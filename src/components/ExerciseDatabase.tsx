import React, { useState } from 'react';
import { Exercise, MuscleGroup, LocationType, DifficultyLevel, Discipline } from '../types';
import { EXERCISES, MUSCLE_GROUPS_META } from '../data/exercisesData';
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
  Activity
} from 'lucide-react';

interface ExerciseDatabaseProps {
  onStartExercise: (exercise: Exercise) => void;
  defaultSelectedMuscle?: MuscleGroup | null;
}

export const ExerciseDatabase: React.FC<ExerciseDatabaseProps> = ({
  onStartExercise,
  defaultSelectedMuscle = null
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(defaultSelectedMuscle);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | 'all'>('all');
  const [activeExerciseModal, setActiveExerciseModal] = useState<Exercise | null>(null);
  const [modalTab, setModalTab] = useState<'video' | 'technique'>('video');

  const filteredExercises = EXERCISES.filter((ex) => {
    if (selectedMuscle && ex.muscle !== selectedMuscle) return false;
    if (selectedLocation !== 'all' && ex.location !== selectedLocation) return false;
    if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;
    if (selectedDiscipline !== 'all' && ex.discipline !== selectedDiscipline) return false;
    return true;
  });

  const handleOpenDetail = (ex: Exercise, tab: 'video' | 'technique' = 'video') => {
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

        {/* Right Column: Filters and Exercise Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Horizontal Filters Bar */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
              <Filter className="w-4 h-4 text-amber-400" />
              Фільтри вправ
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-neutral-400 block mb-1.5">
                  Місце тренування
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedLocation(e.target.value as LocationType | 'all');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Усі локації (Зал + Дім)</option>
                  <option value="gym">Тренажерний зал (Залізо)</option>
                  <option value="home">Дім / Воркаут майданчик</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-neutral-400 block mb-1.5">
                  Складність
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedDifficulty(e.target.value as DifficultyLevel | 'all');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Будь-яка складність</option>
                  <option value="beginner">Новачок</option>
                  <option value="intermediate">Середній рівень</option>
                  <option value="advanced">Просунутий рівень</option>
                </select>
              </div>

              {/* Discipline Filter */}
              <div>
                <label className="text-[11px] uppercase font-semibold text-neutral-400 block mb-1.5">
                  Напрямок
                </label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedDiscipline(e.target.value as Discipline | 'all');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Усі напрямки</option>
                  <option value="bodybuilding">Бодибілдинг</option>
                  <option value="calisthenics">Калістеніка</option>
                  <option value="hybrid">Гібрид</option>
                </select>
              </div>
            </div>
          </div>

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map((ex) => {
              const diffBadge = difficultyBadges[ex.difficulty];
              return (
                <div
                  key={ex.id}
                  id={`exercise-card-${ex.id}`}
                  onClick={() => handleOpenDetail(ex)}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-amber-500/40 p-5 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${diffBadge.color}`}>
                        {diffBadge.label}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                        +{ex.xpPerRep} XP / реп
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors font-heading leading-snug">
                        {ex.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                        <span className="capitalize">{ex.muscle}</span>
                        <span>•</span>
                        <span>{ex.location === 'gym' ? 'Зал' : 'Дім / Турнік'}</span>
                        <span>•</span>
                        <span className="capitalize">{ex.discipline}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                      {ex.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">{ex.repsGuide}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(ex, 'video');
                        }}
                        className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Tv className="w-3 h-3" />
                        Відео
                      </button>
                      <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Розбір &rarr;
                      </span>
                    </div>
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
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase tracking-wide">
                  {activeExerciseModal.discipline}
                </span>
                <span className="text-xs font-bold text-neutral-400 uppercase">
                  {activeExerciseModal.muscle}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                {activeExerciseModal.name}
              </h2>
              <p className="text-sm text-neutral-300 font-sans">
                {activeExerciseModal.description}
              </p>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setModalTab('video');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modalTab === 'video'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Відео-Урок YouTube & 3D Біомеханіка
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setModalTab('technique');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modalTab === 'technique'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Чек-лист техніки (Як треба / Як не можна)
              </button>
            </div>

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
                {/* Technique Breakdown: Як треба 🟩 / Як не можна 🟥 */}
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
                <Flame className="w-5 h-5 fill-neutral-950" />
                ПОЧАТИ ТРЕНУВАННЯ З КАМЕРА-ТРЕКЕРОМ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
