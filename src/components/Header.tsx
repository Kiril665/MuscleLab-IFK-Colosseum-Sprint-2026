import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Flame, 
  Trophy, 
  Radio, 
  Mic, 
  Search, 
  Menu, 
  X, 
  Dumbbell, 
  Swords, 
  BookOpen, 
  ShoppingBag, 
  Crown, 
  Users, 
  Target, 
  Activity, 
  Sparkles,
  ChevronDown,
  Cloud,
  CloudCheck,
  User as UserIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { authStore } from '../services/authStore';
import { ArnoVoiceSettingsModal } from './ArnoVoiceSettingsModal';
import { Discipline, AnvilStage, ForgeUser } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalXp: number;
  currentStage: AnvilStage;
  userDiscipline: Discipline | null;
  onSelectDiscipline?: (discipline: Discipline) => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalXp,
  currentStage,
  userDiscipline,
  onSelectDiscipline,
  onOpenSearch,
  onOpenAuth
}) => {
  const [currentUser, setCurrentUser] = useState<ForgeUser | null>(authStore.getCurrentUser());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>(authStore.getSyncStatus());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [volume, setVolume] = useState(sound.getVolume());
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [isAmbientOn, setIsAmbientOn] = useState(sound.getIsAmbientPlaying());
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [isArnoSpeaking, setIsArnoSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(arnoVoice.getIsEnabled());
  const [coachName, setCoachName] = useState(arnoVoice.getCoachDisplayName());
  const [showAllModulesMenu, setShowAllModulesMenu] = useState(false);

  useEffect(() => {
    const unsubAuth = authStore.subscribe(() => {
      setCurrentUser(authStore.getCurrentUser());
      setSyncStatus(authStore.getSyncStatus());
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsub = arnoVoice.subscribe((speaking) => {
      setIsArnoSpeaking(speaking);
      setIsVoiceEnabled(arnoVoice.getIsEnabled());
      setCoachName(arnoVoice.getCoachDisplayName());
    });
    return () => unsub();
  }, []);

  // Global Ctrl+K / Cmd+K search hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (onOpenSearch) onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const navItems = [
    { id: 'home', label: 'Головна' },
    { id: 'journey', label: 'Journey', badge: '🔥' },
    { id: 'exercises', label: 'Вправи' },
    { id: 'forge', label: 'Кузня' },
    { id: 'camera', label: 'Камера AI', badge: 'AI' },
    { id: 'nutrition', label: 'Раціон' },
    { id: 'journal', label: 'Журнал' },
    { id: 'battle', label: 'Battle Mode', badge: 'VS' },
    { id: 'community', label: 'Спільнота', badge: '🧠' },
    { id: 'chat', label: 'Чат', badge: '💬' },
    { id: 'education', label: 'Знання & Wiki', badge: '📚' },
    { id: 'profile_quests', label: 'Квести & Профіль', badge: '🎯' },
    { id: 'market', label: 'Маркет', badge: '🛒' },
    { id: 'prohub', label: 'Pro-Hub' }
  ];

  // Point 57: Complete Catalog of all 16 systems
  const allModules = [
    {
      group: 'Тренування & AI',
      items: [
        { id: 'home', label: 'Головна (Home)', desc: 'Щоденний огляд, тренування дня та цілі' },
        { id: 'exercises', label: 'База Вправ (Exercises)', desc: '100+ вправ з 3D біомеханікою та технікою' },
        { id: 'journey', label: 'Forge Journey', desc: 'Персональний маршрут та тижневі прогресії' },
        { id: 'forge', label: 'Workout Forge', desc: 'Конструктор власних тренувальних сплітів' },
        { id: 'camera', label: 'Camera Tracker', desc: 'Computer Vision підрахунок репів та розбір техніки' },
        { id: 'journal', label: 'Прогрес & Щоденник (Progress)', desc: 'Аналітика силових показників та графіки' }
      ]
    },
    {
      group: 'Гейміфікація & Змагання',
      items: [
        { id: 'battle', label: 'Battle Mode & Дуелі', desc: 'Асинхронні та камера-дуелі 1v1 за репи' },
        { id: 'challenges', label: 'Челенджі (Challenges)', desc: 'Випадкові рулетки та щотижневі випробування' },
        { id: 'leaderboards', label: 'Таблиці Лідерів (Leaderboards)', desc: 'Рейтинг атлетів за дисциплінами та гільдіями' },
        { id: 'profile_quests', label: 'Профіль & Forge Score', desc: 'Ранг, ачивки, інвентар та розрахунок очок' }
      ]
    },
    {
      group: 'Спільнота & Знання',
      items: [
        { id: 'community', label: 'Спільнота (Community)', desc: 'Стрічка досвіду, гайди та Ask the Forge Q&A' },
        { id: 'chat', label: 'Forge Chat & Кімнати', desc: 'Живий чат атлетів, модерація та гілки' },
        { id: 'wiki', label: 'Forge Wiki & База Знань', desc: 'Верифіковані наукові статті та міфи' },
        { id: 'academy', label: 'Forge Academy', desc: 'Інтерактивні міні-курси з перевірочними тестами' },
        { id: 'guilds', label: 'Гільдії (Guilds)', desc: 'Братства атлетів, спільний XP та кланові війни' }
      ]
    },
    {
      group: 'Маркетплейс & Екосистема',
      items: [
        { id: 'market', label: 'Forge Market', desc: 'Програми від авторів, цифровий мерч та спонсори' },
        { id: 'premium', label: 'Forge Premium', desc: 'Безлімітні плани, розширена аналітика та аура' },
        { id: 'prohub', label: 'Pro Hub для Тренерів', desc: 'Управління учнями, конструктор та аналітика клієнтів' }
      ]
    },
    {
      group: 'Акаунт & Кузня (#70, #76)',
      items: [
        { id: 'settings', label: 'Налаштування Акаунта (Settings)', desc: 'Приватність, сповіщення, сесії та безпека' },
        { id: 'admin', label: 'Admin Panel & Business Analytics', desc: 'DAU/WAU, ретеншн, виручка та ролі атлетів' }
      ]
    }
  ];

  const handleTabClick = (id: string) => {
    sound.playClick();
    setActiveTab(id);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playClick();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setVolume(val);
  };

  const handleToggleAmbient = () => {
    const playing = sound.toggleAmbient();
    setIsAmbientOn(playing);
    if (playing) {
      sound.playClick();
    }
  };

  const stageBadgeNames: Record<AnvilStage, { name: string; color: string }> = {
    raw_metal: { name: 'Сирий метал', color: 'text-neutral-400 border-neutral-600 bg-neutral-900/80' },
    forged: { name: 'Викуваний', color: 'text-stone-300 border-stone-500/40 bg-stone-900/60' },
    muscles: { name: 'Мʼязовий сталевар', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
    armor: { name: 'Важка броня', color: 'text-blue-400 border-blue-500/40 bg-blue-950/40' },
    fire_aura: { name: 'Вогняна аура', color: 'text-orange-400 border-orange-500/60 bg-orange-950/60 shadow-[0_0_12px_rgba(249,115,22,0.4)]' },
    legendary_forge: { name: 'Легендарна Кузня', color: 'text-amber-300 border-amber-400/80 bg-amber-950/80 shadow-[0_0_16px_rgba(245,158,11,0.6)]' },
    tempered_steel: { name: 'Загартована сталь', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
    heavy_armor: { name: 'Титанова броня', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
    fiery_aura: { name: 'Полумʼя коваля', color: 'text-orange-400 border-orange-500/60 bg-orange-950/60 shadow-[0_0_12px_rgba(249,115,22,0.4)]' }
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-amber-500/20 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <button
            id="header-logo-btn"
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-3.5 group text-left cursor-pointer focus:outline-none"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_25px_rgba(234,88,12,0.6)] transition-all">
              <img
                src="/src/assets/images/forgemuscle_logo.jpg"
                alt="ForgeMuscle Logo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-epic text-2xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 bg-clip-text text-transparent">
                  FORGEMUSCLE
                </span>
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <p className="text-[11px] tracking-wider uppercase text-neutral-400 font-medium">
                Кузня Тіла та Духу
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Smart Search Button (Desktop) */}
            <button
              id="header-smart-search-btn"
              onClick={() => {
                sound.playClick();
                if (onOpenSearch) onOpenSearch();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:border-amber-500/40 text-neutral-300 hover:text-white transition-all text-xs font-medium cursor-pointer mr-1"
              title="Єдиний пошук по системі (Ctrl+K / Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Пошук</span>
              <kbd className="hidden xl:inline text-[10px] text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">⌘K</kbd>
            </button>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative px-3 py-2 text-xs xl:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'text-neutral-300 hover:text-amber-200 hover:bg-neutral-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        item.badge === 'VS'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* All 16 Modules Catalog Toggle */}
            <button
              id="header-all-modules-btn"
              onClick={() => {
                sound.playClick();
                setShowAllModulesMenu(!showAllModulesMenu);
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                showAllModulesMenu
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Всі 16 розділів ForgeMuscle"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden 2xl:inline">Меню</span>
            </button>
          </nav>

          {/* Right Action Controls: Sounds, Ambient & XP status */}
          <div className="flex items-center gap-3">
            {/* Ambient hearth sound toggle */}
            <button
              id="ambient-sound-toggle-btn"
              onClick={handleToggleAmbient}
              title={isAmbientOn ? "Вимкнути фоновий звук кузні" : "Увімкнути фоновий звук кузні"}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isAmbientOn
                  ? 'border-orange-500/60 bg-orange-950/40 text-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.4)]'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <Radio className={`w-4 h-4 ${isAmbientOn ? 'animate-pulse' : ''}`} />
            </button>

            {/* Master Sound Button + Volume Slider */}
            <div className="relative">
              <button
                id="master-sound-toggle-btn"
                onClick={handleToggleMute}
                onMouseEnter={() => setShowVolumePopup(true)}
                title={isMuted ? "Увімкнути звук" : "Вимкнути звук"}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  isMuted
                    ? 'border-red-500/40 bg-red-950/20 text-red-400'
                    : 'border-amber-500/40 bg-amber-950/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Volume flyout on hover/focus */}
              {showVolumePopup && (
                <div
                  onMouseLeave={() => setShowVolumePopup(false)}
                  className="absolute right-0 top-full mt-2 w-48 p-3 rounded-xl bg-neutral-900 border border-amber-500/30 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-300 mb-1.5 font-medium">
                    <span>Гучність ефектів</span>
                    <span className="text-amber-400 font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-800 text-[10px] text-neutral-400">
                    <span>Удар молота / Репи</span>
                    <button
                      onClick={() => {
                        sound.playAnvilHit();
                      }}
                      className="text-amber-400 hover:underline cursor-pointer font-medium"
                    >
                      Тест звуку
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Coach Arno Voice Settings Button */}
            <button
              id="arno-voice-settings-btn"
              onClick={() => {
                sound.playClick();
                setShowVoiceModal(true);
              }}
              title={isVoiceEnabled ? "Налаштування голосу тренера Арно" : "Голос Арно вимкнено (клікніть щоб увімкнути)"}
              className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isArnoSpeaking
                  ? 'border-amber-400 bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                  : isVoiceEnabled
                  ? 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${isArnoSpeaking ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Арно</span>
            </button>

            {/* Current Discipline Badge / Quick Switcher Modal Trigger */}
            <button
              id="header-discipline-branch-btn"
              onClick={() => {
                sound.playClick();
                setShowBranchModal(true);
              }}
              title="Перемкнути бойову гілку (Бодибілдинг, Калістеніка, Гібрид)"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                userDiscipline === 'bodybuilding'
                  ? 'border-amber-500/40 bg-amber-950/30 text-amber-400 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : userDiscipline === 'calisthenics'
                  ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'border-orange-500/40 bg-orange-950/30 text-orange-400 hover:border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="capitalize">
                Гілка: {userDiscipline === 'bodybuilding' ? 'Бодибілдинг' : userDiscipline === 'calisthenics' ? 'Калістеніка' : 'Гібрид'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* User XP & Stage Pill */}
            <div
              onClick={() => handleTabClick('journal')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40 cursor-pointer transition-all"
              title="Перейти в журнал прогресу"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold leading-none">
                  {totalXp} XP
                </div>
                <div className="text-xs font-semibold text-amber-300 leading-tight">
                  {stageBadgeNames[currentStage]?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center overflow-x-auto py-2.5 gap-1.5 border-t border-neutral-800/80 no-scrollbar">
          {/* Quick Search Button (Mobile) */}
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenSearch) onOpenSearch();
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 border border-amber-500/30 text-amber-400 flex items-center gap-1 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Пошук</span>
          </button>

          {/* All 16 Modules (Mobile) */}
          <button
            onClick={() => {
              sound.playClick();
              setShowAllModulesMenu(true);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1 shrink-0"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Всі розділи</span>
          </button>

          {/* Quick Branch Switcher (Mobile) */}
          <button
            id="mobile-branch-switcher-btn"
            onClick={() => {
              sound.playClick();
              setShowBranchModal(true);
            }}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 border border-amber-500/40 text-amber-300 flex items-center gap-1 shrink-0"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Гілка: {userDiscipline === 'bodybuilding' ? 'Бодибілдинг' : userDiscipline === 'calisthenics' ? 'Калістеніка' : 'Гібрид'}</span>
          </button>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-mobile-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ALL 16 MODULES MEGA-CATALOG MODAL (Point 57) */}
      {showAllModulesMenu && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-heading tracking-wide">
                    КАРТА СИСТЕМИ FORGEMUSCLE
                  </h2>
                  <p className="text-xs text-neutral-400">Всі 16 розділів платформи (FITNESS + GAME + COMMUNITY + EDUCATION + MARKET)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllModulesMenu(false)}
                className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allModules.map((grp) => (
                <div key={grp.group} className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 border-l-2 border-amber-500 pl-2">
                    {grp.group}
                  </h3>
                  <div className="space-y-2">
                    {grp.items.map((it) => (
                      <div
                        key={it.id}
                        onClick={() => {
                          handleTabClick(it.id);
                          setShowAllModulesMenu(false);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between group ${
                          activeTab === it.id
                            ? 'bg-amber-500/15 border-amber-500/40'
                            : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {it.label}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {it.desc}
                          </div>
                        </div>
                        <span className="text-neutral-600 group-hover:text-amber-400 text-xs font-mono mt-0.5">→</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
              <span>Швидкий пошук: натисніть <strong>⌘K</strong> або <strong>Ctrl+K</strong></span>
              <button
                onClick={() => {
                  setShowAllModulesMenu(false);
                  if (onOpenSearch) onOpenSearch();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Відкрити Смарт-Пошук
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCIPLINE BRANCH SELECTION MODAL (ПЕРЕХІД НА ВСІ БОЙОВІ ГІЛКИ) */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-wide">
                    БОЙОВІ ГІЛКИ FORGEMUSCLE
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Миттєве перемикання між усіма бойовими напрямками, деревами навичок та базами знань
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBranchModal(false)}
                className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-800 border border-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Branch 1: Bodybuilding */}
              <div
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  userDiscipline === 'bodybuilding'
                    ? 'border-amber-400 bg-amber-950/25 ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Iron Path
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">
                      Бодибілдинг
                    </h3>
                    <p className="text-xs text-amber-300 font-semibold mt-0.5">
                      Залізо, Гіпертрофія та Симетрія
                    </p>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Робота з вільними вагами та тренажерами для максимального збільшення мʼязових обʼємів, пропорцій та сухого рельєфу.
                  </p>

                  <div className="text-[11px] text-neutral-400 space-y-1 pt-2 border-t border-neutral-800">
                    <div><strong className="text-neutral-200">Фокус:</strong> Ізоляція, прогресивне навантаження</div>
                    <div><strong className="text-neutral-200">Снаряди:</strong> Штанги, гантелі, лави, блоки</div>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  {userDiscipline === 'bodybuilding' ? (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-amber-500 text-neutral-950 font-black text-xs text-center uppercase tracking-wider">
                      ✓ Активна Гілка
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playAnvilHit();
                        if (onSelectDiscipline) onSelectDiscipline('bodybuilding');
                        arnoVoice.speak('Обрано бойову гілку Бодибілдингу! Залізна маса та прогресивне перевантаження!', { force: true });
                        setShowBranchModal(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Перейти на Бодибілдинг
                    </button>
                  )}
                </div>
              </div>

              {/* Branch 2: Calisthenics */}
              <div
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  userDiscipline === 'calisthenics'
                    ? 'border-cyan-400 bg-cyan-950/25 ring-2 ring-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Gravity Rebel
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">
                      Калістеніка
                    </h3>
                    <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                      Гравітація, Турніки та Повний Контроль
                    </p>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Мистецтво володіння власною вагою на перекладині та брусах. Вибухова міць, сухий жилавий атлетизм і здорові суглоби.
                  </p>

                  <div className="text-[11px] text-neutral-400 space-y-1 pt-2 border-t border-neutral-800">
                    <div><strong className="text-neutral-200">Фокус:</strong> Відносна сила, статичні горизонти</div>
                    <div><strong className="text-neutral-200">Снаряди:</strong> Турнік, бруси, гімнастичні кільця</div>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  {userDiscipline === 'calisthenics' ? (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 text-neutral-950 font-black text-xs text-center uppercase tracking-wider">
                      ✓ Активна Гілка
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playAnvilHit();
                        if (onSelectDiscipline) onSelectDiscipline('calisthenics');
                        arnoVoice.speak('Обрано бойову гілку Калістеніки! Повний контроль гравітації та турніків!', { force: true });
                        setShowBranchModal(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-cyan-500 hover:text-neutral-950 border border-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Перейти на Калістеніку
                    </button>
                  )}
                </div>
              </div>

              {/* Branch 3: Hybrid */}
              <div
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  userDiscipline === 'hybrid'
                    ? 'border-orange-400 bg-orange-950/25 ring-2 ring-orange-400/50 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-orange-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
                      <Flame className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      Titan Fusion
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">
                      Гібридний Атлетизм
                    </h3>
                    <p className="text-xs text-orange-300 font-semibold mt-0.5">
                      Синтез Заліза та Воркауту
                    </p>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Поєднання важких базових потягів зі штангою та віртуозних виходів на турніку. Тіло без жодних слабких місць.
                  </p>

                  <div className="text-[11px] text-neutral-400 space-y-1 pt-2 border-t border-neutral-800">
                    <div><strong className="text-neutral-200">Фокус:</strong> Максимальний функціонал та міць</div>
                    <div><strong className="text-neutral-200">Снаряди:</strong> Турнік + бруси + штанга / гантелі</div>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  {userDiscipline === 'hybrid' ? (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-orange-500 text-neutral-950 font-black text-xs text-center uppercase tracking-wider">
                      ✓ Активна Гілка
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playAnvilHit();
                        if (onSelectDiscipline) onSelectDiscipline('hybrid');
                        arnoVoice.speak('Обрано бойову гілку Гібридного Атлетизму! Сила заліза та турніків!', { force: true });
                        setShowBranchModal(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-orange-500 hover:text-neutral-950 border border-neutral-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Перейти на Гібрид
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Navigation to related branches */}
            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-neutral-400">Швидкий перехід у розділи активної гілки:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setShowBranchModal(false);
                    handleTabClick('journey');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold cursor-pointer border border-neutral-700"
                >
                  🚀 Forge Journey
                </button>
                <button
                  onClick={() => {
                    setShowBranchModal(false);
                    handleTabClick('forge');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold cursor-pointer border border-neutral-700"
                >
                  ⚡ Кузня Програм
                </button>
                <button
                  onClick={() => {
                    setShowBranchModal(false);
                    handleTabClick('exercises');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold cursor-pointer border border-neutral-700"
                >
                  📖 База Вправ
                </button>
                <button
                  onClick={() => {
                    setShowBranchModal(false);
                    handleTabClick('battle');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 font-semibold cursor-pointer border border-red-500/30"
                >
                  ⚔️ Battle Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach Arno Voice Settings Modal */}
      <ArnoVoiceSettingsModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </header>
  );
};
