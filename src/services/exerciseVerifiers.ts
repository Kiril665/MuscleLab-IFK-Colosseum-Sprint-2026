import { 
  LandmarkPoint, 
  LANDMARKS, 
  calculateJointAngle, 
  checkBodyAlignment,
  calculateDistance 
} from './poseGeometry';

export interface VerifierResult {
  validRep: boolean;
  currentRom: number; // 0..100%
  lowestRom: number;
  error?: 'incomplete_rom' | 'no_lockout' | 'pelvis_sag' | 'rushing_tempo' | 'low_visibility';
  errorMessage?: string;
  isLockedOut: boolean;
}

export abstract class ExerciseVerifier {
  public phase: 'up' | 'down' = 'up';
  public lowestRomReached: number = 0;
  public lastRepTimestamp: number = 0;
  public totalReps: number = 0;
  public failedAttempts: number = 0;
  protected lastRom: number = 0;
  protected lastRomTimestamp: number = 0;

  public abstract process(landmarks: LandmarkPoint[]): VerifierResult;

  public reset() {
    this.phase = 'up';
    this.lowestRomReached = 0;
    this.lastRepTimestamp = 0;
    this.totalReps = 0;
    this.failedAttempts = 0;
    this.lastRom = 0;
    this.lastRomTimestamp = 0;
  }
}

// ─── 1. PUSH-UPS VERIFIER ───────────────────────────────────────────────────

export class PushupsVerifier extends ExerciseVerifier {
  public process(landmarks: LandmarkPoint[]): VerifierResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];

    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
    const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    // Check visibility gate
    const leftVis = ((leftShoulder?.visibility ?? 0) + (leftElbow?.visibility ?? 0)) / 2;
    const rightVis = ((rightShoulder?.visibility ?? 0) + (rightElbow?.visibility ?? 0)) / 2;
    const bestVis = Math.max(leftVis, rightVis);

    if (bestVis < 0.6) {
      return {
        validRep: false,
        currentRom: 0,
        lowestRom: this.lowestRomReached,
        error: 'low_visibility',
        errorMessage: 'Погано видно руки та плечі',
        isLockedOut: false
      };
    }

    const shoulder = leftVis >= rightVis ? leftShoulder : rightShoulder;
    const elbow = leftVis >= rightVis ? leftElbow : rightElbow;
    const wrist = leftVis >= rightVis ? leftWrist : rightWrist;
    const hip = leftVis >= rightVis ? leftHip : rightHip;
    const ankle = leftVis >= rightVis ? leftAnkle : rightAnkle;

    const elbowAngle = calculateJointAngle(shoulder, elbow, wrist);
    const bodyDeviation = checkBodyAlignment(shoulder, hip, ankle);

    // Map elbow angle: 165° (top/0% ROM) down to 85° (bottom/100% ROM)
    const normalizedRom = Math.max(0, Math.min(100, Math.round(((165 - elbowAngle) / (165 - 85)) * 100)));

    // Angular velocity spike detection (reject shaking/camera glitch > 400% ROM/sec)
    const now = Date.now();
    if (this.lastRomTimestamp > 0) {
      const dt = (now - this.lastRomTimestamp) / 1000;
      if (dt > 0.01 && dt < 0.2) {
        const velocity = Math.abs(normalizedRom - this.lastRom) / dt;
        if (velocity > 450) {
          // Spike rejected
          return {
            validRep: false,
            currentRom: this.lastRom,
            lowestRom: this.lowestRomReached,
            isLockedOut: this.lastRom <= 15
          };
        }
      }
    }
    this.lastRom = normalizedRom;
    this.lastRomTimestamp = now;

    let error: VerifierResult['error'] = undefined;
    let errorMessage: string | undefined = undefined;

    // Pelvis sag check: if body bends more than 28 degrees
    if (bodyDeviation > 28 && normalizedRom > 35) {
      error = 'pelvis_sag';
      errorMessage = 'Прогин тазу! Напруж м’язи пресу';
    }

    // Hysteresis state machine: down phase requires ≥ 30% ROM, return to top ≤ 15% ROM
    if (this.phase === 'up') {
      if (normalizedRom >= 30) {
        this.phase = 'down';
        this.lowestRomReached = normalizedRom;
      }
    } else if (this.phase === 'down') {
      if (normalizedRom > this.lowestRomReached) {
        this.lowestRomReached = normalizedRom;
      }

      // Transitioning upward
      if (normalizedRom < this.lowestRomReached - 20) {
        if (this.lowestRomReached < 85) {
          // Did not reach 85% ROM
          error = 'incomplete_rom';
          errorMessage = 'Неповна амплітуда! Опустись нижче 85%';
          this.failedAttempts++;
          this.phase = 'up';
          this.lowestRomReached = 0;
        } else if (normalizedRom <= 15) {
          // Reached top lockout
          if (now - this.lastRepTimestamp < 600) {
            error = 'rushing_tempo';
            errorMessage = 'Надто швидкий темп! Контролюй рух';
          } else {
            this.totalReps++;
            this.lastRepTimestamp = now;
            this.phase = 'up';
            this.lowestRomReached = 0;
            return {
              validRep: true,
              currentRom: normalizedRom,
              lowestRom: 100,
              isLockedOut: true
            };
          }
        }
      }
    }

    return {
      validRep: false,
      currentRom: normalizedRom,
      lowestRom: this.lowestRomReached,
      error,
      errorMessage,
      isLockedOut: normalizedRom <= 15
    };
  }
}

