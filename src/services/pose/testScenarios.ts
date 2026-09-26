import { NormalizedSkeleton } from './poseTypes';
import { PushUpVerifier } from './PushUpVerifier';

export interface TestResult {
  id: string;
  name: string;
  expected: string;
  passed: boolean;
  validReps: number;
  rejectedReps: number;
  message: string;
}

/**
 * Base skeleton generator for standing upright
 */
function createStandingSkeleton(modifications: Partial<NormalizedSkeleton> = {}): NormalizedSkeleton {
  return {
    nose: { x: 0.5, y: 0.15, visibility: 0.95 },
    leftShoulder: { x: 0.42, y: 0.25, visibility: 0.95 },
    rightShoulder: { x: 0.58, y: 0.25, visibility: 0.95 },
    leftElbow: { x: 0.40, y: 0.40, visibility: 0.95 },
    rightElbow: { x: 0.60, y: 0.40, visibility: 0.95 },
    leftWrist: { x: 0.38, y: 0.55, visibility: 0.95 },
    rightWrist: { x: 0.62, y: 0.55, visibility: 0.95 },
    leftHip: { x: 0.45, y: 0.55, visibility: 0.95 },
    rightHip: { x: 0.55, y: 0.55, visibility: 0.95 },
    leftKnee: { x: 0.45, y: 0.75, visibility: 0.95 },
    rightKnee: { x: 0.55, y: 0.75, visibility: 0.95 },
    leftAnkle: { x: 0.45, y: 0.95, visibility: 0.95 },
    rightAnkle: { x: 0.55, y: 0.95, visibility: 0.95 },
    confidence: 0.95,
    ...modifications
  };
}

/**
 * Base skeleton generator for horizontal plank on floor.
 * Mathematically calculates joints so elbow angle exactly equals elbowAngleDeg,
 * while keeping torso perfectly horizontal (< 5° from horizontal).
 */
function createPlankSkeleton(elbowAngleDeg: number = 160): NormalizedSkeleton {
  const t = Math.max(0, Math.min(1, (elbowAngleDeg - 70) / (165 - 70)));
  const sy = 0.81 - t * 0.10;
  const hy = 0.82 - t * 0.10;
  const halfAngleRad = (elbowAngleDeg * Math.PI / 180) / 2;
  const dy = (0.90 - sy) / 2;
  const dx = dy / Math.tan(halfAngleRad);
  const ex = 0.35 - dx;
  const ey = (sy + 0.90) / 2;

  return {
    nose: { x: 0.30, y: sy - 0.02, visibility: 0.95 },
    leftShoulder: { x: 0.35, y: sy, visibility: 0.95 },
    rightShoulder: { x: 0.35, y: sy, visibility: 0.95 },
    leftElbow: { x: ex, y: ey, visibility: 0.95 },
    rightElbow: { x: ex, y: ey, visibility: 0.95 },
    leftWrist: { x: 0.35, y: 0.90, visibility: 0.95 },
    rightWrist: { x: 0.35, y: 0.90, visibility: 0.95 },
    leftHip: { x: 0.75, y: hy, visibility: 0.95 },
    rightHip: { x: 0.75, y: hy, visibility: 0.95 },
    leftKnee: { x: 0.85, y: hy + 0.02, visibility: 0.95 },
    rightKnee: { x: 0.85, y: hy + 0.02, visibility: 0.95 },
    leftAnkle: { x: 0.95, y: 0.90, visibility: 0.95 },
    rightAnkle: { x: 0.95, y: 0.90, visibility: 0.95 },
    confidence: 0.95
  };
}

/**
 * Runs all 11 mandatory verification test scenarios as specified in the ForgeMuscle specification.
 */
