import {
  NormalizedSkeleton,
  RepPhase,
  RejectReason,
  VerificationFrameResult,
  IExerciseVerifier,
  CameraViewMode,
  mapRepPhaseToUniversalState
} from './poseTypes';
import {
  calculateAngle,
  calculateTorsoAngleFromHorizontal,
  exponentialSmooth,
  calculatePlankBodyChain
} from './mathUtils';
import { PUSHUP_CONFIG, PushUpConfig } from './verifierConfigs';

export class PushUpVerifier implements IExerciseVerifier {
  public readonly exerciseType = 'push_up';
  private config: PushUpConfig;

  // Repetition counters & metrics
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: RejectReason | null = null;
  private currentFrameReason: RejectReason | null = null;
  private lastRejectedRepReason: RejectReason | null = null;
  private state: RepPhase = 'IDLE';

  // Biomechanical state tracking
  private smoothedLeftAngle: number = 160;
  private smoothedRightAngle: number = 160;
  private smoothedPrimaryAngle: number = 160;
  private repStartTime: number = 0;
  private bottomReached: boolean = false;
  private minAngleInRep: number = 180;
  private maxAngleInRep: number = 160;
  private lastRepEndTime: number = 0;
  private lastRepDurationMs: number = 0;
  private lastRomAchieved: number = 0;

  // Shoulder-to-wrist vertical trajectory tracking
  private referenceShoulderWristDistY: number = 0;
  private maxShoulderDisplacement: number = 0;

  // Multi-Angle Camera View Mode Tracking
  private frontBaselineShoulderY: number = 0;
  private frontBaselineShoulderWidth: number = 0;
  private frontBaselineNoseY: number = 0;
  private frontMaxDescent: number = 0;
  private backBaselineShoulderY: number = 0;
  private backBaselineShoulderWidth: number = 0;
  private backMaxDescent: number = 0;

  // Stability counters (number of consecutive frames in condition)
  private consecutiveFrameCount: number = 0;
  private candidateState: RepPhase = 'IDLE';

  constructor(customConfig?: Partial<PushUpConfig>) {
    this.config = { ...PUSHUP_CONFIG, ...customConfig };
  }

  public reset(): void {
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.currentFrameReason = null;
    this.lastRejectedRepReason = null;
    this.state = 'IDLE';
    this.candidateState = 'IDLE';
    this.consecutiveFrameCount = 0;
    this.smoothedLeftAngle = 160;
    this.smoothedRightAngle = 160;
    this.smoothedPrimaryAngle = 160;
    this.repStartTime = 0;
    this.bottomReached = false;
    this.minAngleInRep = 180;
    this.maxAngleInRep = 160;
    this.lastRepEndTime = 0;
    this.lastRepDurationMs = 0;
    this.lastRomAchieved = 0;
    this.referenceShoulderWristDistY = 0;
    this.maxShoulderDisplacement = 0;
    this.frontBaselineShoulderY = 0;
    this.frontBaselineShoulderWidth = 0;
    this.frontBaselineNoseY = 0;
    this.frontMaxDescent = 0;
    this.backBaselineShoulderY = 0;
    this.backBaselineShoulderWidth = 0;
    this.backMaxDescent = 0;
  }

  public getViewMode(): CameraViewMode {
    return this.config.viewMode || 'side';
  }

