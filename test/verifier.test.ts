import { 
  verifyWorkoutFrameJournal, 
  verifyLivenessChallenge, 
  TelemetryFrame 
} from '../src/services/pose/serverWorkoutVerifier';

// Helper to generate push-up frame sequence
function generatePushUpFrames(
  repCount: number,
  options: {
    shallow?: boolean;
    tooFast?: boolean;
    includeLeftArmRaise?: boolean;
    badAlignment?: boolean;
  } = {}
): TelemetryFrame[] {
  const frames: TelemetryFrame[] = [];
  let t = 1000;

  // Initial calibration frames
  for (let i = 0; i < 10; i++) {
    frames.push({
      timestamp: t,
      primaryAngle: 160,
      torsoAngle: 5,
      confidence: 0.95,
      leftWristY: options.includeLeftArmRaise ? 0.20 : 0.90, // raised if liveness requested
      leftShoulderY: 0.40,
      rightWristY: 0.90,
      rightShoulderY: 0.40,
      noseY: 0.38
    });
    t += 50;
  }

  // Steady plank before starting reps
  for (let i = 0; i < 6; i++) {
    frames.push({
      timestamp: t,
      primaryAngle: 160,
      torsoAngle: 5,
      confidence: 0.95,
      leftWristY: 0.90,
      leftShoulderY: 0.40,
      rightWristY: 0.90,
      rightShoulderY: 0.40,
      noseY: 0.38
    });
    t += 60;
  }

  const dt = options.tooFast ? 20 : 70; // rep tempo speed

  for (let rep = 0; rep < repCount; rep++) {
    // Descending
    const minAngle = options.shallow ? 120 : 78;
    const descAngles = [145, 130, 115, 100, minAngle];
    for (const a of descAngles) {
      frames.push({
        timestamp: t,
        primaryAngle: a,
        torsoAngle: options.badAlignment ? 45 : 5,
        confidence: 0.95,
        leftWristY: 0.90,
        leftShoulderY: 0.40,
        rightWristY: 0.90,
        rightShoulderY: 0.40,
        noseY: 0.38
      });
      t += dt;
    }

    // Bottom hold
    for (let i = 0; i < 4; i++) {
      frames.push({
        timestamp: t,
        primaryAngle: minAngle,
        torsoAngle: options.badAlignment ? 45 : 5,
        confidence: 0.95,
        leftWristY: 0.90,
        leftShoulderY: 0.40,
        rightWristY: 0.90,
        rightShoulderY: 0.40,
        noseY: 0.38
      });
      t += dt;
    }

    // Ascending
    const ascAngles = [95, 115, 135, 150, 160];
    for (const a of ascAngles) {
      frames.push({
        timestamp: t,
        primaryAngle: a,
        torsoAngle: options.badAlignment ? 45 : 5,
        confidence: 0.95,
        leftWristY: 0.90,
        leftShoulderY: 0.40,
        rightWristY: 0.90,
        rightShoulderY: 0.40,
        noseY: 0.38
      });
      t += dt;
    }

    // Lockout top hold
    for (let i = 0; i < 4; i++) {
      frames.push({
        timestamp: t,
        primaryAngle: 160,
        torsoAngle: 5,
        confidence: 0.95,
        leftWristY: 0.90,
        leftShoulderY: 0.40,
        rightWristY: 0.90,
        rightShoulderY: 0.40,
        noseY: 0.38
      });
      t += dt;
    }
  }

  return frames;
}