// ─── 2. SQUATS VERIFIER ─────────────────────────────────────────────────────

export class SquatsVerifier extends ExerciseVerifier {
  public process(landmarks: LandmarkPoint[]): VerifierResult {
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];

    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
    const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    const leftVis = ((leftHip?.visibility ?? 0) + (leftKnee?.visibility ?? 0) + (leftAnkle?.visibility ?? 0)) / 3;
    const rightVis = ((rightHip?.visibility ?? 0) + (rightKnee?.visibility ?? 0) + (rightAnkle?.visibility ?? 0)) / 3;

    if (Math.max(leftVis, rightVis) < 0.6) {
      return {
        validRep: false,
        currentRom: 0,
        lowestRom: this.lowestRomReached,
        error: 'low_visibility',
        errorMessage: 'Погано видно ноги атлета',
        isLockedOut: false
      };
    }

    const hip = leftVis >= rightVis ? leftHip : rightHip;
    const knee = leftVis >= rightVis ? leftKnee : rightKnee;
    const ankle = leftVis >= rightVis ? leftAnkle : rightAnkle;

    const kneeAngle = calculateJointAngle(hip, knee, ankle);
    // Stand = ~170° (0% ROM), Deep squat = ~85° (100% ROM)
    const normalizedRom = Math.max(0, Math.min(100, Math.round(((170 - kneeAngle) / (170 - 85)) * 100)));

    let error: VerifierResult['error'] = undefined;
    let errorMessage: string | undefined = undefined;

    if (this.phase === 'up') {
      if (normalizedRom >= 30) {
        this.phase = 'down';
        this.lowestRomReached = normalizedRom;
      }
    } else if (this.phase === 'down') {
      if (normalizedRom > this.lowestRomReached) {
        this.lowestRomReached = normalizedRom;
      }

      if (normalizedRom < this.lowestRomReached - 20) {
        if (this.lowestRomReached < 85) {
          error = 'incomplete_rom';
          errorMessage = 'Присядь нижче паралелі стегон!';
          this.failedAttempts++;
          this.phase = 'up';
          this.lowestRomReached = 0;
        } else if (normalizedRom <= 15) {
          const now = Date.now();
          if (now - this.lastRepTimestamp < 600) {
            error = 'rushing_tempo';
            errorMessage = 'Надто швидкий темп!';
          } else {
            this.totalReps++;
            this.lastRepTimestamp = now;
            this.phase = 'up';
            this.lowestRomReached = 0;
            return {
              validRep: true,
              currentRom: normalizedRom,
              lowestRom: 100,
              isLockedOut: true
            };
          }
        }
      }
    }

    return {
      validRep: false,
      currentRom: normalizedRom,
      lowestRom: this.lowestRomReached,
      error,
      errorMessage,
      isLockedOut: normalizedRom <= 15
    };
  }
}

// ─── 3. PULL-UPS VERIFIER ───────────────────────────────────────────────────

export class PullupsVerifier extends ExerciseVerifier {
  public process(landmarks: LandmarkPoint[]): VerifierResult {
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const nose = landmarks[LANDMARKS.NOSE];

    if ((leftShoulder?.visibility ?? 0) < 0.6 || (leftElbow?.visibility ?? 0) < 0.6) {
      return {
        validRep: false,
        currentRom: 0,
        lowestRom: this.lowestRomReached,
        error: 'low_visibility',
        errorMessage: 'Погано видно руки атлета',
        isLockedOut: false
      };
    }

    const elbowAngle = calculateJointAngle(leftShoulder, leftElbow, leftWrist);
    // Hang = ~165° (0% ROM), Chin above bar = ~65° (100% ROM)
    const normalizedRom = Math.max(0, Math.min(100, Math.round(((165 - elbowAngle) / (165 - 65)) * 100)));

    let error: VerifierResult['error'] = undefined;
    let errorMessage: string | undefined = undefined;

    // Check chin above hands
    const chinAbove = nose.y < leftWrist.y;

    if (this.phase === 'up') {
      if (normalizedRom >= 30) {
        this.phase = 'down';
        this.lowestRomReached = normalizedRom;
      }
    } else if (this.phase === 'down') {
      if (normalizedRom > this.lowestRomReached) {
        this.lowestRomReached = normalizedRom;
      }

      if (normalizedRom < this.lowestRomReached - 20) {
        if (this.lowestRomReached < 85 || !chinAbove) {
          error = 'incomplete_rom';
          errorMessage = 'Підборіддя не перетнуло перекладину!';
          this.failedAttempts++;
          this.phase = 'up';
          this.lowestRomReached = 0;
        } else if (normalizedRom <= 15) {
          const now = Date.now();
          if (now - this.lastRepTimestamp < 600) {
            error = 'rushing_tempo';
            errorMessage = 'Надто швидкий темп!';
          } else {
            this.totalReps++;
            this.lastRepTimestamp = now;
            this.phase = 'up';
            this.lowestRomReached = 0;
            return {
              validRep: true,
              currentRom: normalizedRom,
              lowestRom: 100,
              isLockedOut: true
            };
          }
        }
      }
    }

    return {
      validRep: false,
      currentRom: normalizedRom,
      lowestRom: this.lowestRomReached,
      error,
      errorMessage,
      isLockedOut: normalizedRom <= 15
    };
  }
}

