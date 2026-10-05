import { LearningProgress } from '../types';
import { forgeGameStore } from './forgeGameStore';
import { storageManager } from './storageManager';

const INITIAL_PROGRESS: LearningProgress = {
  quizDone: false,
  readCardIds: []
};

class AcademyStore {
  private progress: LearningProgress;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.progress = this.load();
  }

  private load(): LearningProgress {
    try {
      const saved = storageManager.getSlice<LearningProgress>('academy');
      if (saved) return saved;
    } catch {}
    return { ...INITIAL_PROGRESS };
  }

  private save() {
    try {
      storageManager.setSlice('academy', this.progress);
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

  public getProgress(): LearningProgress {
    return this.progress;
  }

  public submitQuiz(result: {
    goal: 'mass' | 'weight_loss' | 'strength' | 'health';
    experience: 'beginner' | 'some' | 'intermediate';
    daysPerWeek: number;
  }) {
    this.progress.quizDone = true;
    this.progress.quizResult = result;
    this.save();

    // Reward XP & starter quest completion
    forgeGameStore.incrementQuest('starter_quiz', 1);
    forgeGameStore.addXp(40);
    forgeGameStore.unlockTitle('novice');
  }

  public markCardAsRead(cardId: string, xpReward: number) {
    if (!this.progress.readCardIds.includes(cardId)) {
      this.progress.readCardIds.push(cardId);
      this.save();

      forgeGameStore.incrementQuest('starter_read_basics', 1);
      forgeGameStore.addXp(xpReward);
    }
  }

  public isCardRead(cardId: string): boolean {
    return this.progress.readCardIds.includes(cardId);
  }
}

export const academyStore = new AcademyStore();