  public setViewMode(mode: CameraViewMode): void {
    this.config.viewMode = mode;
    this.reset();
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
    // 0. CHECK FULL BODY VISIBILITY
    if (skeleton.isFullBodyVisible === false) {
      this.state = 'POSITIONING';
      return this.buildResult(
        'POSITIONING',
        null,
        null,
        null,
        0,
        false,
        '⚠️ Не видно все тіло',
        skeleton.confidence,
        '⚠️ Не видно все тіло — відійдіть від камери / покладіть телефон так, щоб було видно від голови до ніг',
        false,
        false,
        0,
        { isPoseValid: false, isPushUpPosition: false }
      );
    }

    // MULTI-ANGLE ROUTING: Front & Back views are handled in dedicated branches
    const viewMode = this.config.viewMode || 'side';
    if (viewMode === 'front') {
      return this.processFrontView(skeleton, timestampMs);
    }
    if (viewMode === 'back') {
      return this.processBackView(skeleton, timestampMs);
    }

    // PRESERVED STABLE SIDE-VIEW LOGIC BELOW
    let isRepCompleted = false;
    let isRepRejected = false;
    let feedback = 'Займіть положення горизонтальної планки на підлозі';
    this.currentFrameReason = null;

    // ----------------------------------------------------
    // 1. PER-LANDMARK CONFIDENCE & UPPER/CORE VALIDATION
    // ----------------------------------------------------
    const leftShoulderVis = skeleton.leftShoulder.visibility ?? 0.8;
    const rightShoulderVis = skeleton.rightShoulder.visibility ?? 0.8;
    const leftElbowVis = skeleton.leftElbow.visibility ?? 0.8;
    const rightElbowVis = skeleton.rightElbow.visibility ?? 0.8;
    const leftWristVis = skeleton.leftWrist.visibility ?? 0.8;
    const rightWristVis = skeleton.rightWrist.visibility ?? 0.8;
    const leftHipVis = skeleton.leftHip.visibility ?? 0.8;
    const rightHipVis = skeleton.rightHip.visibility ?? 0.8;

    const leftArmConfidence = (leftShoulderVis + leftElbowVis + leftWristVis) / 3;
    const rightArmConfidence = (rightShoulderVis + rightElbowVis + rightWristVis) / 3;
    const coreConfidence = (leftShoulderVis + rightShoulderVis + leftHipVis + rightHipVis) / 4;
    const overallConfidence = (leftArmConfidence + rightArmConfidence + coreConfidence) / 3;

    const minConf = this.config.confidenceThreshold || this.config.minConfidence;

    // At least one side must be clearly visible and core must be detected
    const isLeftArmValid = leftArmConfidence >= minConf * 0.9;
    const isRightArmValid = rightArmConfidence >= minConf * 0.9;
    const hasSufficientArm = isLeftArmValid || isRightArmValid;
    const isPoseValid = hasSufficientArm && coreConfidence >= minConf * 0.85;

    if (!isPoseValid) {
      this.currentFrameReason = 'LOW_CONFIDENCE';
      this.handlePositionLoss();
      return this.buildResult(
        'IDLE',
        null,
        null,
        null,
        0,
        false,
        'Низька чіткість: тіло не розпізнано повністю',
        overallConfidence,
        'Переконайтеся, що все тіло та руки видно в кадрі',
        false,
        false,
        0,
        { isPoseValid: false, isPushUpPosition: false, isLeftArmValid, isRightArmValid, isBodyChainValid: false }
      );
    }

    // ----------------------------------------------------
    // 2. BIOMECHANICAL ANGLES & SYMMETRY
    // ----------------------------------------------------
    const rawLeftAngle = calculateAngle(skeleton.leftShoulder, skeleton.leftElbow, skeleton.leftWrist);
    const rawRightAngle = calculateAngle(skeleton.rightShoulder, skeleton.rightElbow, skeleton.rightWrist);

    this.smoothedLeftAngle = exponentialSmooth(this.smoothedLeftAngle, rawLeftAngle, 0.60);
    this.smoothedRightAngle = exponentialSmooth(this.smoothedRightAngle, rawRightAngle, 0.60);

    let primaryAngle: number;
    if (isLeftArmValid && isRightArmValid) {
      // Both arms visible -> check symmetry!
      const armAsymmetry = Math.abs(this.smoothedLeftAngle - this.smoothedRightAngle);
      if (armAsymmetry > this.config.maxArmAsymmetry) {
        this.currentFrameReason = 'ASYMMETRIC_ARMS';
      }
      primaryAngle = (this.smoothedLeftAngle + this.smoothedRightAngle) / 2;
    } else if (isLeftArmValid) {
      primaryAngle = this.smoothedLeftAngle;
    } else {
      primaryAngle = this.smoothedRightAngle;
    }
    this.smoothedPrimaryAngle = primaryAngle;

    // ----------------------------------------------------
    // 3. BODY CHAIN & HORIZONTAL PLANK ALIGNMENT
    // ----------------------------------------------------
    // Torso angle to horizontal: 0° = horizontal, 90° = vertical standing
    const leftTorsoAngle = calculateTorsoAngleFromHorizontal(skeleton.leftShoulder, skeleton.leftHip);
    const rightTorsoAngle = calculateTorsoAngleFromHorizontal(skeleton.rightShoulder, skeleton.rightHip);
    const torsoAngle = (leftTorsoAngle + rightTorsoAngle) / 2;

    const isPlankAngle = torsoAngle <= (this.config.alignmentTolerance || this.config.maxTorsoAngleFromHorizontal);

    // Kinetic chain check: shoulder -> hip -> knee (check that body is not in squat or extreme pike)
    let isCoreChainValid = true;
    const kneeVis = (skeleton.leftKnee.visibility ?? 0.8 + (skeleton.rightKnee.visibility ?? 0.8)) / 2;
    if (kneeVis >= 0.40) {
      const leftChain = calculatePlankBodyChain(skeleton.leftShoulder, skeleton.leftHip, skeleton.leftKnee, 130);
      const rightChain = calculatePlankBodyChain(skeleton.rightShoulder, skeleton.rightHip, skeleton.rightKnee, 130);
      isCoreChainValid = leftChain.isChainValid || rightChain.isChainValid;
    }

    const isBodyChainValid = isPlankAngle && isCoreChainValid;
    const isPushUpPosition = isBodyChainValid && isPoseValid;

    const alignmentStatus = isPushUpPosition
      ? `Планка підтверджена (${Math.round(torsoAngle)}°)`
      : !isPlankAngle
      ? `Помилка позиції: вертикальна стійка (${Math.round(torsoAngle)}°)`
      : `Помилка ланцюга тіла: зігнутий таз/ноги`;

    // ----------------------------------------------------
    // 4. STRICT FILTER: NOT IN PUSH-UP POSITION
    // ----------------------------------------------------
    // Standing, waving, head movement, squats -> REJECT PUSH-UP
    if (!isPushUpPosition) {
      this.currentFrameReason = !isPlankAngle ? 'BAD_BODY_ALIGNMENT' : 'INVALID_START_POSITION';

      // If athlete was in the middle of a rep and suddenly stood up or dropped form
      if (this.state === 'DESCENDING' || this.state === 'BOTTOM' || this.state === 'ASCENDING') {
        this.rejectedReps++;
        this.lastRejectReason = 'BAD_BODY_ALIGNMENT';
        this.lastRejectedRepReason = 'BAD_BODY_ALIGNMENT';
        isRepRejected = true;
      }

      this.handlePositionLoss();

      return this.buildResult(
        'IDLE',
        this.smoothedLeftAngle,
        this.smoothedRightAngle,
        primaryAngle,
        torsoAngle,
        false,
        alignmentStatus,
        overallConfidence,
        'Для віджимань займіть горизонтальну планку на підлозі (упор лежачи)',
        false,
        isRepRejected,
        0,
        {
          isPoseValid,
          isPushUpPosition: false,
          isLeftArmValid,
          isRightArmValid,
          isBodyChainValid: false
        }
      );
    }

    // ----------------------------------------------------
    // 5. SHOULDER VERTICAL DISPLACEMENT TRAJECTORY TRACKING
    // ----------------------------------------------------
    const avgShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;
    const avgWristY = (skeleton.leftWrist.y + skeleton.rightWrist.y) / 2;
    const currentShoulderWristDist = avgWristY - avgShoulderY;

    // ----------------------------------------------------
    // 6. TIMEOUT CHECK FOR STUCK / ABANDONED REPETITIONS
    // ----------------------------------------------------
    if (this.state === 'DESCENDING' || this.state === 'BOTTOM' || this.state === 'ASCENDING') {
      const repDurationSec = (timestampMs - this.repStartTime) / 1000;
      if (repDurationSec > (this.config.maxRepDurationSec || 8.0)) {
        this.rejectedReps++;
        this.lastRejectReason = 'TIMEOUT';
        this.lastRejectedRepReason = 'TIMEOUT';
        isRepRejected = true;
        this.state = 'READY';
        this.bottomReached = false;
        feedback = '⚠️ Час очікування вичерпано (повтор тривав занадто довго)';
      }
    }

    // ----------------------------------------------------
    // 7. FINITE STATE MACHINE (FSM) WITH HYSTERESIS
    // ----------------------------------------------------
    const angle = primaryAngle;
    let nextCandidate: RepPhase = this.state;
    const topAngleThreshold = this.config.topAngle || this.config.maxElbowAngle;
    const bottomAngleThreshold = this.config.bottomAngle || this.config.minElbowAngle;
    const topExitAngleThreshold = this.config.topExitAngle || this.config.descendingTriggerAngle;
    const bottomExitAngleThreshold = this.config.bottomExitAngle || this.config.ascendingTriggerAngle;

    switch (this.state) {
      case 'IDLE':
        // Move to READY when in plank with arms extended
        if (angle >= topAngleThreshold - 8) {
          nextCandidate = 'READY';
        }
        feedback = 'Прийміть упор лежачи з випрямленими руками';
        break;

      case 'READY':
        this.referenceShoulderWristDistY = currentShoulderWristDist;
        this.maxShoulderDisplacement = 0;
        // Start descent when elbows bend below exit threshold
        if (angle <= topExitAngleThreshold) {
          nextCandidate = 'DESCENDING';
        }
        feedback = 'Опускайтеся вниз до згинання ліктів (глибина > 85% ROM)';
        break;

      case 'DESCENDING':
        if (angle < this.minAngleInRep) {
          this.minAngleInRep = angle;
        }
        // Track downward shoulder displacement
        const descentDisp = Math.abs(currentShoulderWristDist - this.referenceShoulderWristDistY);
        if (descentDisp > this.maxShoulderDisplacement) {
          this.maxShoulderDisplacement = descentDisp;
        }

        // Bottom depth reached when elbow <= bottomAngle
        if (angle <= bottomAngleThreshold) {
          nextCandidate = 'BOTTOM';
          feedback = 'Нижня точка зафіксована! Потужно тисніть угору';
        } else if (angle >= topAngleThreshold - 10) {
          // Turned back up without ever reaching bottom depth
          this.rejectedReps++;
          this.lastRejectReason = 'SHALLOW_REP';
          this.lastRejectedRepReason = 'SHALLOW_REP';
          isRepRejected = true;
          nextCandidate = 'READY';
          feedback = '⚠️ Відхилено: занадто мілке опускання (неповна амплітуда)';
        } else {
          feedback = 'Опускайтеся глибше...';
        }
        break;

      case 'BOTTOM':
        if (angle < this.minAngleInRep) {
          this.minAngleInRep = angle;
        }
        // Starts pushing back up past bottom exit threshold
        if (angle >= bottomExitAngleThreshold) {
          nextCandidate = 'ASCENDING';
          feedback = 'Дотискайте до повного випрямлення ліктів у верхній точці';
        } else {
          feedback = 'Нижня точка зафіксована. Витискайте!';
        }
        break;

      case 'ASCENDING':
        // Top lockout reached
        if (angle >= topAngleThreshold) {
          nextCandidate = 'TOP';
        } else if (angle <= bottomAngleThreshold + 5) {
          // Re-dipped before reaching lockout
          nextCandidate = 'BOTTOM';
        }
        feedback = 'Випряміть лікті у верхній точці (lockout)';
        break;

      case 'TOP':
        nextCandidate = 'READY';
        break;
    }

    // ----------------------------------------------------
    // 8. TEMPORAL STABILITY CONFIRMATION
    // ----------------------------------------------------
    const requiredStability = this.config.stateStabilityFrames || this.config.stabilityFramesRequired || 2;

    if (nextCandidate !== this.state) {
      if (nextCandidate === this.candidateState) {
        this.consecutiveFrameCount++;
      } else {
        this.candidateState = nextCandidate;
        this.consecutiveFrameCount = 1;
      }

      if (this.consecutiveFrameCount >= requiredStability) {
        const oldState = this.state;
        this.state = nextCandidate;
        this.consecutiveFrameCount = 0;

        if (oldState === 'READY' && this.state === 'DESCENDING') {
          this.repStartTime = timestampMs;
          this.bottomReached = false;
          this.minAngleInRep = 180;
          this.maxAngleInRep = angle;
        } else if (this.state === 'BOTTOM') {
          this.bottomReached = true;
        } else if (this.state === 'TOP') {
          const durationSec = (timestampMs - this.repStartTime) / 1000;
          this.lastRepDurationMs = Math.round(durationSec * 1000);
          const timeSinceLastRep = timestampMs - this.lastRepEndTime;
          const romDegrees = Math.round(this.maxAngleInRep - this.minAngleInRep);
          this.lastRomAchieved = romDegrees;

          const minDuration = this.config.minRepDurationSec || 0.55;
          const cooldown = this.config.cooldownMs || 400;
          const minRomRequired = this.config.minRom || 45;

          // Multi-layer anti-cheat checks
          if (timeSinceLastRep < cooldown || durationSec < minDuration) {
            this.rejectedReps++;
            this.lastRejectReason = 'TOO_FAST';
            this.lastRejectedRepReason = 'TOO_FAST';
            isRepRejected = true;
            feedback = '⚠️ Занадто швидкий ривок! Контролюйте темп вправи';
          } else if (!this.bottomReached || this.minAngleInRep > bottomAngleThreshold + 8) {
            this.rejectedReps++;
            this.lastRejectReason = 'SHALLOW_REP';
            this.lastRejectedRepReason = 'SHALLOW_REP';
            isRepRejected = true;
            feedback = '⚠️ Відхилено: лікті не зігнулися на достатній кут';
          } else if (romDegrees < minRomRequired) {
            this.rejectedReps++;
            this.lastRejectReason = 'SHALLOW_REP';
            this.lastRejectedRepReason = 'SHALLOW_REP';
            isRepRejected = true;
            feedback = `⚠️ Недостатня амплітуда (${romDegrees}° < ${minRomRequired}°)`;
          } else {
            // VERIFIED REP CONFIRMED!
            this.validReps++;
            this.lastRepEndTime = timestampMs;
            isRepCompleted = true;
            feedback = `✅ Віджимання #${this.validReps} зараховано! Відмінна біомеханіка`;
          }

          // Reset cycle
          this.bottomReached = false;
          this.minAngleInRep = 180;
          this.maxAngleInRep = 160;
          this.state = 'READY';
        }
      }
    } else {
      this.consecutiveFrameCount = 0;
    }

    // Calculate real-time Range of Motion percentage (0% to 100%)
    const span = Math.max(1, topAngleThreshold - bottomAngleThreshold);
    const progress = Math.min(100, Math.max(0, Math.round(((topAngleThreshold - primaryAngle) / span) * 100)));

    return this.buildResult(
      this.state,
      this.smoothedLeftAngle,
      this.smoothedRightAngle,
      primaryAngle,
      torsoAngle,
      isPushUpPosition,
      alignmentStatus,
      overallConfidence,
      feedback,
      isRepCompleted,
      isRepRejected,
      progress,
      {
        isPoseValid,
        isPushUpPosition,
        isLeftArmValid,
        isRightArmValid,
        isBodyChainValid
      }
    );
  }

