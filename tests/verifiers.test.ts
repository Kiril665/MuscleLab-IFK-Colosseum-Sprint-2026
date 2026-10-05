import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PushupsVerifier, SquatsVerifier } from '../src/services/exerciseVerifiers';
import { LandmarkPoint, LANDMARKS } from '../src/services/poseGeometry';

function createMockPushupLandmarks(elbowAngleDegrees: number, bodySagOffset: number = 0): LandmarkPoint[] {
  const points: LandmarkPoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));

  // Shoulder at (0.2, 0.5)
  // Elbow at (0.4, 0.5)
  // Wrist rotated around Elbow by (180 - elbowAngleDegrees)
  const elbow = { x: 0.4, y: 0.5, visibility: 1 };
  const rad = ((180 - elbowAngleDegrees) * Math.PI) / 180;
  const wrist = {
    x: elbow.x + 0.2 * Math.cos(rad),
    y: elbow.y + 0.2 * Math.sin(rad),
    visibility: 1
  };

  points[LANDMARKS.LEFT_SHOULDER] = { x: 0.2, y: 0.5, visibility: 1 };
  points[LANDMARKS.LEFT_ELBOW] = elbow;
  points[LANDMARKS.LEFT_WRIST] = wrist;

  // Hip and Ankle for body straight alignment
  points[LANDMARKS.LEFT_HIP] = { x: 0.55, y: 0.5 + bodySagOffset, visibility: 1 };
  points[LANDMARKS.LEFT_ANKLE] = { x: 0.9, y: 0.5, visibility: 1 };

  return points;
}

describe('Pushups Verifier - Synthetic Sequence Tests', () => {
  it('correctly registers a valid repetition with >85% ROM and top lockout', () => {
    const verifier = new PushupsVerifier();

    // 1. Initial top lockout: 165° elbow
    let res = verifier.process(createMockPushupLandmarks(165));
    assert.strictEqual(res.validRep, false);
    assert.strictEqual(verifier.totalReps, 0);

    // 2. Bottom position: 85° elbow (100% ROM)
    res = verifier.process(createMockPushupLandmarks(85));
    assert.strictEqual(res.validRep, false);
    assert.strictEqual(res.currentRom, 100);

    // 3. Return to top lockout: 165° elbow
    verifier.lastRepTimestamp = Date.now() - 1000;
    res = verifier.process(createMockPushupLandmarks(165));

    assert.strictEqual(res.validRep, true);
    assert.strictEqual(verifier.totalReps, 1);
  });

  it('rejects incomplete amplitude when turning back before 85% ROM', () => {
    const verifier = new PushupsVerifier();

    // Start top -> descend only halfway to 125° (<85% ROM) -> ascend
    verifier.process(createMockPushupLandmarks(165));
    verifier.process(createMockPushupLandmarks(125));

    const res = verifier.process(createMockPushupLandmarks(165));
    assert.strictEqual(res.validRep, false);
    assert.strictEqual(res.error, 'incomplete_rom');
    assert.strictEqual(verifier.totalReps, 0);
    assert.strictEqual(verifier.failedAttempts, 1);
  });

  it('detects pelvis sag alignment error when hips droop', () => {
    const verifier = new PushupsVerifier();

    verifier.process(createMockPushupLandmarks(165));
    // Large hip droop offset
    const res = verifier.process(createMockPushupLandmarks(90, 0.3));

    assert.strictEqual(res.error, 'pelvis_sag');
  });
});

describe('Squats Verifier - Synthetic Tests', () => {
  it('correctly counts deep squats at 85% depth', () => {
    const verifier = new SquatsVerifier();
    const points: LandmarkPoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));

    // Standing (knee ~170°)
    points[LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.4, visibility: 1 };
    points[LANDMARKS.LEFT_KNEE] = { x: 0.5, y: 0.65, visibility: 1 };
    points[LANDMARKS.LEFT_ANKLE] = { x: 0.5, y: 0.9, visibility: 1 };
    verifier.process(points);

    // Deep squat (knee ~85°)
    points[LANDMARKS.LEFT_HIP] = { x: 0.4, y: 0.65, visibility: 1 };
    points[LANDMARKS.LEFT_KNEE] = { x: 0.55, y: 0.65, visibility: 1 };
    points[LANDMARKS.LEFT_ANKLE] = { x: 0.5, y: 0.9, visibility: 1 };
    verifier.process(points);

    // Stand back up
    points[LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.4, visibility: 1 };
    const res = verifier.process(points);
    assert.strictEqual(res.validRep, true);
    assert.strictEqual(verifier.totalReps, 1);
  });
});
