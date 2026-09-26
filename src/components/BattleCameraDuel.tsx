import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/soundEngine';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CameraOff, 
  Trophy, 
  Timer, 
  Flame, 
  Zap, 
  RotateCcw, 
  X, 
  Dumbbell, 
  Activity, 
  Volume2, 
  VolumeX, 
  Sparkles,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useCameraVerifier } from '../hooks/useCameraVerifier';
import { analyticsTracker } from '../services/analyticsTracker';

interface BattleCameraDuelProps {
  userTeam: 'bodybuilding' | 'calisthenics';
  onRepCompleted: (team: 'bodybuilding' | 'calisthenics', repCount: number, xp: number) => void;
  onClose: () => void;
}

export const BattleCameraDuel: React.FC<BattleCameraDuelProps> = ({
  userTeam,
  onRepCompleted,
  onClose
}) => {
  // Duel configuration
  const [exerciseType, setExerciseType] = useState<'pushups' | 'squats'>('pushups');
  const [duelMode, setDuelMode] = useState<'blitz45' | 'first15'>('blitz45');
  const [gameState, setGameState] = useState<'ready' | 'active' | 'finished'>('ready');

  // Scores
  const [userReps, setUserReps] = useState<number>(0);
  const [rivalReps, setRivalReps] = useState<number>(0);
  const [winner, setWinner] = useState<'user' | 'rival' | 'draw' | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(45);

  const [isMuted, setIsMuted] = useState<boolean>(sound.getIsMuted());
  const [lastFeedback, setLastFeedback] = useState<string>('Прийміть вихідне положення перед камерою');
  const [repFlash, setRepFlash] = useState<boolean>(false);

  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rivalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const rivalTeam = userTeam === 'bodybuilding' ? 'calisthenics' : 'bodybuilding';
  const rivalName = userTeam === 'bodybuilding' ? 'Суперник (Калістеніка)' : 'Суперник (Бодибілдинг)';
  const userTeamName = userTeam === 'bodybuilding' ? 'Бодибілдинг' : 'Калістеніка';
  const rivalTeamName = rivalTeam === 'bodybuilding' ? 'Бодибілдинг' : 'Калістеніка';

  // Calculate live tug of war position (-50 to +50)
  const repDiff = userReps - rivalReps;
  const ropeShiftPercent = Math.max(10, Math.min(90, 50 + repDiff * 4));

  // Finish duel helper
  const finishDuel = useCallback((forcedWinner?: 'user' | 'rival' | 'draw') => {
    setGameState('finished');
    if (duelTimerRef.current) clearInterval(duelTimerRef.current);
    if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);

    let finalWinner: 'user' | 'rival' | 'draw' = 'draw';
    if (forcedWinner) {
      finalWinner = forcedWinner;
    } else if (userReps > rivalReps) {
      finalWinner = 'user';
    } else if (rivalReps > userReps) {
      finalWinner = 'rival';
    }

    setWinner(finalWinner);
    analyticsTracker.track('battle_complete', {
      exerciseType,
      winner: finalWinner,
      userReps,
      rivalReps
    });

    if (finalWinner === 'user') {
      sound.playLevelUp();
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } else if (finalWinner === 'rival') {
      sound.playGong();
    } else {
      sound.playAnvilHit();
    }
  }, [userReps, rivalReps, exerciseType]);

  // Register physical rep from unified Camera Verifier hands-free
  const handleRegisterUserRep = useCallback(() => {
    sound.playChainTug();
    setRepFlash(true);
    setTimeout(() => setRepFlash(false), 200);

    setUserReps((prev) => {
      const next = prev + 1;
      onRepCompleted(userTeam, next, 30);

      // Visual feedback
      if (next === 1) {
        setLastFeedback('🔥 Перше чисто! Тягни ланцюг!');
      } else if (next === 5) {
        setLastFeedback('⚡ 5 повторів! Опонент відчуває тиск!');
      } else if (next === 10) {
        setLastFeedback('💥 10 повторів! Вириваєш перемогу!');
      } else {
        setLastFeedback(`✅ Повторення #${next} зараховано!`);
      }

      // Check first to 15 win condition
      if (duelMode === 'first15' && next >= 15) {
        finishDuel('user');
      }

      return next;
    });
  }, [userTeam, onRepCompleted, duelMode, finishDuel]);

  // Biomechanical rejection feedback
  const handleRepRejected = useCallback((reason: string) => {
    setLastFeedback(`⚠️ Помилка форми: ${reason}`);
  }, []);

  // Use the unified camera verifier hook
  const {
    videoRef,
    canvasRef,
    cameraStatus,
    errorMessage,
    currentRomPercent,
    startCamera,
    stopCamera,
    setExercise: setVerifierExercise,
    resetCounters
  } = useCameraVerifier({
    exerciseId: exerciseType === 'pushups' ? 'push_up' : 'squat',
    onRep: handleRegisterUserRep,
    onReject: handleRepRejected
  });

  // Keep verifier exercise synced
  useEffect(() => {
    setVerifierExercise(exerciseType === 'pushups' ? 'push_up' : 'squat');
  }, [exerciseType, setVerifierExercise]);

  // Handle start duel
  const handleStartDuel = async () => {
    setUserReps(0);
    setRivalReps(0);
    setWinner(null);
    setTimeLeft(duelMode === 'blitz45' ? 45 : 60);
    setGameState('active');
    resetCounters();
    sound.playAnvilHit();
    analyticsTracker.track('battle_start', { exerciseType, duelMode });

    await startCamera();
  };

  // AI rival progression interval
  useEffect(() => {
    if (gameState !== 'active') {
      if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
      return;
    }

    const scheduleNextRivalRep = () => {
      // Rival reps every 3.2 - 4.5 seconds with slight variance
      const delay = Math.floor(Math.random() * 1300) + 3200;
      rivalIntervalRef.current = setTimeout(() => {
        setRivalReps((prev) => {
          const next = prev + 1;
          onRepCompleted(rivalTeam, next, 25);

          if (duelMode === 'first15' && next >= 15) {
            finishDuel('rival');
          }
          return next;
        });

        if (gameState === 'active') {
          scheduleNextRivalRep();
        }
      }, delay);
    };

    scheduleNextRivalRep();

    return () => {
      if (rivalIntervalRef.current) clearTimeout(rivalIntervalRef.current);
    };
  }, [gameState, rivalTeam, onRepCompleted, duelMode, finishDuel]);

  // Duel countdown timer (for blitz45 mode)
  useEffect(() => {
    if (gameState !== 'active' || duelMode !== 'blitz45') return;

    duelTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishDuel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (duelTimerRef.current) clearInterval(duelTimerRef.current);
    };
  }, [gameState, duelMode, finishDuel]);

  // Spacebar fallback listener for accessibility
  useEffect(() => {
    if (gameState !== 'active') return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleRegisterUserRep();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, handleRegisterUserRep]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (duelTimerRef.current) clearInterval(duelTimerRef.current);
      if (rivalIntervalRef.current) clearTimeout(rivalIntervalRef.current);
    };
  }, [stopCamera]);

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div 
        className={`absolute -top-32 ${userTeam === 'bodybuilding' ? '-left-32 bg-amber-500/10' : '-right-32 bg-cyan-500/10'} w-96 h-96 rounded-full blur-3xl pointer-events-none`}
      />

      {/* Duel Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
              КАМЕРА-БАТЛ: ВЕРИФІКОВАНА ДУЕЛЬ
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Pose Verifier фіксує лише чисті повторення. Тягни ланцюг за свою команду!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              !isMuted 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
            title={!isMuted ? 'Вимкнути звукові ефекти' : 'Увімкнути звукові ефекти'}
          >
            {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sponsor Challenge Notice */}
      <div className="p-3 rounded-2xl bg-neutral-900/60 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Sponsor Challenge:</strong> Призовий пул $500 від GymBeam & Solana Devnet за верифіковані репи. Без P2P ставок!
          </span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px] uppercase border border-amber-500/30">
          100% Fair Play
        </span>
      </div>

      {/* TUG-OF-WAR CHAIN VISUALIZER */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold uppercase tracking-wider font-heading">
          {/* User side */}
          <div className="flex items-center gap-2">
            <span className={userTeam === 'bodybuilding' ? 'text-amber-400' : 'text-cyan-400'}>
              ТИ ({userTeamName})
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-800 text-white font-mono text-sm">
              {userReps} репів
            </span>
          </div>

          {/* Timer display */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-700 text-amber-400 font-mono text-xs">
            <Timer className="w-3.5 h-3.5" />
            <span>{duelMode === 'blitz45' ? `${timeLeft}s` : 'First to 15'}</span>
          </div>

          {/* Rival side */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-neutral-800 text-white font-mono text-sm">
              {rivalReps} репів
            </span>
            <span className={rivalTeam === 'bodybuilding' ? 'text-amber-400' : 'text-cyan-400'}>
              {rivalName}
            </span>
          </div>
        </div>

        {/* Rope slider bar */}
        <div className="relative w-full h-8 rounded-full bg-neutral-950 border border-neutral-800 p-1 flex items-center overflow-hidden">
          {/* User side bar */}
          <div
            className={`h-full rounded-l-full transition-all duration-300 ${
              userTeam === 'bodybuilding' 
                ? 'bg-gradient-to-r from-amber-600 to-orange-500' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
            }`}
            style={{ width: `${ropeShiftPercent}%` }}
          />

          {/* Rival side bar */}
          <div
            className={`h-full rounded-r-full transition-all duration-300 ${
              rivalTeam === 'bodybuilding' 
                ? 'bg-gradient-to-r from-amber-600 to-orange-500' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
            }`}
            style={{ width: `${100 - ropeShiftPercent}%` }}
          />

          {/* Glowing central ring/iron knot */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-neutral-950 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.9)] flex items-center justify-center z-10 transition-all duration-300 ${
              repFlash ? 'scale-125 ring-4 ring-amber-400' : ''
            }`}
            style={{ left: `${ropeShiftPercent}%` }}
          >
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Duel Stage */}
      {gameState === 'ready' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-4">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white font-heading">
              Налаштування бою перед камерою
            </h3>
            
            {/* Exercise select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Вправа для дуелі:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExerciseType('pushups')}
                  className={`p-3.5 rounded-xl border text-left font-heading font-bold text-sm transition-all cursor-pointer ${
                    exerciseType === 'pushups'
                      ? 'border-amber-500 bg-amber-500/20 text-white shadow-lg'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  🤸‍♂️ Відтискання
                  <span className="block text-[11px] font-normal text-neutral-400 mt-1 font-sans">
                    MediaPipe Plank & Lockout
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExerciseType('squats')}
                  className={`p-3.5 rounded-xl border text-left font-heading font-bold text-sm transition-all cursor-pointer ${
                    exerciseType === 'squats'
                      ? 'border-amber-500 bg-amber-500/20 text-white shadow-lg'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  🏋️‍♂️ Присідання
                  <span className="block text-[11px] font-normal text-neutral-400 mt-1 font-sans">
                    Паралель стегон & випрямлення
                  </span>
                </button>
              </div>
            </div>

            {/* Duel Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Формат поєдинку:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDuelMode('blitz45')}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer font-heading ${
                    duelMode === 'blitz45'
                      ? 'border-amber-500 bg-amber-500/20 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  ⏱ 45 секунд бліц
                </button>

                <button
                  type="button"
                  onClick={() => setDuelMode('first15')}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer font-heading ${
                    duelMode === 'first15'
                      ? 'border-amber-500 bg-amber-500/20 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  🏆 Перший до 15 репів
                </button>
              </div>
            </div>

            <button
              id="start-camera-duel-btn"
              onClick={handleStartDuel}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-neutral-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-heading flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              УВІМКНУТИ КАМЕРУ ТА ПОЧАТИ БАТЛ
            </button>
          </div>

          {/* Opponent Preview Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-neutral-800 border-2 border-red-500/50 flex items-center justify-center text-3xl shadow-lg">
              {rivalTeam === 'bodybuilding' ? '🏋️‍♂️' : '🤸‍♂️'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
                Твій суперник
              </span>
              <h4 className="text-xl font-black text-white font-heading mt-1">
                {rivalName}
              </h4>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Команда: <strong className="text-cyan-400">{rivalTeamName}</strong>
              </p>
            </div>
            <p className="text-xs text-neutral-300 italic font-sans">
              «Я роблю одне чисте повторення кожні 3.5 секунди. Зможеш обігнати мене перед власною камерою?»
            </p>
          </div>
        </div>
      )}

      {/* ACTIVE CAMERA DUEL ARENA */}
      {gameState === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* User Live Camera Feed (Takes 2 cols) */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.2)] bg-neutral-900 aspect-[4/3] max-h-[380px] flex items-center justify-center">
            {/* Hidden video element for stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="hidden"
            />

            {/* Canvas with CV Kinematics HUD */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-cover"
            />

            {/* Live Feedback Toast */}
            <div className="absolute bottom-3 inset-x-3 text-center">
              <div className="inline-block px-4 py-1.5 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-700 text-xs font-bold text-amber-300 shadow-lg">
                {lastFeedback}
              </div>
            </div>

            {/* Amplitude gauge overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
              <span className="text-neutral-400 font-bold">ROM:</span>
              <div className="w-20 bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    currentRomPercent >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${currentRomPercent}%` }}
                />
              </div>
              <span className="font-mono text-white font-bold">{currentRomPercent}%</span>
            </div>

            {cameraStatus === 'simulation' && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-orange-600/90 text-white text-[10px] font-black uppercase tracking-wider">
                AI Skeleton Fallback
              </div>
            )}
          </div>

          {/* Opponent & Stats Box (Takes 1 col) */}
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl">
                  {rivalTeam === 'bodybuilding' ? '🏋️‍♂️' : '🤸‍♂️'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-heading">
                    {rivalName}
                  </h4>
                  <span className="text-xs text-neutral-400">
                    Ритм: одне повторення кожні ~3.5с
                  </span>
                </div>
              </div>

              {/* Progress Bar of Rival */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-400 font-mono">
                  <span>Суперник:</span>
                  <span className="text-white font-bold">{rivalReps} репів</span>
                </div>
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (rivalReps / (duelMode === 'first15' ? 15 : 20)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Progress Bar of User */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-400 font-mono">
                  <span>Твій результат:</span>
                  <span className="text-amber-400 font-bold">{userReps} репів</span>
                </div>
                <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (userReps / (duelMode === 'first15' ? 15 : 20)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Accessibility fallback button (for when user cannot use camera) */}
            <button
              type="button"
              onClick={handleRegisterUserRep}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-xs text-neutral-300 font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Зарахувати повторення вручну (Пробіл)</span>
            </button>

            {/* Give up button */}
            <button
              type="button"
              onClick={() => finishDuel('rival')}
              className="w-full py-2 text-xs text-neutral-500 hover:text-red-400 transition-colors text-center cursor-pointer"
            >
              Здатись у цьому раунді
            </button>
          </div>
        </div>
      )}

      {/* FINISHED DUEL SCREEN */}
      {gameState === 'finished' && (
        <div className="text-center py-8 space-y-6 max-w-lg mx-auto animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            {winner === 'user' ? '🏆' : winner === 'rival' ? '🥈' : '🤝'}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Поєдинок Завершено
            </span>
            <h3 className="text-3xl font-extrabold text-white font-heading">
              {winner === 'user' 
                ? 'ПЕРЕМОГА! ЛАНЦЮГ ТВОЙ!' 
                : winner === 'rival' 
                  ? 'СУПЕРНИК БУВ СПРИТНІШИМ' 
                  : 'БОЙОВА НІЧИЯ!'}
            </h3>
            <p className="text-sm text-neutral-300 font-sans">
              Ти виконав <strong className="text-amber-400">{userReps}</strong> верифікованих повторень проти{' '}
              <strong className="text-neutral-400">{rivalReps}</strong> у {rivalName}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
            <div>
              <span className="text-xs text-neutral-400">Твій рахунок</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {userReps} репів
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-400">Зароблено XP</span>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
                +{userReps * 30} XP
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setGameState('ready');
                setUserReps(0);
                setRivalReps(0);
                setWinner(null);
              }}
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-neutral-950 font-bold font-heading shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              РЕВАНШ (ЩЕ РАЗ)
            </button>

            <button
              onClick={onClose}
              className="py-3.5 px-6 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-bold font-heading cursor-pointer"
            >
              Закрити дуель
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
