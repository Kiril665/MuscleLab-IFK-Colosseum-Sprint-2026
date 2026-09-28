import { Exercise } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { authStore } from './authStore';
import { sound } from './soundEngine';
import { TelemetryFrame } from './pose/serverWorkoutVerifier';

export type BattleState = 
  | 'IDLE'
  | 'MATCHMAKING' 
  | 'MATCH_FOUND' 
  | 'EXERCISE_SELECTION' 
  | 'WAITING_FOR_OPPONENT'
  | 'EXERCISE_CONFIRMED' 
  | 'CALIBRATION' 
  | 'COUNTDOWN' 
  | 'ACTIVE' 
  | 'VERIFYING'
  | 'FINISHED'
  | 'SETTLED'
  | 'OPPONENT_DISCONNECTED'
  | 'CAMERA_ERROR'
  | 'VERIFICATION_FAILED';

export interface BattleParticipant {
  id: string;
  name: string;
  avatar: string;
  wallet?: string;
  badge?: string;
  isPremium: boolean;
  isAi?: boolean;
  selectedExerciseId: string | null;
  isReady: boolean;
  calibrationPassed: boolean;
  isConnected: boolean;
  validReps: number;
  rejectedReps: number;
  romPercent: number;
}

export interface VerifiedBattleResult {
  battleId: string;
  winnerId: string | 'draw';
  winnerReps: number;
  p1VerifiedReps: number;
  p2VerifiedReps: number;
  p1Id: string;
  p2Id: string;
  exerciseId: string;
  proofHash: string;
  serverSignature: string;
  xpAwarded: number;
  finishedAt: string;
  verificationStatus: string;
}

export interface SolanaSettlementResult {
  status: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'NOT_CONFIGURED';
  signature: string | null;
  explorerUrl: string | null;
  memoContent?: string;
  error?: string;
  settledAt?: string;
}

export interface BattleRoomState {
  roomId: string;
  roomCode: string;
  state: BattleState;
  myRole: 'player1' | 'player2';
  isAiBattle: boolean;
  player1: BattleParticipant;
  player2: BattleParticipant;
  authoritativeExerciseId: string | null;
  selectionTimeLeft: number;
  battleTimeLeft: number;
  sessionNonce: string | null;
  verifiedResult: VerifiedBattleResult | null;
  solanaSettlement: SolanaSettlementResult | null;
  errorMessage: string | null;
}

type BattleListener = (state: BattleRoomState) => void;

class BattleStore {
  private roomId: string | null = null;
  private roomCode: string = 'FORGE-GLOBAL';
  private state: BattleState = 'IDLE';
  private myRole: 'player1' | 'player2' = 'player1';
  private isAiBattle: boolean = false;
  private sessionNonce: string | null = null;

  private player1: BattleParticipant = {
    id: 'p1_me',
    name: 'Ви (Атлет Forge)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop',
    badge: 'Challenger',
    isPremium: false,
    selectedExerciseId: 'pushups_classic',
    isReady: false,
    calibrationPassed: false,
    isConnected: true,
    validReps: 0,
    rejectedReps: 0,
    romPercent: 0
  };

  private player2: BattleParticipant = {
    id: 'p2_waiting',
    name: 'Очікування суперника…',
    avatar: '',
    badge: 'PvP',
    isPremium: false,
    isAi: false,
    selectedExerciseId: null,
    isReady: false,
    calibrationPassed: false,
    isConnected: false,
    validReps: 0,
    rejectedReps: 0,
    romPercent: 0
  };

  private authoritativeExerciseId: string | null = 'pushups_classic';
  private selectionTimeLeft: number = 35;
  private battleTimeLeft: number = 60;
  private verifiedResult: VerifiedBattleResult | null = null;
  private solanaSettlement: SolanaSettlementResult | null = null;
  private errorMessage: string | null = null;

  // Real telemetry journal recorded hands-free via pose tracker
  private telemetryFrames: TelemetryFrame[] = [];

  private listeners: Set<BattleListener> = new Set();
  private pollTimer: any = null;
  private battleClockInterval: any = null;

  constructor() {
    this.syncCurrentUser();
    authStore.subscribe(() => {
      this.syncCurrentUser();
    });
  }

