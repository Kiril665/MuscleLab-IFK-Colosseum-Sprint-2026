import { ExerciseId } from '../types';
import { soundEngine } from './soundEngine';

export interface RepEvent {
  exerciseId: ExerciseId;
  count: number;
  rom: number; // 0..100
  accuracy: number; // 0..100
  error?: 'incomplete_rom' | 'no_lockout' | 'pelvis_sag';
}

export interface TrackingState {
  currentRom: number; // 0..100%
  phase: 'up' | 'down' | 'inflection';
  errorFeedback: string | null;
  totalValidReps: number;
  totalAttempts: number;
  accuracyRate: number;
  isBodyInFrame: boolean;
  lightingOk: boolean;
}

export class ExerciseEngine {
  private exerciseId: ExerciseId;
  private minRomThreshold: number = 85; // 85% ROM requirement
  private currentRom: number = 0;
  private lowestRomReached: number = 0;
  private phase: 'up' | 'down' = 'up';
  private validReps: number = 0;
  private failedAttempts: number = 0;
  private onRepCallback?: (event: RepEvent) => void;
  private onErrorCallback?: (errText: string) => void;
  private lastRepTimestamp: number = 0;
  private lockoutVerified: boolean = true;
  private errorTimer: number | null = null;
  public activeFeedback: string | null = null;

  constructor(exerciseId: ExerciseId) {
    this.exerciseId = exerciseId;
  }

  public setCallbacks(
    onRep: (event: RepEvent) => void,
    onError: (errText: string) => void
  ) {
    this.onRepCallback = onRep;
    this.onErrorCallback = onError;
  }

  public reset() {
    this.currentRom = 0;
    this.lowestRomReached = 0;
    this.phase = 'up';
    this.validReps = 0;
    this.failedAttempts = 0;
    this.lockoutVerified = true;
    this.activeFeedback = null;
    this.lastRepTimestamp = 0;
  }

  /**
   * Process a landmark ROM reading (0% = initial locked out state, 100% = maximum compression/depth)
   */
  public updateRom(romPercentage: number, pelvisSagDetected: boolean = false) {
    const clampedRom = Math.max(0, Math.min(100, Math.round(romPercentage)));
    this.currentRom = clampedRom;

    // Pelvis sag check
    if (pelvisSagDetected && clampedRom > 40) {
      this.triggerError('Прогин тазу! Підтягни прес');
    }

    if (this.phase === 'up') {
      if (clampedRom > 30) {
        // Commenced rep descent
        this.phase = 'down';
        this.lowestRomReached = clampedRom;
      }
    } else if (this.phase === 'down') {
      if (clampedRom > this.lowestRomReached) {
        this.lowestRomReached = clampedRom;
      }

      // If user starts coming back up after reaching inflection
      if (clampedRom < this.lowestRomReached - 15) {
        // Ascending phase
        if (this.lowestRomReached < this.minRomThreshold) {
          // Turned back too early!
          this.triggerError('Неповна амплітуда! Опустись глибше');
          this.failedAttempts++;
          this.phase = 'up';
          this.lowestRomReached = 0;
        } else if (clampedRom <= 15) {
          // Reached top lockout
          const now = Date.now();
          if (now - this.lastRepTimestamp > 800) {
            // Rep completed successfully!
            this.validReps++;
            this.lastRepTimestamp = now;
            this.phase = 'up';
            this.clearFeedback();

            soundEngine.playRepSound();

            const accuracy = this.calculateAccuracy();
            if (this.onRepCallback) {
              this.onRepCallback({
                exerciseId: this.exerciseId,
                count: this.validReps,
                rom: this.lowestRomReached,
                accuracy
              });
            }
          }
          this.lowestRomReached = 0;
        }
      }
    }
  }

  private triggerError(msg: string) {
    this.activeFeedback = msg;
    soundEngine.playErrorSound();
    if (this.onErrorCallback) {
      this.onErrorCallback(msg);
    }

    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.errorTimer = window.setTimeout(() => {
      this.activeFeedback = null;
      if (this.onErrorCallback) this.onErrorCallback('');
    }, 2000);
  }

  private clearFeedback() {
    this.activeFeedback = null;
  }

  public calculateAccuracy(): number {
    const total = this.validReps + this.failedAttempts;
    if (total === 0) return 100;
    return Math.max(60, Math.min(100, Math.round((this.validReps / total) * 100)));
  }

  public getState(): TrackingState {
    const accuracy = this.calculateAccuracy();
    return {
      currentRom: this.currentRom,
      phase: this.phase,
      errorFeedback: this.activeFeedback,
      totalValidReps: this.validReps,
      totalAttempts: this.validReps + this.failedAttempts,
      accuracyRate: accuracy,
      isBodyInFrame: true,
      lightingOk: true
    };
  }
}
