/**
 * ForgeMuscle Unified Versioned Storage Manager
 * Centralizes localStorage persistence with automated migration from legacy keys
 * and scoped cleanup (preventing wiping unrelated browser state).
 */

export const FORGEMUSCLE_STORAGE_VERSION = 2;
export const UNIFIED_STORAGE_KEY = 'forgemuscle_app_state_v2';

export interface ForgeMuscleStoredState {
  version: number;
  lastUpdated: number;
  progress?: Record<string, unknown>;
  quests?: unknown[];
  academy?: {
    quizDone: boolean;
    quizResult?: unknown;
    readCardIds: string[];
  };
  chat?: {
    messages?: unknown[];
    blockedUsers?: string[];
  };
  onboarding?: {
    completed: boolean;
    completedAt?: number;
    step?: number;
  };
  mediaSettings?: {
    micEnabled: boolean;
    selectedMicId: string;
    pushToTalk: boolean;
    cameraEnabled: boolean;
    selectedCameraId: string;
    facingMode: 'user' | 'environment';
    showSkeleton: boolean;
    mirrorVideo: boolean;
  };
}

class StorageManager {
  private state: ForgeMuscleStoredState;

  constructor() {
    this.state = this.initAndMigrate();
  }

  private initAndMigrate(): ForgeMuscleStoredState {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        version: FORGEMUSCLE_STORAGE_VERSION,
        lastUpdated: Date.now()
      };
    }

    try {
      // 1. Check if unified v2 state exists
      const savedV2 = localStorage.getItem(UNIFIED_STORAGE_KEY);
      if (savedV2) {
        const parsed = JSON.parse(savedV2) as ForgeMuscleStoredState;
        if (parsed.version === FORGEMUSCLE_STORAGE_VERSION) {
          return parsed;
        }
      }

      // 2. Perform Migration from legacy fragmented keys
      const migrated: ForgeMuscleStoredState = {
        version: FORGEMUSCLE_STORAGE_VERSION,
        lastUpdated: Date.now()
      };

      // Progress migration
      const legacyProgress = localStorage.getItem('forgemuscle_progress');
      if (legacyProgress) {
        try {
          migrated.progress = JSON.parse(legacyProgress);
        } catch {}
      }

      // Quests migration
      const legacyQuests = localStorage.getItem('forgemuscle_quests');
      if (legacyQuests) {
        try {
          migrated.quests = JSON.parse(legacyQuests);
        } catch {}
      }

      // Academy migration
      const legacyAcademy = localStorage.getItem('forgemuscle_academy');
      if (legacyAcademy) {
        try {
          migrated.academy = JSON.parse(legacyAcademy);
        } catch {}
      }

      // Chat & Blocked migration
      const legacyChat = localStorage.getItem('forgemuscle_chat_history');
      const legacyBlocked = localStorage.getItem('forgemuscle_blocked_users');
      if (legacyChat || legacyBlocked) {
        migrated.chat = {
          messages: legacyChat ? JSON.parse(legacyChat) : [],
          blockedUsers: legacyBlocked ? JSON.parse(legacyBlocked) : []
        };
      }

      // Save migrated unified state
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      return {
        version: FORGEMUSCLE_STORAGE_VERSION,
        lastUpdated: Date.now()
      };
    }
  }

  public getSlice<T>(key: keyof Omit<ForgeMuscleStoredState, 'version' | 'lastUpdated'>): T | undefined {
    return this.state[key] as T | undefined;
  }

  public setSlice<T>(key: keyof Omit<ForgeMuscleStoredState, 'version' | 'lastUpdated'>, value: T): void {
    if (!this.state) {
      this.state = { version: FORGEMUSCLE_STORAGE_VERSION, lastUpdated: Date.now() };
    }
    (this.state as unknown as Record<string, unknown>)[key] = value;
    this.state.lastUpdated = Date.now();
    this.persist();
  }

  private persist(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  /**
   * Cleans only ForgeMuscle-specific data on logout or account reset,
   * avoiding wiping other browser state or site settings.
   */
  public clearForgeUserData(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      // Clear unified state
      localStorage.removeItem(UNIFIED_STORAGE_KEY);
      
      // Clean legacy keys if any remained
      const keysToRemove = [
        'forgemuscle_progress',
        'forgemuscle_quests',
        'forgemuscle_academy',
        'forgemuscle_chat_history',
        'forgemuscle_blocked_users',
        'forgemuscle_onboarding_completed'
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Reset state in memory
      this.state = {
        version: FORGEMUSCLE_STORAGE_VERSION,
        lastUpdated: Date.now()
      };
    } catch {}
  }

  /**
   * Full data export in compliant JSON format
   */
  public exportAllUserData(): string {
    const exportBundle = {
      app: 'ForgeMuscle',
      exportDate: new Date().toISOString(),
      schemaVersion: FORGEMUSCLE_STORAGE_VERSION,
      data: this.state
    };
    return JSON.stringify(exportBundle, null, 2);
  }
}

export const storageManager = new StorageManager();
