import {
  NormalizedSkeleton,
  RepPhase,
  RejectReason,
  VerificationFrameResult,
  IExerciseVerifier
} from './poseTypes';
import { calculateAngle, calculateTorsoAngleFromHorizontal, exponentialSmooth } from './mathUtils';
import { PULLUP_CONFIG, PullUpConfig } from './verifierConfigs';

export class PullUpVerifier implements IExerciseVerifier {
  public readonly exerciseType = 'pull_up';
  private config: PullUpConfig;

  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: RejectReason | null = null;
  private state: RepPhase = 'IDLE';

  private smoothedLeftAngle: number = 160;
  private smoothedRightAngle: number = 160;
  private smoothedPrimaryAngle: number = 160;
  private repStartTime: number = 0;
  private topReached: boolean = false;
  private minAngleInRep: number = 180;
  private lastRepEndTime: number = 0;

  private consecutiveFrameCount: number = 0;
  private candidateState: RepPhase = 'IDLE';

  constructor(customConfig?: Partial<PullUpConfig>) {
    this.config = { ...PULLUP_CONFIG, ...customConfig };
  }

  public reset(): void {
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.state = 'IDLE';
    this.candidateState = 'IDLE';
    this.consecutiveFrameCount = 0;
    this.smoothedLeftAngle = 160;
    this.smoothedRightAngle = 160;
    this.smoothedPrimaryAngle = 160;
    this.repStartTime = 0;
    this.topReached = false;
    this.minAngleInRep = 180;
    this.lastRepEndTime = 0;
  }

  public getState(): RepPhase {
    return this.state;
  }

  public getValidReps(): number {
    return this.validReps;
  }

  public getRejectedReps(): number {
    return this.rejectedReps;
  }

  public getLastRejectReason(): RejectReason | null {
    return this.lastRejectReason;
  }

