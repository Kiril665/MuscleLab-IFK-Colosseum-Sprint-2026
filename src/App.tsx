/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeOnboarding } from './components/HomeOnboarding';
import { ExerciseDatabase } from './components/ExerciseDatabase';
import { ProgramForge } from './components/ProgramForge';
import { CameraTracker } from './components/CameraTracker';
import { ProgressJournal } from './components/ProgressJournal';
import { BattleMode } from './components/BattleMode';
import { ForgeBattleArena } from './components/ForgeBattleArena';
import { ForgePassportView } from './components/ForgePassportView';
import { ProHub } from './components/ProHub';
import { NutritionPlanner } from './components/NutritionPlanner';
import { ForgeCommunity } from './components/ForgeCommunity';
import { ForgeEducation } from './components/ForgeEducation';
import { ForgeProfileQuests } from './components/ForgeProfileQuests';
import { ForgeJourneyEngine } from './components/ForgeJourneyEngine';
import { ForgeMarketplaceStore } from './components/ForgeMarketplaceStore';
import { SmartSearchModal } from './components/SmartSearchModal';
import { HelpCenterView } from './components/HelpCenterView';
import { Leaderboard } from './components/Leaderboard';
import { ForgeWardrobe } from './components/ForgeWardrobe';
import { ChallengeInviteLanding } from './components/ChallengeInviteLanding';
import { AccountSettings } from './components/AccountSettings';
import { HelpArticle } from './data/helpArticles';
import { Discipline, AnvilStage, WorkoutSession, ForgedProgram, Exercise } from './types';
import { EXERCISES } from './data/exercisesData';
import { sound } from './services/soundEngine';
import { authStore } from './services/authStore';
import { AuthModal } from './components/AuthModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Flame, Dumbbell, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('battle');
  const [userDiscipline, setUserDiscipline] = useState<Discipline | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [forgedPrograms, setForgedPrograms] = useState<ForgedProgram[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedHelpArticle, setSelectedHelpArticle] = useState<HelpArticle | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [challengeInviteCode, setChallengeInviteCode] = useState<string | null>(null);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);

  // Authentication & Onboarding state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authStore.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(authStore.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(!authStore.isAuthenticated());
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      const authed = authStore.isAuthenticated();
      const user = authStore.getCurrentUser();
      setIsAuthenticated(authed);
      setCurrentUser(user);
      if (!authed) {
        setIsAuthModalOpen(true);
      }
    });
    return unsubscribe;
  }, []);

  // Detect invite link in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const challengeParam = params.get('challenge');
      if (challengeParam) {
        setChallengeInviteCode(challengeParam);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedDiscipline = localStorage.getItem('forgemuscle_discipline');
      if (savedDiscipline) {
        setUserDiscipline(savedDiscipline as Discipline);
      }

      const savedSessions = localStorage.getItem('forgemuscle_sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      } else {
        setSessions([]);
      }

      const savedPrograms = localStorage.getItem('forgemuscle_programs');
      if (savedPrograms) {
        setForgedPrograms(JSON.parse(savedPrograms));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save sessions when updated
  const saveSessions = (newSessions: WorkoutSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem('forgemuscle_sessions', JSON.stringify(newSessions));
    } catch {
      // ignore
    }
  };

  const handleSelectDiscipline = (disc: Discipline) => {
    setUserDiscipline(disc);
    try {
      localStorage.setItem('forgemuscle_discipline', disc);
    } catch {
      // ignore
    }
  };

  // Compute total XP
  const totalXp = sessions.reduce((acc, curr) => acc + curr.totalXp, 0);

  // Determine anvil evolution stage
  const getCurrentStage = (xp: number): AnvilStage => {
    if (xp >= 1500) return 'fiery_aura';
    if (xp >= 700) return 'heavy_armor';
    if (xp >= 250) return 'tempered_steel';
    return 'raw_metal';
  };

  const currentStage = getCurrentStage(totalXp);

  // Handle completed session from Camera Tracker or Manual
  const handleWorkoutComplete = (session: WorkoutSession) => {
    const updated = [session, ...sessions];
    saveSessions(updated);
  };

  // Handle saving forged routine
  const handleSaveProgram = (prog: ForgedProgram) => {
    const updated = [prog, ...forgedPrograms];
    setForgedPrograms(updated);
    try {
      localStorage.setItem('forgemuscle_programs', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Start exercise in camera tracker
  const handleStartExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setActiveTab('camera');
  };

  // Clear history
  const handleClearHistory = () => {
    saveSessions([]);
  };

  // Tug of war XP boost
  const handleContributeBattleXp = (team: 'bodybuilding' | 'calisthenics', amount: number) => {
    // Artificial mini session for record
    const battleSession: WorkoutSession = {
      id: `battle_${Date.now()}`,
      date: new Date().toISOString(),
      exerciseName: `Внесок у битву (${team === 'bodybuilding' ? 'Бодибілдинг' : 'Калістеніка'})`,
      muscleGroup: 'back',
      discipline: team,
      reps: 5,
      totalXp: amount,
      durationSeconds: 15
    };
    handleWorkoutComplete(battleSession);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Persistent Navigation Header with Web Audio Engine Controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalXp={totalXp}
        currentStage={currentStage}
        userDiscipline={userDiscipline}
        onSelectDiscipline={handleSelectDiscipline}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main App Screens */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <HomeOnboarding
            onSelectDiscipline={handleSelectDiscipline}
            selectedDiscipline={userDiscipline}
            onNavigate={(tab) => {
              sound.playClick();
              setActiveTab(tab);
            }}
          />
        )}

        {/* Point 1: Forge Journey */}
        {activeTab === 'journey' && (
          <ForgeJourneyEngine
            onStartExercise={handleStartExercise}
            onNavigate={(tab) => {
              sound.playClick();
              setActiveTab(tab);
            }}
            userDiscipline={userDiscipline}
            onSelectDiscipline={handleSelectDiscipline}
          />
        )}

        {activeTab === 'exercises' && (
          <ExerciseDatabase
            onStartExercise={handleStartExercise}
          />
        )}

        {activeTab === 'forge' && (
          <ProgramForge
            userDiscipline={userDiscipline}
            onSaveProgram={handleSaveProgram}
            onStartExercise={handleStartExercise}
          />
        )}

        {activeTab === 'camera' && (
          <CameraTracker
            currentExercise={currentExercise || EXERCISES[0]}
            onSelectExercise={setCurrentExercise}
            onWorkoutComplete={handleWorkoutComplete}
            userDiscipline={userDiscipline}
            onBack={() => {
              sound.playClick();
              setActiveTab('exercises');
            }}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionPlanner
            userDiscipline={userDiscipline}
          />
        )}

        {activeTab === 'journal' && (
          <ProgressJournal
            sessions={sessions}
            totalXp={totalXp}
            currentStage={currentStage}
            onAddManualSession={handleWorkoutComplete}
            onClearHistory={handleClearHistory}
            userDiscipline={userDiscipline}
          />
        )}

        {activeTab === 'battle' && (
          <ForgeBattleArena
            onBackToPassport={() => setActiveTab('passport')}
            onNavigateToSoloVerifier={() => setActiveTab('camera')}
          />
        )}

        {activeTab === 'passport' && (
          <ForgePassportView
            onStartBattle={() => setActiveTab('battle')}
            onStartVerification={() => setActiveTab('camera')}
          />
        )}

        {(activeTab === 'leaderboards' || activeTab === 'leaderboard') && (
          <Leaderboard
            onOpenInviteModal={() => setIsInviteModalOpen(true)}
            onOpenWardrobeModal={() => setIsWardrobeOpen(true)}
          />
        )}

        {activeTab === 'community' && (
          <ForgeCommunity
            initialTab="feed"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
          />
        )}

        {activeTab === 'chat' && (
          <ForgeCommunity
            initialTab="chat"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
          />
        )}

        {activeTab === 'guilds' && (
          <ForgeCommunity
            initialTab="guilds"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
          />
        )}

        {activeTab === 'education' && (
          <ForgeEducation
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
          />
        )}

        {activeTab === 'wiki' && (
          <ForgeEducation
            initialTab="wiki"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
          />
        )}

        {activeTab === 'academy' && (
          <ForgeEducation
            initialTab="academy"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
          />
        )}

        {activeTab === 'profile_quests' && (
          <ForgeProfileQuests
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
            onNavigateToWorkout={() => setActiveTab('camera')}
          />
        )}

        {activeTab === 'challenges' && (
          <ForgeProfileQuests
            initialTab="quests"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
            onNavigateToWorkout={() => setActiveTab('camera')}
          />
        )}

        {activeTab === 'profile' && (
          <ForgeProfileQuests
            initialTab="score"
            onEarnXp={(amount) => handleContributeBattleXp(userDiscipline || 'hybrid', amount)}
            onNavigateToWorkout={() => setActiveTab('camera')}
          />
        )}

        {(activeTab === 'market' || activeTab === 'marketplace') && (
          <ForgeMarketplaceStore
            initialTab="programs"
            onPurchaseComplete={(item) => {
              sound.playAnvilHit();
            }}
          />
        )}

        {activeTab === 'premium' && (
          <ForgeMarketplaceStore
            initialTab="premium"
            onPurchaseComplete={(item) => {
              sound.playAnvilHit();
            }}
          />
        )}

        {activeTab === 'prohub' && (
          <ProHub />
        )}

        {(activeTab === 'settings' || activeTab === 'account_settings') && (
          <AccountSettings
            onNavigateHome={() => setActiveTab('battle')}
            onNavigateToProfile={() => setActiveTab('profile_quests')}
          />
        )}

        {activeTab === 'help' && (
          <HelpCenterView
            initialArticle={selectedHelpArticle}
            onNavigateToCamera={() => setActiveTab('camera')}
            onNavigateToBattle={() => setActiveTab('battle')}
            onNavigateToPassport={() => setActiveTab('passport')}
            onBack={() => setActiveTab('battle')}
          />
        )}
      </main>

      {/* Global Smart Search Modal (Point 58) */}
      <SmartSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab, itemData) => {
          sound.playClick();
          if (tab === 'exercises' && itemData?.metadata?.exerciseId) {
            const found = EXERCISES.find(e => e.id === itemData.metadata.exerciseId);
            if (found) {
              setCurrentExercise(found);
            }
          } else if (tab === 'help' && itemData) {
            setSelectedHelpArticle(itemData);
          }
          setActiveTab(tab);
        }}
      />

      {/* Wardrobe Modal */}
      {isWardrobeOpen && (
        <ForgeWardrobe
          onClose={() => setIsWardrobeOpen(false)}
          userXp={totalXp}
        />
      )}

      {/* Challenge Invite Modal */}
      {(isInviteModalOpen || challengeInviteCode) && (
        <ChallengeInviteLanding
          inviteCode={challengeInviteCode}
          onClose={() => {
            setIsInviteModalOpen(false);
            setChallengeInviteCode(null);
          }}
          onStartDuel={(exerciseName, targetReps, opponentName) => {
            setIsInviteModalOpen(false);
            setChallengeInviteCode(null);
            setActiveTab('battle');
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={!isAuthenticated || isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => {
          if (isAuthenticated) {
            setIsAuthModalOpen(false);
          }
        }}
        onSuccess={(isNew) => {
          setIsAuthModalOpen(false);
          setIsAuthenticated(true);
          const user = authStore.getCurrentUser();
          setCurrentUser(user);
          if (isNew || (user && !user.hasCompletedOnboarding)) {
            setShowOnboarding(true);
          }
        }}
      />

      {/* Onboarding Flow Modal for New Users */}
      {showOnboarding && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <OnboardingFlow
              initialUsername={currentUser.username}
              initialDiscipline={userDiscipline}
              onComplete={() => {
                setShowOnboarding(false);
                if (currentUser) {
                  currentUser.hasCompletedOnboarding = true;
                  authStore.updateProfile({ hasCompletedOnboarding: true }).catch(() => {});
                }
              }}
              onStartPushupTest={() => {
                setShowOnboarding(false);
                if (currentUser) {
                  currentUser.hasCompletedOnboarding = true;
                  authStore.updateProfile({ hasCompletedOnboarding: true }).catch(() => {});
                }
                setActiveTab('camera');
              }}
            />
          </div>
        </div>
      )}

      {/* Atmospheric Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/90 py-8 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-epic font-bold text-amber-400 text-sm tracking-wider">FORGEMUSCLE</span>
            <span>—</span>
            <span>Кузня Бодибілдингу та Калістеніки</span>
          </div>

          <div className="flex items-center gap-6 text-neutral-400">
            <button
              onClick={() => {
                sound.playAnvilHit();
              }}
              className="hover:text-amber-400 cursor-pointer transition-colors"
            >
              Звук молота
            </button>
            <button
              onClick={() => {
                sound.playCoachWhistle();
              }}
              className="hover:text-amber-400 cursor-pointer transition-colors"
            >
              Свисток Арно
            </button>
            <span>Web Audio API Procedural Synthesis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
