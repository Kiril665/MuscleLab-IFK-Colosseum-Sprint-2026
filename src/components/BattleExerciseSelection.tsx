import React, { useState, useEffect } from 'react';
import { Exercise, MuscleGroup, DifficultyLevel, Discipline } from '../types';
import { EXERCISES, getExerciseCategoryTitle, getExerciseCategory } from '../data/exercisesData';
import { battleStore, BattleRoomState } from '../services/battleStore';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';
import { 
  Swords, 
  Search, 
  Check, 
  CheckCircle2, 
  Lock, 
  Camera, 
  AlertTriangle, 
  ArrowLeft, 
  Timer, 
  Dumbbell, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  RotateCcw,
  Zap,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';

interface BattleExerciseSelectionProps {
  onBackToArena: () => void;
  onExerciseConfirmed: (selectedExercise: Exercise) => void;
  onNavigateToPremium?: () => void;
}

export const BattleExerciseSelection: React.FC<BattleExerciseSelectionProps> = ({
  onBackToArena,
  onExerciseConfirmed,
  onNavigateToPremium
}) => {
  const [battleState, setBattleState] = useState<BattleRoomState>(battleStore.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | 'all'>('all');
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = battleStore.subscribe((newState) => {
      setBattleState(newState);

      // Auto-trigger calibration when both are confirmed and ready
      if (newState.state === 'CALIBRATION' || newState.state === 'EXERCISE_CONFIRMED') {
        const agreedId = newState.authoritativeExerciseId || newState.player1.selectedExerciseId || 'pushups_classic';
        const fullExercise = EXERCISES.find(e => e.id === agreedId) || EXERCISES[0];
        onExerciseConfirmed(fullExercise);
      }
    });

    return () => {
      unsub();
    };
  }, [onExerciseConfirmed]);

  const availableExercises = battleStore.getAvailableExercises();

  // Filter exercises by category, search query, difficulty, discipline
  const filteredExercises = availableExercises.filter((ex) => {
    if (selectedCategory !== 'all') {
      const cat = getExerciseCategory(ex);
      if (cat !== selectedCategory) return false;
    }
    if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;
    if (selectedDiscipline !== 'all' && ex.discipline !== selectedDiscipline) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = ex.name.toLowerCase().includes(q);
      const descMatch = ex.description.toLowerCase().includes(q);
      const catMatch = getExerciseCategoryTitle(getExerciseCategory(ex)).toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !catMatch) return false;
    }
    return true;
  });

  const currentUser = authStore.getCurrentUser();
  const isUserPremium = Boolean(currentUser?.isPremium);

  const handleSelectCandidate = async (exercise: Exercise) => {
    sound.playClick();
    setSelectionError(null);

    const res = await battleStore.selectExerciseCandidate(exercise.id);
    if (!res.success && res.error) {
      setSelectionError(res.error);
    }
  };

  const handleConfirmReady = () => {
    sound.playAnvilHit();
    setSelectionError(null);
    battleStore.confirmExerciseReady();
  };

  const handleChangeExercise = () => {
    sound.playClick();
    battleStore.changeExercise();
  };

  const activeMyChoiceId = battleState.player1.selectedExerciseId;
  const activeMyChoice = EXERCISES.find(e => e.id === activeMyChoiceId);

  const activeRivalChoiceId = battleState.player2.selectedExerciseId;
  const activeRivalChoice = EXERCISES.find(e => e.id === activeRivalChoiceId);

  const agreedExerciseId = battleState.authoritativeExerciseId || activeMyChoiceId || 'pushups_classic';
  const agreedExercise = EXERCISES.find(e => e.id === agreedExerciseId) || EXERCISES[0];

  const difficultyBadges: Record<DifficultyLevel, { label: string; color: string }> = {
    beginner: { label: 'Новачок', color: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' },
    intermediate: { label: 'Середній', color: 'bg-amber-950/80 text-amber-400 border-amber-500/30' },
    advanced: { label: 'Просунутий', color: 'bg-red-950/80 text-red-400 border-red-500/30' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Top Navigation & Battle Timer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              battleStore.resetState();
              onBackToArena();
            }}
            className="p-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
            title="Повернутися до Арени"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5" />
              Battle Arena • Кімната {battleState.roomCode}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-heading mt-0.5">
              ВИБІР ВПРАВИ ДЛЯ ДУЕЛІ
            </h1>
          </div>
        </div>

        {/* Selection Timer */}
        <div className="flex items-center gap-3 bg-neutral-950 px-4 py-2.5 rounded-2xl border border-neutral-800 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Таймер вибору:</span>
          </div>
          <span className="text-lg font-black font-mono text-amber-300">
            00:{battleState.selectionTimeLeft < 10 ? `0${battleState.selectionTimeLeft}` : battleState.selectionTimeLeft}
          </span>
        </div>
      </div>

      {/* Opponent Disconnect Alert Overlay */}
      {battleState.state === 'OPPONENT_DISCONNECTED' && (
        <div className="p-6 rounded-3xl bg-red-950/40 border-2 border-red-500/50 text-red-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white">Суперник відключився від сесії</h3>
              <p className="text-xs text-red-300 mt-0.5">
                Вибір вправи скасовано через розрив з'єднання з другого боку.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              battleStore.startMatchmaking(battleState.roomCode);
            }}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-neutral-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Шукати іншого суперника
          </button>
        </div>
      )}

      {/* Error Message Toast */}
      {selectionError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>{selectionError}</span>
          </div>
          {selectionError.includes('Premium') && onNavigateToPremium && (
            <button
              onClick={() => {
                sound.playClick();
                onNavigateToPremium();
              }}
              className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 text-[11px] font-black cursor-pointer hover:bg-amber-400"
            >
              Отримати Premium 🔒
            </button>
          )}
        </div>
      )}

      {/* DUAL FIGHTERS SELECTION STATUS (YOU VS OPPONENT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PLAYER 1: YOU */}
        <div className={`p-6 rounded-3xl border transition-all ${
          battleState.player1.isReady 
            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
            : 'bg-neutral-900/80 border-neutral-800'
        }`}>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={battleState.player1.avatar}
                alt={battleState.player1.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/50 shadow"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">ВАША СТОРОНА</span>
                <h3 className="text-base font-bold text-white">{battleState.player1.name}</h3>
              </div>
            </div>

            <div className="text-right">
              {battleState.player1.isReady ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold">
                  <CheckCircle2 className="w-4 h-4" />
                  ГОТОВИЙ ✓
                </span>
              ) : activeMyChoice ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Обрано
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs font-medium">
                  Обирає...
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 font-medium">Ваш вибір вправи:</span>
                <h4 className="text-sm font-bold text-white">
                  {activeMyChoice ? activeMyChoice.name : 'Натисніть на вправу нижче'}
                </h4>
              </div>
            </div>

            {activeMyChoice && (
              <span className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-mono">
                {activeMyChoice.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* PLAYER 2: OPPONENT */}
        <div className={`p-6 rounded-3xl border transition-all ${
          battleState.player2.isReady 
            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
            : 'bg-neutral-900/80 border-neutral-800'
        }`}>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={battleState.player2.avatar}
                alt={battleState.player2.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-neutral-700 shadow"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">СУПЕРНИК</span>
                <h3 className="text-base font-bold text-white">{battleState.player2.name}</h3>
              </div>
            </div>

            <div className="text-right">
              {!battleState.player2.isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Відключено
                </span>
              ) : battleState.player2.isReady ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold">
                  <CheckCircle2 className="w-4 h-4" />
                  ГОТОВИЙ ✓
                </span>
              ) : activeRivalChoice ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Обрано
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs font-medium">
                  Обирає...
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 font-medium">Вибір суперника:</span>
                <h4 className="text-sm font-bold text-white">
                  {activeRivalChoice ? activeRivalChoice.name : 'Очікується вибір суперника...'}
                </h4>
              </div>
            </div>

            {activeRivalChoice && (
              <span className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-mono">
                {activeRivalChoice.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION & READY ACTION BANNER */}
      {activeMyChoice && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border-2 border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">УЗГОДЖЕНА ВПРАВА</span>
              <h3 className="text-lg font-black text-white">{agreedExercise.name}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Обидва атлети змагатимуться на одній і тій самій вправі за єдиним сервером верифікації.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {battleState.player1.isReady ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Чекаємо на суперника...
                </div>
                <button
                  onClick={handleChangeExercise}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Змінити вправу
                </button>
              </div>
            ) : (
              <button
                onClick={handleConfirmReady}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-sm font-black shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                ПІДТВЕРДИТИ ТА ГОТОВИЙ (READY)
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEARCH, CATEGORIES & FILTERS SECTION */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук вправ для Battle Arena (віджимання, присідання, підтягування)..."
              className="w-full bg-neutral-900/90 text-sm text-neutral-100 pl-11 pr-4 py-3 rounded-2xl border border-neutral-800 focus:outline-none focus:border-amber-400 transition-all placeholder:text-neutral-500"
            />
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  sound.playClick();
                  setSelectedDifficulty(diff);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {diff === 'all' && 'Усі рівні'}
                {diff === 'beginner' && 'Новачок'}
                {diff === 'intermediate' && 'Середній'}
                {diff === 'advanced' && 'Просунутий'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Всі вправи' },
            { id: 'upper_body', label: 'Верх тіла' },
            { id: 'legs', label: 'Ноги' },
            { id: 'core', label: 'Кор' },
            { id: 'full_body', label: 'Все тіло' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-black shadow'
                  : 'bg-neutral-900/70 border border-neutral-800/80 text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* EXERCISES CATALOG GRID */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-neutral-900/50 border border-neutral-800 space-y-3">
          <Dumbbell className="w-10 h-10 text-neutral-600 mx-auto" />
          <h4 className="text-base font-bold text-neutral-300">Вправ за вказаними фільтрами не знайдено</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Спробуйте скинути фільтри або змінити пошуковий запит.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer hover:bg-neutral-700"
          >
            Скинути фільтри
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => {
            const isSelectedByMe = activeMyChoiceId === exercise.id;
            const isSelectedByRival = activeRivalChoiceId === exercise.id;
            const isPremiumLock = Boolean((exercise as any).premium) && !isUserPremium;
            const diffMeta = difficultyBadges[exercise.difficulty] || difficultyBadges.beginner;

            return (
              <div
                key={exercise.id}
                onClick={() => handleSelectCandidate(exercise)}
                className={`group rounded-3xl border p-5 transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  isSelectedByMe
                    ? 'bg-gradient-to-b from-amber-950/40 to-neutral-900 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-amber-500/40 hover:bg-neutral-900'
                }`}
              >
                {/* Selection Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${diffMeta.color}`}>
                    {diffMeta.label}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPremiumLock && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Premium
                      </span>
                    )}

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Camera Verified
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                    {exercise.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-neutral-400">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800">
                    {exercise.discipline === 'calisthenics' ? 'Калістеніка' : exercise.discipline === 'bodybuilding' ? 'Бодибілдинг' : 'Гібрид'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800">
                    {exercise.location === 'home' ? 'Без обладнання' : 'Спортивний зал'}
                  </span>
                </div>

                {/* Selection Action Button */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    +{exercise.xpPerRep} XP / rep
                  </span>

                  {isSelectedByMe ? (
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-black flex items-center gap-1.5 shadow">
                      <Check className="w-4 h-4 stroke-[3]" />
                      Обрано вами
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 group-hover:bg-amber-500 group-hover:text-neutral-950 text-neutral-300 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>Обрати</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Rival selection indicator banner */}
                {isSelectedByRival && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-neutral-950 text-[10px] font-black px-3 py-0.5 rounded-bl-xl shadow">
                    Вибір суперника
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
