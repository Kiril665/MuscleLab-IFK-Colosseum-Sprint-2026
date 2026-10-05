import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Swords, 
  BookOpen, 
  Dumbbell, 
  Utensils, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Award,
  Sparkles
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProgressBar } from '../../ui/ProgressBar';
import { EXERCISES } from '../../data/exercisesData';
import { ACADEMY_CARDS, LearningCard } from '../../data/academyData';
import { Exercise, ExerciseId } from '../../types';
import { MuscleMap } from './MuscleMap';
import { LevelQuizModal } from './LevelQuizModal';
import { NutritionCalculator } from './NutritionCalculator';
import { PlateRuleVisualizer } from './PlateRuleVisualizer';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { LearningCardModal } from './LearningCardModal';
import { academyStore } from '../../services/academyStore';
import { forgeGameStore } from '../../services/forgeGameStore';
import { useI18n } from '../../services/i18n';

export interface HomeViewProps {
  onNavigateToBattle: (exerciseId?: ExerciseId) => void;
  onNavigateToProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToBattle,
  onNavigateToProfile
}) => {
  const { t } = useI18n();
  const [academyProgress, setAcademyProgress] = useState(academyStore.getProgress());
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'training' | 'exercises' | 'nutrition'>('training');

  // Modals state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedCard, setSelectedCard] = useState<LearningCard | null>(null);

  useEffect(() => {
    const unsub = academyStore.subscribe(() => {
      setAcademyProgress({ ...academyStore.getProgress() });
    });
    return () => {
      unsub();
    };
  }, []);

  // Filter exercises
  const filteredExercises = EXERCISES.filter((ex) => {
    if (selectedMuscle !== 'all' && !ex.muscleGroups.includes(selectedMuscle)) return false;
    if (selectedLevel !== 'all' && ex.level !== selectedLevel) return false;
    if (selectedEquipment !== 'all' && ex.equipment !== selectedEquipment) return false;
    return true;
  });

  const starterQuests = forgeGameStore.getQuests().filter((q) => q.type === 'starter');
  const completedStarterCount = starterQuests.filter((q) => q.completed).length;

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-4xl mx-auto w-full px-4 pt-3">
      {/* Hero: Кузня Твого Тіла з логотипом */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#181D26] via-[#11141B] to-[#0B0D11] border border-[var(--border-subtle)] p-5 sm:p-7 overflow-hidden shadow-2xl">
        {/* Subtle ember glow behind hero image */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          {/* Brand Logo emblem badge */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0B0D11] border-2 border-[var(--accent)]/60 overflow-hidden shrink-0 shadow-lg shadow-[var(--accent)]/20 flex items-center justify-center p-1">
            <img
              src="/logo.png"
              alt="ForgeMuscle Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col gap-2.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="accent" size="sm" className="font-bold tracking-wider uppercase">
                {t.home.stepIndicator} {academyProgress.quizDone ? '2' : '1'} {t.home.of} 3
              </Badge>
              <span className="text-xs text-[var(--text-secondary)] font-medium">Forge Muscle OS</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {t.home.heroTitle}.
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
              {t.home.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
              {!academyProgress.quizDone ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsQuizOpen(true)}
                  className="font-bold shadow-lg"
                >
                  <Sparkles size={16} />
                  {t.home.quizButton}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsQuizOpen(true)}
                >
                  {t.home.changeGoal}
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  const el = document.getElementById('learning-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <BookOpen size={16} />
                {t.home.startBasics}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Starter Quests Block */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[var(--accent)]" />
            <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)]">
              {t.home.firstQuests}
            </h3>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            {completedStarterCount} {t.home.of} {starterQuests.length} {t.home.completed}
          </span>
        </div>

        <ProgressBar value={completedStarterCount} max={starterQuests.length} height="sm" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {starterQuests.map((q) => (
            <div
              key={q.id}
              onClick={() => {
                if (q.id === 'starter_quiz' && !q.completed) setIsQuizOpen(true);
                if (q.id === 'starter_first_battle') onNavigateToBattle();
                if (q.id === 'starter_calibration') onNavigateToBattle();
              }}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                q.completed
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--text-secondary)]'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    q.completed ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {q.completed ? '✓' : '•'}
                </div>
                <div>
                  <div className="text-xs font-semibold">{q.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{q.desc}</div>
                </div>
              </div>
              <div className="text-xs font-bold text-[var(--accent)] shrink-0 ml-2">
                +{q.rewardXp} XP
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Learning Hub Tabs */}
      <div id="learning-section" className="flex flex-col gap-4">
        {/* Navigation tabs for learning blocks */}
        <div className="flex bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)] gap-1">
          {[
            { id: 'training', label: '1. Як накачатись', icon: <Zap size={15} /> },
            { id: 'exercises', label: '2. Вправи та техніка', icon: <Dumbbell size={15} /> },
            { id: 'nutrition', label: '3. Харчування', icon: <Utensils size={15} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-md font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Як накачатись */}
        {activeTab === 'training' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                  Основи м’язового росту (Гіпертрофія)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Картки на 1–2 хвилини читання. Прочитай і тисни «Засвоїти» для нарахування XP.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACADEMY_CARDS.filter((c) => c.category === 'training').map((card) => {
                const isRead = academyStore.isCardRead(card.id);
                return (
                  <Card
                    key={card.id}
                    variant={isRead ? 'default' : 'interactive'}
                    padding="md"
                    onClick={() => setSelectedCard(card)}
                    className="flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                          <Clock size={11} /> {card.readTime}
                        </span>
                        {isRead ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle size={10} className="mr-1" /> Засвоєно
                          </Badge>
                        ) : (
                          <Badge variant="accent" size="sm">
                            +{card.xpReward} XP
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] mb-1.5 leading-snug">
                        {card.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {card.summary}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                      <span>{t.home.readNotes}</span>
                      <ChevronRight size={14} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Вправи та техніка */}
        {activeTab === 'exercises' && (
          <div className="flex flex-col gap-5">
            {/* Interactive Anatomical Muscle Map */}
            <MuscleMap
              selectedGroup={selectedMuscle}
              onSelectGroup={(g) => setSelectedMuscle(g)}
            />

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-subtle)] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Рівень:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">Всі рівні</option>
                  <option value="beginner">Новачок</option>
                  <option value="intermediate">Середній</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Інвентар:</span>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="all">Будь-який</option>
                  <option value="none">Власна вага</option>
                  <option value="pullup_bar">Турнік / Бруси</option>
                </select>
              </div>
            </div>

            {/* Exercise cards list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredExercises.map((ex) => (
                <Card
                  key={ex.id}
                  variant="interactive"
                  padding="md"
                  onClick={() => setSelectedExercise(ex)}
                  className="flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="neutral" size="sm">
                        {ex.level === 'beginner' ? 'Новачок' : 'Середній'}
                      </Badge>
                      {ex.supportedByCamera && (
                        <Badge variant="accent" size="sm">
                          ШІ-камера
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-heading font-bold text-base text-[var(--text-primary)] mb-1">
                      {ex.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mb-2">
                      {ex.muscleTarget}
                    </p>

                    <div className="text-[11px] text-[var(--text-secondary)] space-y-1">
                      <div>• Кроки: {ex.steps.length} етапи</div>
                      <div>• 3 типові помилки розібрано</div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{t.home.detailedTech}</span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToBattle(ex.id);
                      }}
                    >
                      <Swords size={14} className="mr-1" />
                      {t.home.inBattle}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Харчування */}
        {activeTab === 'nutrition' && (
          <div className="flex flex-col gap-5">
            <NutritionCalculator />
            <PlateRuleVisualizer />

            {/* Nutrition Academy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {ACADEMY_CARDS.filter((c) => c.category === 'nutrition').map((card) => {
                const isRead = academyStore.isCardRead(card.id);
                return (
                  <Card
                    key={card.id}
                    variant={isRead ? 'default' : 'interactive'}
                    padding="md"
                    onClick={() => setSelectedCard(card)}
                    className="flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                          <Clock size={11} /> {card.readTime}
                        </span>
                        {isRead ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle size={10} className="mr-1" /> Засвоєно
                          </Badge>
                        ) : (
                          <Badge variant="accent" size="sm">
                            +{card.xpReward} XP
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] mb-1.5 leading-snug">
                        {card.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {card.summary}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                      <span>{t.home.readNotes}</span>
                      <ChevronRight size={14} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA: Ready? First Battle */}
      <div className="mt-4 rounded-3xl bg-gradient-to-r from-[#181D26] via-[#13171F] to-[#0E1116] border-2 border-[var(--accent)]/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xl">
        <div>
          <Badge variant="accent" size="sm" className="mb-2">
            {t.home.readyChallenge}
          </Badge>
          <h3 className="font-heading text-xl sm:text-2xl font-black text-white">
            {t.home.readyCta}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mt-1">
            {t.home.firstBattleSub}
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={() => onNavigateToBattle()}
          className="shrink-0 font-bold px-8 shadow-xl shadow-[var(--accent)]/20"
        >
          <Swords size={20} className="mr-2" />
          {t.home.readyCta}
        </Button>
      </div>

      {/* Level Quiz Modal */}
      <LevelQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onComplete={(goal) => {
          if (goal === 'mass') setActiveTab('training');
          else setActiveTab('nutrition');
        }}
      />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onStartInBattle={(id) => onNavigateToBattle(id)}
      />

      {/* Learning Card Modal */}
      <LearningCardModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        isRead={selectedCard ? academyStore.isCardRead(selectedCard.id) : false}
      />
    </div>
  );
};