// ─── 4. JUMPING JACKS VERIFIER ──────────────────────────────────────────────

export class JumpingJacksVerifier extends ExerciseVerifier {
  public process(landmarks: LandmarkPoint[]): VerifierResult {
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
    const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

    if ((leftShoulder?.visibility ?? 0) < 0.6 || (leftAnkle?.visibility ?? 0) < 0.6) {
      return {
        validRep: false,
        currentRom: 0,
        lowestRom: this.lowestRomReached,
        isLockedOut: false
      };
    }

    const armAngle = calculateJointAngle(leftHip, leftShoulder, leftWrist);
    const feetDist = calculateDistance(leftAnkle, rightAnkle);

    // Arms down ~20° (0% ROM), Arms overhead ~150° (100% ROM)
    const normalizedRom = Math.max(0, Math.min(100, Math.round(((armAngle - 20) / (150 - 20)) * 100)));

    if (this.phase === 'up') {
      if (normalizedRom > 40 && feetDist > 0.25) {
        this.phase = 'down';
        this.lowestRomReached = normalizedRom;
      }
    } else if (this.phase === 'down') {
      if (normalizedRom > this.lowestRomReached) {
        this.lowestRomReached = normalizedRom;
      }

      if (normalizedRom < 25 && feetDist < 0.2) {
        if (this.lowestRomReached >= 85) {
          const now = Date.now();
          if (now - this.lastRepTimestamp >= 500) {
            this.totalReps++;
            this.lastRepTimestamp = now;
            this.phase = 'up';
            this.lowestRomReached = 0;
            return {
              validRep: true,
              currentRom: normalizedRom,
              lowestRom: 100,
              isLockedOut: true
            };
          }
        }
        this.phase = 'up';
        this.lowestRomReached = 0;
      }
    }

    return {
      validRep: false,
      currentRom: normalizedRom,
      lowestRom: this.lowestRomReached,
      isLockedOut: normalizedRom <= 20
    };
  }
}

// ─── 5. LUNGES VERIFIER ─────────────────────────────────────────────────────

export class LungesVerifier extends ExerciseVerifier {
  public process(landmarks: LandmarkPoint[]): VerifierResult {
    const hip = landmarks[LANDMARKS.LEFT_HIP];
    const knee = landmarks[LANDMARKS.LEFT_KNEE];
    const ankle = landmarks[LANDMARKS.LEFT_ANKLE];

    if ((hip?.visibility ?? 0) < 0.6 || (knee?.visibility ?? 0) < 0.6) {
      return {
        validRep: false,
        currentRom: 0,
        lowestRom: this.lowestRomReached,
        isLockedOut: false
      };
    }

    const kneeAngle = calculateJointAngle(hip, knee, ankle);
    const normalizedRom = Math.max(0, Math.min(100, Math.round(((165 - kneeAngle) / (165 - 90)) * 100)));

    if (this.phase === 'up') {
      if (normalizedRom >= 30) {
        this.phase = 'down';
        this.lowestRomReached = normalizedRom;
      }
    } else if (this.phase === 'down') {
      if (normalizedRom > this.lowestRomReached) {
        this.lowestRomReached = normalizedRom;
      }

      if (normalizedRom < this.lowestRomReached - 20) {
        if (this.lowestRomReached >= 85 && normalizedRom <= 20) {
          const now = Date.now();
          if (now - this.lastRepTimestamp >= 600) {
            this.totalReps++;
            this.lastRepTimestamp = now;
            this.phase = 'up';
            this.lowestRomReached = 0;
            return {
              validRep: true,
              currentRom: normalizedRom,
              lowestRom: 100,
              isLockedOut: true
            };
          }
        }
      }
    }

    return {
      validRep: false,
      currentRom: normalizedRom,
      lowestRom: this.lowestRomReached,
      isLockedOut: normalizedRom <= 20
    };
  }
}

// ─── FACTORY ────────────────────────────────────────────────────────────────

export function createExerciseVerifier(id: string): ExerciseVerifier {
  switch (id) {
    case 'pushups':
      return new PushupsVerifier();
    case 'squats':
      return new SquatsVerifier();
    case 'pullups':
      return new PullupsVerifier();
    case 'jumping_jacks':
      return new JumpingJacksVerifier();
    case 'lunges':
      return new LungesVerifier();
    default:
      return new PushupsVerifier();
  }
}