  private syncCurrentUser() {
    const u = authStore.getCurrentUser();
    if (u) {
      this.player1.id = u.id;
      this.player1.name = u.displayName || u.username;
      this.player1.avatar = u.avatar || this.player1.avatar;
      this.player1.isPremium = Boolean(u.isPremium);
      this.player1.wallet = u.walletAddress || undefined;
    }
  }

  public subscribe(listener: BattleListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public getState(): BattleRoomState {
    return {
      roomId: this.roomId || '',
      roomCode: this.roomCode,
      state: this.state,
      myRole: this.myRole,
      isAiBattle: this.isAiBattle,
      player1: { ...this.player1 },
      player2: { ...this.player2 },
      authoritativeExerciseId: this.authoritativeExerciseId,
      selectionTimeLeft: this.selectionTimeLeft,
      battleTimeLeft: this.battleTimeLeft,
      sessionNonce: this.sessionNonce,
      verifiedResult: this.verifiedResult ? { ...this.verifiedResult } : null,
      solanaSettlement: this.solanaSettlement ? { ...this.solanaSettlement } : null,
      errorMessage: this.errorMessage
    };
  }

  public getAvailableExercises(): Exercise[] {
    return EXERCISES.filter((ex) => {
      const isCameraSupported = 
        Boolean(ex.cameraVerifierId) || 
        Boolean(ex.cameraTrackingSupported) || 
        ['push_up', 'squat', 'pull_up', 'dips_bars', 'pike_pushups', 'archer_pushups'].some(k => ex.id.includes(k) || (ex.category && ex.category.includes(k)));
      return isCameraSupported;
    });
  }

  /**
   * Start server-authoritative matchmaking
   */
  public async startMatchmaking(preferredRoomCode = 'FORGE-GLOBAL', mode: 'pvp' | 'ai' = 'pvp'): Promise<void> {
    this.resetState();
    this.state = 'MATCHMAKING';
    this.roomCode = preferredRoomCode.toUpperCase();
    this.errorMessage = null;
    this.isAiBattle = (mode === 'ai');
    this.notify();

    const currentUser = authStore.getCurrentUser();
    const athleteName = currentUser ? (currentUser.displayName || currentUser.username) : 'Атлет Forge';
    if (!currentUser) {
      this.errorMessage = 'Для PvP потрібна авторизація.';
      this.state = 'IDLE';
      this.notify();
      return;
    }
    const athleteWallet = currentUser.walletAddress || currentUser.id;

    try {
      const res = await fetch('/api/battle/matchmake', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          roomCode: this.roomCode,
          exercise: this.player1.selectedExerciseId || 'pushups_classic',
          mode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        this.errorMessage = data.error || 'Помилка пошуку суперника';
        this.state = 'IDLE';
        this.notify();
        return;
      }

      if (data.status === 'waiting') {
        this.state = 'MATCHMAKING';
        this.errorMessage = null;
        this.notify();
        return;
      }

      this.roomId = data.battleId;
      this.sessionNonce = data.sessionNonce;
      this.isAiBattle = Boolean(data.isAiBattle);

      if (data.opponent) {
        this.player2 = {
          id: data.opponent.userId || data.opponent.wallet || (this.isAiBattle ? 'ai_forge_simulator' : 'p2_waiting'),
          name: data.opponent.name || (this.isAiBattle ? 'Forge AI Trainer' : 'Суперник'),
          avatar: data.opponent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop',
          wallet: data.opponent.wallet,
          badge: data.opponent.badge || (this.isAiBattle ? 'AI Coach' : 'Fighter P2'),
          isPremium: Boolean(data.opponent.isPremium),
          isAi: Boolean(data.opponent.isAi),
          selectedExerciseId: 'pushups_classic',
          isReady: false,
          calibrationPassed: false,
          isConnected: true,
          validReps: 0,
          rejectedReps: 0,
          romPercent: 0
        };
      }

      this.state = 'EXERCISE_SELECTION';
      this.selectionTimeLeft = 35;
      sound.playGong();
      this.startRoomPolling();
      this.notify();
    } catch (err: any) {
      this.errorMessage = err?.message || 'Помилка звʼязку із сервером';
      this.state = 'IDLE';
      this.notify();
    }
  }

  /**
   * Continuous sync with server authoritative room state
   */
  private startRoomPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      if (!this.roomId) return;
      const currentUser = authStore.getCurrentUser();
      const userId = currentUser?.id || this.player1.id;

      try {
        const res = await fetch(`/api/battle/room/${encodeURIComponent(this.roomId)}?userId=${encodeURIComponent(userId)}`, {
          headers: authStore.getAuthHeaders()
        });

        if (res.ok) {
          const room = await res.json();
          this.selectionTimeLeft = room.secondsLeft ?? this.selectionTimeLeft;

          if (room.confirmedExerciseId) {
            this.authoritativeExerciseId = room.confirmedExerciseId;
          }

          if (room.p1 && room.p2) {
            this.player1.selectedExerciseId = room.p1.selectedExerciseId;
            this.player1.isReady = room.p1.isReady;
            this.player1.calibrationPassed = room.p1.calibrationPassed;
            this.player1.validReps = room.p1.verifiedReps ?? this.player1.validReps;
            this.player1.rejectedReps = room.p1.rejectedReps ?? this.player1.rejectedReps;

            this.player2.selectedExerciseId = room.p2.selectedExerciseId;
            this.player2.isReady = room.p2.isReady;
            this.player2.calibrationPassed = room.p2.calibrationPassed;
            this.player2.validReps = room.p2.verifiedReps ?? this.player2.validReps;
            this.player2.rejectedReps = room.p2.rejectedReps ?? this.player2.rejectedReps;
          }

          // Advance state based on server room status
          if (room.status === 'EXERCISE_CONFIRMED' && (this.state === 'EXERCISE_SELECTION' || this.state === 'WAITING_FOR_OPPONENT')) {
            this.state = 'EXERCISE_CONFIRMED';
            sound.playLevelUp();
            this.notify();
            setTimeout(() => {
              if (this.state === 'EXERCISE_CONFIRMED') {
                this.state = 'CALIBRATION';
                this.notify();
              }
            }, 1000);
          } else if (room.status === 'COUNTDOWN' && this.state === 'CALIBRATION') {
            this.state = 'COUNTDOWN';
            this.notify();
          } else if (room.status === 'ACTIVE' && this.state === 'COUNTDOWN') {
            this.startActiveBattleClock();
          } else if (room.status === 'FINISHED' && this.state === 'VERIFYING') {
            if (room.verifiedResult) {
              this.verifiedResult = room.verifiedResult;
              this.state = 'FINISHED';
              sound.playTrophy();
              this.notify();
            }
          } else if (room.status === 'SETTLED') {
            if (room.solanaSettlement) {
              this.solanaSettlement = room.solanaSettlement;
            }
            this.state = 'SETTLED';
            this.notify();
          } else if (room.status === 'DISCONNECTED') {
            this.state = 'OPPONENT_DISCONNECTED';
            this.errorMessage = 'Суперник втратив зʼєднання під час Батлу';
            this.notify();
          }
        }
      } catch {
        // ignore poll network glithes
      }
    }, 1200);
  }

  /**
   * User selects an exercise candidate
   */
  public async selectExerciseCandidate(exerciseId: string): Promise<{ success: boolean; error?: string; isPremiumRequired?: boolean }> {
    const exercise = EXERCISES.find((e) => e.id === exerciseId);
    if (!exercise) {
      return { success: false, error: 'Вправу не знайдено в каталозі' };
    }

    if (!this.roomId) {
      this.player1.selectedExerciseId = exerciseId;
      this.authoritativeExerciseId = exerciseId;
      this.notify();
      return { success: true };
    }

    const currentUser = authStore.getCurrentUser();
    const userId = currentUser?.id || this.player1.id;

    try {
      const res = await fetch('/api/battle/select-exercise', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          battleId: this.roomId,
          userId,
          exerciseId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Помилка вибору вправи',
          isPremiumRequired: data.isPremiumRequired
        };
      }

      this.player1.selectedExerciseId = exerciseId;
      this.player1.isReady = false;
      if (data.confirmedExerciseId) {
        this.authoritativeExerciseId = data.confirmedExerciseId;
      }
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Помилка мережі' };
    }
  }

  /**
   * Confirm exercise readiness
   */
  public async confirmExerciseReady(): Promise<void> {
    if (!this.roomId) return;
    const currentUser = authStore.getCurrentUser();
    const userId = currentUser?.id || this.player1.id;

    sound.playAnvilHit();
    this.player1.isReady = true;
    this.state = 'WAITING_FOR_OPPONENT';
    this.notify();

    try {
      const res = await fetch('/api/battle/confirm-ready', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          battleId: this.roomId,
          userId,
          ready: true
        })
      });

      const data = await res.json();
      if (data.status === 'EXERCISE_CONFIRMED' || (data.p1Ready && data.p2Ready)) {
        this.state = 'EXERCISE_CONFIRMED';
        sound.playLevelUp();
        this.notify();

        setTimeout(() => {
          this.state = 'CALIBRATION';
          this.notify();
        }, 1200);
      }
    } catch {
      // room polling will sync state
    }
  }

  /**
   * Change exercise choice before both confirm
   */
  public async changeExercise(): Promise<void> {
    this.player1.isReady = false;
    this.state = 'EXERCISE_SELECTION';
    sound.playClick();
    this.notify();

    if (this.roomId) {
      const currentUser = authStore.getCurrentUser();
      const userId = currentUser?.id || this.player1.id;
      try {
        await fetch('/api/battle/confirm-ready', {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({
            battleId: this.roomId,
            userId,
            ready: false
          })
        });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Camera calibration passed by athlete
   */
  public async confirmCalibrationPassed(): Promise<void> {
    if (!this.roomId) {
      this.state = 'COUNTDOWN';
      this.notify();
      return;
    }

    const currentUser = authStore.getCurrentUser();
    const userId = currentUser?.id || this.player1.id;

    try {
      const res = await fetch('/api/battle/calibration-ready', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          battleId: this.roomId,
          userId
        })
      });

      const data = await res.json();
      if (data.status === 'COUNTDOWN') {
        this.state = 'COUNTDOWN';
        this.notify();
      }
    } catch {
      this.state = 'COUNTDOWN';
      this.notify();
    }
  }

  /**
   * Launch active 60-second battle clock
   */
  public async startActiveBattleClock(): Promise<void> {
    this.state = 'ACTIVE';
    this.battleTimeLeft = 60;
    this.telemetryFrames = [];
    sound.playAnvilHit();
    this.notify();

    if (this.roomId) {
      try {
        await fetch('/api/battle/start-active', {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({ battleId: this.roomId })
        });
      } catch {
        // ignore
      }
    }

    if (this.battleClockInterval) clearInterval(this.battleClockInterval);

    this.battleClockInterval = setInterval(() => {
      if (this.battleTimeLeft > 1) {
        this.battleTimeLeft -= 1;
        if (this.battleTimeLeft === 11) {
          sound.playChainTug();
        } else if (this.battleTimeLeft <= 4 && this.battleTimeLeft >= 2) {
          sound.playTimerTick();
        }
        this.notify();
      } else {
        clearInterval(this.battleClockInterval);
        this.battleTimeLeft = 0;
        this.finishBattleAndVerify();
      }
    }, 1000);
  }

  /**
   * Records a frame to telemetry journal
   */
  public addTelemetryFrame(frame: TelemetryFrame): void {
    if (this.state === 'ACTIVE') {
      this.telemetryFrames.push(frame);
    }
  }

  /**
   * Updates local feedback reps (visual only - server will authoritatively verify telemetry!)
   */
  public updateLocalDisplayReps(validReps: number, rejectedReps: number, romPercent: number): void {
    this.player1.validReps = validReps;
    this.player1.rejectedReps = rejectedReps;
    this.player1.romPercent = romPercent;
    this.notify();
  }

  /**
   * Finish 60-second battle and submit telemetry journal for server-side verification
   */
  public async finishBattleAndVerify(): Promise<void> {
    if (this.battleClockInterval) clearInterval(this.battleClockInterval);
    this.state = 'VERIFYING';
    sound.playGong();
    this.notify();

    if (!this.roomId) {
      this.errorMessage = 'Відсутній ID активної сесії батлу';
      this.state = 'VERIFICATION_FAILED';
      this.notify();
      return;
    }

    // AI Simulator is demo-only: never send it to competitive settlement.
    if (this.isAiBattle) {
      const demoReps = Math.max(0, Math.round(this.player1.validReps));
      const aiReps = Math.max(0, Math.round(demoReps * 0.85));
      this.player2.validReps = aiReps;
      this.verifiedResult = {
        battleId: this.roomId,
        winnerId: demoReps === aiReps ? 'draw' : (demoReps > aiReps ? this.player1.id : this.player2.id),
        winnerReps: Math.max(demoReps, aiReps),
        p1VerifiedReps: demoReps,
        p2VerifiedReps: aiReps,
        p1Id: this.player1.id,
        p2Id: 'ai_forge_simulator',
        exerciseId: this.authoritativeExerciseId || this.player1.selectedExerciseId || 'pushups_classic',
        proofHash: '',
        serverSignature: '',
        xpAwarded: 0,
        finishedAt: new Date().toISOString(),
        verificationStatus: 'AI_SIMULATION_ONLY'
      };
      this.state = 'FINISHED';
      this.solanaSettlement = null;
      this.notify();
      return;
    }

    try {
      const res = await fetch('/api/battle/verify-session', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          battleId: this.roomId,
          frames: this.telemetryFrames,
          sessionNonce: this.sessionNonce
        })
      });

      const data = await res.json();
      if (!res.ok) {
        this.errorMessage = data.error || 'Помилка серверної верифікації батлу';
        this.state = 'VERIFICATION_FAILED';
        this.notify();
        return;
      }

      this.verifiedResult = data.verifiedResult;
      this.player1.validReps = data.verifiedResult.p1VerifiedReps;
      this.player2.validReps = data.verifiedResult.p2VerifiedReps;
      this.state = 'FINISHED';
      sound.playTrophy();
      this.notify();

      // Automatically trigger real blockchain notarization on server
      this.settleBlockchain();
    } catch (err: any) {
      this.errorMessage = err?.message || 'Помилка звʼязку при верифікації повторень';
      this.state = 'VERIFICATION_FAILED';
      this.notify();
    }
  }

  /**
   * Real Solana blockchain settlement
   */
  public async settleBlockchain(): Promise<void> {
    if (!this.roomId || !this.verifiedResult) return;

    try {
      const res = await fetch('/api/battle/settle-blockchain', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          battleId: this.roomId
        })
      });

      const data = await res.json();
      if (data.settlement) {
        this.solanaSettlement = data.settlement;
      }
      if (data.settlement?.status === 'CONFIRMED') this.state = 'SETTLED';
      else this.state = 'FINISHED';
      this.notify();
    } catch {
      // Settlement remains retriable
    }
  }

  /**
   * Retry Solana settlement without losing battle outcome
   */
  public async retrySolanaSettlement(): Promise<void> {
    await this.settleBlockchain();
  }

  /**
   * Set Camera Error state (strictly prohibits simulation mode in competitive battle)
   */
  public setCameraError(message: string): void {
    this.state = 'CAMERA_ERROR';
    this.errorMessage = message;
    sound.playClick();
    this.notify();
  }

  /**
   * Leave or forfeit room
   */
  public async leaveRoom(): Promise<void> {
    if (this.roomId) {
      const currentUser = authStore.getCurrentUser();
      const userId = currentUser?.id || this.player1.id;
      try {
        await fetch('/api/battle/leave-room', {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: JSON.stringify({
            battleId: this.roomId,
            userId
          })
        });
      } catch {
        // ignore
      }
    }
    this.resetState();
  }

  /**
   * Reset store state cleanly
   */
  public resetState(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.battleClockInterval) clearInterval(this.battleClockInterval);

    this.state = 'IDLE';
    this.roomId = null;
    this.sessionNonce = null;
    this.isAiBattle = false;
    this.authoritativeExerciseId = 'pushups_classic';
    this.selectionTimeLeft = 35;
    this.battleTimeLeft = 60;
    this.verifiedResult = null;
    this.solanaSettlement = null;
    this.errorMessage = null;
    this.telemetryFrames = [];

    this.player1.selectedExerciseId = 'pushups_classic';
    this.player1.isReady = false;
    this.player1.calibrationPassed = false;
    this.player1.validReps = 0;
    this.player1.rejectedReps = 0;

    this.player2.selectedExerciseId = 'pushups_classic';
    this.player2.isReady = false;
    this.player2.calibrationPassed = false;
    this.player2.validReps = 0;
    this.player2.rejectedReps = 0;

    this.notify();
  }
}

export const battleStore = new BattleStore();
