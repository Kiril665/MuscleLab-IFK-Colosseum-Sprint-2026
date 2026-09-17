import React, { useState, useEffect } from 'react';
import { ATHLETE_QUOTES, ATHLETE_COMPARISONS, NUTRITION_PLANS } from '../data/proHubData';
import { EXERCISES } from '../data/exercisesData';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';
import { sound } from '../services/soundEngine';
import { 
  Flame, 
  Quote, 
  Swords, 
  Utensils, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Calculator,
  ChevronRight,
  Sparkles,
  Award,
  Tv,
  Video,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const ProHub: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'quotes' | 'vs' | 'nutrition' | 'timers' | 'videos'>('videos');
  const [selectedMasterclassEx, setSelectedMasterclassEx] = useState(EXERCISES[0]);

  // Nutrition Calculator state
  const [calcWeight, setCalcWeight] = useState<number>(75);
  const [calcGoal, setCalcGoal] = useState<'hypertrophy' | 'recomp' | 'endurance'>('hypertrophy');

  // Timers state
  const [timerType, setTimerType] = useState<'warmup' | 'cooldown'>('warmup');
  const [timerDuration, setTimerDuration] = useState<number>(300); // 5 min default for warmup
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Switch between warmup (5 min) and cooldown (3 min)
  const handleSwitchTimerType = (type: 'warmup' | 'cooldown') => {
    sound.playClick();
    setTimerType(type);
    const duration = type === 'warmup' ? 300 : 180;
    setTimerDuration(duration);
    setTimeLeft(duration);
    setIsTimerRunning(false);
  };

  const handleToggleTimer = () => {
    sound.playClick();
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    sound.playClick();
    setIsTimerRunning(false);
    setTimeLeft(timerDuration);
  };

  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            sound.playGong();
            setIsTimerRunning(false);
            return 0;
          }
          if (prev <= 4) {
            sound.playTimerTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Macro calculations
  const calculateMacros = () => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    let water = (calcWeight * 0.04).toFixed(1);

    if (calcGoal === 'hypertrophy') {
      calories = Math.round(calcWeight * 38);
      protein = Math.round(calcWeight * 2.0);
      fats = Math.round(calcWeight * 0.9);
      carbs = Math.round((calories - (protein * 4 + fats * 9)) / 4);
    } else if (calcGoal === 'recomp') {
      calories = Math.round(calcWeight * 29);
      protein = Math.round(calcWeight * 2.4);
      fats = Math.round(calcWeight * 0.8);
      carbs = Math.round((calories - (protein * 4 + fats * 9)) / 4);
    } else {
      calories = Math.round(calcWeight * 33);
      protein = Math.round(calcWeight * 1.7);
      fats = Math.round(calcWeight * 1.0);
      carbs = Math.round((calories - (protein * 4 + fats * 9)) / 4);
    }

    return { calories, protein, carbs, fats, water };
  };

  const macros = calculateMacros();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5" />
          Мудрість та Наука Атлетизму
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          PRO-HUB: ЛЕГЕНДИ, РАЦІОН ТА ТАЙМЕРИ
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base font-sans">
          Вивчай філософію легендарних атлетів, розраховуй макронутрієнти під свою вагу та використовуй акустичні таймери розминки.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-neutral-800 bg-neutral-900/90 p-1.5 gap-1 shadow-lg max-w-full overflow-x-auto">
          <button
            onClick={() => {
              sound.playClick();
              setActiveSection('videos');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSection === 'videos'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Відео-Клуб (Майстер-класи)
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSection('quotes');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSection === 'quotes'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            Цитати Атлетів
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSection('vs');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSection === 'vs'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Легенда vs Легенда
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSection('nutrition');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSection === 'nutrition'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Nutrition & Макроси
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSection('timers');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeSection === 'timers'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            Таймери Розминки
          </button>
        </div>
      </div>

      {/* SECTION 1: ATHLETE QUOTES */}
      {activeSection === 'quotes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {ATHLETE_QUOTES.map((q) => (
            <div
              key={q.id}
              className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-amber-500/40 transition-all shadow-md group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow">
                    <img
                      src={q.avatarUrl}
                      alt={q.athleteName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-heading">
                      {q.athleteName}
                    </h3>
                    <p className="text-xs text-amber-400 font-semibold">
                      {q.nickname}
                    </p>
                  </div>
                </div>

                <blockquote className="text-sm sm:text-base text-neutral-200 italic leading-relaxed font-sans border-l-2 border-amber-500/60 pl-4 py-1">
                  «{q.quote}»
                </blockquote>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300 space-y-1">
                <span className="font-bold text-amber-400 uppercase tracking-wider block text-[10px]">
                  Ключова порада:
                </span>
                <p className="leading-relaxed">
                  {q.highlightAdvice}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 2: LEGEND VS LEGEND SPLIT COMPARISON */}
      {activeSection === 'vs' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {ATHLETE_COMPARISONS.map((comp) => (
            <div
              key={comp.id}
              className="rounded-3xl border border-amber-500/30 bg-neutral-900/80 overflow-hidden shadow-2xl space-y-6"
            >
              <div className="p-6 border-b border-neutral-800 text-center space-y-1 bg-neutral-950/60">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  {comp.subTitle}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {comp.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 p-6 sm:p-8 gap-8">
                {/* Athlete 1 */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      {comp.athlete1.discipline}
                    </span>
                    <h4 className="text-2xl font-bold text-amber-400 font-heading">
                      {comp.athlete1.name}
                    </h4>
                    <p className="text-xs font-semibold text-neutral-400">
                      {comp.athlete1.title}
                    </p>
                  </div>

                  <p className="text-sm text-neutral-300 font-sans">
                    <strong className="text-white">Фокус: </strong>
                    {comp.athlete1.focus}
                  </p>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Переваги підходу:
                    </span>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      {comp.athlete1.pros.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="text-neutral-500 uppercase font-bold text-[10px] block">Улюблений рух:</span>
                    <span className="text-amber-300 font-semibold">{comp.athlete1.favoriteMove}</span>
                  </div>
                </div>

                {/* Athlete 2 */}
                <div className="space-y-4 pt-6 md:pt-0">
                  <div className="space-y-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                      {comp.athlete2.discipline}
                    </span>
                    <h4 className="text-2xl font-bold text-cyan-400 font-heading">
                      {comp.athlete2.name}
                    </h4>
                    <p className="text-xs font-semibold text-neutral-400">
                      {comp.athlete2.title}
                    </p>
                  </div>

                  <p className="text-sm text-neutral-300 font-sans">
                    <strong className="text-white">Фокус: </strong>
                    {comp.athlete2.focus}
                  </p>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Переваги підходу:
                    </span>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      {comp.athlete2.pros.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyan-500 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="text-neutral-500 uppercase font-bold text-[10px] block">Улюблений рух:</span>
                    <span className="text-cyan-300 font-semibold">{comp.athlete2.favoriteMove}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: NUTRITION & MACROS CALCULATOR */}
      {activeSection === 'nutrition' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* Interactive Calculator Card */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="text-2xl font-bold text-white font-heading">
                КАЛЬКУЛЯТОР МАКРОНУТРІЄНТІВ ТА ПАЛИВА
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-neutral-300">
                  <span>Твоя вага тіла</span>
                  <span className="text-amber-400 text-sm">{calcWeight} кг</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="140"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Goal Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral-300 block">
                  Твоя ціль раціону
                </label>
                <select
                  value={calcGoal}
                  onChange={(e) => {
                    sound.playClick();
                    setCalcGoal(e.target.value as 'hypertrophy' | 'recomp' | 'endurance');
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="hypertrophy">Набір чистої маси (+350 ккал)</option>
                  <option value="recomp">Сушка та рельєф (-400 ккал)</option>
                  <option value="endurance">Витривалість та калістеніка</option>
                </select>
              </div>
            </div>

            {/* Calculated Macros Result Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Калорії</span>
                <span className="text-2xl font-extrabold text-amber-400 font-heading">{macros.calories}</span>
                <span className="text-[10px] text-neutral-400 block">ккал / добу</span>
              </div>

              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Білки</span>
                <span className="text-2xl font-extrabold text-red-400 font-heading">{macros.protein} г</span>
                <span className="text-[10px] text-neutral-400 block">будівельний блок</span>
              </div>

              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Вуглеводи</span>
                <span className="text-2xl font-extrabold text-amber-300 font-heading">{macros.carbs} г</span>
                <span className="text-[10px] text-neutral-400 block">глікоген & енергія</span>
              </div>

              <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Жири</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-heading">{macros.fats} г</span>
                <span className="text-[10px] text-neutral-400 block">гормональний баланс</span>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Вода</span>
                <span className="text-2xl font-extrabold text-cyan-400 font-heading">{macros.water} л</span>
                <span className="text-[10px] text-neutral-400 block">гідратація клітин</span>
              </div>
            </div>
          </div>

          {/* Nutrition Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NUTRITION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4 hover:border-amber-500/40 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white font-heading">
                    {plan.title}
                  </h4>
                  <p className="text-xs text-amber-400 font-medium">
                    {plan.tagline}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Формула:</span>
                    <span className="font-semibold text-white">{plan.caloriesFormula}</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-neutral-400 font-bold block text-[10px] uppercase">
                      Ключові продукти:
                    </span>
                    <ul className="space-y-1 text-[11px] text-neutral-300">
                      {plan.keyFoods.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-amber-500">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ACOUSTIC WARMUP & COOLDOWN TIMERS */}
      {activeSection === 'timers' && (
        <div className="max-w-xl mx-auto rounded-3xl border border-amber-500/30 bg-neutral-900/80 p-8 text-center space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="inline-flex rounded-xl border border-neutral-800 bg-neutral-950 p-1">
            <button
              onClick={() => handleSwitchTimerType('warmup')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timerType === 'warmup'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Розминка (5 хв)
            </button>
            <button
              onClick={() => handleSwitchTimerType('cooldown')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timerType === 'cooldown'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Заминка (3 хв)
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white font-heading">
              {timerType === 'warmup' ? 'ТАЙМЕР РОЗМИНКИ СУГЛОБІВ' : 'ТАЙМЕР РОЗТЯЖКИ ТА ДИХАННЯ'}
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Звуковий гонг сповістить про завершення інтервалу.
            </p>
          </div>

          {/* Circular Countdown Display */}
          <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
            {/* SVG Circle Progress */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="90"
                fill="none"
                stroke="#27272a"
                strokeWidth="10"
              />
              <circle
                cx="112"
                cy="112"
                r="90"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - timeLeft / timerDuration)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-white font-heading tracking-wider">
                {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
              </span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-1">
                {isTimerRunning ? 'Триває рух' : 'Пауза'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer font-heading ${
                isTimerRunning
                  ? 'bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 hover:scale-105'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  ПАУЗА
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  СТАРТ
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Скинути таймер"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: VIDEO MASTERCLASSES */}
      {activeSection === 'videos' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
                <Video className="w-3.5 h-3.5" />
                Відео-Академія Руху (60 FPS)
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
                МАЙСТЕР-КЛАСИ З ТЕХНІКИ ТА БІОМЕХАНІКИ
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-sans">
                Анатомічні відео з контролем темпу (0.5x Slow-Motion), підсвічуванням робочих мʼязів та коментарями Арно.
              </p>
            </div>

            {/* Quick Exercise Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-bold uppercase">Вправа:</span>
              <select
                value={selectedMasterclassEx.id}
                onChange={(e) => {
                  sound.playClick();
                  const found = EXERCISES.find((ex) => ex.id === e.target.value);
                  if (found) setSelectedMasterclassEx(found);
                }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                {EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Featured Video Demonstration Player */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <ExerciseVideoPlayer
                exercise={selectedMasterclassEx}
                compact={false}
              />
            </div>

            {/* Video Bio-Card & Exercise Breakdown */}
            <div className="lg:col-span-4 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {selectedMasterclassEx.discipline} • {selectedMasterclassEx.muscle}
                </span>
                <h3 className="text-xl font-bold text-white font-heading">
                  {selectedMasterclassEx.name}
                </h3>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  {selectedMasterclassEx.description}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Робочі мʼязи:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold capitalize">
                    {selectedMasterclassEx.muscle} (Основний)
                  </span>
                  {selectedMasterclassEx.secondaryMuscles?.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs capitalize">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Ключовий акцент безпеки:
                </div>
                <p className="text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                  {selectedMasterclassEx.tips}
                </p>
              </div>
            </div>
          </div>

          {/* Video Library Catalog Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
              Популярні відео-уроки техніки
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {EXERCISES.slice(0, 8).map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedMasterclassEx(ex);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    selectedMasterclassEx.id === ex.id
                      ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-400 uppercase">{ex.muscle}</span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Tv className="w-3 h-3" />
                        60 FPS
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors font-heading line-clamp-1">
                      {ex.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {ex.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 capitalize">{ex.discipline}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Дивитись &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
