import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
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
  CheckCircle2
} from 'lucide-react';

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

  // Camera & Tracking state
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'active' | 'error' | 'simulation'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoiceOn, setIsVoiceOn] = useState<boolean>(true);
  const [lastFeedback, setLastFeedback] = useState<string>('Прийміть вихідне положення перед камерою');
  const [romPercent, setRomPercent] = useState<number>(0);
  const [repFlash, setRepFlash] = useState<boolean>(false);

  // Refs for tracking
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const motionPhaseRef = useRef<'down' | 'up'>('up');
  const lastRepTimeRef = useRef<number>(0);
  const recentYPositionsRef = useRef<number[]>([]);
  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rivalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const rivalTeam = userTeam === 'bodybuilding' ? 'calisthenics' : 'bodybuilding';
  const rivalName = userTeam === 'bodybuilding' ? 'Турнікмен Тарас' : 'Залізний Віктор';
  const userTeamName = userTeam === 'bodybuilding' ? 'Бодибілдинг' : 'Калістеніка';
  const rivalTeamName = rivalTeam === 'bodybuilding' ? 'Бодибілдинг' : 'Калістеніка';

  // Calculate live tug of war position (-50 to +50)
  const repDiff = userReps - rivalReps;
  const ropeShiftPercent = Math.max(10, Math.min(90, 50 + repDiff * 4));

  // Stop camera stream safely
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    setCameraStatus('idle');
    setErrorMessage(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('simulation');
      return;
    }

    try {
      stopCameraStream();

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user'
          },
          audio: false
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (!stream) {
        throw new Error('Не вдалося ініціалізувати веб-камеру.');
      }

      streamRef.current = stream;
      if (videoRef.current) {
        const vid = videoRef.current;
        vid.srcObject = stream;
        await new Promise<void>((resolve) => {
          let resolved = false;
          const done = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          vid.onloadedmetadata = done;
          vid.onloadeddata = done;
          vid.play().then(done).catch(done);
          setTimeout(done, 1000);
        });
      }
      setCameraStatus('active');
    } catch (err: unknown) {
      console.warn('Camera access denied or failed, switching to AI simulation:', err);
      setCameraStatus('simulation');
      setErrorMessage('Камера недоступна або доступ відхилено. Активовано режим AI-симуляції.');
    }
  }, [stopCameraStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (duelTimerRef.current) clearInterval(duelTimerRef.current);
      if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
    };
  }, [stopCameraStream]);

  // Handle start duel
  const handleStartDuel = async () => {
    setUserReps(0);
    setRivalReps(0);
    setWinner(null);
    setTimeLeft(duelMode === 'blitz45' ? 45 : 60);
    setGameState('active');
    sound.playAnvilHit();

    await startCamera();

    arnoVoice.speak(
      `Батл розпочато! Твоя команда — ${userTeamName}. Роби ${
        exerciseType === 'pushups' ? 'відтискання від підлоги' : 'присідання'
      } перед камерою і тягни ланцюг!`,
      { force: true }
    );
  };

  // Register physical rep from camera hands-free
  const handleRegisterUserRep = useCallback(() => {
    sound.playChainTug();
    setRepFlash(true);
    setTimeout(() => setRepFlash(false), 200);

    setUserReps((prev) => {
      const next = prev + 1;
      onRepCompleted(userTeam, next, 30);

      // Arno motivational commentary
      if (next === 1) {
        setLastFeedback('🔥 Перше чисто! Тягни ланцюг!');
      } else if (next === 5) {
        arnoVoice.speak('Пʼять повторень! Залізна техніка, так тримати!');
        setLastFeedback('⚡ 5 повторів! Опонент відчуває тиск!');
      } else if (next === 10) {
        arnoVoice.speak('Десять! Ланцюг тріщить на нашу користь!');
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
  }, [userTeam, onRepCompleted, duelMode]);

  // Finish duel helper
  const finishDuel = useCallback((forcedWinner?: 'user' | 'rival' | 'draw') => {
    setGameState('finished');
    if (duelTimerRef.current) clearInterval(duelTimerRef.current);
    if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
    stopCameraStream();

    let finalWinner: 'user' | 'rival' | 'draw' = 'draw';
    if (forcedWinner) {
      finalWinner = forcedWinner;
    } else if (userReps > rivalReps) {
      finalWinner = 'user';
    } else if (rivalReps > userReps) {
      finalWinner = 'rival';
    }

    setWinner(finalWinner);

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
      arnoVoice.speak(
        `Перемога! Твої повторення схилили шальки терезів на користь ${userTeamName}! Справжній титан!`,
        { force: true }
      );
    } else if (finalWinner === 'rival') {
      arnoVoice.speak(
        `Раунд за опонентом! Не опускай руки, віднови дихання та бери реванш!`,
        { force: true }
      );
    } else {
      arnoVoice.speak('Нічия! Сили абсолютно рівні, це була запекла битва!');
    }
  }, [userReps, rivalReps, stopCameraStream, userTeamName]);

  // Opponent AI rep generator (simulates human adversary repping every ~3.2 - 3.8s)
  useEffect(() => {
    if (gameState !== 'active') return;

    const scheduleNextRivalRep = () => {
      const delay = 2800 + Math.random() * 1400; // Realistic human interval
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

  // --- COMPUTER VISION KINEMATIC LOOP FOR LIVE WEBCAM & SIMULATION ---
  useEffect(() => {
    if (gameState !== 'active') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const processDuelFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = 320;
      const height = 240;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      const video = videoRef.current;
      const isRealCam = cameraStatus === 'active' && video && video.readyState >= 2;

      if (isRealCam && video) {
        // Draw real webcam mirror
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        try {
          const frame = ctx.getImageData(0, 0, width, height);
          const data = frame.data;

          if (prevFrameDataRef.current && prevFrameDataRef.current.length === data.length) {
            let sumX = 0;
            let sumY = 0;
            let motionPixels = 0;
            let minX = width;
            let maxX = 0;
            let minY = height;
            let maxY = 0;

            for (let i = 0; i < data.length; i += 16) {
              const diff =
                Math.abs(data[i] - prevFrameDataRef.current[i]) +
                Math.abs(data[i + 1] - prevFrameDataRef.current[i + 1]) +
                Math.abs(data[i + 2] - prevFrameDataRef.current[i + 2]);

              if (diff > 80) {
                const pxIdx = i / 4;
                const x = pxIdx % width;
                const y = Math.floor(pxIdx / width);

                sumX += x;
                sumY += y;
                motionPixels++;

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }

            if (motionPixels > 130) {
              const centroidX = sumX / motionPixels;
              const centroidY = sumY / motionPixels;
              const boxW = Math.max(1, maxX - minX);
              const boxH = Math.max(1, maxY - minY);
              const aspectRatio = boxW / boxH;
              const groundProximity = centroidY / height;

              // Sliding envelope tracking (adaptive floor & standing)
              recentYPositionsRef.current.push(centroidY);
              if (recentYPositionsRef.current.length > 35) {
                recentYPositionsRef.current.shift();
              }

              const recentYs = recentYPositionsRef.current;
              const dynMinY = Math.min(...recentYs);
              const dynMaxY = Math.max(...recentYs);
              const dynAmp = Math.max(1, dynMaxY - dynMinY);

              const isPushupMode = exerciseType === 'pushups' || (aspectRatio > 1.05 && groundProximity > 0.4);
              const rom = Math.min(100, Math.max(0, Math.round(((centroidY - dynMinY) / Math.max(12, dynAmp)) * 100)));
              setRomPercent(rom);

              // Down / Up trigger logic
              const now = Date.now();
              const minAmp = isPushupMode ? 14 : 20;
              const downTrigger = dynMinY + Math.max(minAmp, dynAmp * 0.52);
              const upTrigger = dynMinY + Math.max(6, dynAmp * 0.24);

              if (centroidY > downTrigger && motionPhaseRef.current === 'up') {
                motionPhaseRef.current = 'down';
              } else if (centroidY < upTrigger && motionPhaseRef.current === 'down') {
                if (now - lastRepTimeRef.current > 650) {
                  motionPhaseRef.current = 'up';
                  lastRepTimeRef.current = now;
                  handleRegisterUserRep();
                }
              }

              // Draw HUD box & markers
              ctx.strokeStyle = userTeam === 'bodybuilding' ? '#f59e0b' : '#06b6d4';
              ctx.lineWidth = 2;
              ctx.strokeRect(minX, minY, boxW, boxH);

              // Center crosshair
              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.arc(centroidX, centroidY, 6, 0, Math.PI * 2);
              ctx.fill();

              // Top Live Status Pill
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.fillRect(10, 10, 200, 26);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText(
                motionPhaseRef.current === 'down' ? '⬇ ОПУСКАННЯ' : '⬆ ВИШТОВХУВАННЯ',
                20,
                27
              );

              // Rep Count pill
              ctx.fillStyle = userTeam === 'bodybuilding' ? '#f59e0b' : '#06b6d4';
              ctx.fillRect(width - 90, 10, 80, 26);
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 12px sans-serif';
              ctx.fillText(`РЕПИ: ${userReps}`, width - 82, 28);
            }
          }

          prevFrameDataRef.current = new Uint8ClampedArray(data);
        } catch {
          // ignore
        }
      } else {
        // AI Simulated Athlete Canvas (Fallback)
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);

        // Tech grid
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        const t = Date.now() / 600;
        const repCycle = (Math.sin(t) + 1) / 2;
        setRomPercent(Math.round(repCycle * 100));

        // Simulated wireframe athlete
        ctx.strokeStyle = userTeam === 'bodybuilding' ? '#f59e0b' : '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(160, 80 + repCycle * 25, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '11px sans-serif';
        ctx.fillText('AI-СИМУЛЯТОР РУХУ (БЕЗ ВЕБКАМЕРИ)', 45, 190);
        ctx.fillText('Або натисніть ПРОБІЛ для ручного повтору', 40, 210);
      }

      animFrameRef.current = requestAnimationFrame(processDuelFrame);
    };

    animFrameRef.current = requestAnimationFrame(processDuelFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, cameraStatus, exerciseType, userTeam, userReps, handleRegisterUserRep]);

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
              КАМЕРА-БАТЛ: ЖИВИЙ ДУЕЛЬ-РАУНД
            </h2>
            <p className="text-xs text-neutral-400 font-sans">
              Без кнопок! Вебкамера фіксує кожне твоє фізичне повторення і перетягує ланцюг у прямому ефірі.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const state = arnoVoice.toggleVoice();
              setIsVoiceOn(state);
            }}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title={isVoiceOn ? 'Вимкнути голос Арно' : 'Увімкнути голос Арно'}
          >
            {isVoiceOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Закрити батл"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LIVE TUG-OF-WAR CHAIN VISUALIZER */}
      <div className="bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800 space-y-3">
        <div className="flex justify-between items-center text-sm font-bold font-heading">
          <div className="flex items-center gap-2 text-amber-400">
            <Dumbbell className="w-4 h-4" />
            <span>ТИ: {userReps} репів ({userTeamName})</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-400 font-mono">
            <Timer className="w-4 h-4 text-amber-400" />
            {duelMode === 'blitz45' ? (
              <span>Час: <strong className="text-white text-sm">{timeLeft}с</strong></span>
            ) : (
              <span>Ціль: <strong className="text-white text-sm">15 репів</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2 text-cyan-400">
            <span>{rivalName}: {rivalReps} репів</span>
            <Activity className="w-4 h-4" />
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
              repFlash ? 'scale-135 ring-4 ring-amber-400' : ''
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
                  🤸‍♂️ Відтискання від підлоги
                  <span className="block text-[11px] font-normal text-neutral-400 mt-1 font-sans">
                    Адаптивний трекер підлоги
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
                    Повна амплітуда стегон
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
              className="w-full h-full object-cover"
            />

            {/* Live Feedback Toast */}
            <div className="absolute bottom-3 inset-x-3 text-center">
              <div className="inline-block px-4 py-1.5 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-700 text-xs font-bold text-amber-300 shadow-lg">
                {lastFeedback}
              </div>
            </div>
          </div>

          {/* Rival Side Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-2xl animate-pulse">
                {rivalTeam === 'bodybuilding' ? '🏋️‍♂️' : '🤸‍♂️'}
              </div>
              <h4 className="text-lg font-bold text-white font-heading">
                {rivalName}
              </h4>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {rivalReps} РЕПІВ
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (rivalReps / (duelMode === 'first15' ? 15 : 20)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-3 space-y-2 text-center">
              <div className="text-xs text-neutral-400">Твій поточний рахунок:</div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {userReps} РЕПІВ
              </div>
              <p className="text-[11px] text-neutral-500">
                Камера фіксує рух. Працюй в повній амплітуді!
              </p>
            </div>

            <button
              onClick={() => finishDuel()}
              className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs font-bold transition-all cursor-pointer font-heading"
            >
              Завершити дуель достроково
            </button>
          </div>
        </div>
      )}

      {/* FINISHED SUMMARY SCREEN */}
      {gameState === 'finished' && (
        <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            {winner === 'user' ? '🏆' : winner === 'draw' ? '🤝' : '⚔️'}
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
              {winner === 'user' 
                ? 'ТИ ПЕРЕМІГ У ДУЕЛІ!' 
                : winner === 'draw' 
                ? 'БОЙОВА НІЧИЯ!' 
                : 'СУПЕРНИК БУВ ШВИДШИМ!'}
            </h3>
            <p className="text-sm text-neutral-300 font-sans">
              {winner === 'user'
                ? `Твої ${userReps} повторень принесли додаткові XP для команди ${userTeamName}!`
                : `Ти виконав ${userReps} повторень, суперник — ${rivalReps}. Спробуй ще раз!`}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="text-xs text-neutral-400">Твої репи</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{userReps}</div>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="text-xs text-neutral-400">XP для команди</div>
              <div className="text-2xl font-black text-green-400 mt-0.5">+{userReps * 30} XP</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={handleStartDuel}
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center gap-2 cursor-pointer font-heading"
            >
              <RotateCcw className="w-4 h-4" />
              Взяти реванш
            </button>

            <button
              onClick={onClose}
              className="py-3 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm cursor-pointer font-heading"
            >
              Повернутися до турніру
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