  /**
   * Dedicated Branch for Front-View Push-Up Tracking
   * Uses shoulder width & vertical displacement as primary motion signal,
   * with nose position as secondary confirmation when visible.
   */
  private processFrontView(skeleton: NormalizedSkeleton, timestampMs: number): VerificationFrameResult {
    let isRepCompleted = false;
    let isRepRejected = false;
    let feedback = 'Ракурс спереду: займіть упор лежачи обличчям до камери';
    this.currentFrameReason = null;

    const leftShoulderVis = skeleton.leftShoulder.visibility ?? 0.8;
    const rightShoulderVis = skeleton.rightShoulder.visibility ?? 0.8;
    const shoulderVis = (leftShoulderVis + rightShoulderVis) / 2;
    const minConf = this.config.confidenceThreshold || 0.45;

    if (shoulderVis < minConf) {
      this.currentFrameReason = 'LOW_CONFIDENCE';
      this.handlePositionLoss();
      return this.buildResult(
        'IDLE', null, null, null, 0, false,
        'Низька чіткість: плечі не розпізнано в ракурсі спереду',
        shoulderVis, 'Переконайтеся, що плечі чітко видно в кадрі спереду',
        false, false, 0, { isPoseValid: false, isPushUpPosition: false }
      );
    }

    const currentShoulderWidth = Math.abs(skeleton.leftShoulder.x - skeleton.rightShoulder.x);
    const currentShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;

    // Check nose visibility for secondary confirmation
    const noseVis = skeleton.nose?.visibility ?? 0;
    const isNoseVisible = noseVis >= 0.40;
    const currentNoseY = isNoseVisible ? skeleton.nose.y : null;

    // Calibration of baseline when IDLE or READY
    if (this.state === 'IDLE' || this.frontBaselineShoulderY === 0) {
      this.frontBaselineShoulderY = currentShoulderY;
      this.frontBaselineShoulderWidth = currentShoulderWidth;
      if (currentNoseY !== null) {
        this.frontBaselineNoseY = currentNoseY;
      }
      this.state = 'READY';
      this.repStartTime = timestampMs;
    }

    // Displacement metrics:
    // In front view push-up, lowering chest causes shoulder Y to drop (increase)
    // and apparent shoulder width to expand as chest approaches lens/floor
    const shoulderDrop = currentShoulderY - this.frontBaselineShoulderY;
    const widthExpansion = currentShoulderWidth - this.frontBaselineShoulderWidth;
    let noseDrop = 0;
    if (currentNoseY !== null && this.frontBaselineNoseY > 0) {
      noseDrop = currentNoseY - this.frontBaselineNoseY;
    }

    // Combined motion score (0 to 1)
    const motionSignal = isNoseVisible 
      ? (Math.max(0, shoulderDrop * 2.5) + Math.max(0, widthExpansion * 1.5) + Math.max(0, noseDrop * 3.0)) / 3
      : (Math.max(0, shoulderDrop * 3.0) + Math.max(0, widthExpansion * 2.0)) / 2;

    // Map motionSignal to equivalent angle 160 -> 75
    const depthRatio = Math.min(1.0, Math.max(0, motionSignal / 0.16));
    const syntheticAngle = Math.round(160 - depthRatio * 85);
    this.smoothedPrimaryAngle = syntheticAngle;

    if (depthRatio > this.frontMaxDescent) {
      this.frontMaxDescent = depthRatio;
    }

    // State Machine
    switch (this.state) {
      case 'READY':
        if (depthRatio >= 0.22) {
          this.state = 'DESCENDING';
          this.repStartTime = timestampMs;
          this.frontMaxDescent = depthRatio;
          feedback = 'Опускайтеся нижче (ракурс спереду)...';
        } else {
          feedback = 'Готові до віджимання. Опускайте корпус!';
        }
        break;

      case 'DESCENDING':
        if (depthRatio >= 0.70) {
          this.state = 'BOTTOM';
          this.bottomReached = true;
          feedback = 'Нижня точка зафіксована! Тисніть угору';
        } else if (depthRatio < 0.15 && (timestampMs - this.repStartTime > 300)) {
          this.rejectedReps++;
          this.lastRejectReason = 'SHALLOW_REP';
          this.lastRejectedRepReason = 'SHALLOW_REP';
          isRepRejected = true;
          this.state = 'READY';
          feedback = '⚠️ Занадто мілке опускання (недостатня глибина)';
        } else {
          feedback = 'Глибше до підлоги...';
        }
        break;

      case 'BOTTOM':
        if (depthRatio <= 0.45) {
          this.state = 'ASCENDING';
          feedback = 'Витискайте до випрямлення рук!';
        }
        break;

      case 'ASCENDING':
        if (depthRatio <= 0.15) {
          const repDurationSec = (timestampMs - this.repStartTime) / 1000;
          this.lastRepDurationMs = Math.round(repDurationSec * 1000);
          this.lastRomAchieved = Math.round(this.frontMaxDescent * 100);

          if (repDurationSec < (this.config.minRepDurationSec || 0.45)) {
            this.rejectedReps++;
            this.lastRejectReason = 'TOO_FAST';
            this.lastRejectedRepReason = 'TOO_FAST';
            isRepRejected = true;
            feedback = '⚠️ Занадто швидкий ривок!';
          } else {
            this.validReps++;
            this.lastRepEndTime = timestampMs;
            isRepCompleted = true;
            feedback = `✅ Віджимання #${this.validReps} зараховано (спереду)!`;
          }

          this.state = 'READY';
          this.bottomReached = false;
          this.frontMaxDescent = 0;
        }
        break;
    }

    const progress = Math.round(depthRatio * 100);
    return this.buildResult(
      this.state,
      null, null, syntheticAngle, 5,
      true,
      isNoseVisible ? 'Ракурс спереду (плечі + ніс підтверджено)' : 'Ракурс спереду (ширина плечей)',
      shoulderVis,
      feedback,
      isRepCompleted,
      isRepRejected,
      progress,
      { isPoseValid: true, isPushUpPosition: true }
    );
  }

