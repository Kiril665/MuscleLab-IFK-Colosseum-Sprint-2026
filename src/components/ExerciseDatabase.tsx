import React, { useState } from 'react';
import { Exercise, MuscleGroup, LocationType, DifficultyLevel, Discipline } from '../types';
import { 
  EXERCISES, 
  MUSCLE_GROUPS_META, 
  EXERCISE_CATEGORIES_META,
  getExerciseCategory,
  getExerciseCategoryTitle,
  getCameraViewLabel,
  getExerciseInstructions,
  getExerciseDifficultyDisplay
} from '../data/exercisesData';
import { MuscleMap } from './MuscleMap';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';
import { sound } from '../services/soundEngine';
import { 
  Filter, 
  Dumbbell, 
  Home, 
  Building2, 
  Play, 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  XCircle,
  Flame,
  Tv,
  Video,
  Activity,
  Camera,
  Eye,
  Clock,
  Search,
  Shield,
  Compass,
  ArrowRight
} from 'lucide-react';

interface ExerciseDatabaseProps {
  onStartExercise: (exercise: Exercise) => void;
  defaultSelectedMuscle?: MuscleGroup | null;
}

export const ExerciseDatabase: React.FC<ExerciseDatabaseProps> = ({
  onStartExercise,
  defaultSelectedMuscle = null
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(defaultSelectedMuscle);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | 'all'>('all');
  const [activeExerciseModal, setActiveExerciseModal] = useState<Exercise | null>(null);
  const [modalTab, setModalTab] = useState<'instructions' | 'video' | 'technique'>('instructions');

  const filteredExercises = EXERCISES.filter((ex) => {
    if (selectedCategory !== 'all') {
      const cat = getExerciseCategory(ex);
      if (cat !== selectedCategory) return false;
    }
    if (selectedMuscle && ex.muscle !== selectedMuscle) return false;
    if (selectedLocation !== 'all' && ex.location !== selectedLocation) return false;
    if (selectedDifficulty !== 'all') {
      const diffDisplay = getExerciseDifficultyDisplay(ex.difficulty);
      if (selectedDifficulty === 'beginner' && diffDisplay.level !== 'easy') return false;
      if (selectedDifficulty === 'intermediate' && diffDisplay.level !== 'medium') return false;
      if (selectedDifficulty === 'advanced' && diffDisplay.level !== 'hard') return false;
    }
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

  const handleOpenDetail = (ex: Exercise, tab: 'instructions' | 'video' | 'technique' = 'instructions') => {
    sound.playClick();
    setModalTab(tab);
    setActiveExerciseModal(ex);
  };

  const handleCloseDetail = () => {
    sound.playClick();
    setActiveExerciseModal(null);
  };

  const handleStartWorkout = (ex: Exercise) => {
    sound.playAnvilHit();
    setActiveExerciseModal(null);
    onStartExercise(ex);
  };

  const difficultyBadges: Record<DifficultyLevel, { label: string; color: string }> = {
    beginner: { label: 'Новачок', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' },
    intermediate: { label: 'Середній', color: 'bg-amber-950/60 text-amber-400 border-amber-500/30' },
    advanced: { label: 'Просунутий', color: 'bg-red-950/60 text-red-400 border-red-500/30' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Dumbbell className="w-3.5 h-3.5" />
            Енциклопедія Руху
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
            БАЗА ВПРАВ ТА РОЗБІР ТЕХНІКИ
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base font-sans mt-1">
            Обирай мʼязові групи на анатомічній карті або скористайся фільтрами нижче.
          </p>
        </div>

        <div className="text-sm text-neutral-400">
          Знайдено вправ: <strong className="text-amber-400">{filteredExercises.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Muscle Map & Fast Selection */}
        <div className="lg:col-span-4 space-y-6">
          <MuscleMap
            selectedMuscle={selectedMuscle}
            onSelectMuscle={setSelectedMuscle}
          />

          {/* Quick Muscle Pills */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Швидкий вибір груп мʼязів
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedMuscle(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMuscle === null
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Всі групи
              </button>
              {MUSCLE_GROUPS_META.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedMuscle(m.id === selectedMuscle ? null : m.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedMuscle === m.id
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {m.nameUk}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Categories, Search, Filters and Exercise Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category Tabs */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Категорія вправ
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                {selectedCategory === 'all' ? 'Усі категорії' : getExerciseCategoryTitle(selectedCategory)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXERCISE_CATEGORIES_META.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-btn-${cat.id}`}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-extrabold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>{cat.nameUk}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar & Secondary Filters */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою або описом (наприклад: віджимання, планка, прес)..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Location Filter */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                  Локація
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedLocation(e.target.value as LocationType | 'all');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Усі локації</option>
                  <option value="gym">Тренажерний зал</option>
                  <option value="home">Дім / Майданчик</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                  Складність
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedDifficulty(e.target.value as DifficultyLevel | 'all');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Будь-яка складність</option>
                  <option value="beginner">Легка (Новачок)</option>
                  <option value="intermediate">Середня (База)</option>
                  <option value="advanced">Висока (Просунутий)</option>
                </select>
              </div>

              {/* Discipline Filter */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                  Напрямок
                </label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedDiscipline(e.target.value as Discipline | 'all');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Усі напрямки</option>
                  <option value="calisthenics">Калістеніка</option>
                  <option value="bodybuilding">Бодибілдинг</option>
                  <option value="hybrid">Гібрид</option>
                </select>
              </div>
            </div>
          </div>

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map((ex) => {
              const diffDisplay = getExerciseDifficultyDisplay(ex.difficulty);
              const categoryTitle = getExerciseCategoryTitle(getExerciseCategory(ex));
              const cameraViewLabel = getCameraViewLabel(ex.cameraView);

              return (
                <div
                  key={ex.id}
                  id={`exercise-card-${ex.id}`}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900/90 hover:border-amber-500/40 p-5 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                >
                  <div className="space-y-3">
                    {/* Header Tags: Category & Difficulty */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wide">
                          {categoryTitle}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${diffDisplay.color}`}>
                          {diffDisplay.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                        +{ex.xpPerRep} XP
                      </div>
                    </div>

                    {/* Exercise Title */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors font-heading leading-snug">
                        {ex.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                        <span className="capitalize">{ex.muscle}</span>
                        <span>•</span>
                        <span>{ex.location === 'gym' ? 'Зал' : 'Дім / Турнік'}</span>
                        {ex.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-neutral-300">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {ex.duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                      {ex.description}
                    </p>

                    {/* Recommended Camera View & AI Tracking Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(ex.cameraTrackingSupported || Boolean(ex.cameraVerifierId)) ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          <span>AI Трекінг та Симулятор <strong className="text-emerald-300 font-bold">✓</strong></span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs font-normal text-neutral-400">
                          <Camera className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span>Довідковий гайд</span>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300">
                        <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Ракурс: <strong className="text-amber-300">{cameraViewLabel}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Detail Link + Prominent Start Button */}
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(ex, 'instructions')}
                      className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 py-1"
                    >
                      Інструкція / Розбір
                    </button>

                    <button
                      id={`start-btn-${ex.id}`}
                      type="button"
                      onClick={() => {
                        sound.playAnvilHit();
                        onStartExercise(ex);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95 transition-all cursor-pointer font-heading tracking-wide"
                    >
                      <Play className="w-3.5 h-3.5 fill-neutral-950" />
                      ПОЧАТИ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-800 p-8 space-y-3">
              <p className="text-neutral-400">За обраними фільтрами вправ не знайдено.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setSelectedMuscle(null);
                  setSelectedLocation('all');
                  setSelectedDifficulty('all');
                  setSelectedDiscipline('all');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold cursor-pointer"
              >
                Скинути всі фільтри
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EXERCISE DETAIL MODAL */}
      {activeExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Close button */}
            <button
              id="close-exercise-modal"
              onClick={handleCloseDetail}
              className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title & tags */}
            <div className="space-y-3 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase tracking-wide">
                  {getExerciseCategoryTitle(getExerciseCategory(activeExerciseModal))}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${getExerciseDifficultyDisplay(activeExerciseModal.difficulty).color}`}>
                  Складність: {getExerciseDifficultyDisplay(activeExerciseModal.difficulty).label}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-amber-400" />
                  Ракурс: {getCameraViewLabel(activeExerciseModal.cameraView)}
                </span>
                {activeExerciseModal.duration && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {activeExerciseModal.duration}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                {activeExerciseModal.name}
              </h2>
              <p className="text-sm text-neutral-300 font-sans leading-relaxed">
                {activeExerciseModal.description}
              </p>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
              <button
                onClick={() => {
                  sound.playClick();
                  setModalTab('instructions');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  modalTab === 'instructions'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Інструкція виконання
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setModalTab('video');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  modalTab === 'video'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Відео-Урок YouTube
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setModalTab('technique');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  modalTab === 'technique'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Чек-лист помилок
              </button>
            </div>

            {/* TAB CONTENT: INSTRUCTIONS */}
            {modalTab === 'instructions' && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Покроковий алгоритм руху:
                </div>
                <div className="space-y-2.5">
                  {getExerciseInstructions(activeExerciseModal).map((step, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3 text-sm text-neutral-200">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs border border-amber-500/40">
                        {idx + 1}
                      </span>
                      <span className="leading-snug pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <Camera className="w-4 h-4 text-amber-400" />
                    Необхідний ракурс камери для відстеження:
                  </span>
                  <span className="font-bold text-amber-300 uppercase">
                    {getCameraViewLabel(activeExerciseModal.cameraView)}
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: VIDEO PLAYER */}
            {modalTab === 'video' && (
              <div className="space-y-4">
                <ExerciseVideoPlayer
                  exercise={activeExerciseModal}
                  compact={false}
                />
              </div>
            )}

            {/* TAB CONTENT: TECHNIQUE CHECKLIST */}
            {modalTab === 'technique' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Як треба 🟩 */}
                  <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-heading">
                      <Check className="w-4 h-4" />
                      ЯК ТРЕБА 🟩
                    </div>
                    <ul className="space-y-2 text-xs text-neutral-300">
                      {activeExerciseModal.techniqueGood.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Як не можна 🟥 */}
                  <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm font-heading">
                      <XCircle className="w-4 h-4" />
                      ЯК НЕ МОЖНА 🟥
                    </div>
                    <ul className="space-y-2 text-xs text-neutral-300">
                      {activeExerciseModal.techniqueBad.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Coach Tip */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-amber-400">Порада від Кузні: </strong>
                {activeExerciseModal.tips}
              </span>
            </div>

            {/* Action CTA: Launch into Camera Tracker */}
            <div className="pt-2">
              <button
                id="modal-start-exercise-btn"
                onClick={() => handleStartWorkout(activeExerciseModal)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-neutral-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-heading tracking-wide"
              >
                <Play className="w-5 h-5 fill-neutral-950" />
                ПОЧАТИ ТРЕНУВАННЯ З КАМЕРОЮ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
