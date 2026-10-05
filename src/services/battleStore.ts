import confetti from 'canvas-confetti';
import { BattleMatch, BattleOpponent, ExerciseId } from '../types';
import { forgeGameStore } from './forgeGameStore';
import { soundEngine } from './soundEngine';
import { socketClient } from './socketClient';

export type BattlePhase = 
  | 'idle'
  | 'calibrating'
  | 'matchmaking'
  | 'matchmaking_timeout'
  | 'countdown'
  | 'in_battle'
  | 'finished';

class BattleStore {
  public phase: BattlePhase = 'idle';
  public currentMatch: BattleMatch | null = null;
  public exerciseId: ExerciseId = 'pushups';
  public durationSeconds: number = 60;
  public countdownNumber: number = 3;
  public matchmakingTimer: number = 20;
  public queueCount: number = 0;
  public tugOfWarValue: number = 0; // -50 (opponent leads) to +50 (player leads)
  public lastXpEarned: number = 0;
  public opponentDisconnectSeconds: number | null = null;
  public finishReason: string | null = null;

  private listeners: Set<() => void> = new Set();
  private matchmakingInterval: number | null = null;
  private countdownInterval: number | null = null;
  private matchInterval: number | null = null;
  private disconnectInterval: number | null = null;
  private unsubSocket: (() => void)[] = [];

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // 1. Queue updates from server
    this.unsubSocket.push(
      socketClient.on('battle_queue_update', (data) => {
        if (this.phase === 'matchmaking') {
          this.queueCount = data.queueCount || 1;
          this.notify();
        }
      })
    );

    // 2. Real opponent matched
    this.unsubSocket.push(
      socketClient.on('battle_matched', (data) => {
        if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
        
        const opponent: BattleOpponent = {
          id: data.opponent.userId,
          nick: data.opponent.nick,
          avatar: data.opponent.avatar,
          title: data.opponent.title || (data.opponent.isBot ? 'Iron Will' : 'Athlete'),
          isBot: Boolean(data.opponent.isBot),
          reps: 0,
          currentRom: 0
        };

        this.initMatch(data.matchId, data.nonce, opponent);
      })
    );

    // 3. Battle countdown finished, duel started
    this.unsubSocket.push(
      socketClient.on('battle_started', (data) => {
        this.phase = 'in_battle';
        if (this.currentMatch) {
          this.currentMatch.status = 'in_progress';
          this.currentMatch.remainingSeconds = data.remainingSeconds || this.durationSeconds;
          this.currentMatch.durationSeconds = data.durationSeconds || this.durationSeconds;
        }
        this.startClientClock();
        this.notify();
      })
    );

    // 4. Tick sync from server authoritative timer
    this.unsubSocket.push(
      socketClient.on('battle_tick', (data) => {
        if (this.currentMatch && this.phase === 'in_battle') {
          this.currentMatch.remainingSeconds = data.remainingSeconds;
          if (data.player2Reps !== undefined && !this.isPlayer1()) {
            // We are player 2
            this.currentMatch.opponentReps = data.player1Reps;
          } else if (data.player2Reps !== undefined) {
            this.currentMatch.opponentReps = data.player2Reps;
          }
          if (data.tugValue !== undefined) {
            this.tugOfWarValue = data.tugValue;
          }
          this.notify();
        }
      })
    );

    // 5. Opponent performed a rep
    this.unsubSocket.push(
      socketClient.on('battle_opponent_rep', (data) => {
        if (this.currentMatch && this.phase === 'in_battle') {
          this.currentMatch.opponentReps = data.reps;
          this.updateTugOfWar();
          this.notify();
        }
      })
    );

    // 6. Opponent disconnected during battle
    this.unsubSocket.push(
      socketClient.on('battle_opponent_disconnected', (data) => {
        if (this.currentMatch && this.phase === 'in_battle') {
          this.opponentDisconnectSeconds = data.graceSeconds || 10;
          if (this.disconnectInterval) clearInterval(this.disconnectInterval);
          this.disconnectInterval = window.setInterval(() => {
            if (this.opponentDisconnectSeconds && this.opponentDisconnectSeconds > 0) {
              this.opponentDisconnectSeconds--;
              this.notify();
            } else {
              if (this.disconnectInterval) clearInterval(this.disconnectInterval);
            }
          }, 1000);
          this.notify();
        }
      })
    );

    // 7. Server-authoritative rep acknowledgement
    this.unsubSocket.push(
      socketClient.on('battle_rep_result', (data) => {
        if (!this.currentMatch || data.matchId !== this.currentMatch.id) return;
        if (data.accepted) {
          this.currentMatch.playerReps = data.reps;
          this.currentMatch.playerAccuracy = data.accuracy ?? this.currentMatch.playerAccuracy;
          this.updateTugOfWar();
          this.notify();
        } else {
          this.currentMatch.feedbackMessage = data.reason || 'Повтор не зараховано';
          this.notify();
        }
      })
    );

