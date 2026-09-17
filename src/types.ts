export type Discipline = 'bodybuilding' | 'calisthenics' | 'hybrid';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'legs';

export type LocationType = 'gym' | 'home';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type GoalType = 'hypertrophy' | 'strength' | 'endurance' | 'recomp';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  secondaryMuscles?: string[];
  discipline: Discipline;
  location: LocationType;
  difficulty: DifficultyLevel;
  description: string;
  techniqueGood: string[]; // Як треба 🟩
  techniqueBad: string[];  // Як не можна 🟥
  repsGuide: string;
  xpPerRep: number;
  demoType: 'svg-animation' | 'video';
  videoUrl?: string;
  videoPoster?: string;
  youtubeId?: string;
  youtubeTitle?: string;
  tempo?: string;
  tips: string;
}

export interface ProgramExercise {
  exercise: Exercise;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface ForgedProgram {
  id: string;
  name: string;
  discipline: Discipline;
  goal: GoalType;
  inventory: string;
  durationMinutes: number;
  exercises: ProgramExercise[];
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string
  exerciseName: string;
  muscleGroup: MuscleGroup;
  discipline: Discipline;
  reps: number;
  totalXp: number;
  durationSeconds: number;
}

export type AnvilStage =
  | 'raw_metal'
  | 'forged'
  | 'muscles'
  | 'armor'
  | 'fire_aura'
  | 'legendary_forge'
  | 'tempered_steel'
  | 'heavy_armor'
  | 'fiery_aura';

export interface AnvilStageInfo {
  stage: AnvilStage;
  name: string;
  minXp: number;
  maxXp: number;
  description: string;
  badge: string;
  perks: string[];
}

export interface AthleteQuote {
  id: string;
  athleteName: string;
  nickname: string;
  avatarUrl: string;
  quote: string;
  discipline: Discipline;
  highlightAdvice: string;
  videoUrl?: string;
}

export interface AthleteComparison {
  id: string;
  title: string;
  subTitle: string;
  athlete1: {
    name: string;
    discipline: Discipline;
    title: string;
    focus: string;
    pros: string[];
    favoriteMove: string;
    quote: string;
    aesthetic: string;
  };
  athlete2: {
    name: string;
    discipline: Discipline;
    title: string;
    focus: string;
    pros: string[];
    favoriteMove: string;
    quote: string;
    aesthetic: string;
  };
}

export interface NutritionPlan {
  id: string;
  goal: GoalType;
  title: string;
  tagline: string;
  caloriesFormula: string;
  proteinRatio: string;
  carbsRatio: string;
  fatsRatio: string;
  waterIntake: string;
  keyFoods: string[];
  timingTips: string[];
}

// ==================== FORGE COMMUNITY & WIKI ====================

export type CommunityCategory =
  | 'training'
  | 'calisthenics'
  | 'bodybuilding'
  | 'nutrition'
  | 'recovery'
  | 'equipment'
  | 'beginners'
  | 'motivation'
  | 'general';

export type PostType = 'experience' | 'guide' | 'discussion' | 'advice' | 'question';

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: ReputationRank;
  content: string;
  createdAt: string;
  upvotes: number;
  isUpvotedByMe?: boolean;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: CommunityCategory;
  type: PostType;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: ReputationRank;
  createdAt: string;
  upvotes: number;
  isUpvotedByMe?: boolean;
  commentsCount: number;
  comments?: PostComment[];
  isPinned?: boolean;
  isReported?: boolean;
}

// ==================== ASK THE FORGE (Q&A) ====================

export interface QuestionAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: ReputationRank;
  content: string;
  createdAt: string;
  upvotes: number;
  isUpvotedByMe?: boolean;
  isBestAnswer: boolean;
}

export interface AskQuestion {
  id: string;
  title: string;
  details: string;
  category: CommunityCategory;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: ReputationRank;
  createdAt: string;
  upvotes: number;
  isUpvotedByMe?: boolean;
  answersCount: number;
  answers: QuestionAnswer[];
  bestAnswerId?: string;
  isResolved: boolean;
  reputationBounty?: number;
}

// ==================== FORGE REPUTATION & RANKS ====================

export type ReputationRank =
  | 'Newcomer'
  | 'Helper'
  | 'Fighter'
  | 'Mentor'
  | 'Master'
  | 'Legend';

export interface ReputationRankInfo {
  rank: ReputationRank;
  minPoints: number;
  title: string;
  color: string;
  badge: string;
  description: string;
}

// ==================== FORGE GUILDS ====================

export interface Guild {
  id: string;
  name: string;
  description: string;
  motto: string;
  icon: string;
  disciplineFocus: Discipline;
  membersCount: number;
  totalXp: number;
  level: number;
  leaderName: string;
  activeChallenge: string;
  isJoinedByMe?: boolean;
}

