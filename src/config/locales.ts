export type SupportedLocale = 'uk' | 'en' | 'pl' | 'de' | 'fr' | 'es';

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  flag: string;
  defaultUnitSystem: 'metric' | 'imperial';
  dateFormat: string;
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleConfig> = {
  uk: {
    code: 'uk',
    name: 'Українська',
    flag: '🇺🇦',
    defaultUnitSystem: 'metric',
    dateFormat: 'dd.MM.yyyy'
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    defaultUnitSystem: 'imperial',
    dateFormat: 'MM/dd/yyyy'
  },
  pl: {
    code: 'pl',
    name: 'Polski',
    flag: '🇵🇱',
    defaultUnitSystem: 'metric',
    dateFormat: 'dd.MM.yyyy'
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    defaultUnitSystem: 'metric',
    dateFormat: 'dd.MM.yyyy'
  },
  fr: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    defaultUnitSystem: 'metric',
    dateFormat: 'dd/MM/yyyy'
  },
  es: {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    defaultUnitSystem: 'metric',
    dateFormat: 'dd/MM/yyyy'
  }
};

export const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  UA: 'uk',
  PL: 'pl',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  FR: 'fr',
  BE: 'fr',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  GB: 'en',
  US: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  IE: 'en'
};

const SAVED_LANG_KEY = 'forgemuscle_selected_lang';

export function getSavedUserLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(SAVED_LANG_KEY);
    if (saved && saved in SUPPORTED_LOCALES) {
      return saved as SupportedLocale;
    }
  } catch {}
  return null;
}

export function saveUserLocale(locale: SupportedLocale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_LANG_KEY, locale);
  } catch {}
}

export function detectBrowserLocale(): SupportedLocale {
  // 1. Check manually saved choice first
  const saved = getSavedUserLocale();
  if (saved) return saved;

  if (typeof window === 'undefined') return 'uk';

  // 2. Check navigator.languages / navigator.language
  const langs = navigator.languages || [navigator.language];
  for (const lang of langs) {
    if (!lang) continue;
    const code = lang.toLowerCase().split('-')[0];
    if (code === 'uk' || code === 'ua') return 'uk';
    if (code === 'pl') return 'pl';
    if (code === 'de') return 'de';
    if (code === 'fr') return 'fr';
    if (code === 'es') return 'es';
    if (code === 'en') return 'en';
  }

  // 3. Default to 'uk'
  return 'uk';
}

export function formatWeight(kg: number, unitSystem: 'metric' | 'imperial', locale: SupportedLocale = 'uk'): string {
  if (unitSystem === 'imperial') {
    const lbs = Math.round(kg * 2.20462);
    return `${lbs} lbs`;
  }
  return `${kg} kg`;
}

export function formatHeight(cm: number, unitSystem: 'metric' | 'imperial', locale: SupportedLocale = 'uk'): string {
  if (unitSystem === 'imperial') {
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}′${inches}″`;
  }
  return `${cm} cm`;
}
