import crypto from 'crypto';
import { NormalizedSkeleton, IExerciseVerifier, CameraViewMode } from './poseTypes';
import { PushUpVerifier } from './PushUpVerifier';
import { SquatVerifier } from './SquatVerifier';
import { PullUpVerifier } from './PullUpVerifier';
import { UniversalExerciseRegistry } from './universalExerciseEngine';

export interface TelemetryFrame {
  timestamp: number;
  primaryAngle: number;
  torsoAngle: number;
  confidence: number;
  viewMode?: CameraViewMode;
  state?: string;
  isAlignmentValid?: boolean;
  leftWristY?: number;
  rightWristY?: number;
  leftShoulderY?: number;
  rightShoulderY?: number;
  noseY?: number;
}

export interface ServerVerificationResult {
  serverValidReps: number;
  serverRejectedReps: number;
  rejectionReasons: string[];
  livenessPassed: boolean;
  livenessReason?: string;
  isDisputedMismatch: boolean;
  repDifference: number;
  status: 'VERIFIED_FORGE' | 'DISPUTED_MISMATCH' | 'REJECTED_CHEAT_DETECTED' | 'COMPLETED_ZERO_REPS';
  framesJournalHash: string;
  framesCount: number;
  anomalyScore: number;
  repDurations: number[];
}

/**
 * Reconstructs a mathematically consistent biomechanical skeleton from a telemetry frame
 */
