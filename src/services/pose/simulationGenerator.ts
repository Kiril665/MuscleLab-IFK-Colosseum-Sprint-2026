import { NormalizedSkeleton } from './poseTypes';

/**
 * Generates an anatomically valid moving skeleton for the AI Simulator.
 * Supports exercise-specific biomechanical movements for all exercises.
 */
export function generateSimulatedSkeleton(
  exerciseId: string,
  timeMs: number
): NormalizedSkeleton {
  const lowerEx = (exerciseId || 'pushups_classic').toLowerCase();

  // Cadence: 1 rep cycle = 2400ms (1200ms eccentric/down, 1200ms concentric/up)
  const cyclePhase = ((timeMs % 2400) / 2400) * Math.PI * 2;
  const normCycle = Math.cos(cyclePhase);
  const depthFactor = (1 - normCycle) / 2; // 0 (start/top) to 1 (target/bottom)

  // 1. ARCHER PUSHUPS
  if (lowerEx.includes('archer')) {
    const isLeftRep = Math.floor(timeMs / 2400) % 2 === 0;
    const shoulderY = 0.62 + depthFactor * 0.14; // Drops as chest descends
    const activeElbowY = 0.72 + depthFactor * 0.08;

    return {
      nose: { x: isLeftRep ? 0.30 : 0.40, y: shoulderY - 0.02, visibility: 0.98 },
      leftShoulder: { x: 0.35, y: shoulderY, visibility: 0.98 },
      rightShoulder: { x: 0.35, y: shoulderY, visibility: 0.98 },
      // Bending active elbow vs straight extended arm
      leftElbow: isLeftRep
        ? { x: 0.28, y: activeElbowY, visibility: 0.98 }
        : { x: 0.18, y: shoulderY + 0.02, visibility: 0.98 },
      rightElbow: isLeftRep
        ? { x: 0.52, y: shoulderY + 0.02, visibility: 0.98 }
        : { x: 0.42, y: activeElbowY, visibility: 0.98 },
      leftWrist: { x: 0.32, y: 0.88, visibility: 0.98 },
      rightWrist: { x: 0.62, y: 0.88, visibility: 0.98 },
      leftHip: { x: 0.75, y: 0.68 + depthFactor * 0.04, visibility: 0.98 },
      rightHip: { x: 0.75, y: 0.68 + depthFactor * 0.04, visibility: 0.98 },
      leftKnee: { x: 0.85, y: 0.72, visibility: 0.98 },
      rightKnee: { x: 0.85, y: 0.72, visibility: 0.98 },
      leftAnkle: { x: 0.95, y: 0.76, visibility: 0.98 },
      rightAnkle: { x: 0.95, y: 0.76, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 2. KNEE PUSHUPS
  if (lowerEx.includes('knees') || lowerEx.includes('колін')) {
    const shoulderY = 0.55 + depthFactor * 0.15;
    const elbowX = 0.35 - depthFactor * 0.08;
    const elbowY = 0.68 + depthFactor * 0.05;

    return {
      nose: { x: 0.26, y: shoulderY - 0.02, visibility: 0.98 },
      leftShoulder: { x: 0.35, y: shoulderY, visibility: 0.98 },
      rightShoulder: { x: 0.35, y: shoulderY, visibility: 0.95 },
      leftElbow: { x: elbowX, y: elbowY, visibility: 0.98 },
      rightElbow: { x: elbowX, y: elbowY, visibility: 0.95 },
      leftWrist: { x: 0.35, y: 0.85, visibility: 0.98 },
      rightWrist: { x: 0.35, y: 0.85, visibility: 0.95 },
      leftHip: { x: 0.65, y: 0.68 + depthFactor * 0.05, visibility: 0.98 },
      rightHip: { x: 0.65, y: 0.68 + depthFactor * 0.05, visibility: 0.95 },
      leftKnee: { x: 0.80, y: 0.85, visibility: 0.98 },
      rightKnee: { x: 0.80, y: 0.85, visibility: 0.95 },
      leftAnkle: { x: 0.92, y: 0.80, visibility: 0.98 },
      rightAnkle: { x: 0.92, y: 0.80, visibility: 0.95 },
      confidence: 0.98
    };
  }

  // 3. DIPS ON BARS
  if (lowerEx.includes('dip') || lowerEx.includes('брус')) {
    const bodyDrop = depthFactor * 0.18;
    const shoulderY = 0.32 + bodyDrop;
    const hipY = 0.58 + bodyDrop;

    return {
      nose: { x: 0.5, y: shoulderY - 0.10, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: shoulderY, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: shoulderY, visibility: 0.98 },
      leftElbow: { x: 0.38 - depthFactor * 0.04, y: shoulderY + 0.16, visibility: 0.98 },
      rightElbow: { x: 0.62 + depthFactor * 0.04, y: shoulderY + 0.16, visibility: 0.98 },
      leftWrist: { x: 0.42, y: 0.55, visibility: 0.98 },
      rightWrist: { x: 0.58, y: 0.55, visibility: 0.98 },
      leftHip: { x: 0.46, y: hipY, visibility: 0.98 },
      rightHip: { x: 0.54, y: hipY, visibility: 0.98 },
      leftKnee: { x: 0.46, y: hipY + 0.15, visibility: 0.98 },
      rightKnee: { x: 0.54, y: hipY + 0.15, visibility: 0.98 },
      leftAnkle: { x: 0.46, y: hipY + 0.28, visibility: 0.98 },
      rightAnkle: { x: 0.54, y: hipY + 0.28, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 4. PLANKS (CLASSIC, ELBOW, SIDE ISOMETRIC)
  if (lowerEx.includes('plank') || lowerEx.includes('планк')) {
    const isElbow = lowerEx.includes('elbow');
    const isSide = lowerEx.includes('side');

    if (isSide) {
      return {
        nose: { x: 0.30, y: 0.55, visibility: 0.98 },
        leftShoulder: { x: 0.35, y: 0.58, visibility: 0.98 },
        rightShoulder: { x: 0.35, y: 0.55, visibility: 0.98 },
        leftElbow: { x: 0.35, y: 0.72, visibility: 0.98 },
        rightElbow: { x: 0.35, y: 0.42, visibility: 0.98 },
        leftWrist: { x: 0.42, y: 0.72, visibility: 0.98 },
        rightWrist: { x: 0.35, y: 0.30, visibility: 0.98 },
        leftHip: { x: 0.65, y: 0.60, visibility: 0.98 },
        rightHip: { x: 0.65, y: 0.58, visibility: 0.98 },
        leftKnee: { x: 0.80, y: 0.62, visibility: 0.98 },
        rightKnee: { x: 0.80, y: 0.60, visibility: 0.98 },
        leftAnkle: { x: 0.92, y: 0.64, visibility: 0.98 },
        rightAnkle: { x: 0.92, y: 0.62, visibility: 0.98 },
        confidence: 0.98
      };
    }

    if (isElbow) {
      return {
        nose: { x: 0.26, y: 0.68, visibility: 0.98 },
        leftShoulder: { x: 0.35, y: 0.70, visibility: 0.98 },
        rightShoulder: { x: 0.35, y: 0.70, visibility: 0.98 },
        leftElbow: { x: 0.35, y: 0.85, visibility: 0.98 },
        rightElbow: { x: 0.35, y: 0.85, visibility: 0.98 },
        leftWrist: { x: 0.45, y: 0.85, visibility: 0.98 },
        rightWrist: { x: 0.45, y: 0.85, visibility: 0.98 },
        leftHip: { x: 0.68, y: 0.72, visibility: 0.98 },
        rightHip: { x: 0.68, y: 0.72, visibility: 0.98 },
        leftKnee: { x: 0.82, y: 0.74, visibility: 0.98 },
        rightKnee: { x: 0.82, y: 0.74, visibility: 0.98 },
        leftAnkle: { x: 0.94, y: 0.76, visibility: 0.98 },
        rightAnkle: { x: 0.94, y: 0.76, visibility: 0.98 },
        confidence: 0.98
      };
    }

    // Classic plank (straight arms)
    return {
      nose: { x: 0.28, y: 0.63, visibility: 0.98 },
      leftShoulder: { x: 0.35, y: 0.65, visibility: 0.98 },
      rightShoulder: { x: 0.35, y: 0.65, visibility: 0.98 },
      leftElbow: { x: 0.35, y: 0.76, visibility: 0.98 },
      rightElbow: { x: 0.35, y: 0.76, visibility: 0.98 },
      leftWrist: { x: 0.35, y: 0.88, visibility: 0.98 },
      rightWrist: { x: 0.35, y: 0.88, visibility: 0.98 },
      leftHip: { x: 0.70, y: 0.68, visibility: 0.98 },
      rightHip: { x: 0.70, y: 0.68, visibility: 0.98 },
      leftKnee: { x: 0.84, y: 0.71, visibility: 0.98 },
      rightKnee: { x: 0.84, y: 0.71, visibility: 0.98 },
      leftAnkle: { x: 0.95, y: 0.74, visibility: 0.98 },
      rightAnkle: { x: 0.95, y: 0.74, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 5. LUNGES
  if (lowerEx.includes('lunge') || lowerEx.includes('випад')) {
    const lungeDrop = depthFactor * 0.16;
    const frontKneeBendX = 0.40 - depthFactor * 0.05;

    return {
      nose: { x: 0.50, y: 0.18 + lungeDrop, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: 0.28 + lungeDrop, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: 0.28 + lungeDrop, visibility: 0.98 },
      leftElbow: { x: 0.42, y: 0.40 + lungeDrop, visibility: 0.98 },
      rightElbow: { x: 0.58, y: 0.40 + lungeDrop, visibility: 0.98 },
      leftWrist: { x: 0.44, y: 0.50 + lungeDrop, visibility: 0.98 },
      rightWrist: { x: 0.56, y: 0.50 + lungeDrop, visibility: 0.98 },
      leftHip: { x: 0.48, y: 0.52 + lungeDrop, visibility: 0.98 },
      rightHip: { x: 0.52, y: 0.52 + lungeDrop, visibility: 0.98 },
      leftKnee: { x: frontKneeBendX, y: 0.70 + lungeDrop * 0.6, visibility: 0.98 },
      rightKnee: { x: 0.68, y: 0.72 + lungeDrop * 0.9, visibility: 0.98 },
      leftAnkle: { x: 0.40, y: 0.90, visibility: 0.98 },
      rightAnkle: { x: 0.72, y: 0.90, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 6. CALF RAISES
  if (lowerEx.includes('calf') || lowerEx.includes('носк')) {
    const heelLift = depthFactor * 0.08;

    return {
      nose: { x: 0.50, y: 0.15 - heelLift, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: 0.25 - heelLift, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: 0.25 - heelLift, visibility: 0.98 },
      leftElbow: { x: 0.42, y: 0.38 - heelLift, visibility: 0.98 },
      rightElbow: { x: 0.58, y: 0.38 - heelLift, visibility: 0.98 },
      leftWrist: { x: 0.44, y: 0.48 - heelLift, visibility: 0.98 },
      rightWrist: { x: 0.56, y: 0.48 - heelLift, visibility: 0.98 },
      leftHip: { x: 0.46, y: 0.52 - heelLift, visibility: 0.98 },
      rightHip: { x: 0.54, y: 0.52 - heelLift, visibility: 0.98 },
      leftKnee: { x: 0.46, y: 0.72 - heelLift, visibility: 0.98 },
      rightKnee: { x: 0.54, y: 0.72 - heelLift, visibility: 0.98 },
      leftAnkle: { x: 0.46, y: 0.92 - heelLift, visibility: 0.98 },
      rightAnkle: { x: 0.54, y: 0.92 - heelLift, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 7. FLOOR CRUNCHES
  if (lowerEx.includes('crunch') || lowerEx.includes('скручуван')) {
    const crunchRise = depthFactor * 0.16;

    return {
      nose: { x: 0.32 + crunchRise * 0.5, y: 0.82 - crunchRise, visibility: 0.98 },
      leftShoulder: { x: 0.38 + crunchRise * 0.4, y: 0.84 - crunchRise * 0.8, visibility: 0.98 },
      rightShoulder: { x: 0.38 + crunchRise * 0.4, y: 0.84 - crunchRise * 0.8, visibility: 0.98 },
      leftElbow: { x: 0.30, y: 0.80 - crunchRise, visibility: 0.98 },
      rightElbow: { x: 0.30, y: 0.80 - crunchRise, visibility: 0.98 },
      leftWrist: { x: 0.35, y: 0.78 - crunchRise, visibility: 0.98 },
      rightWrist: { x: 0.35, y: 0.78 - crunchRise, visibility: 0.98 },
      leftHip: { x: 0.58, y: 0.86, visibility: 0.98 },
      rightHip: { x: 0.58, y: 0.86, visibility: 0.98 },
      leftKnee: { x: 0.72, y: 0.70, visibility: 0.98 },
      rightKnee: { x: 0.72, y: 0.70, visibility: 0.98 },
      leftAnkle: { x: 0.82, y: 0.88, visibility: 0.98 },
      rightAnkle: { x: 0.82, y: 0.88, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 8. HANGING LEG RAISES
  if (lowerEx.includes('leg_raise') || lowerEx.includes('підйом ніг')) {
    const legLiftY = 0.88 - depthFactor * 0.32;
    const legLiftX = 0.50 + depthFactor * 0.22;

    return {
      nose: { x: 0.5, y: 0.28, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: 0.36, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: 0.36, visibility: 0.98 },
      leftElbow: { x: 0.42, y: 0.24, visibility: 0.98 },
      rightElbow: { x: 0.58, y: 0.24, visibility: 0.98 },
      leftWrist: { x: 0.42, y: 0.12, visibility: 0.98 },
      rightWrist: { x: 0.58, y: 0.12, visibility: 0.98 },
      leftHip: { x: 0.48, y: 0.58, visibility: 0.98 },
      rightHip: { x: 0.52, y: 0.58, visibility: 0.98 },
      leftKnee: { x: 0.48 + depthFactor * 0.12, y: 0.74 - depthFactor * 0.18, visibility: 0.98 },
      rightKnee: { x: 0.52 + depthFactor * 0.12, y: 0.74 - depthFactor * 0.18, visibility: 0.98 },
      leftAnkle: { x: legLiftX, y: legLiftY, visibility: 0.98 },
      rightAnkle: { x: legLiftX, y: legLiftY, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 9. JUMPING JACKS
  if (lowerEx.includes('jump') || lowerEx.includes('jack')) {
    const armY = 0.48 - depthFactor * 0.32;
    const footSpread = depthFactor * 0.16;

    return {
      nose: { x: 0.50, y: 0.15, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: 0.25, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: 0.25, visibility: 0.98 },
      leftElbow: { x: 0.38 - depthFactor * 0.08, y: armY + 0.10, visibility: 0.98 },
      rightElbow: { x: 0.62 + depthFactor * 0.08, y: armY + 0.10, visibility: 0.98 },
      leftWrist: { x: 0.46 - depthFactor * 0.12, y: armY, visibility: 0.98 },
      rightWrist: { x: 0.54 + depthFactor * 0.12, y: armY, visibility: 0.98 },
      leftHip: { x: 0.46, y: 0.52, visibility: 0.98 },
      rightHip: { x: 0.54, y: 0.52, visibility: 0.98 },
      leftKnee: { x: 0.44 - footSpread * 0.5, y: 0.72, visibility: 0.98 },
      rightKnee: { x: 0.56 + footSpread * 0.5, y: 0.72, visibility: 0.98 },
      leftAnkle: { x: 0.44 - footSpread, y: 0.92, visibility: 0.98 },
      rightAnkle: { x: 0.56 + footSpread, y: 0.92, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 10. HIGH KNEES
  if (lowerEx.includes('knee') || lowerEx.includes('колін')) {
    const isLeftUp = Math.floor(timeMs / 1200) % 2 === 0;
    const leftKneeY = isLeftUp ? 0.72 - depthFactor * 0.22 : 0.72;
    const rightKneeY = isLeftUp ? 0.72 : 0.72 - depthFactor * 0.22;

    return {
      nose: { x: 0.50, y: 0.15, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: 0.25, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: 0.25, visibility: 0.98 },
      leftElbow: { x: 0.42, y: 0.38, visibility: 0.98 },
      rightElbow: { x: 0.58, y: 0.38, visibility: 0.98 },
      leftWrist: { x: 0.44, y: 0.48, visibility: 0.98 },
      rightWrist: { x: 0.56, y: 0.48, visibility: 0.98 },
      leftHip: { x: 0.46, y: 0.52, visibility: 0.98 },
      rightHip: { x: 0.54, y: 0.52, visibility: 0.98 },
      leftKnee: { x: 0.44, y: leftKneeY, visibility: 0.98 },
      rightKnee: { x: 0.56, y: rightKneeY, visibility: 0.98 },
      leftAnkle: { x: 0.44, y: isLeftUp ? leftKneeY + 0.20 : 0.92, visibility: 0.98 },
      rightAnkle: { x: 0.56, y: isLeftUp ? 0.92 : rightKneeY + 0.20, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 11. BURPEES
  if (lowerEx.includes('burpee') || lowerEx.includes('берпі')) {
    // 4 phases: Standing (0-25%) -> Squat (25-50%) -> Plank/Pushup (50-75%) -> Jump (75-100%)
    const phase = (timeMs % 3000) / 3000;
    if (phase < 0.25) {
      // Standing
      return {
        nose: { x: 0.50, y: 0.15, visibility: 0.98 },
        leftShoulder: { x: 0.44, y: 0.25, visibility: 0.98 },
        rightShoulder: { x: 0.56, y: 0.25, visibility: 0.98 },
        leftElbow: { x: 0.42, y: 0.38, visibility: 0.98 },
        rightElbow: { x: 0.58, y: 0.38, visibility: 0.98 },
        leftWrist: { x: 0.44, y: 0.48, visibility: 0.98 },
        rightWrist: { x: 0.56, y: 0.48, visibility: 0.98 },
        leftHip: { x: 0.46, y: 0.52, visibility: 0.98 },
        rightHip: { x: 0.54, y: 0.52, visibility: 0.98 },
        leftKnee: { x: 0.46, y: 0.72, visibility: 0.98 },
        rightKnee: { x: 0.54, y: 0.72, visibility: 0.98 },
        leftAnkle: { x: 0.46, y: 0.92, visibility: 0.98 },
        rightAnkle: { x: 0.56, y: 0.92, visibility: 0.98 },
        confidence: 0.98
      };
    }
    // Plank pushup phase
    return {
      nose: { x: 0.28, y: 0.70, visibility: 0.98 },
      leftShoulder: { x: 0.35, y: 0.72, visibility: 0.98 },
      rightShoulder: { x: 0.35, y: 0.72, visibility: 0.98 },
      leftElbow: { x: 0.30, y: 0.78, visibility: 0.98 },
      rightElbow: { x: 0.30, y: 0.78, visibility: 0.98 },
      leftWrist: { x: 0.35, y: 0.88, visibility: 0.98 },
      rightWrist: { x: 0.35, y: 0.88, visibility: 0.98 },
      leftHip: { x: 0.72, y: 0.74, visibility: 0.98 },
      rightHip: { x: 0.72, y: 0.74, visibility: 0.98 },
      leftKnee: { x: 0.84, y: 0.76, visibility: 0.98 },
      rightKnee: { x: 0.84, y: 0.76, visibility: 0.98 },
      leftAnkle: { x: 0.94, y: 0.78, visibility: 0.98 },
      rightAnkle: { x: 0.94, y: 0.78, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 12. SQUATS
  if (lowerEx.includes('squat') || lowerEx.includes('присід')) {
    const hipDrop = depthFactor * 0.18;
    const shoulderDrop = depthFactor * 0.16;

    return {
      nose: { x: 0.5, y: 0.15 + shoulderDrop, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: 0.25 + shoulderDrop, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: 0.25 + shoulderDrop, visibility: 0.98 },
      leftElbow: { x: 0.40, y: 0.38 + shoulderDrop, visibility: 0.98 },
      rightElbow: { x: 0.60, y: 0.38 + shoulderDrop, visibility: 0.98 },
      leftWrist: { x: 0.46, y: 0.36 + shoulderDrop, visibility: 0.98 },
      rightWrist: { x: 0.54, y: 0.36 + shoulderDrop, visibility: 0.98 },
      leftHip: { x: 0.45, y: 0.52 + hipDrop, visibility: 0.98 },
      rightHip: { x: 0.55, y: 0.52 + hipDrop, visibility: 0.98 },
      leftKnee: { x: 0.42 - depthFactor * 0.06, y: 0.72 + hipDrop * 0.4, visibility: 0.98 },
      rightKnee: { x: 0.58 + depthFactor * 0.06, y: 0.72 + hipDrop * 0.4, visibility: 0.98 },
      leftAnkle: { x: 0.44, y: 0.92, visibility: 0.98 },
      rightAnkle: { x: 0.56, y: 0.92, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // 13. PULLUPS / CHINUPS
  if (lowerEx.includes('pull') || lowerEx.includes('chin') || lowerEx.includes('підтяг')) {
    const pullUpLift = depthFactor * 0.22;
    const shoulderY = 0.42 - pullUpLift;
    const hipY = 0.68 - pullUpLift;

    return {
      nose: { x: 0.5, y: shoulderY - 0.10, visibility: 0.98 },
      leftShoulder: { x: 0.44, y: shoulderY, visibility: 0.98 },
      rightShoulder: { x: 0.56, y: shoulderY, visibility: 0.98 },
      leftElbow: { x: 0.38 + depthFactor * 0.04, y: 0.28, visibility: 0.98 },
      rightElbow: { x: 0.62 - depthFactor * 0.04, y: 0.28, visibility: 0.98 },
      leftWrist: { x: 0.42, y: 0.12, visibility: 0.98 },
      rightWrist: { x: 0.58, y: 0.12, visibility: 0.98 },
      leftHip: { x: 0.46, y: hipY, visibility: 0.98 },
      rightHip: { x: 0.54, y: hipY, visibility: 0.98 },
      leftKnee: { x: 0.46, y: hipY + 0.16, visibility: 0.98 },
      rightKnee: { x: 0.54, y: hipY + 0.16, visibility: 0.98 },
      leftAnkle: { x: 0.46, y: hipY + 0.26, visibility: 0.98 },
      rightAnkle: { x: 0.54, y: hipY + 0.26, visibility: 0.98 },
      confidence: 0.98
    };
  }

  // DEFAULT STANDARD PUSHUP
  const shoulderY = 0.65 + depthFactor * 0.12;
  const hipY = 0.68 + depthFactor * 0.05;
  const elbowX = 0.35 - depthFactor * 0.08;
  const elbowY = 0.76 + depthFactor * 0.04;

  return {
    nose: { x: 0.28, y: shoulderY - 0.02, visibility: 0.98 },
    leftShoulder: { x: 0.35, y: shoulderY, visibility: 0.98 },
    rightShoulder: { x: 0.35, y: shoulderY, visibility: 0.95 },
    leftElbow: { x: elbowX, y: elbowY, visibility: 0.98 },
    rightElbow: { x: elbowX, y: elbowY, visibility: 0.95 },
    leftWrist: { x: 0.35, y: 0.88, visibility: 0.98 },
    rightWrist: { x: 0.35, y: 0.88, visibility: 0.95 },
    leftHip: { x: 0.75, y: hipY, visibility: 0.98 },
    rightHip: { x: 0.75, y: hipY, visibility: 0.95 },
    leftKnee: { x: 0.85, y: hipY + 0.04, visibility: 0.98 },
    rightKnee: { x: 0.85, y: hipY + 0.04, visibility: 0.95 },
    leftAnkle: { x: 0.95, y: hipY + 0.06, visibility: 0.98 },
    rightAnkle: { x: 0.95, y: hipY + 0.06, visibility: 0.95 },
    confidence: 0.98
  };
}
