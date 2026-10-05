import { User, UserSettings } from '../types';
import { detectBrowserLocale } from '../config/locales';

export function getLocalizedGuestNick(locale: string): string {
  return locale === 'en' ? 'Athlete' : locale === 'pl' ? 'Atleta' : locale === 'de' ? 'Athlet' : locale === 'fr' ? 'Athlète' : locale === 'es' ? 'Atleta' : 'Атлет';
}

const DEFAULT_SETTINGS: UserSettings = {
  language: detectBrowserLocale(),
  theme: 'dark',
  soundEnabled: true,
  hapticEnabled: true,
  notificationsEnabled: true,
  privacy: 'public'
};

const DEFAULT_GUEST: User = {
  id: 'usr_guest',
  nick: getLocalizedGuestNick(DEFAULT_SETTINGS.language),
  avatar: '⚡',
  createdAt: Date.now(),
  settings: DEFAULT_SETTINGS
};

class AuthStore {
  private user: User = { ...DEFAULT_GUEST };
  private isAuthenticated: boolean = false;
  private isCheckingSession: boolean = true;
  private listeners: Set<() => void> = new Set();
  public autoLocaleDismissed: boolean = false;

  constructor() {
    this.checkSession();
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

  public getUser(): User {
    return this.user;
  }

  public getIsAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  public getIsCheckingSession(): boolean {
    return this.isCheckingSession;
  }

  public async checkSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const s = data.user.settings || {};
          this.user = {
            id: data.user.id,
            nick: data.user.nick,
            email: data.user.email,
            isGuest: Boolean(data.user.isGuest),
            avatar: data.user.avatar || '⚡',
            createdAt: data.user.createdAt || data.user.created_at || Date.now(),
            onboardingCompleted: Boolean(data.user.onboardingCompleted),
            settings: {
              language: s.language || data.user.locale || detectBrowserLocale(),
              theme: s.theme || data.user.theme || 'dark',
              soundEnabled: s.soundEnabled !== undefined ? Boolean(s.soundEnabled) : true,
              hapticEnabled: s.hapticEnabled !== undefined ? Boolean(s.hapticEnabled) : true,
              notificationsEnabled: true,
              privacy: s.privacy || 'public',
              micEnabled: s.micEnabled !== undefined ? Boolean(s.micEnabled) : true,
              selectedMicId: s.selectedMicId || '',
              cameraEnabled: s.cameraEnabled !== undefined ? Boolean(s.cameraEnabled) : true,
              selectedCameraId: s.selectedCameraId || '',
              facingMode: s.facingMode || 'user',
              showSkeleton: s.showSkeleton !== undefined ? Boolean(s.showSkeleton) : true,
              mirrorVideo: s.mirrorVideo !== undefined ? Boolean(s.mirrorVideo) : true,
              pushToTalk: Boolean(s.pushToTalk)
            }
          };
          this.isAuthenticated = true;
          this.isCheckingSession = false;
          this.applyTheme(this.user.settings.theme);
          this.notify();
          return true;
        }
      }
    } catch {}

    this.isAuthenticated = false;
    this.isCheckingSession = false;
    this.user = { ...DEFAULT_GUEST };
    this.applyTheme(this.user.settings.theme);
    this.notify();
    return false;
  }

  public async loginWithEmail(identifier: string, pass: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Помилка авторизації' };
      }
      await this.checkSession();
      try { const { socketClient } = await import('./socketClient'); socketClient.disconnect(); socketClient.connect(); } catch {}
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Помилка з’єднання з сервером' };
    }
  }

  public async registerWithEmail(opts: {
    email: string;
    password: string;
    nick: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...opts,
          locale: this.user.settings.language,
          unitSystem: 'metric'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Помилка реєстрації' };
      }
      await this.checkSession();
      try { const { socketClient } = await import('./socketClient'); socketClient.disconnect(); socketClient.connect(); } catch {}
      return { success: true };
    } catch {
      return { success: false, error: 'Помилка з’єднання з сервером' };
    }
  }

  public async loginAsGuest(): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: this.user.settings.language }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Не вдалося створити гостьовий акаунт' };
      await this.checkSession();
      try { const { socketClient } = await import('./socketClient'); socketClient.disconnect(); socketClient.connect(); } catch {}
      return { success: true };
    } catch { return { success: false, error: 'Помилка з’єднання з сервером' }; }
  }

  public async logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    this.isAuthenticated = false;
    this.user = { ...DEFAULT_GUEST };
    try { const { socketClient } = await import('./socketClient'); socketClient.disconnect(); } catch {}
    this.notify();
  }

  public async updateProfile(nick: string, avatar: string) {
    this.user.nick = nick.trim();
    this.user.avatar = avatar;
    if (this.isAuthenticated) {
      try {
        await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nick: this.user.nick, avatar: this.user.avatar })
        });
      } catch {}
    }
    this.notify();
  }

  public async updateSettings(partial: Partial<UserSettings>) {
    const previousLanguage = this.user.settings.language;
    this.user.settings = { ...this.user.settings, ...partial };
    if (partial.language && partial.language !== previousLanguage && (!this.isAuthenticated || this.user.id === 'usr_guest')) {
      this.user.nick = getLocalizedGuestNick(partial.language);
    }
    if (partial.theme) {
      this.applyTheme(partial.theme);
    }
    if (this.isAuthenticated) {
      try {
        await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: this.user.settings.theme,
            locale: this.user.settings.language,
            soundEnabled: this.user.settings.soundEnabled,
            hapticEnabled: this.user.settings.hapticEnabled,
            privacy: this.user.settings.privacy,
            micEnabled: this.user.settings.micEnabled,
            cameraEnabled: this.user.settings.cameraEnabled,
            pushToTalk: this.user.settings.pushToTalk,
            showSkeleton: this.user.settings.showSkeleton,
            mirrorVideo: this.user.settings.mirrorVideo
          })
        });
      } catch {}
    }
    this.notify();
  }

  public async completeOnboarding() {
    this.user.onboardingCompleted = true;
    if (this.isAuthenticated) {
      try {
        await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboardingCompleted: true })
        });
      } catch {}
    }
    this.notify();
  }

  public applyTheme(theme: 'dark' | 'light' | 'system') {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark', 'light');

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }

  public async deleteAccount(): Promise<boolean> {
    if (this.isAuthenticated) {
      try {
        await fetch('/api/auth/account', { method: 'DELETE' });
      } catch {}
    }
    this.isAuthenticated = false;
    this.user = { ...DEFAULT_GUEST };
    this.notify();
    return true;
  }
}

export const authStore = new AuthStore();