export function runAllVerificationTests(): TestResult[] {
  const results: TestResult[] = [];

  // ==========================================
  // TEST 1: Людина просто стоїть. -> 0 reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;
    for (let f = 0; f < 35; f++) {
      const skeleton = createStandingSkeleton();
      verifier.processSkeleton(skeleton, time);
      time += 40;
    }
    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_1',
      name: 'TEST 1: Людина просто стоїть',
      expected: '0 reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: звичайна стійка не викликає підрахунку (0 reps)' : `Помилка: зараховано ${valid} reps`
    });
  }

  // ==========================================
  // TEST 2: Людина стоїть і махає руками. -> 0 reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;
    for (let f = 0; f < 50; f++) {
      const waveRX = 0.60 + Math.sin(f / 2) * 0.20;
      const waveRY = 0.30 + Math.cos(f / 2) * 0.20;
      const waveLX = 0.40 - Math.sin(f / 2) * 0.20;
      const waveLY = 0.30 + Math.cos(f / 2) * 0.20;
      const skeleton = createStandingSkeleton({
        rightWrist: { x: waveRX, y: waveRY, visibility: 0.95 },
        leftWrist: { x: waveLX, y: waveLY, visibility: 0.95 }
      });
      verifier.processSkeleton(skeleton, time);
      time += 40;
    }
    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_2',
      name: 'TEST 2: Людина стоїть і махає руками',
      expected: '0 reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: махання руками у стійці повністю проігноровано (0 reps)' : `Помилка: зараховано ${valid} reps`
    });
  }

  // ==========================================
  // TEST 3: Людина стоїть і рухає головою. -> 0 reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;
    for (let f = 0; f < 40; f++) {
      const headY = 0.15 + Math.sin(f / 2) * 0.09;
      const headX = 0.50 + Math.cos(f / 2) * 0.05;
      const skeleton = createStandingSkeleton({
        nose: { x: headX, y: headY, visibility: 0.95 }
      });
      verifier.processSkeleton(skeleton, time);
      time += 40;
    }
    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_3',
      name: 'TEST 3: Людина стоїть і рухає головою',
      expected: '0 reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: нахили та рухи головою не впливають на віджимання (0 reps)' : `Помилка: зараховано ${valid} reps`
    });
  }

  // ==========================================
  // TEST 4: Людина стоїть і рухає плечима. -> 0 reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;
    for (let f = 0; f < 40; f++) {
      const shoulderY = 0.25 + Math.sin(f / 2) * 0.08;
      const skeleton = createStandingSkeleton({
        leftShoulder: { x: 0.42, y: shoulderY, visibility: 0.95 },
        rightShoulder: { x: 0.58, y: shoulderY, visibility: 0.95 }
      });
      verifier.processSkeleton(skeleton, time);
      time += 40;
    }
    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_4',
      name: 'TEST 4: Людина стоїть і рухає плечима',
      expected: '0 reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: рух плечима у вертикальній стійці відхилено (0 reps)' : `Помилка: зараховано ${valid} reps`
    });
  }

  // ==========================================
  // TEST 5: Людина присідає, але Push-up вибраний. -> 0 reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;
    for (let f = 0; f < 50; f++) {
      const drop = Math.sin((f / 50) * Math.PI) * 0.25;
      const skeleton = createStandingSkeleton({
        leftHip: { x: 0.45, y: 0.55 + drop, visibility: 0.95 },
        rightHip: { x: 0.55, y: 0.55 + drop, visibility: 0.95 },
        leftShoulder: { x: 0.42, y: 0.25 + drop, visibility: 0.95 },
        rightShoulder: { x: 0.58, y: 0.25 + drop, visibility: 0.95 },
        leftKnee: { x: 0.44, y: 0.75 + drop * 0.4, visibility: 0.95 },
        rightKnee: { x: 0.56, y: 0.75 + drop * 0.4, visibility: 0.95 }
      });
      verifier.processSkeleton(skeleton, time);
      time += 40;
    }
    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_5',
      name: 'TEST 5: Людина присідає, але Push-up вибраний',
      expected: '0 reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: присідання у вертикальній позиції не зараховано як віджимання (0 reps)' : `Помилка: зараховано ${valid} reps`
    });
  }

  // ==========================================
  // TEST 6: Людина робить короткі неглибокі рухи руками. -> 0 reps або rejected rep
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;
    for (let f = 0; f < 30; f++) {
      const jiggle = Math.sin(f * 1.5) * 0.04;
      const skeleton = createStandingSkeleton({
        leftElbow: { x: 0.40 + jiggle, y: 0.40 + jiggle, visibility: 0.95 },
        rightElbow: { x: 0.60 - jiggle, y: 0.40 + jiggle, visibility: 0.95 }
      });
      verifier.processSkeleton(skeleton, time);
      time += 40;
    }
    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_6',
      name: 'TEST 6: Людина робить короткі неглибокі рухи руками',
      expected: '0 valid reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: мілкі коливання рук не викликали зарахування повторень' : `Помилка: зараховано ${valid} reps`
    });
  }

  // ==========================================
  // TEST 7: Людина починає push-up, але не доходить до нижньої точки. -> 0 valid reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;

    // READY in plank (160°)
    for (let i = 0; i < 5; i++) {
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 100;
    }

    // DESCEND only to 115° (minElbowAngle is <= 85°)
    const shallowAngles = [145, 130, 115, 115, 115];
    for (const a of shallowAngles) {
      verifier.processSkeleton(createPlankSkeleton(a), time);
      time += 100;
    }

    // ASCEND back to 160° without reaching bottom
    const backUpAngles = [125, 140, 155, 160, 160];
    for (const a of backUpAngles) {
      verifier.processSkeleton(createPlankSkeleton(a), time);
      time += 100;
    }

    const valid = verifier.getValidReps();
    const rejected = verifier.getRejectedReps();
    results.push({
      id: 'TEST_7',
      name: 'TEST 7: Починає push-up, але не доходить до нижньої точки',
      expected: '0 valid reps, rejected >= 1',
      passed: valid === 0 && rejected >= 1,
      validReps: valid,
      rejectedReps: rejected,
      message: valid === 0 && rejected >= 1 ? `Пройдено: неповна глибина відхилена (${verifier.getLastRejectReason()})` : 'Помилка: зараховано мілке повторення'
    });
  }

  // ==========================================
  // TEST 8: Людина доходить вниз, але не повертається в TOP. -> 0 valid reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;

    // READY
    for (let i = 0; i < 5; i++) {
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 100;
    }

    // Full bottom reached (78°)
    const down = [145, 130, 115, 100, 85, 78];
    for (const a of down) {
      verifier.processSkeleton(createPlankSkeleton(a), time);
      time += 100;
    }

    // Bottom hold
    for (let i = 0; i < 4; i++) {
      verifier.processSkeleton(createPlankSkeleton(78), time);
      time += 100;
    }

    // Pushes up only to 130° (no lockout to 155°) and holds or stops
    const upPartial = [95, 110, 125, 130, 130, 130, 130];
    for (const a of upPartial) {
      verifier.processSkeleton(createPlankSkeleton(a), time);
      time += 100;
    }

    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_8',
      name: 'TEST 8: Доходить вниз, але не повертається в TOP (no lockout)',
      expected: '0 valid reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: повторення не зараховано без випрямлення рук у верхній точці' : 'Помилка: зараховано без повернення в TOP'
    });
  }

  // ==========================================
  // TEST 9: Людина робить дуже швидкий випадковий рух. -> 0 reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;

    // Erratic jittery movement with rapid 60ms cycle (< 0.4s min duration)
    for (let rep = 0; rep < 8; rep++) {
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 30;
      verifier.processSkeleton(createPlankSkeleton(78), time);
      time += 30;
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 30;
    }

    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_9',
      name: 'TEST 9: Дуже швидкий випадковий рух (< 0.4с)',
      expected: '0 valid reps',
      passed: valid === 0,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 0 ? 'Пройдено: темповий античит заблокував спам надшвидких рухів' : `Помилка: пропущено ${valid} надшвидких рухів`
    });
  }

  // ==========================================
  // TEST 10: Людина виконує нормальний push-up. -> 1 valid rep
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;

    // READY in plank (160°) for 5 frames
    for (let i = 0; i < 5; i++) {
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 100;
    }

    // DESCENDING (145° -> 78°)
    const desc = [145, 130, 115, 100, 85, 78];
    for (const a of desc) {
      verifier.processSkeleton(createPlankSkeleton(a), time);
      time += 100;
    }

    // BOTTOM (78°) for 4 frames
    for (let i = 0; i < 4; i++) {
      verifier.processSkeleton(createPlankSkeleton(78), time);
      time += 100;
    }

    // ASCENDING (95° -> 160°)
    const asc = [95, 115, 135, 150, 160];
    for (const a of asc) {
      verifier.processSkeleton(createPlankSkeleton(a), time);
      time += 100;
    }

    // TOP lockout (160°) for 4 frames
    for (let i = 0; i < 4; i++) {
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 100;
    }

    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_10',
      name: 'TEST 10: Людина виконує нормальний push-up',
      expected: '1 valid rep',
      passed: valid === 1,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 1 ? 'Пройдено: нормальний повний цикл дав рівно 1 верифіковане повторення' : `Помилка: отримано ${valid} повторень`
    });
  }

  // ==========================================
  // TEST 11: Людина виконує 5 нормальних push-ups. -> 5 valid reps
  // ==========================================
  {
    const verifier = new PushUpVerifier();
    let time = 1000;

    // Initial READY
    for (let i = 0; i < 5; i++) {
      verifier.processSkeleton(createPlankSkeleton(160), time);
      time += 100;
    }

    // Perform 5 consecutive reps with realistic 2.0s tempo
    for (let rep = 0; rep < 5; rep++) {
      // Descend
      const desc = [145, 130, 115, 100, 85, 78];
      for (const a of desc) {
        verifier.processSkeleton(createPlankSkeleton(a), time);
        time += 80;
      }
      // Bottom hold
      for (let i = 0; i < 4; i++) {
        verifier.processSkeleton(createPlankSkeleton(78), time);
        time += 80;
      }
      // Ascend
      const asc = [95, 115, 135, 150, 160];
      for (const a of asc) {
        verifier.processSkeleton(createPlankSkeleton(a), time);
        time += 80;
      }
      // Lockout at TOP
      for (let i = 0; i < 4; i++) {
        verifier.processSkeleton(createPlankSkeleton(160), time);
        time += 80;
      }
      // Pause before next rep
      time += 300;
    }

    const valid = verifier.getValidReps();
    results.push({
      id: 'TEST_11',
      name: 'TEST 11: Людина виконує 5 нормальних push-ups',
      expected: '5 valid reps',
      passed: valid === 5,
      validReps: valid,
      rejectedReps: verifier.getRejectedReps(),
      message: valid === 5 ? 'Пройдено: 5 послідовних повних віджимань дали рівно 5 верифікованих повторень' : `Помилка: отримано ${valid} повторень`
    });
  }

  return results;
}
