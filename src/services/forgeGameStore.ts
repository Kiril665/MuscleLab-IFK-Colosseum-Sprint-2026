import { ExerciseId, LeaderboardEntry, Quest, UserProgress } from '../types';
import { TITLES_LIST } from '../data/exercisesData';
import { storageManager } from './storageManager';

const INITIAL_QUESTS: Quest[] = [
  // Starter Quests
  {
    id: 'starter_quiz',
    type: 'starter',
    title: 'Пройти вступний тест',
    desc: 'Дай відповіді на 3 короткі питання про свій досвід і ціль',
    goal: 1,
    current: 0,
    rewardXp: 40,
    rewardTitleId: 'novice',
    completed: false,
    claimed: false
  },
  {
    id: 'starter_read_basics',
    type: 'starter',
    title: 'Ознайомся з основами',
    desc: 'Прочитай хоча б 1 картку про прогресивне навантаження або харчування',
    goal: 1,
    current: 0,
    rewardXp: 35,
    completed: false,
    claimed: false
  },
  {
    id: 'starter_calibration',
    type: 'starter',
    title: 'Калібрування камери',
    desc: 'Перевір огляд камери та ракурс перед боєм',
    goal: 1,
    current: 0,
    rewardXp: 35,
    completed: false,
    claimed: false
  },
  {
    id: 'starter_first_battle',
    type: 'starter',
    title: 'Перший Forge Battle',
    desc: 'Проведи свою першу 60-секундну дуель',
    goal: 1,
    current: 0,
    rewardXp: 80,
    rewardTitleId: 'first_blood',
    completed: false,
    claimed: false
  },

  // Daily Quests
  {
    id: 'daily_20reps',
    type: 'daily',
    title: '20 якісних повторів',
    desc: 'Зроби сумарно 20 повторів будь-якої вправи перед камерою',
    goal: 20,
    current: 0,
    rewardXp: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'daily_win',
    type: 'daily',
    title: 'Смак перемоги',
    desc: 'Виграй хоча б одну дуель у Battle',
    goal: 1,
    current: 0,
    rewardXp: 60,
    completed: false,
    claimed: false
  },
  {
    id: 'daily_voice',
    type: 'daily',
    title: 'Голосове коло',
    desc: 'Завітай у будь-яку голосову кімнату',
    goal: 1,
    current: 0,
    rewardXp: 25,
    completed: false,
    claimed: false
  },

  // Weekly Quests
  {
    id: 'weekly_5battles',
    type: 'weekly',
    title: 'Боєць тижня',
    desc: 'Проведи 5 повноцінних боїв за цей тиждень',
    goal: 5,
    current: 0,
    rewardXp: 120,
    completed: false,
    claimed: false
  },
  {
    id: 'weekly_300xp',
    type: 'weekly',
    title: 'XP Прорив',
    desc: 'Зароби 300 XP на тренуваннях та завданнях',
    goal: 300,
    current: 0,
    rewardXp: 150,
    completed: false,
    claimed: false
  },
  {
    id: 'weekly_streak',
    type: 'weekly',
    title: 'Серія заліза',
    desc: 'Тренуйся 3 дні поспіль',
    goal: 3,
    current: 1,
    rewardXp: 100,
    rewardTitleId: 'iron_will',
    completed: false,
    claimed: false
  }
];

const INITIAL_PROGRESS: UserProgress = {
  userId: 'usr_novice_1',
  xp: 0,
  level: 1,
  activeTitleId: 'novice',
  unlockedTitleIds: ['novice'],
  stats: {
    totalWins: 0,
    totalLosses: 0,
    totalReps: 0,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    exerciseReps: {
      pushups: 0,
      squats: 0,
      pullups: 0,
      jumping_jacks: 0,
      burpees: 0,
      lunges: 0,
      dips: 0,
      plank: 0
    }
  }
};

class ForgeGameStore {
  private progress: UserProgress;
  private quests: Quest[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.progress = this.loadProgress();
    this.quests = this.loadQuests();
    this.checkDailyStreak();
  }

  private loadProgress(): UserProgress {
    try {
      const saved = storageManager.getSlice<UserProgress>('progress');
      if (saved) return saved;
    } catch {}
    return { ...INITIAL_PROGRESS };
  }

  private loadQuests(): Quest[] {
    try {
      const saved = storageManager.getSlice<Quest[]>('quests');
      if (saved) return saved;
    } catch {}
    return JSON.parse(JSON.stringify(INITIAL_QUESTS));
  }

  private save() {
    try {
      storageManager.setSlice('progress', this.progress);
      storageManager.setSlice('quests', this.quests);
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getProgress(): UserProgress {
    return this.progress;
  }

  public getQuests(): Quest[] {
    return this.quests;
  }

  public getLevel(): number {
    return this.progress.level;
  }

  // Calculate XP threshold for a level
  public getXpForNextLevel(lvl: number): number {
    return Math.floor(100 * Math.pow(lvl, 1.35));
  }

  public getLevelProgress(): { currentLevelXp: number; nextLevelXp: number; percent: number } {
    let accumulated = 0;
    for (let l = 1; l < this.progress.level; l++) {
      accumulated += this.getXpForNextLevel(l);
    }
    const currentLevelXp = Math.max(0, this.progress.xp - accumulated);
    const nextLevelXp = this.getXpForNextLevel(this.progress.level);
    const percent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));
    return { currentLevelXp, nextLevelXp, percent };
  }

  private checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.progress.stats.lastActiveDate;

    if (lastActive === today) {
      return;
    }

