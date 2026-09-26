export type CameraViewMode = 'side' | 'front' | 'back';

// Biomechanical Pose Keypoint & Verification Types
export interface PoseLandmark {
  x: number; // 0.0 to 1.0 (horizontal screen fraction)
  y: number; // 0.0 to 1.0 (vertical screen fraction, 0 = top, 1 = bottom)
  z?: number;
  visibility?: number; // 0.0 to 1.0 (confidence score)
}

export type RawLandmarkArray = PoseLandmark[];

export interface NormalizedSkeleton {
  nose: PoseLandmark;
  leftShoulder: PoseLandmark;
  rightShoulder: PoseLandmark;
  leftElbow: PoseLandmark;
  rightElbow: PoseLandmark;
  leftWrist: PoseLandmark;
  rightWrist: PoseLandmark;
  leftHip: PoseLandmark;
  rightHip: PoseLandmark;
  leftKnee: PoseLandmark;
  rightKnee: PoseLandmark;
  leftAnkle: PoseLandmark;
  rightAnkle: PoseLandmark;
  confidence: number;
  isFullBodyVisible?: boolean;
}

export type RepPhase = 'IDLE' | 'POSITIONING' | 'READY' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING' | 'TOP';

// Universal 5-state finite state machine required by ForgeMuscle architecture
export type UniversalExerciseState = 'ready' | 'movingDown' | 'bottom' | 'movingUp' | 'completed';

export function mapRepPhaseToUniversalState(phase: RepPhase): UniversalExerciseState {
  switch (phase) {
    case 'DESCENDING':
      return 'movingDown';
    case 'BOTTOM':
      return 'bottom';
    case 'ASCENDING':
      return 'movingUp';
    case 'TOP':
      return 'completed';
    case 'READY':
    case 'POSITIONING':
    case 'IDLE':
    default:
      return 'ready';
  }
}

export type RejectReason =
  | 'LOW_CONFIDENCE'
  | 'BAD_BODY_ALIGNMENT'
  | 'SHALLOW_REP'
  | 'INCOMPLETE_REP'
  | 'TOO_FAST'
  | 'TIMEOUT'
  | 'INVALID_START_POSITION'
  | 'ASYMMETRIC_ARMS'
  // Compatibility aliases
  | 'too_shallow'
  | 'bad_alignment'
  | 'insufficient_confidence'
  | 'invalid_sequence'
  | 'too_fast'
  | 'no_lockout';

export interface VerificationFrameResult {
  exerciseId: string;
  exercise?: string;
  state: RepPhase;
  universalState?: UniversalExerciseState;
  validReps: number;
  rejectedReps: number;
  lastRejectReason: RejectReason | null;
  currentFrameReason?: RejectReason | null;
  lastRejectedRepReason?: RejectReason | null;
  rejectReason?: RejectReason | null;
  repProgress: number; // 0 to 100
  leftElbowAngle: number | null;
  rightElbowAngle: number | null;
  primaryElbowAngle: number | null;
  leftKneeAngle: number | null;
  rightKneeAngle: number | null;
  primaryKneeAngle: number | null;
  torsoAngle: number; // angle from horizontal (0° = horizontal plank, 90° = vertical standing)
  isAlignmentValid: boolean;
  alignmentStatus: string;
  confidence: number;
  feedback: string;
  isRepCompleted: boolean;
  isRepRejected: boolean;
  isFullBodyVisible?: boolean;
  repDurationMs?: number;
  rom?: number;
  // Diagnostic flags
  isPoseValid?: boolean;
  poseValid?: boolean;
  isPushUpPosition?: boolean;
  positionValid?: boolean;
  isLeftArmValid?: boolean;
  isRightArmValid?: boolean;
  isBodyChainValid?: boolean;
  validRep?: boolean;
}

export interface IExerciseVerifier {
  readonly exerciseType: string;
  reset(): void;
  processSkeleton(skeleton: NormalizedSkeleton, timestampMs?: number): VerificationFrameResult;
  getState(): RepPhase;
  getValidReps(): number;
  getRejectedReps(): number;
  getLastRejectReason(): RejectReason | null;
}
