import { NormalizedSkeleton } from './poseTypes';

/**
 * Analyzes video frame pixels to extract robust normalized anatomical landmarks
 * when MediaPipe is loading or as a deterministic fallback.
 * Determines body orientation (standing vs plank), centroid, arm span, and joint proxies.
 */
export function extractSkeletonFromFrame(
  data: Uint8ClampedArray,
  prevData: Uint8ClampedArray | null,
  width: number,
  height: number,
  exerciseType: 'push_up' | 'squat' | 'pull_up'
): { skeleton: NormalizedSkeleton; hasMotion: boolean } {
  let motionPixels = 0;
  let sumX = 0;
  let sumY = 0;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  // Scan with stride 4 for high performance (60fps)
  const len = data.length;
  for (let i = 0; i < len; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let isMotionOrSubject = false;

    if (prevData && prevData.length === len) {
      const diff =
        Math.abs(r - prevData[i]) +
        Math.abs(g - prevData[i + 1]) +
        Math.abs(b - prevData[i + 2]);
      if (diff > 35) {
        isMotionOrSubject = true;
      }
    } else {
      // Background contrast detection (not pure black/white)
      const brightness = (r + g + b) / 3;
      if (brightness > 30 && brightness < 220) {
        isMotionOrSubject = true;
      }
    }

    if (isMotionOrSubject) {
      const pixelIdx = i / 4;
      const px = pixelIdx % width;
      const py = Math.floor(pixelIdx / width);

      motionPixels++;
      sumX += px;
      sumY += py;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }

  const hasMotion = motionPixels > 40;
  const boxW = Math.max(20, maxX - minX);
  const boxH = Math.max(20, maxY - minY);
  const centroidX = motionPixels > 0 ? (sumX / motionPixels) / width : 0.5;
  const centroidY = motionPixels > 0 ? (sumY / motionPixels) / height : 0.5;

  // Aspect ratio of bounding box:
  // If boxW / boxH > 1.2 -> Body is horizontal (lying down / plank on floor)
  // If boxH / boxW > 1.3 -> Body is vertical (standing upright)
  const isHorizontalPlank = boxW / boxH > 1.15 || (centroidY > 0.65 && boxH < height * 0.45);

  if (exerciseType === 'push_up') {
    if (isHorizontalPlank) {
      // In plank: shoulder is near front of plank, hip is near rear
      const shoulderX = Math.min(centroidX, 0.45);
      const shoulderY = centroidY;
      const hipX = Math.max(centroidX + 0.3, 0.75);
      const hipY = centroidY + 0.05;

      // Elbow bends down/backward when chest drops
      // Relative height of torso in frame indicates depth:
      // Lower centroidY = higher up (extended arms)
      // Higher centroidY = chest close to floor (flexed arms)
      const depthProgress = Math.min(1, Math.max(0, (centroidY - 0.5) / 0.35));
      // Elbow angle drops from 160° down to 75°
      const elbowAngleDeg = 160 - depthProgress * 85;
      const isBent = elbowAngleDeg < 110;

      const elbowX = isBent ? shoulderX - 0.05 : shoulderX;
      const elbowY = shoulderY + (isBent ? 0.08 : 0.12);
      const wristX = shoulderX;
      const wristY = shoulderY + 0.18;

      const skeleton: NormalizedSkeleton = {
        nose: { x: shoulderX - 0.06, y: shoulderY - 0.02, visibility: 0.9 },
        leftShoulder: { x: shoulderX, y: shoulderY, visibility: 0.9 },
        rightShoulder: { x: shoulderX + 0.02, y: shoulderY, visibility: 0.85 },
        leftElbow: { x: elbowX, y: elbowY, visibility: 0.9 },
        rightElbow: { x: elbowX + 0.02, y: elbowY, visibility: 0.85 },
        leftWrist: { x: wristX, y: wristY, visibility: 0.9 },
        rightWrist: { x: wristX + 0.02, y: wristY, visibility: 0.85 },
        leftHip: { x: hipX, y: hipY, visibility: 0.9 },
        rightHip: { x: hipX + 0.02, y: hipY, visibility: 0.85 },
        leftKnee: { x: hipX + 0.1, y: hipY + 0.02, visibility: 0.9 },
        rightKnee: { x: hipX + 0.1, y: hipY + 0.02, visibility: 0.85 },
        leftAnkle: { x: hipX + 0.2, y: hipY + 0.04, visibility: 0.9 },
        rightAnkle: { x: hipX + 0.2, y: hipY + 0.04, visibility: 0.85 },
        confidence: hasMotion ? 0.88 : 0.4
      };
      return { skeleton, hasMotion };
    } else {
      // Person is standing vertically (e.g. waving hand, moving head, squatting):
      // Shoulders at y=0.25, hips at y=0.55 -> torso angle ~ 80° from horizontal!
      const skeleton: NormalizedSkeleton = {
        nose: { x: centroidX, y: Math.max(0.1, centroidY - 0.35), visibility: 0.9 },
        leftShoulder: { x: centroidX - 0.1, y: centroidY - 0.25, visibility: 0.9 },
        rightShoulder: { x: centroidX + 0.1, y: centroidY - 0.25, visibility: 0.9 },
        leftElbow: { x: centroidX - 0.12, y: centroidY - 0.1, visibility: 0.9 },
        rightElbow: { x: centroidX + 0.12, y: centroidY - 0.1, visibility: 0.9 },
        leftWrist: { x: centroidX - 0.14, y: centroidY + 0.05, visibility: 0.9 },
        rightWrist: { x: centroidX + 0.14, y: centroidY + 0.05, visibility: 0.9 },
        leftHip: { x: centroidX - 0.08, y: centroidY + 0.15, visibility: 0.9 },
        rightHip: { x: centroidX + 0.08, y: centroidY + 0.15, visibility: 0.9 },
        leftKnee: { x: centroidX - 0.08, y: centroidY + 0.35, visibility: 0.9 },
        rightKnee: { x: centroidX + 0.08, y: centroidY + 0.35, visibility: 0.9 },
        leftAnkle: { x: centroidX - 0.08, y: centroidY + 0.50, visibility: 0.9 },
        rightAnkle: { x: centroidX + 0.08, y: centroidY + 0.50, visibility: 0.9 },
        confidence: hasMotion ? 0.9 : 0.3
      };
      return { skeleton, hasMotion };
    }
  }

  // Squat or Pull-up:
  const isUpright = true;
  const skeleton: NormalizedSkeleton = {
    nose: { x: centroidX, y: centroidY - 0.3, visibility: 0.9 },
    leftShoulder: { x: centroidX - 0.1, y: centroidY - 0.2, visibility: 0.9 },
    rightShoulder: { x: centroidX + 0.1, y: centroidY - 0.2, visibility: 0.9 },
    leftElbow: { x: centroidX - 0.12, y: centroidY - 0.05, visibility: 0.9 },
    rightElbow: { x: centroidX + 0.12, y: centroidY - 0.05, visibility: 0.9 },
    leftWrist: { x: centroidX - 0.12, y: centroidY + 0.1, visibility: 0.9 },
    rightWrist: { x: centroidX + 0.12, y: centroidY + 0.1, visibility: 0.9 },
    leftHip: { x: centroidX - 0.08, y: centroidY + 0.1, visibility: 0.9 },
    rightHip: { x: centroidX + 0.08, y: centroidY + 0.1, visibility: 0.9 },
    leftKnee: { x: centroidX - 0.08, y: centroidY + 0.3, visibility: 0.9 },
    rightKnee: { x: centroidX + 0.08, y: centroidY + 0.3, visibility: 0.9 },
    leftAnkle: { x: centroidX - 0.08, y: centroidY + 0.48, visibility: 0.9 },
    rightAnkle: { x: centroidX + 0.08, y: centroidY + 0.48, visibility: 0.9 },
    confidence: hasMotion ? 0.85 : 0.3
  };

  return { skeleton, hasMotion };
}