    // 7. Battle finished
    this.unsubSocket.push(
      socketClient.on('battle_finished', (data) => {
        this.handleBattleFinished(data);
      })
    );
  }

  private isPlayer1(): boolean {
    return true;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public selectExercise(id: ExerciseId) {
    this.exerciseId = id;
    this.notify();
  }

  public startCalibration(exerciseId?: ExerciseId) {
    if (exerciseId) this.exerciseId = exerciseId;
    this.phase = 'calibrating';
    forgeGameStore.incrementQuest('starter_calibration', 1);
    this.notify();
  }

  public setDuration(seconds: number) {
    const allowed = [30, 60, 90, 120];
    if (allowed.includes(seconds)) { this.durationSeconds = seconds; this.notify(); }
  }

  public startMatchmaking() {
    this.phase = 'matchmaking';
    this.matchmakingTimer = 20;
    this.queueCount = 1;
    this.notify();

    // Send queue request to server over WebSocket
    socketClient.send('battle_join_queue', { exerciseId: this.exerciseId, durationSeconds: this.durationSeconds });

    if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);

    this.matchmakingInterval = window.setInterval(() => {
      this.matchmakingTimer--;

      if (this.matchmakingTimer <= 0) {
        if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
        this.phase = 'matchmaking_timeout';
        this.notify();
      } else {
        this.notify();
      }
    }, 1000);
  }

  public cancelMatchmaking() {
    if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
    socketClient.send('battle_leave_queue');
    this.phase = 'idle';
    this.notify();
  }

  public chooseBotSparring() {
    if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
    socketClient.send('battle_spar_bot', { exerciseId: this.exerciseId, durationSeconds: this.durationSeconds });
  }

  private initMatch(matchId: string, nonce: string, opponent: BattleOpponent) {
    this.currentMatch = {
      id: matchId,
      exerciseId: this.exerciseId,
      durationSeconds: this.durationSeconds,
      remainingSeconds: this.durationSeconds,
      status: 'countdown',
      playerReps: 0,
      opponentReps: 0,
      playerAccuracy: 100,
      opponent,
      winner: null,
      nonce
    };

    this.tugOfWarValue = 0;
    this.opponentDisconnectSeconds = null;
    this.finishReason = null;
    this.startCountdown();
  }

  private startCountdown() {
    this.phase = 'countdown';
    this.countdownNumber = 3;
    soundEngine.playCountdownBeep(false);
    this.notify();

    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = window.setInterval(() => {
      this.countdownNumber--;
      if (this.countdownNumber > 0) {
        soundEngine.playCountdownBeep(false);
        this.notify();
      } else if (this.countdownNumber === 0) {
        soundEngine.playCountdownBeep(true);
        this.notify();
      } else {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  private startClientClock() {
    if (this.matchInterval) clearInterval(this.matchInterval);
    this.matchInterval = window.setInterval(() => {
      if (this.currentMatch && this.phase === 'in_battle') {
        if (this.currentMatch.remainingSeconds > 0) {
          this.currentMatch.remainingSeconds--;
          this.notify();
        }
      }
    }, 1000);
  }

  private updateTugOfWar() {
    if (!this.currentMatch) return;
    const diff = this.currentMatch.playerReps - this.currentMatch.opponentReps;
    this.tugOfWarValue = Math.max(-50, Math.min(50, diff * 7));
  }

  private handleBattleFinished(data: any) {
    if (this.matchInterval) clearInterval(this.matchInterval);
    if (this.disconnectInterval) clearInterval(this.disconnectInterval);

    if (!this.currentMatch) return;

    this.phase = 'finished';
    this.currentMatch.status = 'finished';
    this.finishReason = data.reason || null;

    let winner: 'player' | 'opponent' | 'draw' = 'draw';
    if (this.currentMatch.playerReps > this.currentMatch.opponentReps || data.reason === 'opponent_abandoned') {
      winner = 'player';
    } else if (this.currentMatch.playerReps < this.currentMatch.opponentReps) {
      winner = 'opponent';
    }
    this.currentMatch.winner = winner;

    const isWin = winner === 'player';

    if (isWin) {
      soundEngine.playVictoryFanfare();
      this.triggerConfetti();
    } else {
      soundEngine.playMatchEnd();
    }

    // Record stats in local store
    this.lastXpEarned = forgeGameStore.recordBattleResult({
      exerciseId: this.currentMatch.exerciseId,
      isWin,
      reps: this.currentMatch.playerReps,
      accuracy: this.currentMatch.playerAccuracy
    });

    this.notify();
  }

  private triggerConfetti() {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C6FF3D', '#22C55E', '#FFFFFF']
      });
    } catch {}
  }

  public submitCameraRep(rom:number, accuracy:number, errorType?:string) {
    if (this.phase !== 'in_battle' || !this.currentMatch) return;
    socketClient.send('battle_rep', {
      matchId:this.currentMatch.id,
      repNumber:this.currentMatch.playerReps + 1,
      rom, accuracy, nonce:this.currentMatch.nonce, errorType
    });
  }

  /** Ranked/online battles are camera-only. Manual reps must never enter the authoritative battle stream. */
  public manualAddRep() {
    if (this.phase === 'in_battle') {
      this.currentMatch && (this.currentMatch.feedbackMessage = 'Manual repetitions are disabled in competitive battles');
      this.notify();
    }
  }

  public rematch() {
    this.startMatchmaking();
  }

  public exitToIdle() {
    if (this.matchInterval) clearInterval(this.matchInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.matchmakingInterval) clearInterval(this.matchmakingInterval);
    if (this.disconnectInterval) clearInterval(this.disconnectInterval);

    socketClient.send('battle_leave_queue');

    this.phase = 'idle';
    this.currentMatch = null;
    this.opponentDisconnectSeconds = null;
    this.finishReason = null;
    this.notify();
  }
}

export const battleStore = new BattleStore();
