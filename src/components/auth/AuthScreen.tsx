import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Swords, 
  Camera, 
  Trophy, 
  AlertCircle, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authStore } from '../../services/authStore';
import { useI18n } from '../../services/i18n';
import { Button } from '../../ui/Button';

export interface AuthScreenProps {
  onAuthenticated?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nick, setNick] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('reset_token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = await authStore.loginWithEmail(email, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || t.auth.invalidCredentials);
      } else if (onAuthenticated) {
        onAuthenticated();
      }
    } else if (mode === 'register') {
      if (password.length < 8) {
        setIsLoading(false);
        setError(t.auth.shortPassword);
        return;
      }
      if (nick.trim().length < 2) {
        setIsLoading(false);
        setError(t.auth.duplicateNick);
        return;
      }

      const res = await authStore.registerWithEmail({
        email,
        password,
        nick: nick.trim()
      });
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || t.auth.invalidCredentials);
      } else if (onAuthenticated) {
        onAuthenticated();
      }
    } else if (mode === 'forgot') {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        const data = await res.json().catch(() => ({}));
        setIsLoading(false);
        if (!res.ok) {
          setError(data.error || t.common.error);
          return;
        }
        setSuccessMsg(data.message || t.auth.resetSuccessMsg);
      } catch {
        setIsLoading(false);
        setError(t.common.error);
      }
    } else if (mode === 'reset') {
      if (password.length < 8) {
        setIsLoading(false);
        setError(t.auth.shortPassword);
        return;
      }

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password })
        });
        const data = await res.json().catch(() => ({}));
        setIsLoading(false);
        if (!res.ok) {
          setError(data.error || t.common.error);
          return;
        }
        setPassword('');
        setSuccessMsg(data.message || 'Пароль успішно змінено. Тепер увійдіть.');
        window.history.replaceState({}, document.title, window.location.pathname);
        setMode('login');
      } catch {
        setIsLoading(false);
        setError(t.common.error);
      }
    }
  };

  const handleGuest = async () => {
    setError(null); setSuccessMsg(null); setIsLoading(true);
    const res = await authStore.loginAsGuest(); setIsLoading(false);
    if (!res.success) setError(res.error || t.common.error); else onAuthenticated?.();
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-[var(--accent)] selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--accent-glow)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 flex flex-col gap-6 my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#0B0D11] border-2 border-[var(--border-subtle)] overflow-hidden flex items-center justify-center p-1.5 shadow-2xl mb-4 group transition-transform hover:scale-105">
            <img
              src="/logo.png"
              alt="ForgeMuscle Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
            FORGE<span className="text-[var(--accent)]">MUSCLE</span>
          </h1>

          <p className="mt-2 text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {t.auth.subtitle}
          </p>

          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs">
            {t.home.heroSubtitle}
          </p>
        </div>

        {/* Feature badges row */}
        <div className="grid grid-cols-3 gap-2 px-1">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
            <Camera size={16} className="text-[var(--accent)] mb-1" />
            <span className="text-[10px] font-bold text-[var(--text-primary)]">ШІ-Камера</span>
            <span className="text-[9px] text-[var(--text-secondary)]">&gt;85% ROM</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
            <Swords size={16} className="text-[var(--accent)] mb-1" />
            <span className="text-[10px] font-bold text-[var(--text-primary)]">Forge Battle</span>
            <span className="text-[9px] text-[var(--text-secondary)]">60s PvP</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
            <Trophy size={16} className="text-[var(--crown-gold)] mb-1" />
            <span className="text-[10px] font-bold text-[var(--text-primary)]">Прокачка</span>
            <span className="text-[9px] text-[var(--text-secondary)]">Титули й XP</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-7 shadow-2xl backdrop-blur-sm">
          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && mode !== 'reset' && (
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetToken('');
                  setError(null);
                  setSuccessMsg(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[var(--bg-card)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.auth.loginTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[var(--bg-card)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.auth.registerTab}
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                {mode === 'reset' ? 'Новий пароль' : t.auth.forgotTab}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetToken('');
                  setError(null);
                  setSuccessMsg(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="text-xs text-[var(--accent)] font-bold hover:underline cursor-pointer"
              >
                {t.auth.backToLogin}
              </button>
            </div>
          )}

          {mode !== 'forgot' && mode !== 'reset' && (
            <div className="space-y-3 mb-5">
              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Sparkles size={16} className="text-[var(--accent)]" />
                  <div className="text-xs font-extrabold text-[var(--text-primary)]">
                    {t.auth.guestBtn}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] mb-3">
                  Без реєстрації. Для гостя створюється окремий тимчасовий акаунт із власною сесією.
                </p>
                <Button type="button" variant="outline" fullWidth onClick={handleGuest} disabled={isLoading}>
                  <Sparkles size={16} className="mr-2" />
                  {isLoading ? 'Підключаємо…' : t.auth.guestBtn}
                </Button>
              </div>
              <div className="flex items-center gap-3 my-3 text-[var(--text-secondary)] text-[11px]">
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                <span className="uppercase tracking-wider font-semibold">{t.auth.orDivider}</span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>
            </div>
          )}

          {/* Error notification */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 mb-4 animate-shake">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Success notification */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 mb-4">
              <Check size={16} className="shrink-0 text-emerald-400" />
              <span className="leading-relaxed font-medium">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-semibold block mb-1.5">
                  {t.auth.nickLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'Forge_Athlete' : lang === 'pl' ? 'Atleta_Kuźni' : lang === 'de' ? 'Schmiede_Athlet' : lang === 'fr' ? 'Athlète_Forge' : lang === 'es' ? 'Atleta_Forja' : 'Атлет_Кузні'}
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
                  />
                  <UserIcon size={16} className="absolute left-3.5 top-3 text-[var(--text-secondary)]" />
                </div>
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-semibold block mb-1.5">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="athlete@forgemuscle.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
                  />
                  <Mail size={16} className="absolute left-3.5 top-3 text-[var(--text-secondary)]" />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-[var(--text-secondary)] font-semibold">
                    {t.auth.passwordLabel}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                    >
                      {t.auth.forgotLink}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
                  />
                  <Lock size={16} className="absolute left-3.5 top-3 text-[var(--text-secondary)]" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              className="mt-2 font-bold shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>...</span>
                </div>
              ) : mode === 'login' ? (
                <>
                  <span>{t.auth.loginBtn}</span>
                  <ArrowRight size={18} />
                </>
              ) : mode === 'register' ? (
                <>
                  <Sparkles size={18} />
                  <span>{t.auth.registerBtn}</span>
                </>
              ) : mode === 'forgot' ? (
                <>
                  <Mail size={18} />
                  <span>{t.auth.forgotBtn}</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Зберегти новий пароль</span>
                </>
              )}
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-center gap-2 text-[11px] text-[var(--text-secondary)] text-center">
            <ShieldCheck size={14} className="text-[var(--accent)] shrink-0" />
            <span>{t.auth.termsNotice}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-[var(--text-secondary)]">
          ForgeMuscle &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