export function reconstructSkeletonFromFrame(exercise: string, frame: TelemetryFrame): NormalizedSkeleton {
  const normEx = (exercise || 'push_up').toLowerCase();
  const conf = Math.max(0.1, Math.min(1.0, frame.confidence || 0.95));
  const primaryAngle = frame.primaryAngle || 160;
  const torsoAngle = frame.torsoAngle || 5;

  if (normEx.includes('squat')) {
    // Standing vertical squat: hips drop, knees flex
    const halfAngleRad = (Math.max(60, Math.min(180, primaryAngle)) * Math.PI / 180) / 2;
    const drop = (180 - primaryAngle) / 180 * 0.25;
    return {
      nose: { x: 0.50, y: frame.noseY ?? (0.15 + drop), visibility: conf },
      leftShoulder: { x: 0.44, y: frame.leftShoulderY ?? (0.25 + drop), visibility: conf },
      rightShoulder: { x: 0.56, y: frame.rightShoulderY ?? (0.25 + drop), visibility: conf },
      leftElbow: { x: 0.40, y: 0.38 + drop, visibility: conf },
      rightElbow: { x: 0.60, y: 0.38 + drop, visibility: conf },
      leftWrist: { x: 0.44, y: frame.leftWristY ?? (0.42 + drop), visibility: conf },
      rightWrist: { x: 0.56, y: frame.rightWristY ?? (0.42 + drop), visibility: conf },
      leftHip: { x: 0.45, y: 0.52 + drop, visibility: conf },
      rightHip: { x: 0.55, y: 0.52 + drop, visibility: conf },
      leftKnee: { x: 0.45 - Math.sin(halfAngleRad) * 0.08, y: 0.72 + drop * 0.5, visibility: conf },
      rightKnee: { x: 0.55 + Math.sin(halfAngleRad) * 0.08, y: 0.72 + drop * 0.5, visibility: conf },
      leftAnkle: { x: 0.45, y: 0.92, visibility: conf },
      rightAnkle: { x: 0.55, y: 0.92, visibility: conf },
      confidence: conf
    };
  } else if (normEx.includes('pull')) {
    // Pull-up: vertical hanging, elbows flex upwards to bar
    const pullT = (180 - primaryAngle) / (180 - 60);
    const bodyLift = pullT * 0.22;
    return {
      nose: { x: 0.50, y: 0.28 - bodyLift, visibility: conf },
      leftShoulder: { x: 0.43, y: 0.35 - bodyLift, visibility: conf },
      rightShoulder: { x: 0.57, y: 0.35 - bodyLift, visibility: conf },
      leftElbow: { x: 0.36 - pullT * 0.08, y: 0.30 - bodyLift * 0.5, visibility: conf },
      rightElbow: { x: 0.64 + pullT * 0.08, y: 0.30 - bodyLift * 0.5, visibility: conf },
      leftWrist: { x: 0.40, y: frame.leftWristY ?? 0.15, visibility: conf },
      rightWrist: { x: 0.60, y: frame.rightWristY ?? 0.15, visibility: conf },
      leftHip: { x: 0.46, y: 0.60 - bodyLift, visibility: conf },
      rightHip: { x: 0.54, y: 0.60 - bodyLift, visibility: conf },
      leftKnee: { x: 0.46, y: 0.78 - bodyLift, visibility: conf },
      rightKnee: { x: 0.54, y: 0.78 - bodyLift, visibility: conf },
      leftAnkle: { x: 0.46, y: 0.94 - bodyLift, visibility: conf },
      rightAnkle: { x: 0.54, y: 0.94 - bodyLift, visibility: conf },
      confidence: conf
    };
  } else {
    // Push-up:
    const viewMode = frame.viewMode || 'side';

    if (viewMode === 'front') {
      const dropProgress = Math.max(0, Math.min(1, (160 - primaryAngle) / (160 - 75)));
      const baseShoulderY = frame.leftShoulderY ?? 0.35;
      const shoulderY = baseShoulderY + dropProgress * 0.15;
      const halfWidth = 0.12 + dropProgress * 0.04;
      const noseY = frame.noseY ?? (shoulderY - 0.06 + dropProgress * 0.12);

      return {
        nose: { x: 0.50, y: noseY, visibility: conf },
        leftShoulder: { x: 0.50 - halfWidth, y: shoulderY, visibility: conf },
        rightShoulder: { x: 0.50 + halfWidth, y: shoulderY, visibility: conf },
        leftElbow: { x: 0.50 - halfWidth - 0.08, y: shoulderY + 0.10, visibility: conf },
        rightElbow: { x: 0.50 + halfWidth + 0.08, y: shoulderY + 0.10, visibility: conf },
        leftWrist: { x: 0.50 - halfWidth - 0.05, y: 0.85, visibility: conf },
        rightWrist: { x: 0.50 + halfWidth + 0.05, y: 0.85, visibility: conf },
        leftHip: { x: 0.46, y: 0.70, visibility: conf },
        rightHip: { x: 0.54, y: 0.70, visibility: conf },
        leftKnee: { x: 0.47, y: 0.85, visibility: conf },
        rightKnee: { x: 0.53, y: 0.85, visibility: conf },
        leftAnkle: { x: 0.48, y: 0.95, visibility: conf },
        rightAnkle: { x: 0.52, y: 0.95, visibility: conf },
        confidence: conf
      };
    } else if (viewMode === 'back') {
      const dropProgress = Math.max(0, Math.min(1, (160 - primaryAngle) / (160 - 75)));
      const baseShoulderY = frame.leftShoulderY ?? 0.35;
      const shoulderY = baseShoulderY + dropProgress * 0.15;
      const halfWidth = 0.12 + dropProgress * 0.04;

      return {
        nose: { x: 0.50, y: 0.30, visibility: 0 },
        leftShoulder: { x: 0.50 - halfWidth, y: shoulderY, visibility: conf },
        rightShoulder: { x: 0.50 + halfWidth, y: shoulderY, visibility: conf },
        leftElbow: { x: 0.50 - halfWidth - 0.08, y: shoulderY + 0.10, visibility: 0 },
        rightElbow: { x: 0.50 + halfWidth + 0.08, y: shoulderY + 0.10, visibility: 0 },
        leftWrist: { x: 0.50 - halfWidth - 0.05, y: 0.85, visibility: 0 },
        rightWrist: { x: 0.50 + halfWidth + 0.05, y: 0.85, visibility: 0 },
        leftHip: { x: 0.46, y: 0.65, visibility: conf },
        rightHip: { x: 0.54, y: 0.65, visibility: conf },
        leftKnee: { x: 0.47, y: 0.80, visibility: conf },
        rightKnee: { x: 0.53, y: 0.80, visibility: conf },
        leftAnkle: { x: 0.48, y: 0.95, visibility: conf },
        rightAnkle: { x: 0.52, y: 0.95, visibility: conf },
        confidence: conf
      };
    }

    // Standard Side-View (horizontal plank on floor)
    const t = Math.max(0, Math.min(1, (primaryAngle - 70) / (165 - 70)));
    const sy = 0.81 - t * 0.10;
    const torsoRad = (torsoAngle * Math.PI) / 180;
    const hy = sy + Math.sin(torsoRad) * 0.40;

    const halfAngleRad = (Math.max(60, Math.min(180, primaryAngle)) * Math.PI / 180) / 2;
    const dy = (0.90 - sy) / 2;
    const dx = dy / Math.tan(halfAngleRad);
    const ex = 0.35 - dx;
    const ey = (sy + 0.90) / 2;

    const wristY = (frame.leftWristY !== undefined && frame.leftWristY < 0.6) 
      ? frame.leftWristY 
      : 0.90;

    return {
      nose: { x: 0.30, y: sy - 0.02, visibility: conf },
      leftShoulder: { x: 0.35, y: sy, visibility: conf },
      rightShoulder: { x: 0.35, y: sy, visibility: conf },
      leftElbow: { x: ex, y: ey, visibility: conf },
      rightElbow: { x: ex, y: ey, visibility: conf },
      leftWrist: { x: 0.35, y: wristY, visibility: conf },
      rightWrist: { x: 0.35, y: 0.90, visibility: conf },
      leftHip: { x: 0.75, y: hy, visibility: conf },
      rightHip: { x: 0.75, y: hy, visibility: conf },
      leftKnee: { x: 0.85, y: hy + 0.02, visibility: conf },
      rightKnee: { x: 0.85, y: hy + 0.02, visibility: conf },
      leftAnkle: { x: 0.95, y: 0.90, visibility: conf },
      rightAnkle: { x: 0.95, y: 0.90, visibility: conf },
      confidence: conf
    };
  }
}

