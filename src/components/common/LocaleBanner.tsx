import React, { useState, useEffect } from 'react';
import { Globe, X } from 'lucide-react';
import { authStore } from '../../services/authStore';
import { SUPPORTED_LOCALES, SupportedLocale } from '../../config/locales';

const DISMISSED_KEY = 'forgemuscle_locale_banner_dismissed';

export const LocaleBanner: React.FC = () => {
  const [show, setShow] = useState<boolean>(false);
  const [currentLang, setCurrentLang] = useState<SupportedLocale>('uk');

  useEffect(() => {
    const isDismissed = localStorage.getItem(DISMISSED_KEY);
    if (!isDismissed) {
      setShow(true);
    }
    const user = authStore.getUser();
    setCurrentLang((user.settings.language as SupportedLocale) || 'uk');
  }, []);

  if (!show) return null;

  const currentConfig = SUPPORTED_LOCALES[currentLang] || SUPPORTED_LOCALES.uk;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setShow(false);
  };

  const handleSwitchLanguage = (lang: SupportedLocale) => {
    authStore.updateSettings({ language: lang });
    setCurrentLang(lang);
    handleDismiss();
  };

  return (
    <div className="bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-4 py-2 text-xs flex items-center justify-between text-[var(--text-primary)] shadow-sm animate-in fade-in">
      <div className="flex items-center gap-2">
        <Globe size={15} className="text-[var(--accent)] shrink-0" />
        <span>
          Мову інтерфейсу автоматично визначено:{' '}
          <strong className="text-[var(--accent)]">{currentConfig.name} {currentConfig.flag}</strong>.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex gap-1.5">
          {(['uk', 'en', 'pl'] as SupportedLocale[]).map((l) => (
            <button
              key={l}
              onClick={() => handleSwitchLanguage(l)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                currentLang === l
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-[var(--bg-subtle)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          aria-label="Закрити"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
