import { ForgeUser, UserSessionInfo, OnboardingData, CloudProgressSyncPayload } from '../types';
import { sound } from './soundEngine';
import { arnoVoice } from './arnoVoice';

type AuthListener = () => void;

class AuthStore {
  private currentUser: ForgeUser | null = null;
  private token: string | null = null;
  private isLoading = true;
  private syncStatus: 'synced' | 'syncing' | 'offline' | 'error' = 'synced';
  private lastSyncedTime: string | null = null;
  private activeSessions: UserSessionInfo[] = [];
  private listeners: Set<AuthListener> = new Set();
  private syncTimer: any = null;

  constructor() {
    this.initFromStorage();
  }

  public subscribe(listener: AuthListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private async initFromStorage() {
    try {
      const savedToken = localStorage.getItem('forgemuscle_auth_token');
      const cachedUser = localStorage.getItem('forgemuscle_user_cache');

      if (cachedUser) {
        this.currentUser = JSON.parse(cachedUser);
      }
      if (savedToken) {
        this.token = savedToken;
        // Verify with server
        await this.fetchMe();
      } else {
        this.isLoading = false;
        this.notify();
      }
    } catch {
      this.isLoading = false;
      this.syncStatus = 'offline';
      this.notify();
    }
  }

  public getCurrentUser(): ForgeUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser && !!this.token;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getSyncStatus(): 'synced' | 'syncing' | 'offline' | 'error' {
    return this.syncStatus;
  }

  public getLastSyncedTime(): string | null {
    return this.lastSyncedTime;
  }

  public getActiveSessions(): UserSessionInfo[] {
    return this.activeSessions;
  }

  public getToken(): string | null {
    return this.token;
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Quick switch or demo login for multi-user chat testing
  public async loginAsDemo(username: string = '@Kuznets'): Promise<ForgeUser> {
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!res.ok) {
        throw new Error('Failed to log in demo user');
      }

      const data = await res.json();
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('forgemuscle_auth_token', data.token);
      localStorage.setItem('forgemuscle_user_cache', JSON.stringify(data.user));
      this.syncStatus = 'synced';
      this.lastSyncedTime = new Date().toLocaleTimeString();
      this.isLoading = false;
      this.notify();
      sound.playLevelUp();
      return data.user;
    } catch (err) {
      this.isLoading = false;
      this.notify();
      throw err;
    }
  }

