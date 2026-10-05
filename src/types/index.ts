import { SupportedLocale } from '../config/locales';

export type ExerciseId = 'pushups' | 'squats' | 'pullups' | 'jumping_jacks' | 'burpees' | 'lunges' | 'dips' | 'plank';

export interface Exercise {
  id: ExerciseId;
  name: string;
  nameEn: string;
  category: 'chest' | 'legs' | 'back' | 'fullbody' | 'core';
  muscleTarget: string;
  muscleGroups: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  equipment: 'none' | 'pullup_bar' | 'dumbbells';
  supportedByCamera: boolean;
  steps: string[];
  commonMistakes: string[];
  breathing: {
    inhale: string;
    exhale: string;
  };
  targetRomAngle: number; // e.g. 90 deg for pushup elbow
  iconName: string;
}

export interface UserSettings {
  language: SupportedLocale;
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  privacy: 'public' | 'friends_only';
  micEnabled?: boolean;
  selectedMicId?: string;
  pushToTalk?: boolean;
  cameraEnabled?: boolean;
  selectedCameraId?: string;
  facingMode?: 'user' | 'environment';
  showSkeleton?: boolean;
  mirrorVideo?: boolean;
}

export interface User {
  id: string;
  nick: string;
  email?: string;
  isGuest?: boolean;
  avatar: string;
  createdAt: number;
  onboardingCompleted?: boolean;
  settings: UserSettings;
}

export interface Title {
  id: string;
  name: string;
  condition: string;
  icon: string;
  unlockedAt?: number;
}

export interface Quest {
  id: string;
  type: 'starter' | 'daily' | 'weekly';
  title: string;
  desc: string;
  goal: number;
  current: number;
  rewardXp: number;
  rewardTitleId?: string;
  completed: boolean;
  claimed: boolean;
}

export interface UserStats {
  totalWins: number;
  totalLosses: number;
  totalReps: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  exerciseReps: Record<ExerciseId, number>;
}

export interface UserProgress {
  userId: string;
  xp: number;
  level: number;
  activeTitleId: string;
  unlockedTitleIds: string[];
  stats: UserStats;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userNick: string;
  userAvatar: string;
  userTitle?: string;
  text: string;
  ts: number;
  isSystem?: boolean;
}

export interface VoiceRoom {
  id: string;
  name: string;
  participants: {
    userId: string;
    nick: string;
    avatar: string;
    isSpeaking: boolean;
    isMuted: boolean;
  }[];
  maxUsers: number;
  isMatchRoom?: boolean;
}

export interface Friend {
  userId: string;
  nick: string;
  avatar: string;
  title: string;
  isOnline: boolean;
  statusText?: string;
}

export interface BattleOpponent {
  id: string;
  nick: string;
  avatar: string;
  title: string;
  isBot?: boolean;
  reps: number;
  currentRom: number; // 0..100%
}

export interface BattleMatch {
  id: string;
  exerciseId: ExerciseId;
  durationSeconds: number;
  remainingSeconds: number;
  status: 'calibrating' | 'countdown' | 'in_progress' | 'finished';
  playerReps: number;
  opponentReps: number;
  playerAccuracy: number;
  opponent: BattleOpponent;
  winner: 'player' | 'opponent' | 'draw' | null;
  nonce: string;
  feedbackMessage?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nick: string;
  avatar: string;
  activeTitle: string;
  xp: number;
  wins: number;
  reps: number;
  isCurrentUser?: boolean;
}

export interface LearningProgress {
  quizDone: boolean;
  quizResult?: {
    goal: 'mass' | 'weight_loss' | 'strength' | 'health';
    experience: 'beginner' | 'some' | 'intermediate';
    daysPerWeek: number;
  };
  readCardIds: string[];
}
