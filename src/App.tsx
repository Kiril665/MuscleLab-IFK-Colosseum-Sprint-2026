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
import { ProHub } from './components/ProHub';
import { NutritionPlanner } from './components/NutritionPlanner';
import { ForgeCommunity } from './components/ForgeCommunity';
import { ForgeEducation } from './components/ForgeEducation';
import { ForgeProfileQuests } from './components/ForgeProfileQuests';
import { ForgeJourneyEngine } from './components/ForgeJourneyEngine';
import { ForgeMarketplaceStore } from './components/ForgeMarketplaceStore';
import { SmartSearchModal } from './components/SmartSearchModal';
import { Discipline, AnvilStage, WorkoutSession, ForgedProgram, Exercise } from './types';
import { EXERCISES } from './data/exercisesData';
import { sound } from './services/soundEngine';
import { Flame, Dumbbell, Shield } from 'lucide-react';

const INITIAL_SESSIONS: WorkoutSession[] = [
  {
    id: 'ses_init_1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    exerciseName: 'Класичні віджимання від підлоги',
    muscleGroup: 'chest',
    discipline: 'calisthenics',
    reps: 20,
    totalXp: 200,
    durationSeconds: 90
  },
  {
    id: 'ses_init_2',
    date: new Date(Date.now() - 86400000).toISOString(),
    exerciseName: 'Підтягування широким прямим хватом',
    muscleGroup: 'back',
    discipline: 'calisthenics',
    reps: 12,
    totalXp: 216,
    durationSeconds: 110
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [userDiscipline, setUserDiscipline] = useState<Discipline | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [forgedPrograms, setForgedPrograms] = useState<ForgedProgram[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

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
        setSessions(INITIAL_SESSIONS);
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

        {(activeTab === 'battle' || activeTab === 'leaderboards') && (
          <BattleMode
            userDiscipline={userDiscipline}
            sessions={sessions}
            onContributeXp={handleContributeBattleXp}
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
          }
          setActiveTab(tab);
        }}
      />

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
