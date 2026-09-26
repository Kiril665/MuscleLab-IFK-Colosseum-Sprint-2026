import { 
  ForgePassportData, 
  ForgeProgressionTier, 
  ForgeProgressionInfo, 
  VerificationProofEnvelope, 
  VerifiedExerciseKind,
  VerifiedRepDetail,
  BattleSessionData
} from '../types';
import { TelemetryFrame } from './pose/serverWorkoutVerifier';
import { authStore } from './authStore';

export const FORGE_TIER_CONFIG: Record<ForgeProgressionTier, ForgeProgressionInfo> = {
  raw_metal: {
    tier: 'raw_metal',
    title: 'Raw Metal',
    subtitle: 'Сирий Метал',
    badge: '🌑',
    minRepsRequired: 0,
    minWinsRequired: 0,
    unlockCondition: 'Початок шляху в Кузні. Ще жодного верифікованого повторення.',
    color: 'text-neutral-400',
    auraGradient: 'from-neutral-700 to-neutral-900'
  },
  forged: {
    tier: 'forged',
    title: 'Forged',
    subtitle: 'Викуваний',
    badge: '🔨',
    minRepsRequired: 25,
    minWinsRequired: 0,
    unlockCondition: 'Верифіковано перші 25 повторень перед камерою з контролем амплітуди.',
    color: 'text-amber-400',
    auraGradient: 'from-amber-600/30 to-amber-950/40'
  },
  muscles: {
    tier: 'muscles',
    title: 'Muscles',
    subtitle: 'Сталеві Мʼязи',
    badge: '💪',
    minRepsRequired: 50,
    minWinsRequired: 1,
    unlockCondition: '50+ верифікованих повторень та 1 перемога у 60s Forge Battle.',
    color: 'text-orange-400',
    auraGradient: 'from-orange-600/30 to-orange-950/40'
  },
  armor: {
    tier: 'armor',
    title: 'Armor',
    subtitle: 'Броня Кузні',
    badge: '🛡️',
    minRepsRequired: 150,
    minWinsRequired: 3,
    unlockCondition: '150+ верифікованих повторень та 3 перемоги в дуелях.',
    color: 'text-cyan-400',
    auraGradient: 'from-cyan-600/30 to-cyan-950/40'
  },
  fire_aura: {
    tier: 'fire_aura',
    title: 'Fire Aura',
    subtitle: 'Вогняна Аура',
    badge: '🔥',
    minRepsRequired: 300,
    minWinsRequired: 5,
    unlockCondition: '300+ верифікованих повторень та 5 перемог у батлах.',
    color: 'text-red-400',
    auraGradient: 'from-red-600/40 to-amber-950/50'
  },
  tempered_steel: {
    tier: 'tempered_steel',
    title: 'Tempered Steel',
    subtitle: 'Загартована Сталь',
    badge: '⚔️',
    minRepsRequired: 600,
    minWinsRequired: 10,
    unlockCondition: '600+ верифікованих повторень та 10 перемог у дуелях.',
    color: 'text-violet-400',
    auraGradient: 'from-violet-600/40 to-purple-950/50'
  },
  legendary_forge: {
    tier: 'legendary_forge',
    title: 'Legendary Forge',
    subtitle: 'Легенда Кузні',
    badge: '👑',
    minRepsRequired: 1000,
    minWinsRequired: 20,
    unlockCondition: '1000+ верифікованих повторень та 20 перемог у 60-секундних битвах.',
    color: 'text-amber-300',
    auraGradient: 'from-amber-400/50 via-red-500/30 to-purple-900/60'
  }
};

export interface SponsorChallenge {
  id: string;
  sponsorName: string;
  sponsorLogo: string;
  title: string;
  rewardPool: string;
  description: string;
  qualifyingReps: number;
  endDate: string;
}

export const ACTIVE_SPONSOR_CHALLENGE: SponsorChallenge = {
  id: 'sp_gymbeam_solana_1',
  sponsorName: 'GymBeam & Solana Foundation',
  sponsorLogo: '⚡',
  title: 'Titan Verified Reps Challenge',
  rewardPool: '$500 Sponsor Reward Pool',
  description: 'Призовий фонд від офіційних спонсорів за підтверджені камерою повторення. Жодних грошових ставок між гравцями — 100% чесний спорт та фіксація в блокчейні.',
  qualifyingReps: 25,
  endDate: '30 вересня 2026'
};