    const lastDate = new Date(lastActive);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      this.progress.stats.streakDays += 1;
      this.incrementQuest('weekly_streak', 1);
      if (this.progress.stats.streakDays >= 7) {
        this.unlockTitle('iron_will');
      }
    } else if (diffDays > 1) {
      this.progress.stats.streakDays = 1;
    }
    this.progress.stats.lastActiveDate = today;
    this.save();
  }

  public addXp(amount: number) {
    this.progress.xp += amount;
    this.incrementQuest('weekly_300xp', amount);

    // Calculate level up
    let totalXp = this.progress.xp;
    let lvl = 1;
    let needed = this.getXpForNextLevel(lvl);
    while (totalXp >= needed) {
      totalXp -= needed;
      lvl++;
      needed = this.getXpForNextLevel(lvl);
    }
    this.progress.level = lvl;
    this.save();
  }

  public unlockTitle(titleId: string) {
    if (!this.progress.unlockedTitleIds.includes(titleId)) {
      this.progress.unlockedTitleIds.push(titleId);
      this.save();
    }
  }

  public setActiveTitle(titleId: string) {
    if (this.progress.unlockedTitleIds.includes(titleId)) {
      this.progress.activeTitleId = titleId;
      this.save();
    }
  }

  public incrementQuest(questId: string, amount: number) {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || q.completed) return;

    q.current = Math.min(q.goal, q.current + amount);
    if (q.current >= q.goal) {
      q.completed = true;
    }
    this.save();
  }

  public claimQuestReward(questId: string): { xpReward: number; titleReward?: string } | null {
    const q = this.quests.find((item) => item.id === questId);
    if (!q || !q.completed || q.claimed) return null;

    q.claimed = true;
    this.addXp(q.rewardXp);
    if (q.rewardTitleId) {
      this.unlockTitle(q.rewardTitleId);
    }
    this.save();
    return { xpReward: q.rewardXp, titleReward: q.rewardTitleId };
  }

  public recordBattleResult(opts: {
    exerciseId: ExerciseId;
    isWin: boolean;
    reps: number;
    accuracy: number;
  }) {
    const { exerciseId, isWin, reps, accuracy } = opts;
    
    // Update stats
    if (isWin) {
      this.progress.stats.totalWins += 1;
      this.incrementQuest('daily_win', 1);
      this.unlockTitle('first_blood');
      if (this.progress.stats.totalWins >= 10) {
        this.unlockTitle('gladiator');
      }
    } else {
      this.progress.stats.totalLosses += 1;
    }

    this.progress.stats.totalReps += reps;
    this.progress.stats.exerciseReps[exerciseId] = (this.progress.stats.exerciseReps[exerciseId] || 0) + reps;

    // Check titles
    if (this.progress.stats.totalReps >= 100) {
      this.unlockTitle('titan');
    }
    if (accuracy >= 95 && reps >= 10) {
      this.unlockTitle('tech_master');
    }

    // Quests
    this.incrementQuest('starter_first_battle', 1);
    this.incrementQuest('daily_20reps', reps);
    this.incrementQuest('weekly_5battles', 1);

    // XP calculation: +2 XP per rep, +50 XP on win, +15 XP on loss
    const xpGained = reps * 2 + (isWin ? 50 : 15);
    this.addXp(xpGained);
    this.save();

    return xpGained;
  }

  // Get active title data
  public getActiveTitle(): { id: string; name: string; icon: string } {
    const found = TITLES_LIST.find((t) => t.id === this.progress.activeTitleId);
    return found || { id: 'novice', name: 'Новачок', icon: '🌱' };
  }

  // Get community leaderboard with current user dynamic position
  public getLeaderboard(metric: 'xp' | 'wins' | 'reps', currentUserNick: string, currentUserAvatar: string): LeaderboardEntry[] {
    const mockAthletes = [
      { id: 'ath_1', nick: 'Олександр Скеля', avatar: '🦁', activeTitle: 'Титан повторів', xp: 2450, wins: 42, reps: 620 },
      { id: 'ath_2', nick: 'Дарина Фордж', avatar: '⚡', activeTitle: 'Майстер техніки', xp: 1980, wins: 35, reps: 490 },
      { id: 'ath_3', nick: 'Макс Вовк', avatar: '🐺', activeTitle: 'Гладіатор', xp: 1720, wins: 29, reps: 410 },
      { id: 'ath_4', nick: 'Тарас Залізний', avatar: '🤖', activeTitle: 'Залізна воля', xp: 1540, wins: 26, reps: 380 },
      { id: 'ath_5', nick: 'Ярослав Берсерк', avatar: '🛡️', activeTitle: 'Перша кров', xp: 1210, wins: 18, reps: 290 },
      { id: 'ath_6', nick: 'Олена Рух', avatar: '🔥', activeTitle: 'Майстер техніки', xp: 980, wins: 14, reps: 240 },
      { id: 'ath_7', nick: 'Богдан Швидкий', avatar: '🦅', activeTitle: 'Новачок', xp: 750, wins: 10, reps: 180 },
      { id: 'ath_8', nick: 'Сергій Сталь', avatar: '🦾', activeTitle: 'Новачок', xp: 520, wins: 7, reps: 130 }
    ];

    const currentEntry: LeaderboardEntry = {
      rank: 0,
      userId: this.progress.userId,
      nick: currentUserNick,
      avatar: currentUserAvatar,
      activeTitle: this.getActiveTitle().name,
      xp: this.progress.xp,
      wins: this.progress.stats.totalWins,
      reps: this.progress.stats.totalReps,
      isCurrentUser: true
    };

    const combined = [...mockAthletes.map(a => ({ ...a, userId: a.id, isCurrentUser: false })), currentEntry];

    // Sort by selected metric descending
    combined.sort((a, b) => {
      if (metric === 'xp') return b.xp - a.xp;
      if (metric === 'wins') return b.wins - a.wins;
      return b.reps - a.reps;
    });

    return combined.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }
}

export const forgeGameStore = new ForgeGameStore();