// ==================== DAILY QUESTS & WEEKLY CHALLENGES ====================

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: 'workout' | 'reps' | 'knowledge' | 'community';
  progress: number;
  target: number;
  unit: string;
  xpReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  category: 'strength' | 'endurance' | 'consistency' | 'technique' | 'education';
  progress: number;
  target: number;
  unit: string;
  xpReward: number;
  badgeReward: string;
  daysRemaining: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export type ChallengeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface RandomChallenge {
  id: string;
  title: string;
  description: string;
  rarity: ChallengeRarity;
  targetReps: number;
  exerciseName: string;
  timeLimitMinutes: number;
  xpReward: number;
}

// ==================== FORGE SCORE & PROFILE ====================

export interface ForgeScoreBreakdown {
  training: number;    // 0 - 250
  consistency: number; // 0 - 200
  challenges: number;  // 0 - 200
  knowledge: number;   // 0 - 150
  community: number;   // 0 - 200
  total: number;       // 0 - 1000
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  reputationPoints: number;
  reputationRank: ReputationRank;
  streakDays: number;
  discipline: Discipline;
  guildId?: string;
  guildName?: string;
  completedChallengesCount: number;
  bio: string;
  joinedDate: string;
  blockedUserIds: string[];
  // Cosmetics & Customization
  frameId?: string;
  effectId?: string;
  backgroundId?: string;
  selectedTitle?: string;
  unlockedBadgeIds?: string[];
  isPremium?: boolean;
  isCreator?: boolean;
  forgePoints?: number;
}

// ==================== FORGE JOURNEY ====================

export interface UserJourney {
  discipline: Discipline;
  userLevel: number;
  availableEquipment: string[];
  availableTimeMinutes: number;
  goal: GoalType;
  previousActivitySummary: string;
  workoutsCompletedCount: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  todaysWorkout: {
    title: string;
    description: string;
    focus: MuscleGroup[];
    estimatedMinutes: number;
    exercises: string[];
    isCompleted: boolean;
  };
  recommendedTopic: {
    id: string;
    title: string;
    category: string;
    readTimeMinutes: number;
  };
  progressPercentage: number;
}

// ==================== FORGE ENGINE ====================

export interface ForgeEngineExercise {
  exerciseId: string;
  name: string;
  muscle: MuscleGroup;
  order: number;
  sets: number;
  repsOrDuration: string;
  restSeconds: number;
  difficulty: DifficultyLevel;
  cue: string;
  alternativeExerciseIds?: string[];
}

export interface ForgeEngineWorkout {
  id: string;
  title: string;
  discipline: Discipline;
  goal: GoalType;
  durationMinutes: number;
  difficulty: DifficultyLevel;
  equipment: string[];
  exercises: ForgeEngineExercise[];
  instructions: string;
}

// ==================== FORGE CHAT & ROOMS ====================

export interface ChatMessage {
  id: string;
  channelId: string; // roomId or conversationId
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: ReputationRank;
  authorLevel: number;
  content: string;
  createdAt: string;
  replyToMessage?: {
    id: string;
    authorName: string;
    snippet: string;
  };
  reactions: Record<string, string[]>; // emoji -> userIds
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  topic: string;
  icon: string;
  membersOnline: number;
  category: 'public' | 'guild';
  guildId?: string;
}

export interface FriendConnection {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  discipline: Discipline;
  reputationRank: ReputationRank;
  status: 'online' | 'offline' | 'training';
  mutualGuild?: string;
  mutualBattle?: string;
  requestStatus: 'accepted' | 'pending' | 'incoming';
}

// ==================== FORGE ACADEMY ====================

export interface AcademyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AcademyLesson {
  id: string;
  title: string;
  summary: string;
  content: string[];
  quiz: AcademyQuizQuestion[];
  xpReward: number;
  isCompleted?: boolean;
}

export interface AcademyCourse {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: DifficultyLevel;
  category: string;
  lessons: AcademyLesson[];
  completedLessonsCount: number;
}

// ==================== ACHIEVEMENTS ====================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'training' | 'battle' | 'streak' | 'knowledge' | 'community' | 'creator';
  progress: number;
  target: number;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

// ==================== CREATOR ECONOMY & MARKETPLACE ====================

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  creatorLevel: number;
  reputationRank: ReputationRank;
  specialties: string[];
  publishedItemsCount: number;
  averageRating: number;
  followersCount: number;
  totalSalesCount: number;
  earningsBalance: number; // in UAH
  isVerifiedCreator: boolean;
}

export type MarketplaceProductType =
  | 'workout_plan'
  | 'technique_guide'
  | 'exercise_collection'
  | 'course'
  | 'template';

export interface MarketplaceProduct {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  type: MarketplaceProductType;
  discipline: Discipline;
  priceUah: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  badge?: string;
  tags: string[];
  previewBullets: string[];
  isPurchasedByMe?: boolean;
  isVerified: boolean;
}

// ==================== FORGE STORE & COSMETICS ====================

export type CosmeticType = 'frame' | 'effect' | 'background' | 'title' | 'badge';

