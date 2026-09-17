import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  RotateCcw,
  Play,
  Dumbbell,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  ArrowRight,
  GitFork,
  Lock,
  Check,
  Shield,
  Award,
  Activity
} from 'lucide-react';
import { journeyStore, ForgeEngineOptions } from '../services/journeyStore';
import { UserJourney, ForgeEngineWorkout, Discipline, DifficultyLevel, GoalType, Exercise } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';

interface ForgeJourneyEngineProps {
  onStartExercise: (exercise: Exercise) => void;
  onNavigate: (tab: string) => void;
  userDiscipline?: Discipline | null;
  onSelectDiscipline?: (discipline: Discipline) => void;
}

export const ForgeJourneyEngine: React.FC<ForgeJourneyEngineProps> = ({
  onStartExercise,
  onNavigate,
  userDiscipline,
  onSelectDiscipline
}) => {
  const [journey, setJourney] = useState<UserJourney>(journeyStore.getJourney());
  const [engineWorkout, setEngineWorkout] = useState<ForgeEngineWorkout>(journeyStore.getCurrentEngineWorkout());
  const [showGeneratorModal, setShowGeneratorModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'tree' | 'roadmap'>('daily');
  const [selectedBranch, setSelectedBranch] = useState<Discipline>(journey.discipline);

  // Engine Generator state
  const [genDiscipline, setGenDiscipline] = useState<Discipline>(journey.discipline);
  const [genLevel, setGenLevel] = useState<DifficultyLevel>('intermediate');
  const [genDuration, setGenDuration] = useState<number>(journey.availableTimeMinutes);
  const [genGoal, setGenGoal] = useState<GoalType>(journey.goal);
  const [genEquipment, setGenEquipment] = useState<string[]>(journey.availableEquipment);

  useEffect(() => {
    const unsub = journeyStore.subscribe(() => {
      const j = journeyStore.getJourney();
      setJourney(j);
      setSelectedBranch(j.discipline);
      setEngineWorkout(journeyStore.getCurrentEngineWorkout());
    });
    return () => unsub();
  }, []);

  const handleSwitchBranch = (branch: Discipline) => {
    sound.playAnvilHit();
    setSelectedBranch(branch);
    journeyStore.setDiscipline(branch);
    if (onSelectDiscipline) onSelectDiscipline(branch);
    const branchName = branch === 'bodybuilding' ? 'Бодибілдингу' : branch === 'calisthenics' ? 'Калістеніки' : 'Гібридного Атлетизму';
    arnoVoice.speak(`Перемкнуто на бойову гілку ${branchName}! Твій персональний шлях та вправи оновлено!`, { force: true });
  };

  const handleGenerate = () => {
    const opts: ForgeEngineOptions = {
      discipline: genDiscipline,
      level: genLevel,
      equipment: genEquipment,
      durationMinutes: genDuration,
      goal: genGoal
    };
    const generated = journeyStore.generateWorkout(opts);
    setEngineWorkout(generated);
    setShowGeneratorModal(false);
  };

  const handleSubstitute = (idx: number) => {
    journeyStore.substituteExercise(idx);
  };

  const handleCompleteToday = () => {
    journeyStore.completeTodayWorkout();
  };

  const handleLaunchExercise = (exerciseId: string) => {
    const found = EXERCISES.find((e) => e.id === exerciseId) || EXERCISES[0];
    sound.playClick();
    onStartExercise(found);
  };

  const equipmentOptions = ['турнік', 'бруси', 'гантелі', 'штанга', 'резинові петлі', 'лава', 'власна вага'];

  const toggleEquipment = (eq: string) => {
    sound.playClick();
    if (genEquipment.includes(eq)) {
      setGenEquipment(genEquipment.filter((item) => item !== eq));
    } else {
      setGenEquipment([...genEquipment, eq]);
    }
  };

  // Branch Skill Trees Data
  const branchSkillTrees: Record<Discipline, {
    title: string;
    badge: string;
    desc: string;
    nodes: Array<{
      id: string;
      tier: number;
      name: string;
      levelReq: number;
      desc: string;
      perk: string;
      xp: number;
      exerciseIds: string[];
    }>;
  }> = {
    bodybuilding: {
      title: 'Гілка Бодибілдингу (Iron Path)',
      badge: 'Залізо & Гіпертрофія',
      desc: 'Прогресивне перевантаження, глибока ізоляція мʼязових пучків та формування ідеальної естетичної симетрії.',
      nodes: [
        {
          id: 'bb_1',
          tier: 1,
          name: 'Залізний Фундамент: Базовий Жим & Присід',
          levelReq: 1,
          desc: 'Постановка правильної траєкторії штанги, активація грудних та квадрицепсів без перевантаження суглобів.',
          perk: '+15% до стабільності хребта під осьовим навантаженням',
          xp: 300,
          exerciseIds: ['bench_press_barbell', 'barbell_squats']
        },
        {
          id: 'bb_2',
          tier: 2,
          name: 'Тяга Титана & Потужні Плечі',
          levelReq: 3,
          desc: 'Створення V-подібного силуету: класична станова тяга та вертикальні армійські жими гантелей.',
          perk: 'Відкриває дроп-сети в генераторі Forge Engine',
          xp: 450,
          exerciseIds: ['deadlift_classic', 'dumbbell_shoulder_press']
        },
        {
          id: 'bb_3',
          tier: 3,
          name: 'Скульптор Симетрії: Руки та Ізоляція',
          levelReq: 5,
          desc: 'Цільова робота над біцепсом та трицепсом: французький жим, підйоми гантелей та гакк-присідання.',
          perk: '+20% до пампінгу та венозності мʼязових груп',
          xp: 650,
          exerciseIds: ['bicep_curls_dumbbell', 'skull_crushers', 'dumbbell_bench_press']
        },
        {
          id: 'bb_4',
          tier: 4,
          name: 'Залізний Оверлоад: Максимальна Сила & 1RM',
          levelReq: 8,
          desc: 'Робота в діапазоні 85-95% від 1ПМ, форсовані повторення та пікова залізна потужність.',
          perk: 'Титул «Iron Titan» та ексклюзивний скін ковадла',
          xp: 1000,
          exerciseIds: ['bench_press_barbell', 'deadlift_classic']
        }
      ]
    },
    calisthenics: {
      title: 'Гілка Калістеніки (Gravity Rebel)',
      badge: 'Гравітація & Турніки',
      desc: 'Мистецтво володіння власною вагою у тривимірному просторі: від перших чистих підтягувань до горизонтальних висів.',
      nodes: [
        {
          id: 'cal_1',
          tier: 1,
          name: 'Базовий Воркаут: Відтискання & Чисті Підтягування',
          levelReq: 1,
          desc: 'Анатомічно правильний хват, депресія лопаток та повна амплітуда без ривків тіла.',
          perk: 'Зміцнення запʼястних та ліктьових звʼязок',
          xp: 300,
          exerciseIds: ['pushups_classic', 'pullups_classic']
        },
        {
          id: 'cal_2',
          tier: 2,
          name: 'Бруси & Високі Підтягування до Грудей',
          levelReq: 3,
          desc: 'Глибина опускання на брусах під контролем, вибуховий підйом до перекладини.',
          perk: 'Відкриває статичні сети в таймері відпочинку',
          xp: 450,
          exerciseIds: ['dips_bars', 'pullups_wide']
        },
        {
          id: 'cal_3',
          tier: 3,
          name: 'Силовий Вихід & Утримання Куточка L-Sit',
          levelReq: 5,
          desc: 'Перехід над перекладиною двома руками одночасно та залізне утримання пресу.',
          perk: '+25% до сили хапа та передачі імпульсу',
          xp: 650,
          exerciseIds: ['muscle_up', 'l_sit_hold']
        },
        {
          id: 'cal_4',
          tier: 4,
          name: 'Гравітаційний Горизонт: Передній Вис & Planche',
          levelReq: 8,
          desc: 'Вища ліга вуличної гімнастики: паралельне положення тіла відносно землі в повітрі.',
          perk: 'Титул «Gravity Sovereign» та доступ до Pro-Hub арени',
          xp: 1000,
          exerciseIds: ['front_lever_hold', 'planche_lean']
        }
      ]
    },
    hybrid: {
      title: 'Гілка Гібридного Атлетизму (Titan Fusion)',
      badge: 'Абсолютний Синтез',
      desc: 'Поєднання важких залізних тяг з гімнастичною грацією на турніку: тіло універсального солдата.',
      nodes: [
        {
          id: 'hyb_1',
          tier: 1,
          name: 'Синтез Бази: Штанга + Турнік',
          levelReq: 1,
          desc: 'Поєднання горизонтального жиму та вертикальних тяг для симетричного розвитку передньої та задньої лінії.',
          perk: 'Баланс сили штовхання та притягування',
          xp: 350,
          exerciseIds: ['pullups_classic', 'bench_press_barbell']
        },
        {
          id: 'hyb_2',
          tier: 2,
          name: 'Вибухова Міць: Бруси + Важкий Присід',
          levelReq: 3,
          desc: 'Трансфер вибухової сили ніг та стабільного плечового поясу для високих атлетичних результатів.',
          perk: 'Підвищена витривалість у Battle Mode',
          xp: 500,
          exerciseIds: ['dips_bars', 'barbell_squats']
        },
        {
          id: 'hyb_3',
          tier: 3,
          name: 'Титанічний Супер-сет: Muscle-Up + Станова Тяга',
          levelReq: 5,
          desc: 'Повний цикл максимальної функціональної міцності: вихід над перекладиною та підйом подвійної ваги.',
          perk: '+30% до швидкості відновлення між підходами',
          xp: 750,
          exerciseIds: ['muscle_up', 'deadlift_classic']
        },
        {
          id: 'hyb_4',
          tier: 4,
          name: 'Apex Titan: Абсолютний Атлет Forge',
          levelReq: 8,
          desc: 'Гармонія без компромісів: однакова впевненість у залі зі штангою та на вуличній арені.',
          perk: 'Титул «Titan of Two Realms» & золоте сяйво профілю',
          xp: 1100,
          exerciseIds: ['muscle_up', 'front_lever_hold', 'bench_press_barbell']
        }
      ]
    }
  };

  const currentTree = branchSkillTrees[selectedBranch];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner: Forge Journey */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-10 shadow-[0_0_35px_rgba(245,158,11,0.12)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Персональний Шлях Атлета
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-800 border border-neutral-700 text-neutral-300">
                Активна гілка: {journey.discipline === 'calisthenics' ? '🤸 Калістеніка' : journey.discipline === 'bodybuilding' ? '🏋️ Бодибілдинг' : '🔥 Гібрид'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-epic tracking-wide text-neutral-100">
              FORGE JOURNEY
            </h1>
            <p className="text-neutral-400 text-sm max-w-2xl mt-1.5 leading-relaxed">
              Індивідуальний маршрут без медичних обмежень: прогресивне навантаження, синхронізація з рівнем ковадла, квестами та стріком.
            </p>
          </div>

          {/* Quick Stats Pill Group */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
              <span className="text-xs text-neutral-400 block font-medium">Стрік Днів</span>
              <span className="text-xl font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
                {journey.streak}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
              <span className="text-xs text-neutral-400 block font-medium">Рівень Атлета</span>
              <span className="text-xl font-bold text-amber-300">
                Рівень {journey.userLevel}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
              <span className="text-xs text-neutral-400 block font-medium">До наступного рівня</span>
              <span className="text-xl font-bold text-cyan-400">
                {journey.xpToNextLevel} XP
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Загальний прогрес стадії гартування
            </span>
            <span className="text-amber-400 font-bold">{journey.progressPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${journey.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500 mt-2">
            <span>{journey.previousActivitySummary}</span>
            <span>Виконано сесій: {journey.workoutsCompletedCount}</span>
          </div>
        </div>
      </div>

      {/* 2. BRANCH & VIEW SWITCHER NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-md">
        {/* Main View Mode Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('daily');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Щоденний Маршрут & Forge Engine</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('tree');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tree'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Дерево Прогресії Всіх Гілок</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('roadmap');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Дорожня Карта Сезону</span>
          </button>
        </div>

        {/* Quick Branch Switcher Buttons */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-[11px] text-neutral-500 hidden xl:inline font-semibold">Гілка:</span>
          {[
            { id: 'bodybuilding', label: 'Бодибілдинг', icon: '🏋️' },
            { id: 'calisthenics', label: 'Калістеніка', icon: '🤸' },
            { id: 'hybrid', label: 'Гібрид', icon: '🔥' }
          ].map((b) => {
            const isActive = journey.discipline === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleSwitchBranch(b.id as Discipline)}
                title={`Перемкнути на гілку ${b.label}`}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <span>{b.icon}</span>
                <span className="hidden md:inline">{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: DAILY DASHBOARD & FORGE ENGINE */}
      {activeTab === 'daily' && (
        <div className="space-y-8">
          {/* Today's Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today's Workout Card */}
            <div className="rounded-2xl border border-amber-500/30 bg-neutral-900/70 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Today's Workout
                  </span>
                  {journey.todaysWorkout.isCompleted && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Зараховано
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-neutral-100">
                  {journey.todaysWorkout.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {journey.todaysWorkout.description}
                </p>

                <ul className="mt-4 space-y-1.5">
                  {journey.todaysWorkout.exercises.slice(0, 3).map((ex, i) => (
                    <li key={i} className="text-xs text-neutral-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                <span className="text-xs text-neutral-400">
                  ⏱️ ~{journey.todaysWorkout.estimatedMinutes} хв
                </span>
                {journey.todaysWorkout.isCompleted ? (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-semibold"
                  >
                    Виконано (+250 XP)
                  </button>
                ) : (
                  <button
                    id="btn-complete-today-workout"
                    onClick={handleCompleteToday}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                  >
                    Завершити тренування
                  </button>
                )}
              </div>
            </div>

            {/* Recommended Knowledge Card */}
            <div className="rounded-2xl border border-cyan-500/30 bg-neutral-900/70 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Рекомендована Тема Знань
                  </span>
                  <span className="text-[11px] text-neutral-400">~{journey.recommendedTopic.readTimeMinutes} хв</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-100">
                  {journey.recommendedTopic.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-2">
                  Категорія: {journey.recommendedTopic.category}. Наукове пояснення біомеханіки руху для запобігання травмам та максимізації сили.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => onNavigate('education')}
                  className="w-full py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Читати в Академії
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Current Battle Card */}
            <div className="rounded-2xl border border-red-500/30 bg-neutral-900/70 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-red-400 font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-red-500" />
                    Поточний Battle
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    LIVE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-100">
                  Битва Таборів: Залізо vs Турніки
                </h3>
                <p className="text-xs text-neutral-400 mt-2">
                  Кожне виконане тренування додає XP до загального заліку твоєї дисципліни.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => onNavigate('battle')}
                  className="w-full py-2.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Перейти на Арену Битви
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* FORGE ENGINE (Interactive Workout Generator) */}
          <div className="rounded-3xl border border-amber-500/40 bg-neutral-900/90 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Forge Engine
                  </span>
                  <span className="text-xs text-neutral-400">Автоматичний підбір на основі біомеханічних правил</span>
                </div>
                <h2 className="text-2xl font-extrabold text-neutral-100 mt-1">
                  {engineWorkout.title}
                </h2>
              </div>

              {/* Trigger button for "I DON'T KNOW WHAT TO TRAIN TODAY" */}
              <div className="flex items-center gap-3">
                <button
                  id="btn-dont-know-train"
                  onClick={() => setShowGeneratorModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  I DON'T KNOW WHAT TO TRAIN TODAY
                </button>
              </div>
            </div>

            {/* Instructions banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-3">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{engineWorkout.instructions}</span>
            </div>

            {/* Exercise List */}
            <div className="mt-6 space-y-3">
              {engineWorkout.exercises.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold flex items-center justify-center text-sm shrink-0">
                      {item.order}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                        {item.name}
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-400">
                          {item.muscle}
                        </span>
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        💡 {item.cue}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 block">
                        {item.sets} сесій × {item.repsOrDuration}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Відпочинок: {item.restSeconds} сек
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSubstitute(idx)}
                        title="Замінити вправу на альтернативу для тієї ж групи мʼязів"
                        className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Замінити</span>
                      </button>

                      <button
                        onClick={() => handleLaunchExercise(item.exerciseId)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Старт
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SKILL PROGRESSION TREE (ДЕРЕВО ПРОГРЕСІЇ ВСІХ ГІЛОК) */}
      {activeTab === 'tree' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Tree Header & Branch Tabs */}
          <div className="p-6 rounded-3xl border border-amber-500/30 bg-neutral-900/80 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
                  <GitFork className="w-4 h-4" />
                  Дерево Навичок & Еволюція Вправ
                </span>
                <h2 className="text-2xl font-black text-white font-heading">
                  {currentTree.title}
                </h2>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                  {currentTree.desc}
                </p>
              </div>

              {/* Branch Selector Tabs within Tree */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'bodybuilding', label: '🏋️ Бодибілдинг' },
                  { id: 'calisthenics', label: '🤸 Калістеніка' },
                  { id: 'hybrid', label: '🔥 Гібрид' }
                ].map((br) => (
                  <button
                    key={br.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedBranch(br.id as Discipline);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedBranch === br.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {br.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Branch Status Pill */}
            <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Статус цієї гілки для вашого профілю:</span>
                {journey.discipline === selectedBranch ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
                    ✓ Поточна активна бойова гілка
                  </span>
                ) : (
                  <button
                    onClick={() => handleSwitchBranch(selectedBranch)}
                    className="px-3 py-1 rounded-md bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-all cursor-pointer shadow-sm"
                  >
                    Зробити основною гілкою тренувань
                  </button>
                )}
              </div>
              <span className="text-neutral-500">
                Ваш поточний рівень: <strong>{journey.userLevel}</strong>
              </span>
            </div>
          </div>

          {/* Skill Nodes Timeline / Progression Cards */}
          <div className="space-y-4">
            {currentTree.nodes.map((node, index) => {
              const isUnlocked = journey.userLevel >= node.levelReq;
              const isCurrent = isUnlocked && (index === currentTree.nodes.length - 1 || journey.userLevel < currentTree.nodes[index + 1]?.levelReq);

              return (
                <div
                  key={node.id}
                  className={`rounded-3xl border p-6 transition-all relative overflow-hidden ${
                    isCurrent
                      ? 'border-amber-400 bg-gradient-to-br from-neutral-900 via-amber-950/20 to-neutral-900 ring-1 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                      : isUnlocked
                      ? 'border-neutral-800 bg-neutral-900/60'
                      : 'border-neutral-850 bg-neutral-950/40 opacity-70'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      {/* Node Icon Marker */}
                      <div
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-base shrink-0 ${
                          isUnlocked
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-600'
                        }`}
                      >
                        {isUnlocked ? <Check className="w-5 h-5 text-amber-400" /> : <Lock className="w-5 h-5 text-neutral-600" />}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            Ранг {node.tier}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              isUnlocked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            Вимога: Рівень {node.levelReq}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500 text-neutral-950">
                              Поточний фокус
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white font-heading">
                          {node.name}
                        </h3>

                        <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                          {node.desc}
                        </p>

                        <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Бонус вузла: {node.perk}</span>
                        </div>
                      </div>
                    </div>

                    {/* Associated Exercises Quick Launch */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                      <span className="text-xs text-neutral-400 font-medium">Ключові вправи вузла:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {node.exerciseIds.map((exId) => {
                          const ex = EXERCISES.find((e) => e.id === exId);
                          if (!ex) return null;
                          return (
                            <button
                              key={exId}
                              onClick={() => {
                                sound.playClick();
                                onStartExercise(ex);
                              }}
                              title={`Почати тренування ${ex.name} з AI трекером`}
                              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-700 text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{ex.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SEASON ROADMAP (ДОРОЖНЯ КАРТА СЕЗОНУ) */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl border border-amber-500/30 bg-neutral-900/80 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-2xl font-black text-white font-heading">
                  ДОРОЖНЯ КАРТА СЕЗОНУ ТА ПЕРІОДИЗАЦІЇ
                </h2>
                <p className="text-xs text-neutral-400">
                  Чотири фази розвитку вашого атлетичного ковадла: від адаптації до фінального Battle Week
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                phase: 'Фаза 1',
                title: 'Нейро-мʼязова Адаптація',
                weeks: 'Тижні 1–4',
                desc: 'Формування правильної моторної траєкторії, зміцнення сухожиль та налагодження звʼязку мозок-мʼяз.',
                xp: '1000 XP',
                status: 'completed',
                color: 'emerald'
              },
              {
                phase: 'Фаза 2',
                title: 'Прогресивне Навантаження',
                weeks: 'Тижні 5–8',
                desc: 'Збільшення робочих ваг та кількості чистих повторень без порушення біомеханічної симетрії.',
                xp: '2000 XP',
                status: 'active',
                color: 'amber'
              },
              {
                phase: 'Фаза 3',
                title: 'Пікова Гіпертрофія & Сила',
                weeks: 'Тижні 9–12',
                desc: 'Використання дроп-сетів, пауз в нижній точці та комбінованих супер-серій для глибокого росту.',
                xp: '3500 XP',
                status: 'upcoming',
                color: 'cyan'
              },
              {
                phase: 'Фаза 4',
                title: 'Battle Week & Тест 1RM',
                weeks: 'Тиждень 13',
                desc: 'Фіксація персональних рекордів у камері AI, змагання кланів та перехід на новий ранг ковадла.',
                xp: '5000 XP',
                status: 'upcoming',
                color: 'red'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-5 border flex flex-col justify-between ${
                  item.status === 'active'
                    ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                    : item.status === 'completed'
                    ? 'border-emerald-500/40 bg-emerald-950/15'
                    : 'border-neutral-800 bg-neutral-950/60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {item.weeks}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : item.status === 'active'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {item.status === 'completed' ? '✓ Пройдено' : item.status === 'active' ? '⚡ Зараз тут' : '🔒 Заблоковано'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-heading">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                  <span>Винагорода фази:</span>
                  <span className="font-bold text-amber-400">{item.xp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Generator Modal ("FORGE IT") */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/40 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Forge Engine Configuration</span>
                <h3 className="text-xl font-bold text-neutral-100">Налаштуй тренування на сьогодні</h3>
              </div>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="text-neutral-500 hover:text-neutral-200 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Direction Selection */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-2">Напрямок дисципліни</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bodybuilding', label: '🏋️ Бодибілдинг' },
                  { id: 'calisthenics', label: '🤸 Калістеніка' },
                  { id: 'hybrid', label: '🔥 Гібрид' }
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setGenDiscipline(d.id as Discipline)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      genDiscipline === d.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Available */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400 font-medium">Доступний час</span>
                <span className="text-amber-400 font-bold">{genDuration} хвилин</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[20, 35, 45, 60].map((t) => (
                  <button
                    key={t}
                    onClick={() => setGenDuration(t)}
                    className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      genDuration === t
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {t} хв
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-2">Основна мета</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'hypertrophy', label: 'Гіпертрофія (Обʼєм)' },
                  { id: 'strength', label: 'Максимальна Сила' },
                  { id: 'endurance', label: 'Витривалість' },
                  { id: 'recomp', label: 'Рекомпозиція' }
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGenGoal(g.id as GoalType)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer ${
                      genGoal === g.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Chips */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-2">Доступний інвентар</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => {
                  const isSelected = genEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500/60 bg-orange-500/20 text-orange-300'
                          : 'border-neutral-800 bg-neutral-900/40 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action FORGE IT */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-semibold cursor-pointer"
              >
                Скасувати
              </button>
              <button
                id="btn-forge-it-action"
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-sm font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                FORGE IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
