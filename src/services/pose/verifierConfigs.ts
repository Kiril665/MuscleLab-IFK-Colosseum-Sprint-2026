import { CameraViewMode } from './poseTypes';

// Verifier Configuration Profiles & Configurable Thresholds

export interface PushUpConfig {
  viewMode?: CameraViewMode; // 'side' (default), 'front', or 'back'
  confidenceThreshold: number; // Minimum keypoint visibility score (0 to 1)
  minConfidence: number; // Alias for backward compatibility
  topAngle: number; // Top lockout threshold (degrees)
  maxElbowAngle: number; // Alias for backward compatibility
  bottomAngle: number; // Bottom depth threshold (degrees)
  minElbowAngle: number; // Alias for backward compatibility
  topExitAngle: number; // Hysteresis threshold to exit TOP
  descendingTriggerAngle: number; // Alias for topExitAngle
  bottomExitAngle: number; // Hysteresis threshold to exit BOTTOM
  ascendingTriggerAngle: number; // Alias for bottomExitAngle
  minRom: number; // Minimum ROM degrees (e.g. 45°)
  minRepDurationSec: number; // Anti-cheat: minimum realistic duration (e.g. 0.60s)
  maxRepDurationSec: number; // Maximum rep duration before timeout reset (e.g. 8.0s)
  stateStabilityFrames: number; // Consecutive frames to stabilize transitions
  stabilityFramesRequired: number; // Alias for backward compatibility
  alignmentTolerance: number; // Must be horizontal plank (<= 40° from horizontal)
  maxTorsoAngleFromHorizontal: number; // Alias for alignmentTolerance
  maxArmAsymmetry: number; // Maximum angle difference between arms (degrees)
  cooldownMs: number; // Debounce time between valid repetitions
}

export type PushUpVerificationConfig = PushUpConfig;

export interface SquatConfig {
  minKneeAngle: number; // Bottom parallel/deep squat angle (degrees)
  maxKneeAngle: number; // Top standing lockout angle (degrees)
  descendingTriggerAngle: number;
  ascendingTriggerAngle: number;
  minTorsoAngleFromHorizontal: number; // Must be upright torso (>= 50°)
  minConfidence: number;
  minRepDurationSec: number;
  maxRepDurationSec: number;
  stabilityFramesRequired: number;
  cooldownMs: number;
}

export interface PullUpConfig {
  minElbowAngle: number; // Top chin-over-bar elbow angle (degrees)
  maxElbowAngle: number; // Bottom dead-hang extension angle (degrees)
  minTorsoAngleFromHorizontal: number; // Must be vertical hanging (>= 55°)
  minConfidence: number;
  minRepDurationSec: number;
  maxRepDurationSec: number;
  stabilityFramesRequired: number;
  cooldownMs: number;
}

export const PUSHUP_CONFIG: PushUpConfig = {
  confidenceThreshold: 0.50,
  minConfidence: 0.50,
  topAngle: 155,
  maxElbowAngle: 155,
  bottomAngle: 85,
  minElbowAngle: 85,
  topExitAngle: 145,
  descendingTriggerAngle: 145,
  bottomExitAngle: 105,
  ascendingTriggerAngle: 105,
  minRom: 45,
  minRepDurationSec: 0.55,
  maxRepDurationSec: 8.0,
  stateStabilityFrames: 2,
  stabilityFramesRequired: 2,
  alignmentTolerance: 40,
  maxTorsoAngleFromHorizontal: 40,
  maxArmAsymmetry: 45,
  cooldownMs: 400
};

export const SQUAT_CONFIG: SquatConfig = {
  minKneeAngle: 95,
  maxKneeAngle: 160,
  descendingTriggerAngle: 145,
  ascendingTriggerAngle: 115,
  minTorsoAngleFromHorizontal: 50,
  minConfidence: 0.50,
  minRepDurationSec: 0.85,
  maxRepDurationSec: 8.0,
  stabilityFramesRequired: 2,
  cooldownMs: 600
};

export const PULLUP_CONFIG: PullUpConfig = {
  minElbowAngle: 80,
  maxElbowAngle: 150,
  minTorsoAngleFromHorizontal: 55,
  minConfidence: 0.50,
  minRepDurationSec: 1.0,
  maxRepDurationSec: 8.0,
  stabilityFramesRequired: 2,
  cooldownMs: 700
};
