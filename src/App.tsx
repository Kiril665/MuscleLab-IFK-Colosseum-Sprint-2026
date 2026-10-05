/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavBar, NavTabId } from './components/navigation/NavBar';
import { HomeView } from './components/home/HomeView';
import { BattleView } from './components/battle/BattleView';
import { ChatVoiceView } from './components/chat/ChatVoiceView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';
import { LocaleBanner } from './components/common/LocaleBanner';
import { SettingsModal } from './components/settings/SettingsModal';
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import { authStore } from './services/authStore';
import { forgeGameStore } from './services/forgeGameStore';
import { battleStore } from './services/battleStore';
import { onboardingStore } from './services/onboardingStore';
import { useI18n } from './services/i18n';
import { ExerciseId } from './types';
import { Swords, Settings as SettingsIcon, WifiOff } from 'lucide-react';
import { AuthScreen } from './components/auth/AuthScreen';
import { Avatar } from './ui/Avatar';

export default function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [user, setUser] = useState(authStore.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authStore.getIsAuthenticated());
  const [isCheckingSession, setIsCheckingSession] = useState(authStore.getIsCheckingSession());
  const [level, setLevel] = useState(forgeGameStore.getLevel());
  const [selectedBattleExercise, setSelectedBattleExercise] = useState<ExerciseId>('pushups');
  const [challengeInviteText, setChallengeInviteText] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Check if user came from a challenge link
    const params = new URLSearchParams(window.location.search);
    const challengeParam = params.get('challenge');
    if (challengeParam) {
      setChallengeInviteText(t.battle.challengeBanner);
      setActiveTab('battle');
    }

    // Register tab changer with onboarding store
    onboardingStore.registerTabChanger((tab) => setActiveTab(tab));

    const unsubAuth = authStore.subscribe(() => {
      const u = authStore.getUser();
      setUser(u);
      setIsAuthenticated(authStore.getIsAuthenticated());
      setIsCheckingSession(authStore.getIsCheckingSession());

      // Trigger onboarding for new registered athletes
      if (authStore.getIsAuthenticated() && !u.onboardingCompleted) {
        onboardingStore.startTour();
      }
    });

    const unsubGame = forgeGameStore.subscribe(() => {
      setLevel(forgeGameStore.getLevel());
    });

    // Offline / Online listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubAuth();
      unsubGame();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  const handleNavigateToBattle = (exerciseId?: ExerciseId) => {
    if (exerciseId) {
      setSelectedBattleExercise(exerciseId);
      battleStore.selectExercise(exerciseId);
    }
    setActiveTab('battle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChallengePlayer = (_nick: string) => {
    setActiveTab('battle');
    battleStore.startCalibration();
  };

  const handleOpenChatWithPlayer = (_nick: string) => {
    setActiveTab('chat');
  };

  // 1. Initial boot session loading state (logo spinner only, zero flash of login screen)
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#0B0D11] text-white flex flex-col items-center justify-center p-4 selection:bg-[var(--accent)] selection:text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#13171F] border border-[#283244] p-1.5 shadow-2xl flex items-center justify-center mb-4 animate-pulse">
          <img src="/logo.png" alt="ForgeMuscle" className="w-full h-full object-contain" />
        </div>
        <div className="font-heading font-black text-2xl tracking-tight text-white mb-2">
          FORGE<span className="text-[var(--accent)]">MUSCLE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span>{t.auth.checkingSession}</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated gate: full-screen AuthScreen
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthenticated={() => {
          setIsAuthenticated(true);
          const u = authStore.getUser();
          if (!u.onboardingCompleted) {
            onboardingStore.startTour();
          }
        }}
      />
    );
  }

  // 3. Authenticated athlete: main ForgeMuscle platform
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col md:flex-row">
      {/* Navigation: Desktop Sidebar & Mobile Bottom Bar */}
      <NavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Offline notification banner */}
        {!isOnline && (
          <div className="bg-amber-500/90 text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
            <WifiOff size={16} />
            <span>{t.offline.title}: {t.offline.desc}</span>
          </div>
        )}

        {/* Auto Locale Notification Banner */}
        <LocaleBanner />

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B0D11] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-sm">
              <img
                src="/logo.png"
                alt="ForgeMuscle"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-heading font-black text-base text-[var(--text-primary)] tracking-tight">
              FORGE<span className="text-[var(--accent)]">MUSCLE</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="mobile-header-settings"
              onClick={() => setIsSettingsOpen(true)}
              aria-label={t.settings.title}
              className="p-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <SettingsIcon size={16} />
            </button>

            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 bg-[var(--bg-subtle)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] text-xs font-semibold cursor-pointer"
            >
              <Avatar avatar={user.avatar} size="sm" />
              <span className="text-[var(--accent)] font-heading font-bold">LVL {level}</span>
            </div>
          </div>
        </header>

        {/* Challenge Link Banner if opened via invite */}
        {challengeInviteText && (
          <div className="bg-[var(--accent)] text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Swords size={16} />
              <span>{challengeInviteText}</span>
            </div>
            <button
              onClick={() => setChallengeInviteText(null)}
              className="text-[11px] font-black underline cursor-pointer ml-3"
            >
              {t.battle.challengeGotIt}
            </button>
          </div>
        )}

        {/* View Routing */}
        <div className="flex-1 w-full">
          {activeTab === 'home' && (
            <HomeView
              onNavigateToBattle={handleNavigateToBattle}
              onNavigateToProfile={() => setActiveTab('profile')}
            />
          )}

          {activeTab === 'battle' && (
            <BattleView
              initialExerciseId={selectedBattleExercise}
              onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
              onNavigateToHome={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'chat' && (
            <ChatVoiceView
              onChallengePlayer={handleChallengePlayer}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              onChallengePlayer={handleChallengePlayer}
              onOpenChatWithPlayer={handleOpenChatWithPlayer}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView />
          )}
        </div>
      </main>

      {/* Global Modals: Settings & Interactive Onboarding Tour */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRestartOnboarding={() => onboardingStore.startTour()}
      />

      <OnboardingTour />
    </div>
  );
}