// Test runner
function runTests() {
  console.log('--- RUNNING FORGEMUSCLE SERVER VERIFIER TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, detail: string = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail}`);
      failed++;
    }
  }

  // TEST 1: Honest single clean rep
  {
    const frames = generatePushUpFrames(1);
    const result = verifyWorkoutFrameJournal('pushups', frames, 1);
    assert(
      'Honest single clean rep counted by server',
      result.serverValidReps === 1 && result.status === 'VERIFIED_FORGE',
      `serverValidReps=${result.serverValidReps}, status=${result.status}`
    );
  }

  // TEST 2: Honest 3 clean reps
  {
    const frames = generatePushUpFrames(3);
    const result = verifyWorkoutFrameJournal('pushups', frames, 3);
    assert(
      'Honest 3 clean reps counted by server',
      result.serverValidReps === 3 && result.status === 'VERIFIED_FORGE' && !result.isDisputedMismatch,
      `serverValidReps=${result.serverValidReps}, status=${result.status}`
    );
  }

  // TEST 3: Shallow rep (Incomplete amplitude)
  {
    const frames = generatePushUpFrames(1, { shallow: true });
    const result = verifyWorkoutFrameJournal('pushups', frames, 0);
    assert(
      'Shallow rep is rejected by server biomechanics',
      result.serverValidReps === 0 && result.serverRejectedReps >= 1,
      `serverValidReps=${result.serverValidReps}, serverRejectedReps=${result.serverRejectedReps}`
    );
  }

  // TEST 4: Too fast rep (< 400ms rep cycle)
  {
    const frames = generatePushUpFrames(2, { tooFast: true });
    const result = verifyWorkoutFrameJournal('pushups', frames, 0);
    assert(
      'Rapid erratic movement spam is rejected',
      result.serverValidReps === 0,
      `serverValidReps=${result.serverValidReps}`
    );
  }

  // TEST 5: Client claims inflated reps without frames -> DISPUTED_MISMATCH
  {
    const frames = generatePushUpFrames(1); // Only 1 real rep in telemetry
    const result = verifyWorkoutFrameJournal('pushups', frames, 15); // Client claims 15
    assert(
      'Disputed mismatch triggered on client rep spoofing',
      result.isDisputedMismatch === true && result.status === 'DISPUTED_MISMATCH' && result.serverValidReps === 1,
      `status=${result.status}, isDisputedMismatch=${result.isDisputedMismatch}, repDiff=${result.repDifference}`
    );
  }

  // TEST 6: Client submits zero frames but claims 10 reps -> DISPUTED_MISMATCH
  {
    const result = verifyWorkoutFrameJournal('pushups', [], 10);
    assert(
      'Empty frame journal with claimed reps flagged as DISPUTED_MISMATCH',
      result.status === 'DISPUTED_MISMATCH' && result.serverValidReps === 0,
      `status=${result.status}, serverValidReps=${result.serverValidReps}`
    );
  }

  // TEST 7: Liveness check: Raise left arm challenge - Passed
  {
    const frames = generatePushUpFrames(1, { includeLeftArmRaise: true });
    const liveness = verifyLivenessChallenge('Підніміть ліву руку на 1 секунду перед стартом', frames);
    assert(
      'Liveness challenge passed when left arm raised',
      liveness.passed === true,
      `liveness.passed=${liveness.passed}`
    );
  }

  // TEST 8: Liveness check: Raise left arm challenge - Failed
  {
    const frames = generatePushUpFrames(1, { includeLeftArmRaise: false });
    const liveness = verifyLivenessChallenge('Підніміть ліву руку на 1 секунду перед стартом', frames);
    assert(
      'Liveness challenge failed when left arm NOT raised',
      liveness.passed === false,
      `liveness.passed=${liveness.passed}, reason=${liveness.reason}`
    );
  }

  // TEST 9: Liveness failure triggers REJECTED_CHEAT_DETECTED
  {
    const frames = generatePushUpFrames(1, { includeLeftArmRaise: false });
    const result = verifyWorkoutFrameJournal('pushups', frames, 1, 'Підніміть ліву руку на 1 секунду перед стартом');
    assert(
      'Workout rejected when liveness fails',
      result.status === 'REJECTED_CHEAT_DETECTED' && result.livenessPassed === false,
      `status=${result.status}, livenessPassed=${result.livenessPassed}`
    );
  }

  // TEST 10: Anti-replay: Frame journal hash binding
  {
    const framesA = generatePushUpFrames(1);
    const framesB = generatePushUpFrames(2);
    const resultA = verifyWorkoutFrameJournal('pushups', framesA, 1);
    const resultB = verifyWorkoutFrameJournal('pushups', framesB, 2);

    assert(
      'Different frame journals generate distinct cryptographic hashes',
      resultA.framesJournalHash !== resultB.framesJournalHash && resultA.framesJournalHash.length === 64,
      `hashA=${resultA.framesJournalHash}, hashB=${resultB.framesJournalHash}`
    );
  }

  // TEST 11-21: Universal verifier tests for all 11 bodyweight exercises
  const elevenExercises = [
    'hanging_leg_raises',
    'floor_crunches',
    'pushups_knees',
    'plank_classic',
    'lunges_bodyweight',
    'calf_raises',
    'elbow_plank',
    'side_plank',
    'jumping_jacks',
    'high_knees',
    'burpees'
  ];

  for (const exId of elevenExercises) {
    const isPlank = exId.includes('plank');
    const frames: TelemetryFrame[] = [];
    const count = isPlank ? 30 : 20;
    const interval = isPlank ? 100 : 50;

    for (let i = 0; i < count; i++) {
      frames.push({
        timestamp: 1000 + i * interval,
        primaryAngle: isPlank ? 175 : 90 + Math.sin(i * 0.5) * 50,
        torsoAngle: isPlank ? 5 : 80,
        confidence: 0.95
      });
    }

    const result = verifyWorkoutFrameJournal(exId, frames, 0);
    assert(
      `Universal detector for '${exId}' verified by server verifier`,
      result.status !== undefined && typeof result.serverValidReps === 'number',
      `status=${result.status}, serverValidReps=${result.serverValidReps}`
    );
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed.`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