/**
 * Validates biometric liveness against nonce challenge
 */
export function verifyLivenessChallenge(
  challenge: string | undefined | null,
  frames: TelemetryFrame[]
): { passed: boolean; reason?: string } {
  if (!challenge) {
    return { passed: frames.length > 0 };
  }

  if (!frames || frames.length === 0) {
    return { passed: false, reason: 'Журнал кадрів порожній — відсутні дані камери' };
  }

  // Early window inspection (first 35% of frames or up to 60 frames)
  const windowFrames = frames.slice(0, Math.min(frames.length, 60));

  if (challenge.includes('ліву руку') || challenge.includes('RAISE_LEFT_ARM')) {
    // Check for left arm elevation in first window
    const raisedFrames = windowFrames.filter(f => {
      if (f.leftWristY !== undefined) {
        if (f.leftShoulderY !== undefined) {
          return f.leftWristY < f.leftShoulderY - 0.03;
        }
        return f.leftWristY < 0.45;
      }
      return false;
    });

    if (raisedFrames.length >= 3) {
      return { passed: true };
    }
    return { passed: false, reason: 'Дія liveness (підняття лівої руки) не зафіксована у початкових кадрах' };
  }

  if (challenge.includes('Статична фіксація') || challenge.includes('STATIC_HOLD')) {
    if (windowFrames.length < 6) {
      return { passed: false, reason: 'Недостатньо кадрів для перевірки статичної фіксації' };
    }
    const angles = windowFrames.slice(0, 15).map(f => f.primaryAngle);
    const avg = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / angles.length;
    if (variance < 150) {
      return { passed: true };
    }
    return { passed: false, reason: 'Статична фіксація 3с не витримана' };
  }

  if (challenge.includes('погляд') || challenge.includes('CALIBRATE_GAZE')) {
    const confidentFrames = windowFrames.filter(f => f.confidence >= 0.75);
    if (confidentFrames.length >= 5) {
      return { passed: true };
    }
    return { passed: false, reason: 'Калібрування погляду/обличчя не завершено' };
  }

  return { passed: true };
}

/**
 * Runs independent server-side state machine verification on telemetry frames
 */