  /**
   * Dedicated Branch for Back-View Push-Up Tracking
   * Uses synchronous shoulder movement and width change.
   * Does NOT check elbow angles or facial landmarks (nose/eyes) when invisible.
   * Warns of lower accuracy and allows acceptable tolerance.
   */
  private processBackView(skeleton: NormalizedSkeleton, timestampMs: number): VerificationFrameResult {
    let isRepCompleted = false;
    let isRepRejected = false;
    let feedback = '⚠️ Ракурс ззаду: орієнтовна точність (похибка ±1-2 репи). Займіть упор спиною до камери';
    this.currentFrameReason = null;

    const leftShoulderVis = skeleton.leftShoulder.visibility ?? 0.8;
    const rightShoulderVis = skeleton.rightShoulder.visibility ?? 0.8;
    const shoulderVis = (leftShoulderVis + rightShoulderVis) / 2;
    const minConf = this.config.confidenceThreshold || 0.40;

    if (shoulderVis < minConf) {
      this.currentFrameReason = 'LOW_CONFIDENCE';
      this.handlePositionLoss();
      return this.buildResult(
        'IDLE', null, null, null, 0, false,
        'Низька чіткість: плечі не розпізнано в ракурсі ззаду',
        shoulderVis, '⚠️ Ракурс ззаду: станьте так, щоб обидва плеча було видно в кадрі',
        false, false, 0, { isPoseValid: false, isPushUpPosition: false }
      );
    }

    // Synchronous shoulder movement verification
    const shoulderSyncDiff = Math.abs(skeleton.leftShoulder.y - skeleton.rightShoulder.y);
    const isSynchronous = shoulderSyncDiff <= 0.18;
    if (!isSynchronous) {
      this.currentFrameReason = 'ASYMMETRIC_ARMS';
    }

    const currentShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;
    const currentShoulderWidth = Math.abs(skeleton.leftShoulder.x - skeleton.rightShoulder.x);

    // Establish baseline at lockout
    if (this.state === 'IDLE' || this.backBaselineShoulderY === 0) {
      this.backBaselineShoulderY = currentShoulderY;
      this.backBaselineShoulderWidth = currentShoulderWidth;
      this.state = 'READY';
      this.repStartTime = timestampMs;
    }

    // Vertical shoulder descent + synchronous width change
    const shoulderDrop = currentShoulderY - this.backBaselineShoulderY;
    const widthChange = Math.abs(currentShoulderWidth - this.backBaselineShoulderWidth);
    const motionSignal = Math.max(0, shoulderDrop * 3.0) + Math.max(0, widthChange * 1.5);

    const depthRatio = Math.min(1.0, Math.max(0, motionSignal / 0.18));
    const syntheticAngle = Math.round(160 - depthRatio * 85);
    this.smoothedPrimaryAngle = syntheticAngle;

    if (depthRatio > this.backMaxDescent) {
      this.backMaxDescent = depthRatio;
    }

    switch (this.state) {
      case 'READY':
        if (depthRatio >= 0.22 && isSynchronous) {
          this.state = 'DESCENDING';
          this.repStartTime = timestampMs;
          this.backMaxDescent = depthRatio;
          feedback = '⚠️ Ззаду: рух униз зафіксовано...';
        } else {
          feedback = '⚠️ Ракурс ззаду: упор лежачи. Тисніть униз!';
        }
        break;

      case 'DESCENDING':
        if (depthRatio >= 0.68) {
          this.state = 'BOTTOM';
          this.bottomReached = true;
          feedback = '⚠️ Ззаду: нижня точка! Потужно тисніть угору';
        } else if (depthRatio < 0.15 && (timestampMs - this.repStartTime > 300)) {
          this.rejectedReps++;
          this.lastRejectReason = 'SHALLOW_REP';
          this.lastRejectedRepReason = 'SHALLOW_REP';
          isRepRejected = true;
          this.state = 'READY';
          feedback = '⚠️ Відхилено: недостатнє опускання корпусу';
        } else {
          feedback = '⚠️ Ззаду: опускайтеся глибше...';
        }
        break;

      case 'BOTTOM':
        if (depthRatio <= 0.45) {
          this.state = 'ASCENDING';
          feedback = '⚠️ Ззаду: витискайте до локауту плечей!';
        }
        break;

      case 'ASCENDING':
        if (depthRatio <= 0.16) {
          const repDurationSec = (timestampMs - this.repStartTime) / 1000;
          this.lastRepDurationMs = Math.round(repDurationSec * 1000);
          this.lastRomAchieved = Math.round(this.backMaxDescent * 100);

          if (repDurationSec < (this.config.minRepDurationSec || 0.45)) {
            this.rejectedReps++;
            this.lastRejectReason = 'TOO_FAST';
            this.lastRejectedRepReason = 'TOO_FAST';
            isRepRejected = true;
            feedback = '⚠️ Занадто швидкий ривок!';
          } else {
            this.validReps++;
            this.lastRepEndTime = timestampMs;
            isRepCompleted = true;
            feedback = `✅ Віджимання #${this.validReps} зараховано (ракурс ззаду, ±1 реп допуск)!`;
          }

          this.state = 'READY';
          this.bottomReached = false;
          this.backMaxDescent = 0;
        }
        break;
    }

    const progress = Math.round(depthRatio * 100);
    return this.buildResult(
      this.state,
      null, null, syntheticAngle, 5,
      isSynchronous,
      '⚠️ Ракурс ззаду: синхронний рух плечей (орієнтовна точність)',
      shoulderVis,
      feedback,
      isRepCompleted,
      isRepRejected,
      progress,
      { isPoseValid: true, isPushUpPosition: isSynchronous }
    );
  }