  public processSkeleton(skeleton: NormalizedSkeleton, timestampMs: number = Date.now()): VerificationFrameResult {
    let isRepCompleted = false;
    let isRepRejected = false;
    let feedback = 'Займіть положення вису на перекладині';

    // 1. Arm & Shoulder Confidence
    const leftArmVis =
      ((skeleton.leftShoulder.visibility ?? 0.8) +
        (skeleton.leftElbow.visibility ?? 0.8) +
        (skeleton.leftWrist.visibility ?? 0.8)) / 3;

    const rightArmVis =
      ((skeleton.rightShoulder.visibility ?? 0.8) +
        (skeleton.rightElbow.visibility ?? 0.8) +
        (skeleton.rightWrist.visibility ?? 0.8)) / 3;

    const overallConfidence = (leftArmVis + rightArmVis) / 2;

    if (overallConfidence < this.config.minConfidence) {
      return this.buildResult(
        this.state,
        null,
        null,
        null,
        0,
        false,
        'Руки або турнік поза полем зору камери',
        overallConfidence,
        'Підніміть або віддаліть камеру',
        false,
        false
      );
    }

    // 2. Elbow Angles
    const rawLeftAngle = calculateAngle(skeleton.leftShoulder, skeleton.leftElbow, skeleton.leftWrist);
    const rawRightAngle = calculateAngle(skeleton.rightShoulder, skeleton.rightElbow, skeleton.rightWrist);

    this.smoothedLeftAngle = exponentialSmooth(this.smoothedLeftAngle, rawLeftAngle, 0.6);
    this.smoothedRightAngle = exponentialSmooth(this.smoothedRightAngle, rawRightAngle, 0.6);

    let primaryElbowAngle: number;
    if (leftArmVis >= 0.5 && rightArmVis >= 0.5) {
      primaryElbowAngle = (this.smoothedLeftAngle + this.smoothedRightAngle) / 2;
    } else if (leftArmVis > rightArmVis) {
      primaryElbowAngle = this.smoothedLeftAngle;
    } else {
      primaryElbowAngle = this.smoothedRightAngle;
    }
    this.smoothedPrimaryAngle = primaryElbowAngle;

    // 3. Hanging Check: Wrists must be overhead (wrist.y < shoulder.y in canvas space)
    const avgWristY = (skeleton.leftWrist.y + skeleton.rightWrist.y) / 2;
    const avgShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;
    const isHandsAboveHead = avgWristY < avgShoulderY;

    const torsoAngle = calculateTorsoAngleFromHorizontal(skeleton.leftShoulder, skeleton.leftHip);
    const isVerticalHanging = torsoAngle >= this.config.minTorsoAngleFromHorizontal;

    const isHanging = isHandsAboveHead && isVerticalHanging;
    const alignmentStatus = isHanging
      ? `Вис на турніку зафіксовано`
      : isHandsAboveHead
      ? `Руки підняті, але не у висі`
      : `Руки опущені (не на турніку)`;

    if (!isHanging) {
      if (this.state === 'ASCENDING' || this.state === 'TOP') {
        this.rejectedReps++;
        this.lastRejectReason = 'bad_alignment';
        isRepRejected = true;
      }
      this.state = 'IDLE';
      this.candidateState = 'IDLE';
      this.consecutiveFrameCount = 0;

      return this.buildResult(
        'IDLE',
        this.smoothedLeftAngle,
        this.smoothedRightAngle,
        primaryElbowAngle,
        torsoAngle,
        false,
        alignmentStatus,
        overallConfidence,
        'Візьміться за турнік обома руками',
        false,
        isRepRejected
      );
    }

    // 4. State Machine (DEADHANG -> ASCENDING -> TOP -> DESCENDING -> DEADHANG)
    const angle = primaryElbowAngle;
    let nextCandidate: RepPhase = this.state;

    switch (this.state) {
      case 'IDLE':
        if (angle >= this.config.maxElbowAngle - 10) {
          nextCandidate = 'READY';
        }
        feedback = 'Повний вис на прямих руках';
        break;

      case 'READY':
        if (angle <= 135) {
          nextCandidate = 'ASCENDING';
        }
        feedback = 'Тягніть підборіддя вище перекладини';
        break;

      case 'ASCENDING':
        if (angle < this.minAngleInRep) {
          this.minAngleInRep = angle;
        }

        if (angle <= this.config.minElbowAngle) {
          nextCandidate = 'TOP';
          feedback = 'Підборіддя над турніком! Опускайтеся підконтрольно';
        } else if (angle >= this.config.maxElbowAngle - 10) {
          this.rejectedReps++;
          this.lastRejectReason = 'too_shallow';
          isRepRejected = true;
          nextCandidate = 'READY';
          feedback = '⚠️ Підтягування не завершено (не дотягнули до підборіддя)';
        }
        break;

      case 'TOP':
        if (angle < this.minAngleInRep) {
          this.minAngleInRep = angle;
        }

        if (angle >= 105) {
          nextCandidate = 'DESCENDING';
          feedback = 'Опускайтеся до повного розгинання ліктів';
        }
        break;

      case 'DESCENDING':
        if (angle >= this.config.maxElbowAngle) {
          nextCandidate = 'READY';
        }
        break;
    }

    // Stability verification
    if (nextCandidate !== this.state) {
      if (nextCandidate === this.candidateState) {
        this.consecutiveFrameCount++;
      } else {
        this.candidateState = nextCandidate;
        this.consecutiveFrameCount = 1;
      }

      if (this.consecutiveFrameCount >= this.config.stabilityFramesRequired) {
        const oldState = this.state;
        this.state = nextCandidate;
        this.consecutiveFrameCount = 0;

        if (oldState === 'READY' && this.state === 'ASCENDING') {
          this.repStartTime = timestampMs;
          this.topReached = false;
          this.minAngleInRep = 180;
        } else if (this.state === 'TOP') {
          this.topReached = true;
        } else if (oldState === 'DESCENDING' && this.state === 'READY') {
          const durationSec = (timestampMs - this.repStartTime) / 1000;
          const timeSinceLastRep = timestampMs - this.lastRepEndTime;

          if (timeSinceLastRep < this.config.cooldownMs || durationSec < this.config.minRepDurationSec) {
            this.rejectedReps++;
            this.lastRejectReason = 'too_fast';
            isRepRejected = true;
            feedback = '⚠️ Занадто різкий рувок!';
          } else if (!this.topReached || this.minAngleInRep > this.config.minElbowAngle + 8) {
            this.rejectedReps++;
            this.lastRejectReason = 'too_shallow';
            isRepRejected = true;
            feedback = '⚠️ Підборіддя не піднялося вище перекладини';
          } else {
            this.validReps++;
            this.lastRepEndTime = timestampMs;
            isRepCompleted = true;
            feedback = `✅ Підтягування #${this.validReps} зараховано!`;
          }

          this.topReached = false;
          this.minAngleInRep = 180;
        }
      }
    } else {
      this.consecutiveFrameCount = 0;
    }

    const span = Math.max(1, this.config.maxElbowAngle - this.config.minElbowAngle);
    const progress = Math.min(100, Math.max(0, Math.round(((this.config.maxElbowAngle - primaryElbowAngle) / span) * 100)));

    return this.buildResult(
      this.state,
      this.smoothedLeftAngle,
      this.smoothedRightAngle,
      primaryElbowAngle,
      torsoAngle,
      isHanging,
      alignmentStatus,
      overallConfidence,
      feedback,
      isRepCompleted,
      isRepRejected,
      progress
    );
  }

  private buildResult(
    state: RepPhase,
    leftElbowAngle: number | null,
    rightElbowAngle: number | null,
    primaryElbowAngle: number | null,
    torsoAngle: number,
    isAlignmentValid: boolean,
    alignmentStatus: string,
    confidence: number,
    feedback: string,
    isRepCompleted: boolean,
    isRepRejected: boolean,
    repProgress: number = 0
  ): VerificationFrameResult {
    return {
      exerciseId: this.exerciseType,
      state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      lastRejectReason: this.lastRejectReason,
      repProgress,
      leftElbowAngle: leftElbowAngle !== null ? Math.round(leftElbowAngle) : null,
      rightElbowAngle: rightElbowAngle !== null ? Math.round(rightElbowAngle) : null,
      primaryElbowAngle: primaryElbowAngle !== null ? Math.round(primaryElbowAngle) : null,
      leftKneeAngle: null,
      rightKneeAngle: null,
      primaryKneeAngle: null,
      torsoAngle: Math.round(torsoAngle),
      isAlignmentValid,
      alignmentStatus,
      confidence: Math.round(confidence * 100),
      feedback,
      isRepCompleted,
      isRepRejected
    };
  }
}
