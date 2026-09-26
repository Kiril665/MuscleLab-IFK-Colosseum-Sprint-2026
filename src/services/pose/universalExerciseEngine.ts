import {
  NormalizedSkeleton,
  PoseLandmark,
  UniversalExerciseState,
  CameraViewMode
} from './poseTypes';
import { calculateAngle, calculateDistance, calculateTorsoAngleFromHorizontal, exponentialSmooth } from './mathUtils';

export interface UniversalDetectorResult {
  exerciseId: string;
  state: UniversalExerciseState;
  validReps: number;
  rejectedReps: number;
  isRepIncremented: boolean;
  repProgress: number; // 0 - 100
  isUserInFrame: boolean;
  userFrameMessage: string;
  feedback: string;
  primaryAngle: number | null;
  secondaryAngle: number | null;
  lastRejectReason: string | null;
  // Isometric hold seconds (e.g. plank)
  holdSeconds?: number;
}

export interface IUniversalDetector {
  readonly exerciseId: string;
  getState(): UniversalExerciseState;
  getValidReps(): number;
  getRejectedReps(): number;
  getLastRejectReason(): string | null;
  getHoldSeconds?(): number;
  reset(): void;
  processFrame(skeleton: NormalizedSkeleton, timestampMs?: number, viewMode?: CameraViewMode): UniversalDetectorResult;
}

