import { ThemePreference } from '../types';

class ThemeService {
  private currentTheme: ThemePreference = 'dark';
  private mediaQuery: MediaQueryList | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('forgemuscle_theme') as ThemePreference;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
      this.currentTheme = saved;
    } else {
      this.currentTheme = 'dark';
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });

    this.applyTheme();
  }

  public getTheme(): ThemePreference {
    return this.currentTheme;
  }

  public getResolvedTheme(): 'dark' | 'light' {
    if (this.currentTheme === 'system') {
      return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  public setTheme(theme: ThemePreference) {
    this.currentTheme = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('forgemuscle_theme', theme);
    }
    this.applyTheme();
    this.notify();
  }

  private applyTheme() {
    if (typeof document === 'undefined') return;

    const resolved = this.getResolvedTheme();
    const root = document.documentElement;

    if (resolved === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#0c0a09';
      document.body.style.color = '#f5f5f4';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#f4f4f5';
      document.body.style.color = '#18181b';
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const themeService = new ThemeService();
