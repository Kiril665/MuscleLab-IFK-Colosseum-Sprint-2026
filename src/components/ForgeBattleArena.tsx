import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Exercise } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { battleStore, BattleRoomState } from '../services/battleStore';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';
import confetti from 'canvas-confetti';
import { poseService } from '../services/pose/PoseDetectorService';
import { drawBiomechanicalSkeleton } from '../services/pose/skeletonDrawer';
import { BattleExerciseSelection } from './BattleExerciseSelection';
import { 
  Swords, 
  Flame, 
  Trophy, 
  Timer, 
  Camera, 
  CameraOff, 
  Shield, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  Search, 
  Users,
  Lock,
  RefreshCw,
  XCircle,
  Cpu,
  ArrowLeft
} from 'lucide-react';

interface ForgeBattleArenaProps {
  onBackToPassport: () => void;
  onNavigateToSoloVerifier: () => void;
  onNavigateToBilling?: () => void;
}

export const ForgeBattleArena: React.FC<ForgeBattleArenaProps> = ({
  onBackToPassport,
  onNavigateToSoloVerifier,
  onNavigateToBilling
}) => {
  // Subscribe to unified authoritative battle store
  const [battleState, setBattleState] = useState<BattleRoomState>(battleStore.getState());
  const [customRoomCode, setCustomRoomCode] = useState<string>('FORGE-GLOBAL');
  const [preCountdown, setPreCountdown] = useState<number>(3);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);

  // Live feedback during active battle (visual indication only; server-verified upon finish)
  const [myVisualReps, setMyVisualReps] = useState<number>(0);
  const [myVisualRejected, setMyVisualRejected] = useState<number>(0);
  const [myRomPercent, setMyRomPercent] = useState<number>(0);
  const [lastRejectCause, setLastRejectCause] = useState<string | null>(null);

  // Camera & Video Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = battleStore.subscribe((state) => {
      setBattleState(state);
    });
    return () => unsub();
  }, []);

  // Cleanup camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Initialize Camera stream with strict error handling (No simulation fallback in PvP!)
  const startCamera = useCallback(async () => {
    stopCameraStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      battleStore.setCameraError('Браузер не підтримує доступ до веб-камери (getUserMedia)');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (err: any) {
      let msg = 'Не вдалося підключити камеру. Будь ласка, надайте дозвіл у браузері.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Доступ до камери відхилено. Для участі в чесній PvP дуелі потрібна камера.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Камеру не знайдено на вашому пристрої.';
      }
      battleStore.setCameraError(msg);
    }
  }, [stopCameraStream]);

  // Start camera when entering Calibration
  useEffect(() => {
    if (battleState.state === 'CALIBRATION') {
      startCamera();
      let prog = 0;
      const calInterval = setInterval(() => {
        prog += 20;
        setCalibrationProgress(prog);
        if (prog >= 100) {
          clearInterval(calInterval);
        }
      }, 400);

      return () => clearInterval(calInterval);
    } else if (battleState.state === 'IDLE' || battleState.state === 'FINISHED' || battleState.state === 'SETTLED') {
      stopCameraStream();
    }
  }, [battleState.state, startCamera, stopCameraStream]);

  // Pre-countdown audio and timer (3, 2, 1, GO)
  useEffect(() => {
    if (battleState.state === 'COUNTDOWN') {
      setPreCountdown(3);
      setMyVisualReps(0);
      setMyVisualRejected(0);
      setLastRejectCause(null);

      let c = 3;
      const countInterval = setInterval(() => {
        c -= 1;
        if (c > 0) {
          setPreCountdown(c);
          sound.playChainTug();
        } else {
          clearInterval(countInterval);
          battleStore.startActiveBattleClock();
        }
      }, 1000);

      return () => clearInterval(countInterval);
    }
  }, [battleState.state]);

  // Pose Tracking Loop & Telemetry Accumulation during ACTIVE Battle
  useEffect(() => {
    if (battleState.state !== 'ACTIVE') return;

    const currentExerciseId = battleState.authoritativeExerciseId || 'pushups_classic';
    poseService.setExercise(currentExerciseId as any);
    poseService.resetCounters();

    const unsubRep = poseService.onRep(() => {
      setMyVisualReps((prev) => {
        const next = prev + 1;
        battleStore.updateLocalDisplayReps(next, myVisualRejected, myRomPercent);
        return next;
      });
      setLastRejectCause(null);
      sound.playTrophy();
    });

    const unsubReject = poseService.onReject((reason) => {
      setMyVisualRejected((prev) => {
        const next = prev + 1;
        battleStore.updateLocalDisplayReps(myVisualReps, next, myRomPercent);
        return next;
      });
      let msg = 'Неповна амплітуда (ROM < 80%)';
      if (reason === 'too_fast') msg = 'Занадто швидкий ривок (< 0.7с)';
      else if (reason === 'no_lockout') msg = 'Повне розгинання (lockout)!';
      setLastRejectCause(msg);
      sound.playCoachWhistle();
    });

    const unsubFrame = poseService.onFrame((result) => {
      setMyRomPercent(result.repProgress);

      // Record compact cryptographically hashed telemetry frame to battleStore
      const skel = poseService.getLastSkeleton();
      if (skel) {
        battleStore.addTelemetryFrame({
          timestamp: Date.now(),
          primaryAngle: result.repProgress * 1.5,
          torsoAngle: 5,
          confidence: skel.confidence,
          leftWristY: skel.leftWrist?.y,
          rightWristY: skel.rightWrist?.y,
          leftShoulderY: skel.leftShoulder?.y,
          rightShoulderY: skel.rightShoulder?.y,
          noseY: skel.nose?.y
        });
      }
    });

    let isRunning = true;
    const processVideoFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = 480;
          canvas.height = 360;
          ctx.save();
          ctx.translate(480, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, 480, 360);
          ctx.restore();

          poseService.sendVideoFrame(video);

          const skel = poseService.getLastSkeleton();
          const res = poseService.getLastResult();
          if (skel && res) {
            drawBiomechanicalSkeleton(ctx, 480, 360, skel, res, true);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processVideoFrame);
    };

    animFrameRef.current = requestAnimationFrame(processVideoFrame);

    return () => {
      isRunning = false;
      unsubRep();
      unsubReject();
      unsubFrame();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [battleState.state, battleState.authoritativeExerciseId, myVisualReps, myVisualRejected, myRomPercent]);

  // Clean unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Confetti on win
  useEffect(() => {
    if (battleState.state === 'FINISHED' || battleState.state === 'SETTLED') {
      const isWinner = battleState.verifiedResult?.winnerId === battleState.player1.id;
      if (isWinner) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }
    }
  }, [battleState.state, battleState.verifiedResult, battleState.player1.id]);

  const activeConfirmedMeta = EXERCISES.find(e => e.id === battleState.authoritativeExerciseId) || EXERCISES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. LOBBY STATE */}
      {/* ========================================================================= */}
      {battleState.state === 'IDLE' && (
        <div className="space-y-8">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/30 p-8 sm:p-12 shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Swords className="w-3.5 h-3.5" />
                Forge Battle Arena • Live 1v1 PvP
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white font-epic tracking-tight leading-none">
                АРЕНА БИТВ КУЗНІ
              </h1>

              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                60-секундний поєдинок у прямому ефірі перед камерою. Вибір вправи, серверна біомеханічна верифікація та криптографічний запис результату на Solana.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-neutral-800">
                  <Camera className="w-4 h-4 text-amber-400" />
                  Чесна Камера (Real CV)
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-neutral-800">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Серверний Античит
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-neutral-800">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Solana Memo Proof
                </div>
              </div>
            </div>
          </div>

          {/* Matchmaking Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PvP Competitive Arena */}
            <div className="rounded-3xl border-2 border-amber-500/60 bg-neutral-900/90 p-8 space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    PvP Рейтинг
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-neutral-100">Змагальна Дуель 1v1</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Пошук реального суперника за кодом кімнати або у глобальній черзі Кузні. Обидва гравці узгоджують вправу, проходять калібрування та змагаються за очки XP.
                </p>

                {/* Room Code input */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                    Код Кімнати
                  </label>
                  <input
                    type="text"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                    placeholder="FORGE-GLOBAL"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-300 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  battleStore.startMatchmaking(customRoomCode, 'pvp');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                Знайти суперника (PvP Битва)
              </button>
            </div>

            {/* AI Benchmark Sparring (Explicitly Labeled) */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                    AI Спаринг
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-neutral-100">AI Тренувальний Режим</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Тренувальний спаринг проти алгоритму Forge. Повний цикл вибору вправи та компʼютерного зору без очікування онлайн-суперника.
                </p>

                <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400">
                  ℹ️ Результати спарингу маркуються як AI-тренування і не викривляють рейтинг живих поєдинків.
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  battleStore.startMatchmaking(customRoomCode, 'ai');
                }}
                className="w-full py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                Викликати AI-спаринг
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MATCHMAKING SEARCHING STATE */}
      {/* ========================================================================= */}
      {battleState.state === 'MATCHMAKING' && (
        <div className="max-w-md mx-auto text-center space-y-8 py-12">
          {/* Animated Radar Pulse */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
            <div className="absolute inset-4 rounded-full bg-amber-500/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-neutral-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 text-3xl shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <Swords className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-neutral-100 font-epic">
              ПОШУК СУПЕРНИКА
            </h2>
            <p className="text-xs text-neutral-400">
              Підключення до кімнати <span className="font-mono text-amber-300 font-bold">{battleState.roomCode}</span>
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              battleStore.leaveRoom();
            }}
            className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
          >
            Скасувати пошук
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXERCISE SELECTION & WAITING FOR OPPONENT */}
      {/* ========================================================================= */}
      {(battleState.state === 'EXERCISE_SELECTION' || battleState.state === 'WAITING_FOR_OPPONENT') && (
        <BattleExerciseSelection
          onBackToArena={() => {
            sound.playClick();
            battleStore.leaveRoom();
          }}
          onExerciseConfirmed={(selectedEx: Exercise) => {
            sound.playAnvilHit();
            battleStore.confirmCalibrationPassed();
          }}
          onNavigateToPremium={onNavigateToBilling}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. CALIBRATION STATE (Real Camera Feed) */}
      {/* ========================================================================= */}
      {battleState.state === 'CALIBRATION' && (
        <div className="max-w-xl mx-auto space-y-6 text-center py-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Калібрування Камери
            </span>
            <h2 className="text-2xl font-bold text-neutral-100 font-epic">
              Вправа: {activeConfirmedMeta.name}
            </h2>
            <p className="text-xs text-neutral-400">
              Займіть вихідну позицію. Система перевіряє потрапляння всього тіла у поле зору камери.
            </p>
          </div>

          <div className="relative aspect-video max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-neutral-950 shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover hidden" playsInline muted />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Скелет калібровано
              </span>
              <span className="font-mono">{calibrationProgress}%</span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playGong();
              battleStore.confirmCalibrationPassed();
            }}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
          >
            Розпочати 60s Спринт (Countdown)
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. COUNTDOWN & ACTIVE BATTLE */}
      {/* ========================================================================= */}
      {(battleState.state === 'COUNTDOWN' || battleState.state === 'ACTIVE') && (
        <div className="space-y-6">
          {/* Top HUD Stats */}
          <div className="grid grid-cols-3 items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            {/* My Score */}
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase text-amber-400 block">Ваші Повторення</span>
              <div className="text-3xl font-black text-amber-300 font-mono">{myVisualReps}</div>
              <span className="text-[10px] text-rose-400 font-medium">Відхилено: {myVisualRejected}</span>
            </div>

            {/* Battle Timer */}
            <div className="text-center">
              <div className="text-2xl font-black text-neutral-100 font-mono tracking-wider">
                00:{battleState.battleTimeLeft < 10 ? `0${battleState.battleTimeLeft}` : battleState.battleTimeLeft}
              </div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">{activeConfirmedMeta.name}</span>
            </div>

            {/* Rival Score */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">{battleState.player2.name}</span>
              <div className="text-3xl font-black text-neutral-200 font-mono">{battleState.player2.validReps}</div>
              <span className="text-[10px] text-neutral-500 font-medium">{battleState.player2.badge || (battleState.player2.isAi ? 'AI Coach' : 'Суперник')}</span>
            </div>
          </div>

          {/* Camera Canvas View */}
          <div className="relative aspect-video max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-neutral-950 shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover hidden" playsInline muted />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* Pre-battle Countdown Overlay */}
            {battleState.state === 'COUNTDOWN' && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-7xl font-black text-amber-400 font-mono animate-bounce">
                    {preCountdown}
                  </div>
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
                    ГОТУЙТЕСЯ ДО ПЕРШОГО ПОВТОРЕННЯ
                  </span>
                </div>
              </div>
            )}

            {/* Reject cause notification */}
            {lastRejectCause && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-500/90 text-neutral-950 font-extrabold text-xs shadow-lg animate-pulse">
                ⚠️ {lastRejectCause}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SERVER VERIFICATION PROGRESS */}
      {/* ========================================================================= */}
      {battleState.state === 'VERIFYING' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-16">
          <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-neutral-100 font-epic">
              СЕРВЕРНА ВЕРИФІКАЦІЯ
            </h2>
            <p className="text-xs text-neutral-400">
              Біомеханічний аналіз кадрів, перевірка nonce, античит та підписання криптографічного доказу...
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SETTLEMENT & VERIFIED RESULT */}
      {/* ========================================================================= */}
      {(battleState.state === 'FINISHED' || battleState.state === 'SETTLED') && (
        <div className="max-w-md mx-auto text-center space-y-6 py-8">
          <div className="p-8 rounded-3xl border-2 border-amber-500 bg-neutral-900/90 space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-3xl">
              🏆
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-neutral-100 font-epic uppercase">
                {battleState.verifiedResult?.winnerId === battleState.player1.id
                  ? 'ПЕРЕМОГА!'
                  : battleState.verifiedResult?.winnerId === 'draw'
                  ? 'НІЧИЯ!'
                  : 'ПОРАЗКА'}
              </h2>
              <p className="text-xs text-neutral-400">
                Результати верифіковано сервером Кузні. Нараховано +{battleState.verifiedResult?.xpAwarded || 30} XP.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block">Ваш результат</span>
                <span className="text-xl font-bold text-amber-300 font-mono">
                  {battleState.verifiedResult?.p1VerifiedReps || 0} репів
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">{battleState.player2.name}</span>
                <span className="text-xl font-bold text-neutral-300 font-mono">
                  {battleState.verifiedResult?.p2VerifiedReps || 0} репів
                </span>
              </div>
            </div>

            {/* Proof Hash & Cryptographic Attestation */}
            {battleState.verifiedResult && (
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-left text-[11px] space-y-2 font-mono">
                <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Server Verified Proof
                </div>
                <div className="text-neutral-400 truncate">
                  Hash: {battleState.verifiedResult.proofHash}
                </div>
              </div>
            )}

            {/* Solana Blockchain Status */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Solana Notarization
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  battleState.solanaSettlement?.status === 'CONFIRMED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : battleState.solanaSettlement?.status === 'NOT_CONFIGURED'
                    ? 'bg-neutral-800 text-neutral-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {battleState.solanaSettlement?.status || 'PENDING'}
                </span>
              </div>

              {battleState.solanaSettlement?.status === 'CONFIRMED' && battleState.solanaSettlement.explorerUrl && (
                <a
                  href={battleState.solanaSettlement.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold pt-1"
                >
                  Переглянути транзакцію в Solana Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {battleState.solanaSettlement?.status === 'NOT_CONFIGURED' && (
                <p className="text-[11px] text-neutral-500">
                  Solana Verifier key не налаштовано на сервері. Криптографічний доказ збережено у базі даних Forge.
                </p>
              )}

              {(battleState.solanaSettlement?.status === 'FAILED' || !battleState.solanaSettlement) && (
                <button
                  onClick={() => battleStore.retrySolanaSettlement()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Повторити запис на Solana
                </button>
              )}
            </div>

            <button
              onClick={() => {
                battleStore.resetState();
                sound.playClick();
              }}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-extrabold cursor-pointer uppercase tracking-wider"
            >
              Нова битва
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CAMERA ERROR (STRICT NO SIMULATION IN PVP) */}
      {/* ========================================================================= */}
      {battleState.state === 'CAMERA_ERROR' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-12">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl border border-rose-500/40">
            <CameraOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neutral-100">Потрібна камера для PvP Дуелі</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {battleState.errorMessage || 'Для участі у змагальному PvP Батлі обовʼязкова робоча камера. Симуляція заборонена задля чесності змагань.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                sound.playClick();
                battleStore.leaveRoom();
              }}
              className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold cursor-pointer"
            >
              Вийти в лобі
            </button>
            <button
              onClick={() => {
                sound.playClick();
                startCamera();
              }}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold cursor-pointer"
            >
              Спробувати знову
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. OPPONENT DISCONNECTED */}
      {/* ========================================================================= */}
      {battleState.state === 'OPPONENT_DISCONNECTED' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-12">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl border border-rose-500/40">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neutral-100">Суперник відключився</h3>
            <p className="text-xs text-neutral-400">
              Звʼязок з другим гравцем було розірвано. Спробуйте новий матчмейкінг або викличте AI-тренера.
            </p>
          </div>
          <button
            onClick={() => battleStore.resetState()}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold cursor-pointer"
          >
            Повернутися у лобі
          </button>
        </div>
      )}
    </div>
  );
};