// ============================================================================
// 1. UPPER BODY: PUSH-UP & DIP VARIANTS
// ============================================================================
export class UniversalPushUpDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;

  private smoothedElbowAngle: number = 165;
  private minAngleInRep: number = 180;
  private repStartTime: number = 0;
  private lastRepEndTime: number = 0;
  private bottomAchieved: boolean = false;

  private readonly variant: 'classic' | 'wide' | 'diamond' | 'knees' | 'wall' | 'pike' | 'dips' | 'archer';

  constructor(exerciseId: string = 'pushups_classic') {
    this.exerciseId = exerciseId;
    const lower = exerciseId.toLowerCase();
    if (lower.includes('diamond')) this.variant = 'diamond';
    else if (lower.includes('wide')) this.variant = 'wide';
    else if (lower.includes('knees') || lower.includes('колін')) this.variant = 'knees';
    else if (lower.includes('wall') || lower.includes('стін')) this.variant = 'wall';
    else if (lower.includes('pike')) this.variant = 'pike';
    else if (lower.includes('dip') || lower.includes('брус')) this.variant = 'dips';
    else if (lower.includes('archer') || lower.includes('лучник')) this.variant = 'archer';
    else this.variant = 'classic';
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.smoothedElbowAngle = 165;
    this.minAngleInRep = 180;
    this.repStartTime = 0;
    this.lastRepEndTime = 0;
    this.bottomAchieved = false;
  }

  public processFrame(
    skeleton: NormalizedSkeleton,
    timestampMs: number = Date.now(),
    viewMode: CameraViewMode = 'side'
  ): UniversalDetectorResult {
    let isRepIncremented = false;

    // Visibility check
    const leftArmVis = ((skeleton.leftShoulder.visibility ?? 0.8) + (skeleton.leftElbow.visibility ?? 0.8) + (skeleton.leftWrist.visibility ?? 0.8)) / 3;
    const rightArmVis = ((skeleton.rightShoulder.visibility ?? 0.8) + (skeleton.rightElbow.visibility ?? 0.8) + (skeleton.rightWrist.visibility ?? 0.8)) / 3;
    const coreVis = ((skeleton.leftHip.visibility ?? 0.8) + (skeleton.rightHip.visibility ?? 0.8)) / 2;

    const isArmDetected = leftArmVis > 0.4 || rightArmVis > 0.4;
    const isCoreDetected = coreVis > 0.35;

    if (!isArmDetected || !isCoreDetected) {
      return {
        exerciseId: this.exerciseId,
        state: this.state,
        validReps: this.validReps,
        rejectedReps: this.rejectedReps,
        isRepIncremented: false,
        repProgress: 0,
        isUserInFrame: false,
        userFrameMessage: 'Розташуйтеся повністю в кадрі (видно руки та корпус)',
        feedback: 'Камера повинна бачити плечі, лікті та таз',
        primaryAngle: null,
        secondaryAngle: null,
        lastRejectReason: this.lastRejectReason
      };
    }

    const leftElbow = calculateAngle(skeleton.leftShoulder, skeleton.leftElbow, skeleton.leftWrist);
    const rightElbow = calculateAngle(skeleton.rightShoulder, skeleton.rightElbow, skeleton.rightWrist);

    let rawElbow: number;
    if (this.variant === 'archer') {
      // In archer pushups, active arm flexes while other stays straight
      rawElbow = Math.min(leftElbow, rightElbow);
    } else {
      if (leftArmVis > 0.5 && rightArmVis > 0.5) rawElbow = (leftElbow + rightElbow) / 2;
      else if (leftArmVis > rightArmVis) rawElbow = leftElbow;
      else rawElbow = rightElbow;
    }

    this.smoothedElbowAngle = exponentialSmooth(this.smoothedElbowAngle, rawElbow, 0.65);
    const angle = this.smoothedElbowAngle;

    // Torso angle verification
    const leftTorso = calculateTorsoAngleFromHorizontal(skeleton.leftShoulder, skeleton.leftHip);
    const rightTorso = calculateTorsoAngleFromHorizontal(skeleton.rightShoulder, skeleton.rightHip);
    const torsoAngle = (leftTorso + rightTorso) / 2;

    // Check alignment depending on variant
    let isPostureValid = true;
    if (this.variant === 'wall') {
      // Wall pushups: torso is standing (~60°-90°)
      isPostureValid = torsoAngle >= 45;
    } else if (this.variant === 'dips') {
      // Dips: vertical torso (~60°-90°)
      isPostureValid = torsoAngle >= 50;
    } else if (this.variant === 'pike') {
      // Pike pushups: inverted V, hip elevated
      isPostureValid = true;
    } else if (this.variant === 'knees') {
      // Knee pushups: torso at slight angle (20°-55°)
      isPostureValid = torsoAngle <= 60;
    } else {
      // Standard floor pushups: plank angle <= 45°
      isPostureValid = viewMode === 'front' ? true : torsoAngle <= 45;
    }

    // Target angles by variant
    const lockoutTarget = this.variant === 'dips' ? 150 : 155;
    const bottomTarget = this.variant === 'diamond' ? 88 : this.variant === 'dips' ? 90 : 92;

    const progress = Math.max(0, Math.min(100, Math.round(((lockoutTarget - angle) / (lockoutTarget - bottomTarget)) * 100)));

    let feedback = 'Займіть вихідну позицію';

    if (!isPostureValid && (this.state === 'movingDown' || this.state === 'bottom' || this.state === 'movingUp')) {
      this.rejectedReps++;
      this.lastRejectReason = 'Порушення форми тіла';
      this.state = 'ready';
      this.bottomAchieved = false;
      return {
        exerciseId: this.exerciseId,
        state: 'ready',
        validReps: this.validReps,
        rejectedReps: this.rejectedReps,
        isRepIncremented: false,
        repProgress: 0,
        isUserInFrame: true,
        userFrameMessage: 'Форма порушена',
        feedback: '⚠️ Тримайте правильну форму! Спина рівна, корпус зафіксований',
        primaryAngle: Math.round(angle),
        secondaryAngle: Math.round(torsoAngle),
        lastRejectReason: this.lastRejectReason
      };
    }

    switch (this.state) {
      case 'ready':
        this.bottomAchieved = false;
        this.minAngleInRep = 180;
        if (angle <= 140 && isPostureValid) {
          this.state = 'movingDown';
          this.repStartTime = timestampMs;
          this.minAngleInRep = angle;
          feedback = 'Опускайтеся вниз... Згинайте лікті';
        } else {
          feedback = 'Вихідне положення: випряміть руки';
        }
        break;

      case 'movingDown':
        if (angle < this.minAngleInRep) this.minAngleInRep = angle;
        if (angle <= bottomTarget) {
          this.state = 'bottom';
          this.bottomAchieved = true;
          feedback = 'Нижня точка зафіксована! Витискайтеся вгору';
        } else if (angle >= 148) {
          // Incomplete shallow rep
          this.rejectedReps++;
          this.lastRejectReason = 'Неповна амплітуда (опустіться нижче)';
          this.state = 'ready';
          this.bottomAchieved = false;
          feedback = '⚠️ Відхилено: опустіться глибше (ROM < 85%)';
        } else {
          feedback = 'Опускайтеся ще нижче...';
        }
        break;

      case 'bottom':
        if (angle >= 115) {
          this.state = 'movingUp';
          feedback = 'Підйом вгору! Випрямляйте руки';
        }
        break;

      case 'movingUp':
        if (angle >= lockoutTarget) {
          const duration = timestampMs - this.repStartTime;
          if (duration < 450) {
            // Jerk or tremor protection
            this.rejectedReps++;
            this.lastRejectReason = 'Занадто швидкий ривок';
            feedback = '⚠️ Відхилено: занадто швидкий рух, тримайте темп';
            this.state = 'ready';
          } else if (this.bottomAchieved) {
            this.state = 'completed';
            this.validReps++;
            isRepIncremented = true;
            this.lastRepEndTime = timestampMs;
            feedback = `Повторення #${this.validReps} зараховано!`;
          } else {
            this.rejectedReps++;
            this.state = 'ready';
          }
        }
        break;

      case 'completed':
        this.state = angle <= 140 ? 'movingDown' : 'ready';
        break;
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: progress,
      isUserInFrame: true,
      userFrameMessage: 'Тіло в кадрі',
      feedback,
      primaryAngle: Math.round(angle),
      secondaryAngle: Math.round(torsoAngle),
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 2. UPPER BODY: PULL-UPS & CHIN-UPS
// ============================================================================
export class UniversalPullUpDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;

  private smoothedElbowAngle: number = 160;
  private minAngleInRep: number = 180;
  private repStartTime: number = 0;
  private topReached: boolean = false;

  constructor(exerciseId: string = 'pullups_classic') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.smoothedElbowAngle = 160;
    this.minAngleInRep = 180;
    this.repStartTime = 0;
    this.topReached = false;
  }

  public processFrame(skeleton: NormalizedSkeleton, timestampMs: number = Date.now()): UniversalDetectorResult {
    let isRepIncremented = false;

    const leftArmVis = ((skeleton.leftShoulder.visibility ?? 0.8) + (skeleton.leftElbow.visibility ?? 0.8) + (skeleton.leftWrist.visibility ?? 0.8)) / 3;
    const rightArmVis = ((skeleton.rightShoulder.visibility ?? 0.8) + (skeleton.rightElbow.visibility ?? 0.8) + (skeleton.rightWrist.visibility ?? 0.8)) / 3;

    if (leftArmVis < 0.4 && rightArmVis < 0.4) {
      return {
        exerciseId: this.exerciseId,
        state: this.state,
        validReps: this.validReps,
        rejectedReps: this.rejectedReps,
        isRepIncremented: false,
        repProgress: 0,
        isUserInFrame: false,
        userFrameMessage: 'Камера повинна бачити турнік та руки',
        feedback: 'Станьте так, щоб було видно плечі, руки та поперечину',
        primaryAngle: null,
        secondaryAngle: null,
        lastRejectReason: this.lastRejectReason
      };
    }

    const leftElbow = calculateAngle(skeleton.leftShoulder, skeleton.leftElbow, skeleton.leftWrist);
    const rightElbow = calculateAngle(skeleton.rightShoulder, skeleton.rightElbow, skeleton.rightWrist);
    const rawElbow = leftArmVis > rightArmVis ? leftElbow : rightElbow;

    this.smoothedElbowAngle = exponentialSmooth(this.smoothedElbowAngle, rawElbow, 0.65);
    const angle = this.smoothedElbowAngle;

    // In pull-up: Deadhang = ~150°-170°, Top chin over bar = <= 75°
    const progress = Math.max(0, Math.min(100, Math.round(((160 - angle) / (160 - 75)) * 100)));
    let feedback = 'Вис на перекладині';

    switch (this.state) {
      case 'ready':
        this.topReached = false;
        if (angle <= 140) {
          this.state = 'movingDown'; // pull phase
          this.repStartTime = timestampMs;
          this.minAngleInRep = angle;
          feedback = 'Тягніть підборіддя до перекладини!';
        } else {
          feedback = 'Повний вис (руки випрямлені)';
        }
        break;

      case 'movingDown':
        if (angle < this.minAngleInRep) this.minAngleInRep = angle;
        if (angle <= 75) {
          this.state = 'bottom'; // top peak contraction
          this.topReached = true;
          feedback = 'Підборіддя над перекладиною! Підконтрольно опускайтеся';
        } else if (angle >= 145) {
          this.rejectedReps++;
          this.lastRejectReason = 'Неповна тяга (не дістали підборіддям)';
          this.state = 'ready';
          feedback = '⚠️ Відхилено: дотягніть підборіддя вище перекладини';
        }
        break;

      case 'bottom':
        if (angle >= 100) {
          this.state = 'movingUp'; // descending back to deadhang
          feedback = 'Опускайтеся до повного випрямлення рук';
        }
        break;

      case 'movingUp':
        if (angle >= 150) {
          if (this.topReached) {
            this.state = 'completed';
            this.validReps++;
            isRepIncremented = true;
            feedback = `Підтягування #${this.validReps} зараховано!`;
          } else {
            this.rejectedReps++;
            this.state = 'ready';
          }
        }
        break;

      case 'completed':
        this.state = angle <= 140 ? 'movingDown' : 'ready';
        break;
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: progress,
      isUserInFrame: true,
      userFrameMessage: 'Тіло на перекладині',
      feedback,
      primaryAngle: Math.round(angle),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 3. LOWER BODY: SQUAT & PISTOL SQUAT VARIANTS
// ============================================================================
export class UniversalSquatDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private smoothedKneeAngle: number = 170;
  private minAngleInRep: number = 180;
  private repStartTime: number = 0;
  private bottomAchieved: boolean = false;

  private isPistol: boolean = false;

  constructor(exerciseId: string = 'squats_bodyweight') {
    this.exerciseId = exerciseId;
    this.isPistol = exerciseId.toLowerCase().includes('pistol');
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.smoothedKneeAngle = 170;
    this.minAngleInRep = 180;
    this.bottomAchieved = false;
  }

  public processFrame(skeleton: NormalizedSkeleton, timestampMs: number = Date.now()): UniversalDetectorResult {
    let isRepIncremented = false;

    const leftLegVis = ((skeleton.leftHip.visibility ?? 0.8) + (skeleton.leftKnee.visibility ?? 0.8) + (skeleton.leftAnkle.visibility ?? 0.8)) / 3;
    const rightLegVis = ((skeleton.rightHip.visibility ?? 0.8) + (skeleton.rightKnee.visibility ?? 0.8) + (skeleton.rightAnkle.visibility ?? 0.8)) / 3;

    if (leftLegVis < 0.4 && rightLegVis < 0.4) {
      return {
        exerciseId: this.exerciseId,
        state: this.state,
        validReps: this.validReps,
        rejectedReps: this.rejectedReps,
        isRepIncremented: false,
        repProgress: 0,
        isUserInFrame: false,
        userFrameMessage: 'Розташуйтеся так, щоб було видно стегна та коліна',
        feedback: 'Камера повинна бачити ноги та таз для присідань',
        primaryAngle: null,
        secondaryAngle: null,
        lastRejectReason: this.lastRejectReason
      };
    }

    const leftKnee = calculateAngle(skeleton.leftHip, skeleton.leftKnee, skeleton.leftAnkle);
    const rightKnee = calculateAngle(skeleton.rightHip, skeleton.rightKnee, skeleton.rightAnkle);

    const rawKnee = this.isPistol
      ? Math.min(leftKnee, rightKnee)
      : (leftLegVis > rightLegVis ? leftKnee : rightKnee);

    this.smoothedKneeAngle = exponentialSmooth(this.smoothedKneeAngle, rawKnee, 0.65);
    const angle = this.smoothedKneeAngle;

    const bottomTarget = this.isPistol ? 90 : 96; // parallel thigh or below
    const lockoutTarget = 162;

    const progress = Math.max(0, Math.min(100, Math.round(((lockoutTarget - angle) / (lockoutTarget - bottomTarget)) * 100)));
    let feedback = 'Встаньте у вихідну стійку';

    switch (this.state) {
      case 'ready':
        this.bottomAchieved = false;
        if (angle <= 145) {
          this.state = 'movingDown';
          this.repStartTime = timestampMs;
          this.minAngleInRep = angle;
          feedback = 'Опускайтеся в присід (стегна до паралелі)...';
        }
        break;

      case 'movingDown':
        if (angle < this.minAngleInRep) this.minAngleInRep = angle;
        if (angle <= bottomTarget) {
          this.state = 'bottom';
          this.bottomAchieved = true;
          feedback = 'Глибина присіду зафіксована! Вставайте вгору';
        } else if (angle >= 155) {
          this.rejectedReps++;
          this.lastRejectReason = 'Неповний присід (не досягнуто паралелі)';
          this.state = 'ready';
          feedback = '⚠️ Відхилено: опустіться глибше (до паралелі стегон)';
        }
        break;

      case 'bottom':
        if (angle >= 120) {
          this.state = 'movingUp';
          feedback = 'Підйом угору! Випрямляйте коліна';
        }
        break;

      case 'movingUp':
        if (angle >= lockoutTarget) {
          if (this.bottomAchieved) {
            this.state = 'completed';
            this.validReps++;
            isRepIncremented = true;
            feedback = `Присідання #${this.validReps} зараховано!`;
          } else {
            this.rejectedReps++;
            this.state = 'ready';
          }
        }
        break;

      case 'completed':
        this.state = angle <= 145 ? 'movingDown' : 'ready';
        break;
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: progress,
      isUserInFrame: true,
      userFrameMessage: 'Ноги в кадрі',
      feedback,
      primaryAngle: Math.round(angle),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 4. LOWER BODY: LUNGES
// ============================================================================
export class UniversalLungesDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private smoothedFrontKnee: number = 165;
  private bottomAchieved: boolean = false;

  constructor(exerciseId: string = 'lunges_bodyweight') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.smoothedFrontKnee = 165;
    this.bottomAchieved = false;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;

    const leftKnee = calculateAngle(skeleton.leftHip, skeleton.leftKnee, skeleton.leftAnkle);
    const rightKnee = calculateAngle(skeleton.rightHip, skeleton.rightKnee, skeleton.rightAnkle);
    // In lunge, front knee flexes to ~90°
    const minKnee = Math.min(leftKnee, rightKnee);

    this.smoothedFrontKnee = exponentialSmooth(this.smoothedFrontKnee, minKnee, 0.65);
    const angle = this.smoothedFrontKnee;

    const progress = Math.max(0, Math.min(100, Math.round(((165 - angle) / (165 - 95)) * 100)));
    let feedback = 'Зробіть випад уперед або назад';

    switch (this.state) {
      case 'ready':
        this.bottomAchieved = false;
        if (angle <= 135) {
          this.state = 'movingDown';
          feedback = 'Опускайте таз до прямого кута в коліні...';
        }
        break;

      case 'movingDown':
        if (angle <= 95) {
          this.state = 'bottom';
          this.bottomAchieved = true;
          feedback = 'Глибина випаду досягнута! Вставайте у вихідне положення';
        } else if (angle >= 150) {
          this.rejectedReps++;
          this.lastRejectReason = 'Неглибокий випад';
          this.state = 'ready';
          feedback = '⚠️ Опустіть коліно нижче (кут 90° у передньому коліні)';
        }
        break;

      case 'bottom':
        if (angle >= 120) {
          this.state = 'movingUp';
          feedback = 'Повернення у вихідну стійку...';
        }
        break;

      case 'movingUp':
        if (angle >= 155) {
          if (this.bottomAchieved) {
            this.state = 'completed';
            this.validReps++;
            isRepIncremented = true;
            feedback = `Випад #${this.validReps} зараховано!`;
          } else {
            this.state = 'ready';
          }
        }
        break;

      case 'completed':
        this.state = angle <= 135 ? 'movingDown' : 'ready';
        break;
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: progress,
      isUserInFrame: true,
      userFrameMessage: 'Ноги в кадрі',
      feedback,
      primaryAngle: Math.round(angle),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 5. LOWER BODY: CALF RAISES
// ============================================================================
export class UniversalCalfRaisesDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private baselineAnkleY: number = 0;
  private topAchieved: boolean = false;

  constructor(exerciseId: string = 'calf_raises') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.baselineAnkleY = 0;
    this.topAchieved = false;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;
    const avgAnkleY = (skeleton.leftAnkle.y + skeleton.rightAnkle.y) / 2;

    if (this.baselineAnkleY === 0) {
      this.baselineAnkleY = avgAnkleY;
    }

    // In calf raise: ankle Y moves UP (decreases in screen coordinates)
    const liftDelta = this.baselineAnkleY - avgAnkleY;
    const liftThreshold = 0.035; // ~3.5% screen height lift on tiptoes

    let feedback = 'Піднімайтеся на носки якомога вище';

    if (this.state === 'ready') {
      if (liftDelta >= liftThreshold * 0.5) {
        this.state = 'movingDown'; // lifting up
        feedback = 'Тягніть пʼяти вгору!';
      }
    } else if (this.state === 'movingDown') {
      if (liftDelta >= liftThreshold) {
        this.state = 'bottom'; // peak tip-toe contraction
        this.topAchieved = true;
        feedback = 'Пік скорочення литок! Опускайтеся підконтрольно';
      }
    } else if (this.state === 'bottom') {
      if (liftDelta <= liftThreshold * 0.4) {
        this.state = 'movingUp'; // descending
      }
    } else if (this.state === 'movingUp') {
      if (liftDelta <= 0.012) {
        if (this.topAchieved) {
          this.state = 'completed';
          this.validReps++;
          isRepIncremented = true;
          this.topAchieved = false;
          feedback = `Підйом на носки #${this.validReps} зараховано!`;
        } else {
          this.state = 'ready';
        }
      }
    } else if (this.state === 'completed') {
      this.state = 'ready';
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: Math.min(100, Math.max(0, Math.round((liftDelta / liftThreshold) * 100))),
      isUserInFrame: true,
      userFrameMessage: 'Стопи в кадрі',
      feedback,
      primaryAngle: Math.round(liftDelta * 1000),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 6. CORE: CRUNCHES
// ============================================================================
export class UniversalCrunchesDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private topAchieved: boolean = false;

  constructor(exerciseId: string = 'floor_crunches') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.topAchieved = false;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;

    // Lying down: distance from shoulders to knees reduces during crunch
    const avgShoulderX = (skeleton.leftShoulder.x + skeleton.rightShoulder.x) / 2;
    const avgShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;
    const avgHipY = (skeleton.leftHip.y + skeleton.rightHip.y) / 2;

    const shoulderRise = avgHipY - avgShoulderY; // positive when torso curls up

    let feedback = 'Ляжте на спину, зігніть коліна';

    if (this.state === 'ready') {
      if (shoulderRise >= 0.12) {
        this.state = 'movingDown'; // curling up
        feedback = 'Скручуйте корпус, відривайте лопатки від підлоги!';
      }
    } else if (this.state === 'movingDown') {
      if (shoulderRise >= 0.22) {
        this.state = 'bottom'; // peak crunch
        this.topAchieved = true;
        feedback = 'Пік скорочення преса! Опускайтеся підконтрольно';
      }
    } else if (this.state === 'bottom') {
      if (shoulderRise <= 0.15) {
        this.state = 'movingUp';
      }
    } else if (this.state === 'movingUp') {
      if (shoulderRise <= 0.08) {
        if (this.topAchieved) {
          this.state = 'completed';
          this.validReps++;
          isRepIncremented = true;
          this.topAchieved = false;
          feedback = `Скручування #${this.validReps} зараховано!`;
        } else {
          this.state = 'ready';
        }
      }
    } else if (this.state === 'completed') {
      this.state = 'ready';
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: Math.min(100, Math.max(0, Math.round((shoulderRise / 0.22) * 100))),
      isUserInFrame: true,
      userFrameMessage: 'Корпус у кадрі',
      feedback,
      primaryAngle: Math.round(shoulderRise * 100),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 7. CORE: HANGING LEG RAISES
// ============================================================================
export class UniversalLegRaisesDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private smoothedHipAngle: number = 170;
  private topAchieved: boolean = false;

  constructor(exerciseId: string = 'hanging_leg_raises') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.smoothedHipAngle = 170;
    this.topAchieved = false;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;

    const leftHipAngle = calculateAngle(skeleton.leftShoulder, skeleton.leftHip, skeleton.leftAnkle);
    const rightHipAngle = calculateAngle(skeleton.rightShoulder, skeleton.rightHip, skeleton.rightAnkle);
    const rawAngle = Math.min(leftHipAngle, rightHipAngle);

    this.smoothedHipAngle = exponentialSmooth(this.smoothedHipAngle, rawAngle, 0.65);
    const angle = this.smoothedHipAngle;

    // Hanging straight = 160°-180°, Legs raised horizontal = <= 95°
    const progress = Math.max(0, Math.min(100, Math.round(((170 - angle) / (170 - 90)) * 100)));
    let feedback = 'Вис на перекладині';

    switch (this.state) {
      case 'ready':
        this.topAchieved = false;
        if (angle <= 140) {
          this.state = 'movingDown'; // raising legs
          feedback = 'Піднімайте прямі ноги до паралелі!';
        }
        break;

      case 'movingDown':
        if (angle <= 95) {
          this.state = 'bottom'; // top peak contraction
          this.topAchieved = true;
          feedback = 'Кут 90° зафіксовано! Опускайте ноги підконтрольно';
        } else if (angle >= 150) {
          this.rejectedReps++;
          this.lastRejectReason = 'Недостатня висота підйому ніг';
          this.state = 'ready';
          feedback = '⚠️ Підніміть ноги вище (до паралелі з підлогою)';
        }
        break;

      case 'bottom':
        if (angle >= 120) {
          this.state = 'movingUp';
          feedback = 'Опускайте ноги без розгойдування корпусу';
        }
        break;

      case 'movingUp':
        if (angle >= 155) {
          if (this.topAchieved) {
            this.state = 'completed';
            this.validReps++;
            isRepIncremented = true;
            this.topAchieved = false;
            feedback = `Підйом ніг #${this.validReps} зараховано!`;
          } else {
            this.state = 'ready';
          }
        }
        break;

      case 'completed':
        this.state = angle <= 140 ? 'movingDown' : 'ready';
        break;
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: progress,
      isUserInFrame: true,
      userFrameMessage: 'Тіло у висі',
      feedback,
      primaryAngle: Math.round(angle),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 8. CORE: PLANK (CLASSIC, ELBOW, SIDE - PURE ISOMETRIC SECONDS ACCUMULATION)
// ============================================================================
export class UniversalPlankDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0; // Represents accumulated clean seconds
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private holdStartTimestamp: number = 0;
  private accumulatedHoldSec: number = 0;
  private lastSecondTickMs: number = 0;

  private isSidePlank: boolean = false;

  constructor(exerciseId: string = 'plank_classic') {
    this.exerciseId = exerciseId;
    this.isSidePlank = exerciseId.toLowerCase().includes('side');
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.accumulatedHoldSec; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }
  public getHoldSeconds(): number { return this.accumulatedHoldSec; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.holdStartTimestamp = 0;
    this.accumulatedHoldSec = 0;
    this.lastSecondTickMs = 0;
  }

  public processFrame(skeleton: NormalizedSkeleton, timestampMs: number = Date.now()): UniversalDetectorResult {
    let isRepIncremented = false;

    const shoulderVis = ((skeleton.leftShoulder.visibility ?? 0.8) + (skeleton.rightShoulder.visibility ?? 0.8)) / 2;
    const hipVis = ((skeleton.leftHip.visibility ?? 0.8) + (skeleton.rightHip.visibility ?? 0.8)) / 2;

    if (shoulderVis < 0.35 || hipVis < 0.35) {
      this.holdStartTimestamp = 0;
      return {
        exerciseId: this.exerciseId,
        state: 'ready',
        validReps: this.accumulatedHoldSec,
        rejectedReps: this.rejectedReps,
        isRepIncremented: false,
        repProgress: 0,
        isUserInFrame: false,
        userFrameMessage: 'Розташуйтеся повністю в кадрі (видно все тіло на підлозі)',
        feedback: 'Займіть положення планки на килимку',
        primaryAngle: null,
        secondaryAngle: null,
        lastRejectReason: this.lastRejectReason,
        holdSeconds: this.accumulatedHoldSec
      };
    }

    const leftTorso = calculateTorsoAngleFromHorizontal(skeleton.leftShoulder, skeleton.leftHip);
    const rightTorso = calculateTorsoAngleFromHorizontal(skeleton.rightShoulder, skeleton.rightHip);
    const torsoAngle = (leftTorso + rightTorso) / 2;

    // Check spinal alignment (shoulder, hip, ankle in straight line)
    const spineAngle = calculateAngle(skeleton.leftShoulder, skeleton.leftHip, skeleton.leftAnkle);
    const isAlignmentStraight = spineAngle >= 150 && spineAngle <= 195;
    const isPlankValid = torsoAngle <= 35 && isAlignmentStraight;

    if (isPlankValid) {
      if (this.holdStartTimestamp === 0) {
        this.holdStartTimestamp = timestampMs;
        this.lastSecondTickMs = timestampMs;
        this.state = 'bottom';
      }

      if (timestampMs - this.lastSecondTickMs >= 1000) {
        this.accumulatedHoldSec += 1;
        this.validReps = this.accumulatedHoldSec;
        this.lastSecondTickMs = timestampMs;
        isRepIncremented = true;
      }
    } else {
      if (this.holdStartTimestamp !== 0) {
        // Paused hold due to sagged hips or raised glutes
        this.lastRejectReason = spineAngle < 150 ? 'Прогин у попереку або таз занадто вгорі' : 'Корпус не в горизонталі';
      }
      this.holdStartTimestamp = 0;
      this.state = 'ready';
    }

    const feedback = isPlankValid
      ? `Планка зафіксована: ${this.accumulatedHoldSec} сек чистого утримання`
      : 'Тримайте рівну лінію тіла: прес і сідниці напружені, без прогину!';

    return {
      exerciseId: this.exerciseId,
      state: isPlankValid ? 'bottom' : 'ready',
      validReps: this.accumulatedHoldSec,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: isPlankValid ? 100 : 0,
      isUserInFrame: true,
      userFrameMessage: isPlankValid ? 'Ідеальна фіксація' : 'Виправте положення планки',
      feedback,
      primaryAngle: Math.round(torsoAngle),
      secondaryAngle: Math.round(spineAngle),
      lastRejectReason: this.lastRejectReason,
      holdSeconds: this.accumulatedHoldSec
    };
  }
}

// ============================================================================
// 9. CARDIO: JUMPING JACKS
// ============================================================================
export class UniversalJumpingJacksDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;

  constructor(exerciseId: string = 'jumping_jacks') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;

    const ankleDist = Math.abs(skeleton.leftAnkle.x - skeleton.rightAnkle.x);
    const avgWristY = (skeleton.leftWrist.y + skeleton.rightWrist.y) / 2;
    const avgShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;
    const handsOverhead = avgWristY < avgShoulderY;

    if (this.state === 'ready') {
      if (ankleDist > 0.20 && handsOverhead) {
        this.state = 'bottom';
      }
    } else if (this.state === 'bottom') {
      if (ankleDist < 0.14 && avgWristY > avgShoulderY) {
        this.state = 'completed';
        this.validReps++;
        isRepIncremented = true;
      }
    } else if (this.state === 'completed') {
      this.state = 'ready';
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: this.state === 'bottom' ? 100 : 0,
      isUserInFrame: true,
      userFrameMessage: 'Тіло в кадрі',
      feedback: this.state === 'bottom' ? 'Зводьте руки та ноги назад' : 'Стрибок: розводьте руки над головою та ноги в сторони!',
      primaryAngle: Math.round(ankleDist * 100),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 10. CARDIO: HIGH KNEES
// ============================================================================
export class UniversalHighKneesDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private lastKneeRaised: 'left' | 'right' | null = null;

  constructor(exerciseId: string = 'high_knees') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.lastKneeRaised = null;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;

    const leftKneeY = skeleton.leftKnee.y;
    const rightKneeY = skeleton.rightKnee.y;
    const avgHipY = (skeleton.leftHip.y + skeleton.rightHip.y) / 2;

    // High knee: knee rises near hip height (diff <= 0.12 in screen fraction)
    const isLeftHigh = avgHipY - leftKneeY > -0.10;
    const isRightHigh = avgHipY - rightKneeY > -0.10;

    let feedback = 'Біг на місці з високим підйомом колін';

    if (this.state === 'ready') {
      if (isLeftHigh && this.lastKneeRaised !== 'left') {
        this.state = 'bottom';
        this.lastKneeRaised = 'left';
        this.validReps++;
        isRepIncremented = true;
        feedback = 'Коліно піднято! Зміна ноги';
      } else if (isRightHigh && this.lastKneeRaised !== 'right') {
        this.state = 'bottom';
        this.lastKneeRaised = 'right';
        this.validReps++;
        isRepIncremented = true;
        feedback = 'Коліно піднято! Зміна ноги';
      }
    } else if (this.state === 'bottom') {
      if (!isLeftHigh && !isRightHigh) {
        this.state = 'ready';
      }
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: this.state === 'bottom' ? 100 : 0,
      isUserInFrame: true,
      userFrameMessage: 'Тіло в русі',
      feedback,
      primaryAngle: null,
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// 11. CARDIO: BURPEES
// ============================================================================
export class UniversalBurpeesDetector implements IUniversalDetector {
  public readonly exerciseId: string;
  private state: UniversalExerciseState = 'ready';
  private validReps: number = 0;
  private rejectedReps: number = 0;
  private lastRejectReason: string | null = null;
  private touchedFloor: boolean = false;

  constructor(exerciseId: string = 'burpees') {
    this.exerciseId = exerciseId;
  }

  public getState(): UniversalExerciseState { return this.state; }
  public getValidReps(): number { return this.validReps; }
  public getRejectedReps(): number { return this.rejectedReps; }
  public getLastRejectReason(): string | null { return this.lastRejectReason; }

  public reset(): void {
    this.state = 'ready';
    this.validReps = 0;
    this.rejectedReps = 0;
    this.lastRejectReason = null;
    this.touchedFloor = false;
  }

  public processFrame(skeleton: NormalizedSkeleton): UniversalDetectorResult {
    let isRepIncremented = false;

    const leftTorso = calculateTorsoAngleFromHorizontal(skeleton.leftShoulder, skeleton.leftHip);
    const rightTorso = calculateTorsoAngleFromHorizontal(skeleton.rightShoulder, skeleton.rightHip);
    const torsoAngle = (leftTorso + rightTorso) / 2;

    const avgWristY = (skeleton.leftWrist.y + skeleton.rightWrist.y) / 2;
    const avgShoulderY = (skeleton.leftShoulder.y + skeleton.rightShoulder.y) / 2;

    let feedback = 'Почніть стоячи: стрибок у планку, потім підйом угору';

    // Standing: torso >= 60°
    // In plank/floor: torso <= 35°
    if (this.state === 'ready') {
      if (torsoAngle <= 35) {
        this.state = 'movingDown'; // drop into plank
        this.touchedFloor = true;
        feedback = 'Планка на підлозі зафіксована! Стрибок ногами до рук';
      }
    } else if (this.state === 'movingDown') {
      if (torsoAngle >= 60 && this.touchedFloor) {
        this.state = 'bottom'; // standing up
        feedback = 'Стрибок угору з підйомом рук!';
      }
    } else if (this.state === 'bottom') {
      if (avgWristY < avgShoulderY) { // hands overhead jump
        this.state = 'completed';
        this.validReps++;
        isRepIncremented = true;
        this.touchedFloor = false;
        feedback = `Берпі #${this.validReps} зараховано!`;
      }
    } else if (this.state === 'completed') {
      this.state = 'ready';
    }

    return {
      exerciseId: this.exerciseId,
      state: this.state,
      validReps: this.validReps,
      rejectedReps: this.rejectedReps,
      isRepIncremented,
      repProgress: this.state === 'bottom' || this.state === 'completed' ? 100 : this.touchedFloor ? 50 : 0,
      isUserInFrame: true,
      userFrameMessage: 'Тіло в кадрі',
      feedback,
      primaryAngle: Math.round(torsoAngle),
      secondaryAngle: null,
      lastRejectReason: this.lastRejectReason
    };
  }
}

// ============================================================================
// UNIVERSAL EXERCISE REGISTRY & TRACKING VERIFIER
// ============================================================================

export const SUPPORTED_EXERCISE_IDS = new Set<string>([
  'pushups_classic',
  'pushups_wide_grip',
  'diamond_pushups',
  'pushups_knees',
  'pushups_wall',
  'pike_pushups',
  'dips_bars',
  'archer_pushups',
  'pullups_classic',
  'pullups_overhand',
  'chin_ups',
  'squats_bodyweight',
  'barbell_squats',
  'lunges_bodyweight',
  'calf_raises',
  'pistol_squats',
  'floor_crunches',
  'hanging_leg_raises',
  'plank_classic',
  'elbow_plank',
  'side_plank',
  'jumping_jacks',
  'high_knees',
  'burpees'
]);

export class UniversalExerciseRegistry {
  private static detectors: Map<string, IUniversalDetector> = new Map();

  public static isTrackingSupported(exerciseId: string): boolean {
    if (!exerciseId) return false;
    const lower = exerciseId.toLowerCase();

    // Check exact id match
    if (SUPPORTED_EXERCISE_IDS.has(exerciseId)) return true;

    // Check keyword patterns strictly matching supported exercises
    if (
      lower.includes('pushup') ||
      lower.includes('віджиман') ||
      lower.includes('diamond') ||
      lower.includes('dips') ||
      lower.includes('брус') ||
      lower.includes('pullup') ||
      lower.includes('підтяг') ||
      lower.includes('chin_up') ||
      lower.includes('squat') ||
      lower.includes('присід') ||
      lower.includes('lunge') ||
      lower.includes('випад') ||
      lower.includes('calf') ||
      lower.includes('носк') ||
      lower.includes('crunch') ||
      lower.includes('скручуван') ||
      lower.includes('leg_raise') ||
      lower.includes('підйом ніг') ||
      lower.includes('plank') ||
      lower.includes('планк') ||
      lower.includes('jump') ||
      lower.includes('knee') ||
      lower.includes('burpee') ||
      lower.includes('берпі')
    ) {
      // Exclude unsupported barbell exercises (bench press, bent over row, bicep curl)
      if (
        lower.includes('bench_press') ||
        lower.includes('жим штанги') ||
        lower.includes('incline') ||
        lower.includes('гантел') ||
        lower.includes('row') ||
        lower.includes('тяга') ||
        lower.includes('curl') ||
        lower.includes('french') ||
        lower.includes('dragon_flag') ||
        lower.includes('warmup') ||
        lower.includes('розминк')
      ) {
        return false;
      }
      return true;
    }

    return false;
  }

  public static getDetector(exerciseId: string): IUniversalDetector | null {
    if (!this.isTrackingSupported(exerciseId)) {
      return null;
    }

    const lower = exerciseId.toLowerCase();

    // Pull-ups & Chin-ups
    if (lower.includes('pull') || lower.includes('chin') || lower.includes('підтяг')) {
      const key = 'pullup_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalPullUpDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Push-up variants
    if (
      lower.includes('pushup') ||
      lower.includes('віджиман') ||
      lower.includes('diamond') ||
      lower.includes('dip') ||
      lower.includes('брус') ||
      lower.includes('pike') ||
      lower.includes('archer')
    ) {
      const key = 'pushup_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalPushUpDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Squat variants (bodyweight, barbell, pistol)
    if (lower.includes('squat') || lower.includes('присід')) {
      const key = 'squat_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalSquatDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Lunges
    if (lower.includes('lunge') || lower.includes('випад')) {
      const key = 'lunge_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalLungesDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Calf raises
    if (lower.includes('calf') || lower.includes('носк')) {
      const key = 'calf_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalCalfRaisesDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Crunches
    if (lower.includes('crunch') || lower.includes('скручуван')) {
      const key = 'crunch_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalCrunchesDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Hanging leg raises
    if (lower.includes('leg_raise') || lower.includes('підйом ніг')) {
      const key = 'leg_raise_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalLegRaisesDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Plank variants
    if (lower.includes('plank') || lower.includes('планк')) {
      const key = 'plank_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalPlankDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Burpees
    if (lower.includes('burpee') || lower.includes('берпі')) {
      const key = 'burpee_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalBurpeesDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // High knees
    if (lower.includes('high_knee') || lower.includes('підйом колін')) {
      const key = 'high_knee_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalHighKneesDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    // Jumping jacks & cardio
    if (lower.includes('jump') || lower.includes('jack')) {
      const key = 'jumping_jacks_' + exerciseId;
      if (!this.detectors.has(key)) {
        this.detectors.set(key, new UniversalJumpingJacksDetector(exerciseId));
      }
      return this.detectors.get(key)!;
    }

    return null;
  }
}
