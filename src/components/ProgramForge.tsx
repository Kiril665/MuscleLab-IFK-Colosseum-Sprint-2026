import React, { useState, useRef, useEffect } from 'react';
import { ForgedProgram, Discipline, GoalType, ProgramExercise, Exercise } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { 
  Hammer, 
  Flame, 
  Clock, 
  Target, 
  Package, 
  Sparkles, 
  Save, 
  Check, 
  Play, 
  RefreshCw 
} from 'lucide-react';

interface ProgramForgeProps {
  userDiscipline: Discipline | null;
  onSaveProgram: (program: ForgedProgram) => void;
  onStartExercise: (exercise: Exercise) => void;
}

export const ProgramForge: React.FC<ProgramForgeProps> = ({
  userDiscipline,
  onSaveProgram,
  onStartExercise
}) => {
  const [goal, setGoal] = useState<GoalType>('hypertrophy');
  const [inventory, setInventory] = useState<string>('gym');
  const [duration, setDuration] = useState<number>(40);
  const [discipline, setDiscipline] = useState<Discipline>(userDiscipline || 'bodybuilding');
  
  const [isForging, setIsForging] = useState<boolean>(false);
  const [forgedProgram, setForgedProgram] = useState<ForgedProgram | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Canvas for sparks effect
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Spawn fiery sparks when anvil is struck
  const fireSparksAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 240;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ['#f59e0b', '#ea580c', '#f97316', '#ffedd5', '#ef4444'];
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.65;

    // Create 90 sparks
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI - Math.PI; // spray upward
      const speed = Math.random() * 9 + 3;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.alpha -= 0.022;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (alive) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  };

  const handleForge = () => {
    setIsForging(true);
    setIsSaved(false);

    // Play anvil strike sounds in sequence (strike 1, pause, strike 2 - heavy)
    sound.playAnvilHit();
    fireSparksAnimation();

    setTimeout(() => {
      sound.playAnvilHit();
      fireSparksAnimation();
    }, 450);

    setTimeout(() => {
      sound.playAnvilHit();
      fireSparksAnimation();

      // Generate customized workout based on inputs
      const available = EXERCISES.filter((ex) => {
        if (inventory === 'home' && ex.location !== 'home') return false;
        if (discipline !== 'hybrid' && ex.discipline !== discipline && ex.discipline !== 'hybrid') return false;
        return true;
      });

      // Pick 4 to 6 diverse exercises covering different muscle groups
      const pool = available.length >= 4 ? available : EXERCISES;
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, duration === 20 ? 3 : duration === 40 ? 5 : 6);

      const exercisesConfigured: ProgramExercise[] = selected.map((ex) => ({
        exercise: ex,
        sets: goal === 'strength' ? 4 : goal === 'endurance' ? 3 : 4,
        reps: goal === 'strength' ? '4-6' : goal === 'endurance' ? '15-20' : '8-12',
        restSeconds: goal === 'strength' ? 120 : goal === 'endurance' ? 45 : 75
      }));

      const newProg: ForgedProgram = {
        id: `prog_${Date.now()}`,
        name: `Кузня Сили: ${discipline === 'bodybuilding' ? 'Залізна Маса' : discipline === 'calisthenics' ? 'Політ Гравітації' : 'Гібридний Титан'}`,
        discipline,
        goal,
        inventory,
        durationMinutes: duration,
        exercises: exercisesConfigured,
        createdAt: new Date().toISOString()
      };

      setForgedProgram(newProg);
      setIsForging(false);
      sound.playLevelUp();
      arnoVoice.speak(`Програму викувано! На тебе чекає ${newProg.exercises.length} вправ на ${duration} хвилин. До бою!`, { force: true });
    }, 1000);
  };

  const handleSaveToJournal = () => {
    if (!forgedProgram) return;
    sound.playAnvilHit();
    onSaveProgram(forgedProgram);
    setIsSaved(true);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Hammer className="w-3.5 h-3.5" />
          Конструктор Програм
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          КУЗНЯ ПЕРСОНАЛЬНИХ ТРЕНУВАНЬ
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base font-sans">
          Задай свої параметри, вдар молотом по ковадлу та отримай викувану під тебе програму з оптимальними сетами й таймінгом відпочинку.
        </p>
      </div>

      {/* The Forge Stage Visualizer with Anvil & Sparks */}
      <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 sm:p-10 shadow-[0_0_40px_rgba(245,158,11,0.15)] overflow-hidden">
        {/* Particle Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20 w-full h-full"
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6">
          {/* Anvil SVG with Hammer Motion */}
          <div className="relative w-64 h-40 flex items-center justify-center">
            {/* Anvil Graphic */}
            <svg viewBox="0 0 200 120" className="w-56 h-32 drop-shadow-[0_0_20px_rgba(234,88,12,0.4)]">
              <defs>
                <linearGradient id="ironGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#71717a" />
                  <stop offset="50%" stopColor="#3f3f46" />
                  <stop offset="100%" stopColor="#18181b" />
                </linearGradient>
                <linearGradient id="glowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Anvil Base & Body */}
              <path
                d="M30 45 L150 45 Q180 45 190 55 L160 70 L135 70 L145 105 L55 105 L65 70 L25 70 Q15 55 30 45 Z"
                fill="url(#ironGrad)"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
              {/* Hot Glowing Anvil Horn */}
              <ellipse cx="100" cy="46" rx="45" ry="4" fill="url(#glowGlow)" />
              {/* Stand */}
              <rect x="40" y="105" width="120" height="10" rx="3" fill="#27272a" stroke="#52525b" strokeWidth="1" />
            </svg>

            {/* Hammer with striking keyframe animation when isForging */}
            <div
              className={`absolute -top-4 right-6 w-24 h-24 origin-bottom-right transition-transform ${
                isForging ? 'rotate-[-60deg] animate-bounce duration-150' : 'rotate-[-25deg]'
              }`}
            >
              <Hammer className="w-16 h-16 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
            </div>
          </div>

          {/* Form Parameters */}
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Discipline */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Напрямок
              </label>
              <select
                value={discipline}
                onChange={(e) => {
                  sound.playClick();
                  setDiscipline(e.target.value as Discipline);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="bodybuilding">Бодибілдинг (Залізо)</option>
                <option value="calisthenics">Калістеніка (Турнік/Бруси)</option>
                <option value="hybrid">Гібридний Титан</option>
              </select>
            </div>

            {/* Goal */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Головна Ціль
              </label>
              <select
                value={goal}
                onChange={(e) => {
                  sound.playClick();
                  setGoal(e.target.value as GoalType);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="hypertrophy">Гіпертрофія (Ріст мʼязів)</option>
                <option value="strength">Максимальна Сила</option>
                <option value="endurance">Витривалість та Рельєф</option>
                <option value="recomp">Рекомпозиція</option>
              </select>
            </div>

            {/* Inventory */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Інвентар
              </label>
              <select
                value={inventory}
                onChange={(e) => {
                  sound.playClick();
                  setInventory(e.target.value);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="gym">Повний зал (Штанги, лави)</option>
                <option value="home">Турнік, бруси або дім</option>
                <option value="bodyweight">Лише власна вага</option>
              </select>
            </div>

            {/* Duration */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Час на тренування
              </label>
              <select
                value={duration}
                onChange={(e) => {
                  sound.playClick();
                  setDuration(parseInt(e.target.value, 10));
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value={20}>20 хвилин (Експрес-вогонь)</option>
                <option value={40}>40 хвилин (Класична сесія)</option>
                <option value={60}>60 хвилин (Повний розгром)</option>
              </select>
            </div>
          </div>

          {/* Action Forge Button */}
          <button
            id="forge-program-button"
            disabled={isForging}
            onClick={handleForge}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-neutral-950 font-extrabold text-lg flex items-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:shadow-[0_0_45px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading tracking-wider disabled:opacity-50"
          >
            <Hammer className={`w-6 h-6 ${isForging ? 'animate-spin' : ''}`} />
            {isForging ? 'ВИКОВУВАННЯ...' : 'ВИКУВАТИ ПРОГРАМУ'}
          </button>
        </div>
      </div>

      {/* Forged Program Result Section */}
      {forgedProgram && (
        <div className="rounded-3xl border border-amber-500/40 bg-neutral-900/80 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Програма готова
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  {forgedProgram.durationMinutes} хв • {forgedProgram.exercises.length} вправ
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-1">
                {forgedProgram.name}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="save-program-btn"
                onClick={handleSaveToJournal}
                disabled={isSaved}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/40'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Збережено в Журнал
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Зберегти програму
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Exercises List in Routine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forgedProgram.exercises.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-white font-heading">
                      {item.exercise.name}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    +{item.exercise.xpPerRep} XP
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 px-3 rounded-xl bg-neutral-900 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Підходи</span>
                    <span className="text-white font-bold text-sm">{item.sets}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Повторення</span>
                    <span className="text-white font-bold text-sm">{item.reps}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Відпочинок</span>
                    <span className="text-white font-bold text-sm">{item.restSeconds} с</span>
                  </div>
                </div>

                <button
                  id={`start-forged-ex-${idx}`}
                  onClick={() => {
                    sound.playAnvilHit();
                    onStartExercise(item.exercise);
                  }}
                  className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Виконати в Камера-трекері
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
