import {
  NormalizedSkeleton,
  RepPhase,
  RejectReason,
  VerificationFrameResult,
  IExerciseVerifier
} from './poseTypes';
import { calculateAngle, calculateTorsoAngleFromHorizontal, exponentialSmooth } from './mathUtils';
import { SQUAT_CONFIG, SquatConfig } from './verifierConfigs';

export class SquatVerifier implements IExerciseVerifier {
  public readonly exerciseType = 'squat';
  private config: SquatConfig;

  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: RejectReason | null = null;
  private state: RepPhase = 'IDLE';

  private smoothedLeftAngle: number = 170;
  private smoothedRightAngle: number = 170;
  private smoothedPrimaryAngle: number = 170;
  private repStartTime: number = 0;
  private bottomReached: boolean = false;
  private minAngleInRep: number = 180;
  private lastRepEndTime: number = 0;

  private consecutiveFrameCount: number = 0;
  private candidateState: RepPhase = 'IDLE';

  constructor(customConfig?: Partial<SquatConfig>) {
    this.config = { ...SQUAT_CONFIG, ...customConfig };
  }

  public reset(): void {
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.state = 'IDLE';
    this.candidateState = 'IDLE';
    this.consecutiveFrameCount = 0;
    this.smoothedLeftAngle = 170;
    this.smoothedRightAngle = 170;
    this.smoothedPrimaryAngle = 170;
    this.repStartTime = 0;
    this.bottomReached = false;
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
    let feedback = 'Встаньте у вихідне вертикальне положення';

    // 1. Confidence of lower body joints
    const leftLegVis =
      ((skeleton.leftHip.visibility ?? 0.8) +
        (skeleton.leftKnee.visibility ?? 0.8) +
        (skeleton.leftAnkle.visibility ?? 0.8)) / 3;

    const rightLegVis =
      ((skeleton.rightHip.visibility ?? 0.8) +
        (skeleton.rightKnee.visibility ?? 0.8) +
        (skeleton.rightAnkle.visibility ?? 0.8)) / 3;

    const overallConfidence = (leftLegVis + rightLegVis) / 2;

    if (overallConfidence < this.config.minConfidence) {
      return this.buildResult(
        this.state,
        null,
        null,
        null,
        0,
        false,
        'Низька видимість ніг у кадрі',
        overallConfidence,
        'Відійдіть далі, щоб було видно стегна, коліна та стопи',
        false,
        false
      );
    }

    // 2. Knee Angles
    const rawLeftAngle = calculateAngle(skeleton.leftHip, skeleton.leftKnee, skeleton.leftAnkle);
    const rawRightAngle = calculateAngle(skeleton.rightHip, skeleton.rightKnee, skeleton.rightAnkle);

    this.smoothedLeftAngle = exponentialSmooth(this.smoothedLeftAngle, rawLeftAngle, 0.6);
    this.smoothedRightAngle = exponentialSmooth(this.smoothedRightAngle, rawRightAngle, 0.6);

    let primaryKneeAngle: number;
    if (leftLegVis >= 0.5 && rightLegVis >= 0.5) {
      primaryKneeAngle = (this.smoothedLeftAngle + this.smoothedRightAngle) / 2;
    } else if (leftLegVis > rightLegVis) {
      primaryKneeAngle = this.smoothedLeftAngle;
    } else {
      primaryKneeAngle = this.smoothedRightAngle;
    }
    this.smoothedPrimaryAngle = primaryKneeAngle;

    // 3. Body Alignment (Upright Torso Check)
    const torsoAngle = calculateTorsoAngleFromHorizontal(skeleton.leftShoulder, skeleton.leftHip);
    const isUpright = torsoAngle >= this.config.minTorsoAngleFromHorizontal;
    const alignmentStatus = isUpright
      ? `Корпус вертикальний (${Math.round(torsoAngle)}°)`
      : `Помилка: нахил або положення лежачи (${Math.round(torsoAngle)}°)`;

    // Reject if lying on floor or bending excessively
    if (!isUpright) {
      if (this.state === 'DESCENDING' || this.state === 'BOTTOM') {
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
        primaryKneeAngle,
        torsoAngle,
        false,
        alignmentStatus,
        overallConfidence,
        'Тримайте спину рівно та вертикально',
        false,
        isRepRejected
      );
    }

    // 4. State Machine
    const angle = primaryKneeAngle;
    let nextCandidate: RepPhase = this.state;

    switch (this.state) {
      case 'IDLE':
        if (angle >= this.config.maxKneeAngle - 10) {
          nextCandidate = 'READY';
        }
        feedback = 'Випряміть ноги, займіть вихідну стійку';
        break;

      case 'READY':
        if (angle <= this.config.descendingTriggerAngle) {
          nextCandidate = 'DESCENDING';
        }
        feedback = 'Присідайте плавно, таз відводиться назад';
        break;

      case 'DESCENDING':
        if (angle < this.minAngleInRep) {
          this.minAngleInRep = angle;
        }

        if (angle <= this.config.minKneeAngle) {
          nextCandidate = 'BOTTOM';
          feedback = 'Паралель пройдена! Виштовхуйтеся вгору';
        } else if (angle >= this.config.maxKneeAngle - 10) {
          this.rejectedReps++;
          this.lastRejectReason = 'too_shallow';
          isRepRejected = true;
          nextCandidate = 'READY';
          feedback = '⚠️ Недостатня глибина присідання (вище паралелі)';
        }
        break;

      case 'BOTTOM':
        if (angle < this.minAngleInRep) {
          this.minAngleInRep = angle;
        }

        if (angle >= this.config.ascendingTriggerAngle) {
          nextCandidate = 'ASCENDING';
          feedback = 'Вставайте до повного розгинання колін';
        }
        break;

      case 'ASCENDING':
        if (angle >= this.config.maxKneeAngle) {
          nextCandidate = 'TOP';
        }
        break;

      case 'TOP':
        nextCandidate = 'READY';
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

        if (oldState === 'READY' && this.state === 'DESCENDING') {
          this.repStartTime = timestampMs;
          this.bottomReached = false;
          this.minAngleInRep = 180;
        } else if (this.state === 'BOTTOM') {
          this.bottomReached = true;
        } else if (this.state === 'TOP') {
          const durationSec = (timestampMs - this.repStartTime) / 1000;
          const timeSinceLastRep = timestampMs - this.lastRepEndTime;

          if (timeSinceLastRep < this.config.cooldownMs || durationSec < this.config.minRepDurationSec) {
            this.rejectedReps++;
            this.lastRejectReason = 'too_fast';
            isRepRejected = true;
            feedback = '⚠️ Занадто швидкий ривок!';
          } else if (!this.bottomReached || this.minAngleInRep > this.config.minKneeAngle + 8) {
            this.rejectedReps++;
            this.lastRejectReason = 'too_shallow';
            isRepRejected = true;
            feedback = '⚠️ Опустіться глибше до паралелі стегон';
          } else {
            this.validReps++;
            this.lastRepEndTime = timestampMs;
            isRepCompleted = true;
            feedback = `✅ Присідання #${this.validReps} зараховано!`;
          }

          this.bottomReached = false;
          this.minAngleInRep = 180;
          this.state = 'READY';
        }
      }
    } else {
      this.consecutiveFrameCount = 0;
    }

    const span = Math.max(1, this.config.maxKneeAngle - this.config.minKneeAngle);
    const progress = Math.min(100, Math.max(0, Math.round(((this.config.maxKneeAngle - primaryKneeAngle) / span) * 100)));

    return this.buildResult(
      this.state,
      this.smoothedLeftAngle,
      this.smoothedRightAngle,
      primaryKneeAngle,
      torsoAngle,
      isUpright,
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
    leftKneeAngle: number | null,
    rightKneeAngle: number | null,
    primaryKneeAngle: number | null,
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
      leftElbowAngle: null,
      rightElbowAngle: null,
      primaryElbowAngle: null,
      leftKneeAngle: leftKneeAngle !== null ? Math.round(leftKneeAngle) : null,
      rightKneeAngle: rightKneeAngle !== null ? Math.round(rightKneeAngle) : null,
      primaryKneeAngle: primaryKneeAngle !== null ? Math.round(primaryKneeAngle) : null,
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
