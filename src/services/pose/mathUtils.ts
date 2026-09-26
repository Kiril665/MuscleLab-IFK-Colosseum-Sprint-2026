import { PoseLandmark, RawLandmarkArray, NormalizedSkeleton } from './poseTypes';

/**
 * Calculates 2D angle in degrees between three keypoints, with B as vertex:
 * A (e.g. shoulder) -> B (e.g. elbow) -> C (e.g. wrist)
 */
export function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle * 10) / 10;
}

/**
 * Calculates Euclidean distance between two landmarks
 */
export function calculateDistance(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates torso angle relative to horizontal plane in degrees.
 * 0° = completely horizontal plank position (floor)
 * 90° = completely vertical standing position
 */
export function calculateTorsoAngleFromHorizontal(shoulder: PoseLandmark, hip: PoseLandmark): number {
  const dx = Math.abs(hip.x - shoulder.x);
  const dy = Math.abs(hip.y - shoulder.y);
  // atan2(dy, dx): when dy >> dx, angle approaches 90° (vertical)
  // when dx >> dy, angle approaches 0° (horizontal)
  const angleRad = Math.atan2(dy, Math.max(0.0001, dx));
  return Math.round(((angleRad * 180.0) / Math.PI) * 10) / 10;
}

/**
 * Exponential Moving Average smoothing
 */
export function exponentialSmooth(prev: number, current: number, alpha: number = 0.55): number {
  return prev * (1 - alpha) + current * alpha;
}

/**
 * Extracts and maps MediaPipe 33 landmark array to standard NormalizedSkeleton
 */
export function extractSkeletonFromMediaPipe(landmarks: RawLandmarkArray): NormalizedSkeleton | null {
  if (!landmarks || landmarks.length < 25) return null;

  const toLm = (lm: any): PoseLandmark => {
    const vis = typeof lm?.visibility === 'number'
      ? lm.visibility
      : (typeof lm?.score === 'number' ? lm.score : 0.85);
    return {
      x: lm?.x ?? 0,
      y: lm?.y ?? 0,
      z: lm?.z ?? 0,
      visibility: Math.max(0, Math.min(1, vis))
    };
  };

  const nose = toLm(landmarks[0]);
  const leftShoulder = toLm(landmarks[11]);
  const rightShoulder = toLm(landmarks[12]);
  const leftElbow = toLm(landmarks[13]);
  const rightElbow = toLm(landmarks[14]);
  const leftWrist = toLm(landmarks[15]);
  const rightWrist = toLm(landmarks[16]);
  const leftHip = toLm(landmarks[23]);
  const rightHip = toLm(landmarks[24]);
  const leftKnee = toLm(landmarks[25]);
  const rightKnee = toLm(landmarks[26]);
  const leftAnkle = toLm(landmarks[27]);
  const rightAnkle = toLm(landmarks[28]);

  // Calculate average confidence of primary core joints
  const coreLandmarks = [
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip
  ];

  let sumVisibility = 0;
  for (const lm of coreLandmarks) {
    sumVisibility += lm.visibility ?? 0.8;
  }
  const confidence = sumVisibility / coreLandmarks.length;

  // Check visibility of hips, knees, and ankles for full body framing
  const VISIBILITY_THRESHOLD = 0.5;
  const hasHip = (leftHip.visibility ?? 0) >= VISIBILITY_THRESHOLD || (rightHip.visibility ?? 0) >= VISIBILITY_THRESHOLD;
  const hasKnee = (leftKnee.visibility ?? 0) >= VISIBILITY_THRESHOLD || (rightKnee.visibility ?? 0) >= VISIBILITY_THRESHOLD;
  const hasAnkle = (leftAnkle.visibility ?? 0) >= VISIBILITY_THRESHOLD || (rightAnkle.visibility ?? 0) >= VISIBILITY_THRESHOLD;
  const isFullBodyVisible = hasHip && hasKnee && hasAnkle;

  return {
    nose,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
    confidence,
    isFullBodyVisible
  };
}

/**
 * Validates body chain line from shoulder through hip and knee.
 * Returns true if body maintains roughly straight plank line (hip angle >= tolerance).
 */
export function calculatePlankBodyChain(
  shoulder: PoseLandmark,
  hip: PoseLandmark,
  knee: PoseLandmark,
  toleranceMinAngle: number = 135
): { isChainValid: boolean; hipAngle: number } {
  const hipAngle = calculateAngle(shoulder, hip, knee);
  // In straight plank, shoulder-hip-knee angle is close to 180° (valid if >= toleranceMinAngle)
  const isChainValid = hipAngle >= toleranceMinAngle;
  return { isChainValid, hipAngle };
}

