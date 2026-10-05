/**
 * ForgeMuscle Onboarding State Store
 * Controls interactive tour steps, spotlight positioning, permission requests,
 * and persistent server-backed onboarding completion flags.
 */

import { storageManager } from './storageManager';
import { authStore } from './authStore';
import { NavTabId } from '../components/navigation/NavBar';

export interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  targetTab?: NavTabId;
  targetSelector?: string;
  hasShownWarmup: boolean;
}

export interface OnboardingStepConfig {
  step: number;
  tab: NavTabId;
  selectorDesktop: string;
  selectorMobile: string;
  titleKey: string;
  descKey: string;
  isPermissionStep?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    step: 1,
    tab: 'home',
    selectorDesktop: '#nav-main-links',
    selectorMobile: '#mobile-nav-home',
    titleKey: 'welcomeTitle',
    descKey: 'welcomeDesc'
  },
  {
    step: 2,
    tab: 'home',
    selectorDesktop: '#home-hero-card',
    selectorMobile: '#home-hero-card',
    titleKey: 'homeTitle',
    descKey: 'homeDesc'
  },
  {
    step: 3,
    tab: 'battle',
    selectorDesktop: '#nav-tab-battle',
    selectorMobile: '#mobile-nav-battle',
    titleKey: 'battleTitle',
    descKey: 'battleDesc'
  },
  {
    step: 4,
    tab: 'chat',
    selectorDesktop: '#nav-tab-chat',
    selectorMobile: '#mobile-nav-chat',
    titleKey: 'chatTitle',
    descKey: 'chatDesc'
  },
  {
    step: 5,
    tab: 'leaderboard',
    selectorDesktop: '#nav-tab-leaderboard',
    selectorMobile: '#mobile-nav-leaderboard',
    titleKey: 'leaderboardTitle',
    descKey: 'leaderboardDesc'
  },
  {
    step: 6,
    tab: 'profile',
    selectorDesktop: '#nav-tab-profile',
    selectorMobile: '#mobile-nav-profile',
    titleKey: 'profileTitle',
    descKey: 'profileDesc'
  },
  {
    step: 7,
    tab: 'profile',
    selectorDesktop: '#nav-settings-btn',
    selectorMobile: '#mobile-header-settings',
    titleKey: 'settingsTitle',
    descKey: 'settingsDesc'
  },
  {
    step: 8,
    tab: 'battle',
    selectorDesktop: '#battle-calibration-btn',
    selectorMobile: '#battle-calibration-btn',
    titleKey: 'permissionsTitle',
    descKey: 'permissionsDesc',
    isPermissionStep: true
  }
];

class OnboardingStore {
  private isActive: boolean = false;
  private currentStepIndex: number = 0; // 0 to 7 (8 steps)
  private hasShownWarmup: boolean = false;
  private listeners: Set<() => void> = new Set();
  private onTabChangeCallback?: (tab: NavTabId) => void;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const slice = storageManager.getSlice<{ completed: boolean; hasShownWarmup?: boolean }>('onboarding');
      if (slice) {
        this.hasShownWarmup = Boolean(slice.hasShownWarmup);
      }
    } catch {}
  }

  public registerTabChanger(cb: (tab: NavTabId) => void) {
    this.onTabChangeCallback = cb;
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

  public getState(): OnboardingState {
    const currentConfig = ONBOARDING_STEPS[this.currentStepIndex] || ONBOARDING_STEPS[0];
    return {
      isActive: this.isActive,
      currentStep: this.currentStepIndex + 1,
      totalSteps: ONBOARDING_STEPS.length,
      targetTab: currentConfig.tab,
      targetSelector: typeof window !== 'undefined' && window.innerWidth >= 768
        ? currentConfig.selectorDesktop
        : currentConfig.selectorMobile,
      hasShownWarmup: this.hasShownWarmup
    };
  }

  public startTour() {
    this.isActive = true;
    this.currentStepIndex = 0;
    const firstStep = ONBOARDING_STEPS[0];
    if (this.onTabChangeCallback && firstStep) {
      this.onTabChangeCallback(firstStep.tab);
    }
    this.notify();
  }

  public nextStep() {
    if (this.currentStepIndex < ONBOARDING_STEPS.length - 1) {
      this.currentStepIndex += 1;
      const nextConfig = ONBOARDING_STEPS[this.currentStepIndex];
      if (this.onTabChangeCallback && nextConfig) {
        this.onTabChangeCallback(nextConfig.tab);
      }
      this.notify();
    } else {
      this.completeTour();
    }
  }

  public prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex -= 1;
      const prevConfig = ONBOARDING_STEPS[this.currentStepIndex];
      if (this.onTabChangeCallback && prevConfig) {
        this.onTabChangeCallback(prevConfig.tab);
      }
      this.notify();
    }
  }

  public skipTour() {
    this.completeTour();
  }

  public async completeTour() {
    this.isActive = false;
    this.notify();

    // Persist locally
    storageManager.setSlice('onboarding', {
      completed: true,
      completedAt: Date.now(),
      hasShownWarmup: this.hasShownWarmup
    });

    // Persist to server
    if (authStore.getIsAuthenticated()) {
      try {
        await fetch('/api/onboarding/complete', { method: 'POST' });
        const user = authStore.getUser();
        user.onboardingCompleted = true;
      } catch {}
    }
  }

  public async restartTour() {
    if (authStore.getIsAuthenticated()) {
      try {
        await fetch('/api/onboarding/reset', { method: 'POST' });
      } catch {}
    }
    this.startTour();
  }

  public shouldShowWarmup(): boolean {
    return !this.hasShownWarmup;
  }

  public markWarmupShown() {
    this.hasShownWarmup = true;
    const slice = storageManager.getSlice<Record<string, unknown>>('onboarding') || {};
    storageManager.setSlice('onboarding', {
      ...slice,
      hasShownWarmup: true
    });
    this.notify();
  }
}

export const onboardingStore = new OnboardingStore();
