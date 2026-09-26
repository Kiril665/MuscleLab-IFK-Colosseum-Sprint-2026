import { Exercise } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { authStore } from './authStore';
import { sound } from './soundEngine';

export type BattleState = 
  | 'IDLE'
  | 'MATCHMAKING' 
  | 'MATCH_FOUND' 
  | 'EXERCISE_SELECTION' 
  | 'EXERCISE_CONFIRMED' 
  | 'CALIBRATION' 
  | 'COUNTDOWN' 
  | 'ACTIVE' 
  | 'FINISHED'
  | 'OPPONENT_DISCONNECTED';

export interface BattleParticipant {
  id: string;
  name: string;
  avatar: string;
  wallet?: string;
  isPremium: boolean;
  selectedExerciseId: string | null;
  isReady: boolean;
  isConnected: boolean;
  validReps: number;
  rejectedReps: number;
  romPercent: number;
}

export interface BattleRoomState {
  roomId: string;
  roomCode: string;
  state: BattleState;
  myRole: 'player1' | 'player2';
  player1: BattleParticipant;
  player2: BattleParticipant;
  authoritativeExerciseId: string | null;
  selectionTimeLeft: number;
  battleTimeLeft: number;
  winnerId: string | 'draw' | null;
  errorMessage: string | null;
}

type BattleListener = (state: BattleRoomState) => void;

class BattleStore {
  private roomId: string | null = null;
  private roomCode: string = 'FORGE-GLOBAL';
  private state: BattleState = 'IDLE';
  private myRole: 'player1' | 'player2' = 'player1';

  private player1: BattleParticipant = {
    id: 'p1_me',
    name: 'Ви (Атлет Forge)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop',
    isPremium: false,
    selectedExerciseId: null,
    isReady: false,
    isConnected: true,
    validReps: 0,
    rejectedReps: 0,
    romPercent: 0
  };

  private player2: BattleParticipant = {
    id: 'p2_rival',
    name: 'Норматив Кузні',
    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=160&h=160&fit=crop',
    isPremium: false,
    selectedExerciseId: null,
    isReady: false,
    isConnected: true,
    validReps: 0,
    rejectedReps: 0,
    romPercent: 0
  };

  private authoritativeExerciseId: string | null = null;
  private selectionTimeLeft: number = 30;
  private battleTimeLeft: number = 60;
  private winnerId: string | 'draw' | null = null;
  private errorMessage: string | null = null;

  private listeners: Set<BattleListener> = new Set();
  private socket: WebSocket | null = null;
  private pollTimer: any = null;
  private selectionTimerInterval: any = null;

