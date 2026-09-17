import React, { useState, useEffect } from 'react';
import { Discipline, WorkoutSession } from '../types';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { BattleCameraDuel } from './BattleCameraDuel';
import confetti from 'canvas-confetti';
import { 
  Swords, 
  Flame, 
  Dumbbell, 
  Activity, 
  Clock, 
  Trophy, 
  Sparkles, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Camera,
  Zap
} from 'lucide-react';

interface BattleModeProps {
  userDiscipline: Discipline | null;
  sessions: WorkoutSession[];
  onContributeXp: (team: 'bodybuilding' | 'calisthenics', amount: number) => void;
}

export const BattleMode: React.FC<BattleModeProps> = ({
  userDiscipline,
  sessions,
  onContributeXp
}) => {
  // Base simulated community scores + user accumulated sessions
  const [bbScore, setBbScore] = useState<number>(48200);
  const [caliScore, setCaliScore] = useState<number>(45800);
  const [pullAnimationSide, setPullAnimationSide] = useState<'left' | 'right' | null>(null);
  const [isCameraDuelOpen, setIsCameraDuelOpen] = useState<boolean>(false);

  // Time remaining until Sunday 23:59
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Incorporate actual user sessions
  useEffect(() => {
    let bbAdded = 0;
    let caliAdded = 0;

    sessions.forEach((s) => {
      if (s.discipline === 'bodybuilding') {
        bbAdded += s.totalXp;
      } else if (s.discipline === 'calisthenics') {
        caliAdded += s.totalXp;
      } else {
        // Hybrid splits equally
        bbAdded += Math.round(s.totalXp / 2);
        caliAdded += Math.round(s.totalXp / 2);
      }
    });

    setBbScore(48200 + bbAdded);
    setCaliScore(45800 + caliAdded);
  }, [sessions]);

  // Countdown timer to Sunday 23:59:59
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
      const daysUntilSunday = (7 - currentDay) % 7;
      
      const targetSunday = new Date(now);
      targetSunday.setDate(now.getDate() + daysUntilSunday);
      targetSunday.setHours(23, 59, 59, 999);

      const diff = targetSunday.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining('Битва завершується!');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${d}д ${h}г ${m}хв ${s}с`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalScore = bbScore + caliScore;
  const bbPercentage = Math.round((bbScore / totalScore) * 100);
  const caliPercentage = 100 - bbPercentage;

  // Handle user manual power pull
  const handleBoostTeam = (team: 'bodybuilding' | 'calisthenics') => {
    sound.playChainTug();
    setPullAnimationSide(team === 'bodybuilding' ? 'left' : 'right');

    const boost = 50;
    if (team === 'bodybuilding') {
      setBbScore((prev) => prev + boost);
    } else {
      setCaliScore((prev) => prev + boost);
    }
    onContributeXp(team, boost);

    // Confetti effect
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7, x: team === 'bodybuilding' ? 0.35 : 0.65 },
        colors: team === 'bodybuilding' ? ['#f59e0b', '#ea580c', '#ffffff'] : ['#06b6d4', '#3b82f6', '#ffffff']
      });
    } catch {
      // ignore
    }

    if (Math.random() > 0.5) {
      const phrase = team === 'bodybuilding' 
        ? 'Бодибілдинг тягне вперед! Відчуй пампінг!' 
        : 'Калістеніка вириває перемогу! Гравітація підкорена!';
      arnoVoice.speak(phrase);
    }

    setTimeout(() => {
      setPullAnimationSide(null);
    }, 600);
  };

  // Real-time rep contribution from camera tracker duel (no button clicking needed)
  const handleCameraDuelRep = (team: 'bodybuilding' | 'calisthenics', _repCount: number, xp: number) => {
    if (team === 'bodybuilding') {
      setBbScore((prev) => prev + xp);
    } else {
      setCaliScore((prev) => prev + xp);
    }
    onContributeXp(team, xp);
    setPullAnimationSide(team === 'bodybuilding' ? 'left' : 'right');
    setTimeout(() => {
      setPullAnimationSide(null);
    }, 350);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Epic Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
          <Swords className="w-3.5 h-3.5" />
          Тижневий Челендж Сил
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          BATTLE MODE: ЗАЛІЗО ПРОТИ ГРАВІТАЦІЇ
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base font-sans">
          Хто переможе цього тижня? Бодибілдери зі штангами чи майстри турніків та брусів? Кожен твій підхід у камера-трекері перетягує ланцюг на твою користь!
        </p>
      </div>

      {/* LIVE CAMERA BATTLE ARENA (HANDS-FREE VIDEO TRACKING) */}
      {isCameraDuelOpen ? (
        <BattleCameraDuel
          userTeam={userDiscipline === 'calisthenics' ? 'calisthenics' : 'bodybuilding'}
          onRepCompleted={handleCameraDuelRep}
          onClose={() => setIsCameraDuelOpen(false)}
        />
      ) : (
        <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative overflow-hidden">
          <div className="space-y-2 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              ЖИВИЙ КАМЕРА-БАТЛ (БЕЗ КНОПОК)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              ТРЕНУЙСЯ ПЕРЕД КАМЕРОЮ ТА ТЯГНИ КАНАТ
            </h2>
            <p className="text-neutral-300 text-xs sm:text-sm font-sans max-w-xl">
              Жодних кліків по кнопках! Вмикай вебкамеру: штучний інтелект відстежує твої реальні відтискання від підлоги та присідання. Кожне чисте повторення наживо зсуває ланцюг у поєдинку проти віртуального атлета суперників!
            </p>
          </div>

          <button
            id="launch-camera-duel-btn"
            onClick={() => setIsCameraDuelOpen(true)}
            className="w-full md:w-auto shrink-0 py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading flex items-center justify-center gap-3 z-10"
          >
            <Camera className="w-5 h-5 text-neutral-950" />
            РОЗПОЧАТИ ЖИВИЙ КАМЕРА-БАТЛ
          </button>
        </div>
      )}

      {/* Battle Mode Arena Banner */}
      <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src="/src/assets/images/battle_banner_1789296229026.jpg"
            alt="Battle Arena"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

          {/* Center countdown badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-lg">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            До завершення тижня: <strong className="text-white">{timeRemaining}</strong>
          </div>

          {/* Versus Badges overlay */}
          <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-white">
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                Команда 1
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-amber-400">
                БОДИБІЛДИНГ
              </h3>
              <p className="text-xs text-neutral-300 font-sans">
                Сила заліза, важкі штанги та гіпертрофія
              </p>
            </div>

            <div className="text-center font-epic text-2xl font-black text-red-500 animate-pulse">
              VS
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                Команда 2
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-cyan-400">
                КАЛІСТЕНІКА
              </h3>
              <p className="text-xs text-neutral-300 font-sans">
                Вуличні турніки, виходи силою та баланс
              </p>
            </div>
          </div>
        </div>

        {/* Tug-of-War Chain and Interactive Progress Bar */}
        <div className="p-6 sm:p-8 space-y-6 bg-neutral-950">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold font-heading">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" />
                БОДИБІЛДИНГ: {bbScore.toLocaleString()} XP ({bbPercentage}%)
              </span>
              <span className="text-cyan-400 flex items-center gap-1.5">
                {caliPercentage}% ({caliScore.toLocaleString()} XP) КАЛІСТЕНІКА
                <Activity className="w-4 h-4" />
              </span>
            </div>

            {/* Tension Tug of War Track */}
            <div className="relative w-full h-8 rounded-full bg-neutral-900 border border-neutral-800 p-1 flex items-center overflow-hidden">
              {/* Left Barbell power fraction */}
              <div
                className="h-full rounded-l-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-700 relative"
                style={{ width: `${bbPercentage}%` }}
              />
              {/* Right Calisthenics power fraction */}
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                style={{ width: `${caliPercentage}%` }}
              />

              {/* Glowing Center Iron Knot */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-neutral-950 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center z-10 transition-all duration-700 ${
                  pullAnimationSide === 'left' ? 'scale-125 -rotate-12' : pullAnimationSide === 'right' ? 'scale-125 rotate-12' : ''
                }`}
                style={{ left: `${bbPercentage}%` }}
              >
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Hands-Free Video Workout Trigger & Quick Actions */}
          <div className="space-y-3 pt-2">
            <button
              id="arena-video-duel-btn"
              onClick={() => setIsCameraDuelOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-heading flex items-center justify-center gap-3"
            >
              <Camera className="w-5 h-5 text-neutral-950" />
              ВІДКРИТИ КАМЕРА-БАТЛ ТА ТЯГНУТИ КАНАТ ВПРАВАМИ
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 pt-1 px-1">
              <span>Автоматичне зарахування очок за кожне повторення через веб-камеру</span>
              <div className="flex gap-4 mt-2 sm:mt-0">
                <button
                  onClick={() => handleBoostTeam('bodybuilding')}
                  className="hover:text-amber-400 underline cursor-pointer"
                >
                  Ручний тест (Бодибілдинг +50)
                </button>
                <button
                  onClick={() => handleBoostTeam('calisthenics')}
                  className="hover:text-cyan-400 underline cursor-pointer"
                >
                  Ручний тест (Калістеніка +50)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Rewards Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Як враховується XP?
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Кожне повторення, зафіксоване Камера-трекером, автоматично спрямовується до команди, яку ти обрав на початку.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
          <div className="text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            Гібридні бійці
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Атлети з обраним гібридним напрямком розподіляють свій зароблений XP рівними частинами (50/50) між обома командами.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
          <div className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            Нагорода переможцям
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Сторона-переможець отримує корону тижня та +20% бонусного множника до всіх вправ на наступний тиждень.
          </p>
        </div>
      </div>
    </div>
  );
};