export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  costPoints: number;
  previewColor?: string;
  previewIcon?: string;
  description: string;
  rarity: ChallengeRarity;
  isPurchased?: boolean;
  isEquipped?: boolean;
}

// ==================== SPONSORSHIPS ====================

export interface PartnerSponsorship {
  id: string;
  partnerName: string;
  logo: string;
  title: string;
  description: string;
  discountCode: string;
  category: 'apparel' | 'equipment' | 'accessories' | 'education';
  link: string;
  badge: string;
}

// ==================== NOTIFICATIONS ====================

export interface ForgeNotification {
  id: string;
  type: 'reply' | 'best_answer' | 'message' | 'guild_invite' | 'challenge' | 'battle' | 'level_up' | 'reputation' | 'achievement';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionTab?: string;
}

// ==================== LEADERBOARDS ====================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  discipline: Discipline;
  score: number;
  badge: string;
  guildName?: string;
  isCurrentUser?: boolean;
}

// ==================== FORGE WIKI ====================

export type WikiSection =
  | 'exercises'
  | 'training'
  | 'calisthenics'
  | 'bodybuilding'
  | 'equipment'
  | 'recovery'
  | 'nutrition'
  | 'terms'
  | 'technique';

export interface WikiArticle {
  id: string;
  title: string;
  section: WikiSection;
  summary: string;
  content: string;
  authorName: string;
  readTimeMinutes: number;
  tags: string[];
  views: number;
  isReadByMe?: boolean;
  isVerified?: boolean;
}

// ==================== MYTH OR FACT ====================

export interface MythFactItem {
  id: string;
  statement: string;
  isMyth: boolean; // true = MYTH, false = FACT
  shortFact: string;
  scientificExplanation: string;
  source: string;
  category: 'nutrition' | 'training' | 'anatomy' | 'recovery';
}

export interface ModerationReport {
  id: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'question' | 'answer' | 'message';
  reason: 'spam' | 'toxic' | 'dangerous_technique' | 'misinformation';
  details?: string;
  createdAt: string;
  resolved?: boolean;
}

// ==================== ACCOUNT & AUTH SYSTEM ====================

export type UserRole = 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN' | 'VERIFIED_CREATOR';

export type AuthProvider = 'google' | 'local';

export type PrivacyVisibility = 'public' | 'friends' | 'private';

export type MessagePermission = 'everyone' | 'friends' | 'nobody';

export type OnlineStatus = 'show' | 'hide';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AccountPrivacySettings {
  profileVisibility: PrivacyVisibility;
  activityVisibility: PrivacyVisibility;
  onlineStatus: OnlineStatus;
  messagePermission: MessagePermission;
}

export interface NotificationSettings {
  messages: boolean;
  community: boolean;
  battle: boolean;
  guild: boolean;
  achievements: boolean;
  challenges: boolean;
}

export interface UserSessionInfo {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  location?: string;
}

export interface ForgeUser {
  id: string;               // Unique internal account ID (e.g. usr_xxxx)
  username: string;         // Unique e.g. @Kuznets
  displayName: string;      // User visible display name
  email: string;
  avatar: string;
  authProvider: AuthProvider;
  googleId?: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  lastUsernameChange?: string;
  bio: string;
  discipline: Discipline;
  level: number;
  xp: number;
  forgeScore: number;
  reputationRank: ReputationRank;
  streak: number;
  isPremium: boolean;
  isBanned?: boolean;
  privacy: AccountPrivacySettings;
  notifications: NotificationSettings;
  theme: ThemePreference;
  hasCompletedOnboarding: boolean;
  // Relationships & Stats
  guildId?: string;
  guildName?: string;
  purchasedProductIds?: string[];
}

export interface OnboardingData {
  username: string;
  discipline: Discipline;
  experience: DifficultyLevel;
  equipment: string[];
  availableTimeMinutes: number;
  goals: GoalType[];
}

export interface CloudProgressSyncPayload {
  userId: string;
  lastSyncedAt: string;
  xp: number;
  level: number;
  discipline: Discipline;
  sessions: WorkoutSession[];
  journey: UserJourney;
  dailyQuests: DailyQuest[];
  weeklyChallenges: WeeklyChallenge[];
  achievements: Achievement[];
  purchasedProductIds: string[];
  forgeScore: ForgeScoreBreakdown;
  userProfileUpdates?: Partial<UserProfile>;
}

export interface BusinessMetrics {
  dau: number;
  wau: number;
  mau: number;
  totalRegistrations: number;
  activationRate: number; // % who finished onboarding & 1st workout
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
  totalWorkoutsCompleted: number;
  totalBattlesFought: number;
  totalCommunityPosts: number;
  totalChallengesCompleted: number;
  totalCreatorsCount: number;
  totalMarketplacePurchases: number;
  premiumSubscribersCount: number;
  monthlyGrossRevenueUah: number;
}