  constructor() {
    // Sync current user info
    authStore.subscribe(() => {
      const u = authStore.getCurrentUser();
      if (u) {
        this.player1.id = u.id;
        this.player1.name = u.displayName || u.username;
        this.player1.avatar = u.avatar || this.player1.avatar;
        this.player1.isPremium = Boolean(u.isPremium);
        this.player1.wallet = u.walletAddress || undefined;
      }
    });
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
      roomId: this.roomId || 'local_room',
      roomCode: this.roomCode,
      state: this.state,
      myRole: this.myRole,
      player1: { ...this.player1 },
      player2: { ...this.player2 },
      authoritativeExerciseId: this.authoritativeExerciseId,
      selectionTimeLeft: this.selectionTimeLeft,
      battleTimeLeft: this.battleTimeLeft,
      winnerId: this.winnerId,
      errorMessage: this.errorMessage
    };
  }

  public getAvailableExercises(): Exercise[] {
    // Filter exercises that are camera-verifiable
    return EXERCISES.filter((ex) => {
      const isCameraSupported = 
        Boolean(ex.cameraVerifierId) || 
        Boolean(ex.cameraTrackingSupported) || 
        ['push_up', 'squat', 'pull_up', 'dips_bars', 'plank'].some(k => ex.id.includes(k) || (ex.category && ex.category.includes(k)));
      return isCameraSupported;
    });
  }

  /**
   * Start matchmaking for a battle room
   */
  public async startMatchmaking(preferredRoomCode = 'FORGE-GLOBAL'): Promise<void> {
    this.resetState();
    this.state = 'MATCHMAKING';
    this.roomCode = preferredRoomCode.toUpperCase();
    this.errorMessage = null;
    this.notify();

    const currentUser = authStore.getCurrentUser();
    const athleteName = currentUser ? (currentUser.displayName || currentUser.username) : 'Атлет Forge';
    const athleteWallet = currentUser?.walletAddress || 'FORGE-LOCAL-USER';

    try {
      const res = await fetch('/api/battle/matchmake', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          roomCode: this.roomCode,
          athleteName,
          athleteWallet
        })
      });

      const data = await res.json();
      if (!res.ok) {
        this.errorMessage = data.error || 'Помилка пошуку суперника';
        this.state = 'IDLE';
        this.notify();
        return;
      }

      this.roomId = data.battleId || `room_${Date.now()}`;

      if (data.status === 'matched') {
        // Matched with another real user
        this.player2 = {
          id: data.opponent.id || 'p2_matched',
          name: data.opponent.name || 'Суперник',
          avatar: data.opponent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop',
          wallet: data.opponent.wallet,
          isPremium: false,
          selectedExerciseId: null,
          isReady: false,
          isConnected: true,
          validReps: 0,
          rejectedReps: 0,
          romPercent: 0
        };
        this.enterExerciseSelection();
      } else {
        // Waiting for matchmaking response / status poll
        this.startMatchmakingPolling();
      }
    } catch (err: any) {
      // Fallback local match for offline mode
      this.roomId = `room_local_${Date.now()}`;
      this.enterExerciseSelection();
    }
  }

  private startMatchmakingPolling() {
    let attempts = 0;
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      attempts++;
      if (attempts > 12) {
        // Matchmaking timeout: paired with Official Target Benchmark Athlete
        clearInterval(this.pollTimer);
        this.player2 = {
          id: 'p2_benchmark',
          name: 'Норматив Кузні (Target Benchmark)',
          avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=160&h=160&fit=crop',
          wallet: 'FORGE-BENCHMARK-OFFICIAL',
          isPremium: true,
          selectedExerciseId: 'pushups_classic',
          isReady: false,
          isConnected: true,
          validReps: 0,
          rejectedReps: 0,
          romPercent: 0
        };
        this.enterExerciseSelection();
        return;
      }

      try {
        const res = await fetch(`/api/battle/matchmake/status?roomCode=${encodeURIComponent(this.roomCode)}&exercise=pushups`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'matched') {
            clearInterval(this.pollTimer);
            if (data.opponent) {
              this.player2 = {
                id: data.opponent.id || 'p2_matched',
                name: data.opponent.name || 'Суперник',
                avatar: data.opponent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop',
                wallet: data.opponent.wallet,
                isPremium: false,
                selectedExerciseId: null,
                isReady: false,
                isConnected: true,
                validReps: 0,
                rejectedReps: 0,
                romPercent: 0
              };
            }
            this.enterExerciseSelection();
          }
        }
      } catch {
        // ignore
      }
    }, 1500);
  }

  /**
   * Transitions to Exercise Selection Screen
   */
  private enterExerciseSelection() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.state = 'EXERCISE_SELECTION';
    this.selectionTimeLeft = 30;
    this.myRole = 'player1';
    this.authoritativeExerciseId = null;

    sound.playGong();
    this.startSelectionTimer();
    this.notify();

    // Also register room on server for authoritative verification
    this.syncRoomWithServer();
  }

  private startSelectionTimer() {
    if (this.selectionTimerInterval) clearInterval(this.selectionTimerInterval);

    this.selectionTimerInterval = setInterval(() => {
      if (this.selectionTimeLeft > 0) {
        this.selectionTimeLeft -= 1;
        this.notify();
      } else {
        // Timer expired: auto-resolve selection
        clearInterval(this.selectionTimerInterval);
        this.handleSelectionTimeout();
      }
    }, 1000);
  }

  private handleSelectionTimeout() {
    if (this.state !== 'EXERCISE_SELECTION') return;

    // Auto-select candidate if none chosen
    if (!this.player1.selectedExerciseId) {
      this.player1.selectedExerciseId = 'pushups_classic';
    }
    if (!this.player2.selectedExerciseId) {
      this.player2.selectedExerciseId = 'pushups_classic';
    }

    this.player1.isReady = true;
    this.player2.isReady = true;
    this.resolveAuthoritativeExercise();
  }

  /**
   * User selects an exercise candidate
   */
  public async selectExerciseCandidate(exerciseId: string): Promise<{ success: boolean; error?: string }> {
    const exercise = EXERCISES.find((e) => e.id === exerciseId);
    if (!exercise) {
      return { success: false, error: 'Вправу не знайдено в каталозі' };
    }

    // Verify camera tracking compatibility
    const isCameraSupported = 
      Boolean(exercise.cameraVerifierId) || 
      Boolean(exercise.cameraTrackingSupported) || 
      ['push_up', 'squat', 'pull_up', 'dips_bars', 'plank'].some(k => exercise.id.includes(k) || (exercise.category && exercise.category.includes(k)));

    if (!isCameraSupported) {
      sound.playClick();
      return { success: false, error: 'Ця вправа не підтримує Camera Verification у Battle Arena' };
    }

    // Check Premium entitlement on server / store
    const isPremiumUser = authStore.getCurrentUser()?.isPremium || false;
    const isExercisePremium = Boolean((exercise as any).premium);

    if (isExercisePremium && !isPremiumUser) {
      sound.playClick();
      return { 
        success: false, 
        error: 'Ця вправа розблоковується з підпискою Forge Premium 🔒' 
      };
    }

    // Assign candidate to my player
    if (this.myRole === 'player1') {
      this.player1.selectedExerciseId = exerciseId;
      this.player1.isReady = false; // Reset ready when changing selection
    } else {
      this.player2.selectedExerciseId = exerciseId;
      this.player2.isReady = false;
    }

    sound.playClick();

    // Benchmark opponent auto-selects / mirrors compatible choice
    if (this.player2.id === 'p2_benchmark') {
      this.player2.selectedExerciseId = exerciseId;
    }

    this.resolveAuthoritativeExercise();
    this.syncRoomWithServer();
    this.notify();

    return { success: true };
  }

  /**
   * Player clicks "Confirm Exercise" / "Ready"
   */
  public confirmExerciseReady(): void {
    if (this.state !== 'EXERCISE_SELECTION') return;

    if (this.myRole === 'player1') {
      if (!this.player1.selectedExerciseId) {
        this.player1.selectedExerciseId = 'pushups_classic';
      }
      this.player1.isReady = true;
    } else {
      if (!this.player2.selectedExerciseId) {
        this.player2.selectedExerciseId = 'pushups_classic';
      }
      this.player2.isReady = true;
    }

    sound.playAnvilHit();

    // Benchmark opponent confirms immediately
    if (this.player2.id === 'p2_benchmark' || !this.player2.isReady) {
      this.player2.isReady = true;
      if (!this.player2.selectedExerciseId) {
        this.player2.selectedExerciseId = this.player1.selectedExerciseId || 'pushups_classic';
      }
    }

    this.resolveAuthoritativeExercise();

    // Check if both players are ready
    if (this.player1.isReady && this.player2.isReady) {
      if (this.selectionTimerInterval) clearInterval(this.selectionTimerInterval);
      this.state = 'EXERCISE_CONFIRMED';
      this.notify();

      // Transition to Camera Calibration after short confirmation delay
      setTimeout(() => {
        this.state = 'CALIBRATION';
        this.notify();
      }, 1200);
    } else {
      this.notify();
    }

    this.syncRoomWithServer();
  }

  /**
   * Player clicks "Change Exercise" before both are ready
   */
  public changeExercise(): void {
    if (this.state !== 'EXERCISE_SELECTION' && this.state !== 'EXERCISE_CONFIRMED') return;

    if (this.myRole === 'player1') {
      this.player1.isReady = false;
    } else {
      this.player2.isReady = false;
    }

    this.state = 'EXERCISE_SELECTION';
    sound.playClick();
    this.notify();
    this.syncRoomWithServer();
  }

  /**
   * Server Authoritative Exercise Resolution
   */
  private resolveAuthoritativeExercise() {
    const p1Choice = this.player1.selectedExerciseId;
    const p2Choice = this.player2.selectedExerciseId;

    if (p1Choice && p2Choice && p1Choice === p2Choice) {
      this.authoritativeExerciseId = p1Choice;
    } else if (p1Choice) {
      this.authoritativeExerciseId = p1Choice;
    } else if (p2Choice) {
      this.authoritativeExerciseId = p2Choice;
    } else {
      this.authoritativeExerciseId = 'pushups_classic';
    }
  }

  /**
   * Transition from Camera Calibration to Countdown and Active Battle
   */
  public startCountdown(): void {
    if (this.state !== 'CALIBRATION') return;
    this.state = 'COUNTDOWN';
    this.notify();

    setTimeout(() => {
      this.state = 'ACTIVE';
      this.battleTimeLeft = 60;
      sound.playAnvilHit();
      this.notify();
    }, 3000);
  }

  /**
   * Live rep telemetry update
   */
  public updateMyReps(validReps: number, rejectedReps: number, romPercent: number): void {
    if (this.myRole === 'player1') {
      this.player1.validReps = validReps;
      this.player1.rejectedReps = rejectedReps;
      this.player1.romPercent = romPercent;
    } else {
      this.player2.validReps = validReps;
      this.player2.rejectedReps = rejectedReps;
      this.player2.romPercent = romPercent;
    }

    // Benchmark opponent simulation if applicable
    if (this.player2.id === 'p2_benchmark' && this.state === 'ACTIVE') {
      // Benchmark target rate
      const targetReps = Math.min(28, Math.floor((60 - this.battleTimeLeft) * 0.45));
      this.player2.validReps = targetReps;
    }

    this.notify();
  }

  /**
   * Disconnects player or handles disconnect state
   */
  public handleOpponentDisconnect(): void {
    this.state = 'OPPONENT_DISCONNECTED';
    this.player2.isConnected = false;
    this.errorMessage = 'Суперник відключився під час підготовки Битви.';
    sound.playClick();
    this.notify();
  }

  /**
   * Reset store state
   */
  public resetState(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.selectionTimerInterval) clearInterval(this.selectionTimerInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.state = 'IDLE';
    this.roomId = null;
    this.authoritativeExerciseId = null;
    this.selectionTimeLeft = 30;
    this.battleTimeLeft = 60;
    this.winnerId = null;
    this.errorMessage = null;

    this.player1.selectedExerciseId = null;
    this.player1.isReady = false;
    this.player1.validReps = 0;
    this.player1.rejectedReps = 0;

    this.player2.selectedExerciseId = null;
    this.player2.isReady = false;
    this.player2.validReps = 0;
    this.player2.rejectedReps = 0;

    this.notify();
  }

  private async syncRoomWithServer() {
    if (!this.roomId) return;

    try {
      await fetch('/api/battle/room/sync', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({
          roomId: this.roomId,
          state: this.state,
          player1: this.player1,
          player2: this.player2,
          authoritativeExerciseId: this.authoritativeExerciseId
        })
      });
    } catch {
      // ignore
    }
  }
}

export const battleStore = new BattleStore();