  public async fetchMe(): Promise<ForgeUser | null> {
    if (!this.token) {
      this.isLoading = false;
      this.notify();
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
        this.syncStatus = 'synced';
        this.lastSyncedTime = new Date().toLocaleTimeString();
        localStorage.setItem('forgemuscle_user_cache', JSON.stringify(data.user));
      } else if (res.status === 401) {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('forgemuscle_auth_token');
        localStorage.removeItem('forgemuscle_user_cache');
      }
    } catch (err) {
      this.syncStatus = 'offline';
    } finally {
      this.isLoading = false;
      this.notify();
    }
    return this.currentUser;
  }

  // Google OAuth / Continue with Google (#62, #81, #87)
  public async signInWithGoogle(customDetails?: { email?: string; name?: string; picture?: string }): Promise<{ isNewUser: boolean; user: ForgeUser }> {
    this.isLoading = true;
    this.notify();

    try {
      // Default to realistic athlete profile or provided details
      const payload = {
        email: customDetails?.email || 'vrbkirill09@gmail.com',
        name: customDetails?.name || 'Kirill Vrb',
        picture: customDetails?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces',
        googleId: `google_${Date.now()}`
      };

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "We couldn't sign you in. Please try again.");
      }

      const data = await res.json();
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('forgemuscle_auth_token', data.token);
      localStorage.setItem('forgemuscle_user_cache', JSON.stringify(data.user));
      this.syncStatus = 'synced';
      this.lastSyncedTime = new Date().toLocaleTimeString();
      this.isLoading = false;
      this.notify();

      sound.playLevelUp();
      return { isNewUser: data.isNewUser, user: data.user };
    } catch (err: any) {
      this.isLoading = false;
      this.notify();
      throw err;
    }
  }

  // Local Login
  public async login(identifier: string, password: string): Promise<{ isNewUser: boolean; user: ForgeUser }> {
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Невірний логін або пароль.");
      }

      const data = await res.json();
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('forgemuscle_auth_token', data.token);
      localStorage.setItem('forgemuscle_user_cache', JSON.stringify(data.user));
      this.syncStatus = 'synced';
      this.lastSyncedTime = new Date().toLocaleTimeString();
      this.isLoading = false;
      this.notify();

      sound.playLevelUp();
      return { isNewUser: data.isNewUser, user: data.user };
    } catch (err: any) {
      this.isLoading = false;
      this.notify();
      throw err;
    }
  }

  // Local Register
  public async register(email: string, username: string, password: string, displayName?: string): Promise<{ isNewUser: boolean; user: ForgeUser }> {
    this.isLoading = true;
    this.notify();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, displayName })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Помилка при створенні акаунта.");
      }

      const data = await res.json();
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('forgemuscle_auth_token', data.token);
      localStorage.setItem('forgemuscle_user_cache', JSON.stringify(data.user));
      this.syncStatus = 'synced';
      this.lastSyncedTime = new Date().toLocaleTimeString();
      this.isLoading = false;
      this.notify();

      sound.playLevelUp();
      return { isNewUser: true, user: data.user };
    } catch (err: any) {
      this.isLoading = false;
      this.notify();
      throw err;
    }
  }

  // Complete Onboarding (#64) -> CREATE MY FORGE
  public async completeOnboarding(data: OnboardingData): Promise<ForgeUser> {
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Не вдалося зберегти дані онбордингу.");
      }

      const resData = await res.json();
      this.currentUser = resData.user;
      localStorage.setItem('forgemuscle_user_cache', JSON.stringify(resData.user));
      this.notify();

      sound.playAnvilHit();
      arnoVoice.speak(`Вітаю у персональній кузні ForgeMuscle, ${this.currentUser?.username}! Твій шлях розпочато.`, { force: true });
      return resData.user;
    } catch (err: any) {
      throw err;
    }
  }

  // Update Profile & Settings (#70)
  public async updateProfile(updates: Partial<ForgeUser>): Promise<ForgeUser> {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Не вдалося оновити налаштування.");
      }

      const resData = await res.json();
      this.currentUser = resData.user;
      localStorage.setItem('forgemuscle_user_cache', JSON.stringify(resData.user));
      this.notify();
      return resData.user;
    } catch (err: any) {
      throw err;
    }
  }

  // Active Sessions (#73)
  public async fetchActiveSessions(): Promise<UserSessionInfo[]> {
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        this.activeSessions = data.sessions || [];
        this.notify();
        return this.activeSessions;
      }
    } catch {
      // offline
    }
    return [];
  }

  // Revoke session
  public async revokeSession(sessionId: string): Promise<void> {
    try {
      await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sessionId })
      });
      await this.fetchActiveSessions();
    } catch {
      // ignore
    }
  }

  // Logout current session
  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {
      // ignore
    }
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('forgemuscle_auth_token');
    localStorage.removeItem('forgemuscle_user_cache');
    sound.playClick();
    this.notify();
  }

  // Logout all devices (#73)
  public async logoutAllDevices(): Promise<void> {
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {
      // ignore
    }
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('forgemuscle_auth_token');
    localStorage.removeItem('forgemuscle_user_cache');
    sound.playClick();
    this.notify();
  }

  // Delete Account (#72)
  public async deleteAccount(confirmUsername: string): Promise<void> {
    const res = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ confirmUsername })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Не вдалося видалити акаунт.");
    }

    this.token = null;
    this.currentUser = null;
    localStorage.clear(); // Clean all local storage
    sound.playClick();
    this.notify();
  }

  // Cloud Progress Sync (#68)
  public async syncProgress(payload: Partial<CloudProgressSyncPayload>): Promise<void> {
    if (!this.token) return;

    this.syncStatus = 'syncing';
    this.notify();

    try {
      const res = await fetch('/api/user/progress/sync', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        this.syncStatus = 'synced';
        this.lastSyncedTime = new Date().toLocaleTimeString();
        if (data.user) {
          this.currentUser = data.user;
          localStorage.setItem('forgemuscle_user_cache', JSON.stringify(data.user));
        }
      } else {
        this.syncStatus = 'error';
      }
    } catch {
      this.syncStatus = 'offline';
    } finally {
      this.notify();
    }
  }

  // Schedule background debounced sync
  public triggerDebouncedSync(payloadSupplier: () => Partial<CloudProgressSyncPayload>) {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncProgress(payloadSupplier());
    }, 1500);
  }
}

export const authStore = new AuthStore();