class ForgeGameStore {
  private walletAddress: string = '';
  private passport: ForgePassportData = {
    walletAddress: null,
    battlesCount: 0,
    winsCount: 0,
    lossesCount: 0,
    totalVerifiedReps: 0,
    personalRecords: {
      pushups60s: 0,
      squats60s: 0,
      pullups60s: 0
    },
    forgeTier: 'raw_metal',
    achievements: [],
    lastActiveNonce: null,
    reputationBadge: 'Новачок Кузні (Raw Metal)'
  };

  private currentNonce: string | null = null;
  private currentChallenge: string = 'Статична фіксація 3с (Liveness Check)';
  private lastVerificationEnvelope: VerificationProofEnvelope | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromLocal();
  }

  private loadFromLocal() {
    try {
      const saved = localStorage.getItem('forgemuscle_passport_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure no legacy fake seeded numbers remain
        if (parsed.totalVerifiedReps === 112 && parsed.battlesCount === 5) {
          this.saveToLocal();
        } else {
          if (parsed.walletAddress === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') {
            parsed.walletAddress = null;
          }
          this.passport = parsed;
          this.walletAddress = this.passport.walletAddress || '';
        }
      } else {
        this.saveToLocal();
      }
    } catch {
      // ignore
    }
  }

  private saveToLocal() {
    try {
      localStorage.setItem('forgemuscle_passport_v2', JSON.stringify(this.passport));
    } catch {
      // ignore
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
    this.saveToLocal();
  }

  getWalletAddress(): string {
    return this.walletAddress;
  }

  setWalletAddress(addr: string) {
    this.walletAddress = addr;
    this.passport.walletAddress = addr;
    this.notify();
  }

  getPassport(): ForgePassportData {
    return this.passport;
  }

  getCurrentNonce(): string | null {
    return this.currentNonce;
  }

  getCurrentChallenge(): string {
    return this.currentChallenge;
  }

  getLastEnvelope(): VerificationProofEnvelope | null {
    return this.lastVerificationEnvelope;
  }

  // Request fresh Anti-Replay session nonce from server
  async requestSessionNonce(): Promise<{ nonce: string; challenge: string }> {
    try {
      const res = await fetch(`/api/verifier/session-nonce?wallet=${encodeURIComponent(this.walletAddress)}`, { headers: authStore.getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to request nonce');
      const data = await res.json();
      this.currentNonce = data.nonce;
      this.currentChallenge = data.challenge;
      this.notify();
      return data;
    } catch {
      throw new Error('Сервер сесії верифікації недоступний. Новий nonce не створено локально.');
    }
  }

  // Submit workout for computer vision verification + server signing + Solana settlement
  async submitWorkoutVerification(params: {
    exercise: VerifiedExerciseKind;
    durationSeconds: number;
    validReps: number;
    rejectedReps: number;
    rejectionReasons: string[];
    repDetails: VerifiedRepDetail[];
    athleteName?: string;
    frames?: TelemetryFrame[];
  }): Promise<VerificationProofEnvelope> {
    const payload = {
      nonce: this.currentNonce || `NONCE-${Date.now()}`,
      exercise: params.exercise,
      durationSeconds: params.durationSeconds,
      validReps: params.validReps,
      rejectedReps: params.rejectedReps,
      rejectionReasons: params.rejectionReasons,
      repDetails: params.repDetails,
      frames: params.frames || [],
      athleteWallet: this.walletAddress,
      athleteName: params.athleteName || 'Кузнець Forge'
    };

    try {
      const res = await fetch('/api/verifier/verify-workout', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        this.lastVerificationEnvelope = data.envelope;
        if (data.passport) {
          this.passport = {
            ...this.passport,
            ...data.passport
          };
        }
        this.notify();
        return data.envelope;
      }
    } catch (err) {
      console.warn('Backend verifier endpoint fallback:', err);
    }

    throw new Error('Серверна верифікація недоступна. Результат не буде позначений як verified локально.');
  }

  // Settle Battle Duel on Solana
  async settleDuel(params: {
    battleId: string;
    exercise: VerifiedExerciseKind;
    player1: { id: string; name: string; wallet: string; validReps: number; rejectedReps: number };
    player2: { id: string; name: string; wallet: string; validReps: number; rejectedReps: number };
    winnerId: string | 'draw';
  }) {
    try {
      const res = await fetch('/api/battle/settle-duel', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        // Update local passport
        this.passport.battlesCount += 1;
        this.passport.totalVerifiedReps += params.player1.validReps;
        if (params.winnerId === params.player1.id) {
          this.passport.winsCount += 1;
          // Add duel win achievement
          this.passport.achievements.unshift({
            id: `ach_battle_${Date.now()}`,
            title: `60s ${params.exercise === 'pushups' ? 'Push-up' : params.exercise === 'squats' ? 'Squat' : 'Pull-up'} Duel Victor`,
            description: `Перемога з ${params.player1.validReps} верифікованими повтореннями в Кузні.`,
            earnedAt: new Date().toISOString(),
            badgeIcon: '👑',
            category: 'battle',
            solanaTxSignature: null,
            solanaExplorerUrl: null,
            proofHash: data.settlement.proofHash
          });
        } else if (params.winnerId !== 'draw') {
          this.passport.lossesCount += 1;
        }

        this.updateProgressionTier();
        this.notify();
        return data.settlement;
      }
    } catch {
      // Fallback
    }

    throw new Error('Battle settlement service недоступний. Результат не буде вигадано локально.');
  }

  // Matchmaking with 20s rival timeout
  async startMatchmaking(params: {
    exercise: VerifiedExerciseKind;
    athleteName: string;
    athleteWallet: string;
    roomCode?: string;
  }): Promise<{ status: 'searching' | 'matched'; opponent?: any; timeoutSeconds: number; roomCode: string }> {
    try {
      const res = await fetch('/api/battle/matchmake', {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Matchmaking API unreachable, using local queue:', err);
    }
    return {
      status: 'searching',
      timeoutSeconds: 20,
      roomCode: (params.roomCode || 'FORGE-GLOBAL').toUpperCase()
    };
  }

  async checkMatchmakingStatus(roomCode: string, exercise: VerifiedExerciseKind): Promise<{
    status: 'idle' | 'searching' | 'matched' | 'timed_out';
    remainingSeconds?: number;
    message?: string;
  }> {
    try {
      const res = await fetch(`/api/battle/matchmake/status?roomCode=${encodeURIComponent(roomCode)}&exercise=${encodeURIComponent(exercise)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { status: 'idle' };
  }

  async cancelMatchmaking(roomCode: string, exercise: VerifiedExerciseKind): Promise<void> {
    try {
      await fetch('/api/battle/matchmake/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, exercise })
      });
    } catch {
      // ignore
    }
  }

  private updateProgressionTier() {
    const reps = this.passport.totalVerifiedReps;
    const wins = this.passport.winsCount;

    if (reps >= 1000 && wins >= 20) {
      this.passport.forgeTier = 'legendary_forge';
    } else if (reps >= 600 && wins >= 10) {
      this.passport.forgeTier = 'tempered_steel';
    } else if (reps >= 300 && wins >= 5) {
      this.passport.forgeTier = 'fire_aura';
    } else if (reps >= 150 && wins >= 3) {
      this.passport.forgeTier = 'armor';
    } else if (reps >= 50 && wins >= 1) {
      this.passport.forgeTier = 'muscles';
    } else if (reps >= 25) {
      this.passport.forgeTier = 'forged';
    } else {
      this.passport.forgeTier = 'raw_metal';
    }
  }

  getTierInfo(tier?: ForgeProgressionTier): ForgeProgressionInfo {
    const t = tier || this.passport.forgeTier;
    return FORGE_TIER_CONFIG[t] || FORGE_TIER_CONFIG.raw_metal;
  }
}

export const forgeGameStore = new ForgeGameStore();