  private handlePositionLoss(): void {
    this.state = 'IDLE';
    this.candidateState = 'IDLE';
    this.consecutiveFrameCount = 0;
    this.bottomReached = false;
    this.minAngleInRep = 180;
    this.maxAngleInRep = 160;
    this.referenceShoulderWristDistY = 0;
    this.maxShoulderDisplacement = 0;
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
    repProgress: number = 0,
    diagnostics?: {
      isPoseValid?: boolean;
      isPushUpPosition?: boolean;
      isLeftArmValid?: boolean;
      isRightArmValid?: boolean;
      isBodyChainValid?: boolean;
    }
  ): VerificationFrameResult {
    const isPose = diagnostics?.isPoseValid ?? (confidence >= (this.config.confidenceThreshold || 0.50));
    const isPushPos = diagnostics?.isPushUpPosition ?? (isAlignmentValid && isPose);
    const isChain = diagnostics?.isBodyChainValid ?? isPushPos;

    return {
      exerciseId: this.exerciseType,
      exercise: this.exerciseType,
      state,
      universalState: mapRepPhaseToUniversalState(state),
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      lastRejectReason: this.lastRejectReason,
      currentFrameReason: this.currentFrameReason,
      lastRejectedRepReason: this.lastRejectedRepReason,
      rejectReason: this.currentFrameReason || this.lastRejectedRepReason || this.lastRejectReason,
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
      isRepRejected,
      repDurationMs: this.lastRepDurationMs,
      rom: this.lastRomAchieved,
      isPoseValid: isPose,
      poseValid: isPose,
      isPushUpPosition: isPushPos,
      positionValid: isPushPos,
      isLeftArmValid: diagnostics?.isLeftArmValid ?? (confidence >= 0.45),
      isRightArmValid: diagnostics?.isRightArmValid ?? (confidence >= 0.45),
      isBodyChainValid: isChain,
      validRep: isRepCompleted
    };
  }
}