export function verifyWorkoutFrameJournal(
  exercise: string,
  frames: TelemetryFrame[],
  clientValidReps: number,
  challenge?: string | null,
  viewMode?: CameraViewMode
): ServerVerificationResult {
  const normEx = (exercise || 'push_up').toLowerCase();
  const effectiveViewMode = viewMode || frames?.[0]?.viewMode || 'side';

  // Calculate cryptographic hash of raw frame journal
  const framesJournalString = JSON.stringify(frames || []);
  const framesJournalHash = crypto.createHash('sha256').update(framesJournalString).digest('hex');

  // Verify Liveness
  const liveness = verifyLivenessChallenge(challenge, frames);

  // If no frames were submitted at all
  if (!frames || frames.length === 0) {
    const isDisputed = clientValidReps > 0;
    return {
      serverValidReps: 0,
      serverRejectedReps: 0,
      rejectionReasons: ['NO_FRAMES_SUBMITTED'],
      livenessPassed: false,
      livenessReason: 'Відсутні кадри телеметрії для верифікації',
      isDisputedMismatch: isDisputed,
      repDifference: clientValidReps,
      status: isDisputed ? 'DISPUTED_MISMATCH' : 'COMPLETED_ZERO_REPS',
      framesJournalHash,
      framesCount: 0,
      anomalyScore: isDisputed ? 100 : 0,
      repDurations: []
    };
  }

  // Sort frames chronologically to ensure deterministic monotonic sequence
  const sortedFrames = [...frames].sort((a, b) => a.timestamp - b.timestamp);

  const rejectionReasonsSet = new Set<string>();
  const repDurations: number[] = [];
  let prevValidReps = 0;
  let lastRepTime = sortedFrames[0]?.timestamp || 0;
  let serverValidReps = 0;
  let serverRejectedReps = 0;

  const universalDetector = UniversalExerciseRegistry.getDetector(exercise);
  if (universalDetector) {
    universalDetector.reset();
    const isIsometric = universalDetector.getHoldSeconds !== undefined;

    for (const frame of sortedFrames) {
      const skeleton = reconstructSkeletonFromFrame(exercise, frame);
      const res = universalDetector.processFrame(skeleton, frame.timestamp, effectiveViewMode);

      if (res.lastRejectReason) {
        rejectionReasonsSet.add(res.lastRejectReason);
      }

      const currentValid = isIsometric && universalDetector.getHoldSeconds ? (universalDetector.getHoldSeconds() || 0) : universalDetector.getValidReps();
      if (currentValid > prevValidReps) {
        const repDurationSec = (frame.timestamp - lastRepTime) / 1000;
        repDurations.push(repDurationSec);
        lastRepTime = frame.timestamp;
        prevValidReps = currentValid;
      }
    }

    serverValidReps = isIsometric && universalDetector.getHoldSeconds ? (universalDetector.getHoldSeconds() || 0) : universalDetector.getValidReps();
    serverRejectedReps = universalDetector.getRejectedReps();
  } else {
    // Fallback verifier
    let verifier: IExerciseVerifier;
    if (normEx.includes('squat')) {
      verifier = new SquatVerifier();
    } else if (normEx.includes('pull')) {
      verifier = new PullUpVerifier();
    } else {
      verifier = new PushUpVerifier({ viewMode: effectiveViewMode });
    }

    for (const frame of sortedFrames) {
      const skeleton = reconstructSkeletonFromFrame(exercise, frame);
      const result = verifier.processSkeleton(skeleton, frame.timestamp);

      if (result.lastRejectReason) {
        rejectionReasonsSet.add(result.lastRejectReason);
      }

      const currentValid = verifier.getValidReps();
      if (currentValid > prevValidReps) {
        const repDurationSec = (frame.timestamp - lastRepTime) / 1000;
        repDurations.push(repDurationSec);
        lastRepTime = frame.timestamp;
        prevValidReps = currentValid;
      }
    }

    serverValidReps = verifier.getValidReps();
    serverRejectedReps = verifier.getRejectedReps();
  }

  const repDifference = Math.abs(clientValidReps - serverValidReps);

  let anomalyScore = 0;

  // Mismatch detection: difference > 2 reps between client claim and server truth
  const isDisputedMismatch = repDifference > 2;
  if (isDisputedMismatch) {
    anomalyScore += 65;
  }

  if (!liveness.passed) {
    anomalyScore += 70;
  }

  // Check rep pacing / tempo anomalies
  const suspiciouslyFast = repDurations.filter(dur => dur > 0 && dur < 0.45).length;
  if (suspiciouslyFast > 1) {
    anomalyScore += 40;
  }

  let status: 'VERIFIED_FORGE' | 'DISPUTED_MISMATCH' | 'REJECTED_CHEAT_DETECTED' | 'COMPLETED_ZERO_REPS';

  if (isDisputedMismatch) {
    status = 'DISPUTED_MISMATCH';
  } else if (!liveness.passed || anomalyScore >= 60) {
    status = 'REJECTED_CHEAT_DETECTED';
  } else if (serverValidReps === 0 && clientValidReps === 0) {
    status = 'COMPLETED_ZERO_REPS';
  } else {
    status = 'VERIFIED_FORGE';
  }

  return {
    serverValidReps,
    serverRejectedReps,
    rejectionReasons: Array.from(rejectionReasonsSet),
    livenessPassed: liveness.passed,
    livenessReason: liveness.reason,
    isDisputedMismatch,
    repDifference,
    status,
    framesJournalHash,
    framesCount: sortedFrames.length,
    anomalyScore,
    repDurations
  };
}
