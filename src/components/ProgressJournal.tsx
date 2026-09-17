import React, { useState } from 'react';
import { WorkoutSession, AnvilStage, Discipline } from '../types';
import { ANVIL_STAGES } from '../data/exercisesData';
import { sound } from '../services/soundEngine';
import { 
  Trophy, 
  Flame, 
  Calendar, 
  History, 
  Shield, 
  Sparkles, 
  PlusCircle, 
  Trash2, 
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface ProgressJournalProps {
  sessions: WorkoutSession[];
  totalXp: number;
  currentStage: AnvilStage;
  onAddManualSession: (session: WorkoutSession) => void;
  onClearHistory: () => void;
  userDiscipline: Discipline | null;
}

export const ProgressJournal: React.FC<ProgressJournalProps> = ({
  sessions,
  totalXp,
  currentStage,
  onAddManualSession,
  onClearHistory,
  userDiscipline
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [manualExName, setManualExName] = useState<string>('Підтягування зворотним хватом');
  const [manualReps, setManualReps] = useState<number>(10);
  const [manualDiscipline, setManualDiscipline] = useState<Discipline>(userDiscipline || 'calisthenics');

  // Calculate streak
  const uniqueDates = Array.from(
    new Set(
      sessions.map((s) => new Date(s.date).toISOString().split('T')[0])
    )
  ).sort();

  const currentStreakDays = uniqueDates.length;

  // Find stage meta
  const currentStageInfo = ANVIL_STAGES.find((s) => s.stage === currentStage) || ANVIL_STAGES[0];
  const nextStageIndex = ANVIL_STAGES.findIndex((s) => s.stage === currentStage) + 1;
  const nextStageInfo = ANVIL_STAGES[nextStageIndex] || null;

  // Calculate percentage to next stage
  let stageProgressPercent = 100;
  if (nextStageInfo) {
    const range = nextStageInfo.minXp - currentStageInfo.minXp;
    const currentProgress = totalXp - currentStageInfo.minXp;
    stageProgressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
  }

  // Last 14 days calendar days for heatmap
  const daysList = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const isoDate = d.toISOString().split('T')[0];
    const hasWorkout = uniqueDates.includes(isoDate);
    const dayName = d.toLocaleDateString('uk-UA', { weekday: 'short' });
    const dayNumber = d.getDate();
    return { isoDate, hasWorkout, dayName, dayNumber };
  });

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playAnvilHit();

    const newSes: WorkoutSession = {
      id: `manual_${Date.now()}`,
      date: new Date().toISOString(),
      exerciseName: manualExName,
      muscleGroup: 'back',
      discipline: manualDiscipline,
      reps: manualReps,
      totalXp: manualReps * 15,
      durationSeconds: manualReps * 4
    };

    onAddManualSession(newSes);
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Особистий Кабінет Коваля
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
            ЖУРНАЛ ПРОГРЕСУ ТА ЕВОЛЮЦІЯ КОВАДЛА
          </h1>
          <p className="text-neutral-400 text-sm font-sans mt-1">
            Відстежуй тренувальні серії, історію виконаних підходів та підвищуй рівень свого аватара.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="add-manual-workout-btn"
            onClick={() => {
              sound.playClick();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading"
          >
            <PlusCircle className="w-4 h-4" />
            Записати тренування
          </button>
        </div>
      </div>

      {/* Top 3 Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total XP */}
        <div className="rounded-2xl border border-amber-500/30 bg-neutral-900/80 p-6 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold">
            <span>Загальний досвід (XP)</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-4xl font-extrabold text-amber-400 font-heading">
            {totalXp} <span className="text-base text-neutral-400 font-sans font-normal">XP</span>
          </div>
          <p className="text-xs text-neutral-400 pt-1">
            Кожне повторення в камері додає сили твоєму аватару.
          </p>
        </div>

        {/* Training Streak */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold">
            <span>Стрік тренувань</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-4xl font-extrabold text-emerald-400 font-heading">
            {currentStreakDays} <span className="text-base text-neutral-400 font-sans font-normal">днів</span>
          </div>
          <p className="text-xs text-neutral-400 pt-1">
            Завершені сесії підтримують вогонь кузні безперервним.
          </p>
        </div>

        {/* Current Anvil Evolution */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold">
            <span>Поточний статус</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-heading truncate">
            {currentStageInfo.name}
          </div>
          <p className="text-xs text-amber-300/80 font-medium pt-1">
            {currentStageInfo.badge}
          </p>
        </div>
      </div>

      {/* Anvil Evolution Stages Visualizer Section */}
      <div className="rounded-3xl border border-amber-500/30 bg-neutral-900/70 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-heading">
              СТУПЕНІ ЕВОЛЮЦІЇ КОВАДЛА
            </h2>
            <p className="text-sm text-neutral-400 font-sans">
              Накопичуй XP, щоб трансформувати сире залізо в розжарену ауру могутності.
            </p>
          </div>

          {nextStageInfo && (
            <div className="text-right">
              <span className="text-xs text-neutral-400 block">До наступного рівня:</span>
              <strong className="text-amber-400 font-heading text-lg">
                {Math.max(0, nextStageInfo.minXp - totalXp)} XP
              </strong>
            </div>
          )}
        </div>

        {/* Progress Bar to next stage */}
        {nextStageInfo && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-400 font-semibold">
              <span>{currentStageInfo.name} ({currentStageInfo.minXp} XP)</span>
              <span>{stageProgressPercent}%</span>
              <span>{nextStageInfo.name} ({nextStageInfo.minXp} XP)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-950 border border-neutral-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{ width: `${stageProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 4 Evolutionary Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {ANVIL_STAGES.map((st, idx) => {
            const isCurrent = st.stage === currentStage;
            const isUnlocked = totalXp >= st.minXp;

            return (
              <div
                key={st.stage}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                  isCurrent
                    ? 'border-amber-500 bg-neutral-900 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
                    : isUnlocked
                    ? 'border-neutral-700 bg-neutral-950/80 text-neutral-300'
                    : 'border-neutral-850 bg-neutral-950/40 opacity-60'
                }`}
              >
                {/* Visual Stage Anvil Graphic */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      Рівень {idx + 1}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-neutral-950">
                        Поточний
                      </span>
                    )}
                  </div>

                  {/* Stage SVG Icon */}
                  <div className="flex justify-center py-2">
                    <svg viewBox="0 0 100 60" className="w-24 h-16">
                      <path
                        d="M15 22 L75 22 Q90 22 95 28 L80 36 L70 36 L74 52 L26 52 L30 36 L12 36 Q8 28 15 22 Z"
                        fill={isCurrent ? '#f59e0b' : isUnlocked ? '#71717a' : '#27272a'}
                        stroke={isCurrent ? '#fbbf24' : '#52525b'}
                        strokeWidth="1.5"
                      />
                      {st.stage === 'fiery_aura' && (
                        <circle cx="50" cy="30" r="24" fill="none" stroke="#ea580c" strokeWidth="2" strokeDasharray="3 3" />
                      )}
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      {st.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1">
                      {st.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-neutral-800 text-xs">
                  <div className="text-[11px] font-bold text-amber-400 uppercase">
                    Привілеї:
                  </div>
                  <ul className="space-y-1 text-neutral-400 text-[11px]">
                    {st.perks.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-amber-500">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 14-Day Activity Heatmap Strip */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Календар активності (Останні 14 днів)
          </h3>
          <span className="text-xs text-neutral-400">
            Зелений колір = день із виконаним тренуванням
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 text-center">
          {daysList.map((day) => (
            <div
              key={day.isoDate}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                day.hasWorkout
                  ? 'bg-emerald-950/60 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-neutral-950 border-neutral-850'
              }`}
            >
              <span className="text-[10px] text-neutral-500 uppercase">{day.dayName}</span>
              <span className={`text-base font-bold font-heading ${day.hasWorkout ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {day.dayNumber}
              </span>
              <span className="text-[10px] mt-0.5">
                {day.hasWorkout ? '🔥' : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workouts History List */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Історія виконаних тренувань ({sessions.length})
          </h3>
          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Справді очистити історію журналу?')) {
                  sound.playClick();
                  onClearHistory();
                }
              }}
              className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистити історію
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-neutral-800 rounded-xl space-y-2">
            <p className="text-neutral-400 text-sm">У журналі поки немає записів.</p>
            <p className="text-neutral-500 text-xs">
              Виконай вправу в Камера-трекері або скористайся кнопкою «Записати тренування».
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-850/40 px-2 rounded-lg transition-colors"
              >
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white font-heading">
                    {ses.exerciseName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>{new Date(ses.date).toLocaleDateString('uk-UA')}</span>
                    <span>•</span>
                    <span className="capitalize">{ses.muscleGroup}</span>
                    <span>•</span>
                    <span className="capitalize">{ses.discipline}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-sm font-bold text-neutral-200 block font-heading">
                      {ses.reps} репів
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      +{ses.totalXp} XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MANUAL WORKOUT LOG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-heading">
                Записати тренування вручну
              </h3>
              <p className="text-xs text-neutral-400 font-sans">
                Додай підхід до свого журналу та отримай належний XP.
              </p>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-neutral-400 block mb-1">
                  Назва вправи
                </label>
                <input
                  type="text"
                  required
                  value={manualExName}
                  onChange={(e) => setManualExName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-neutral-400 block mb-1">
                  Кількість повторень
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={manualReps}
                  onChange={(e) => setManualReps(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-neutral-400 block mb-1">
                  Напрямок
                </label>
                <select
                  value={manualDiscipline}
                  onChange={(e) => setManualDiscipline(e.target.value as Discipline)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="bodybuilding">Бодибілдинг</option>
                  <option value="calisthenics">Калістеніка</option>
                  <option value="hybrid">Гібрид</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer font-heading"
                >
                  Зберегти підхід
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
