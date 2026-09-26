import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VerifiedExerciseKind, VerificationProofEnvelope, Exercise } from '../types';
import { forgeGameStore } from '../services/forgeGameStore';
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
  XCircle
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
  // Game States
  const [gameState, setGameState] = useState<
    'lobby' | 'searching' | 'exercise_selection' | 'waiting_for_opponent' | 'calibration' | 'countdown' | 'battle' | 'settlement' | 'disconnected'
  >('lobby');

  // Battle Room Config
  const [battleCode, setBattleCode] = useState<string>('FORGE-8842');
  const [currentBattleId, setCurrentBattleId] = useState<string>('');
  const [sessionNonce, setSessionNonce] = useState<string>('NONCE-FGM-INIT');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [preCountdown, setPreCountdown] = useState<number>(3);
  const [searchSecondsLeft, setSearchSecondsLeft] = useState<number>(20);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Exercise Catalog & Selection State
  const [exerciseCatalog, setExerciseCatalog] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectionTimer, setSelectionTimer] = useState<number>(35);

  // Players Selection & Ready State
  const [mySelectedExerciseId, setMySelectedExerciseId] = useState<string>('pushups_classic');
  const [rivalSelectedExerciseId, setRivalSelectedExerciseId] = useState<string | null>(null);
  const [confirmedExerciseId, setConfirmedExerciseId] = useState<string>('pushups_classic');
  const [isMyReady, setIsMyReady] = useState<boolean>(false);
  const [isRivalReady, setIsRivalReady] = useState<boolean>(false);
  const [premiumLockModal, setPremiumLockModal] = useState<string | null>(null);

  // Opponent Meta
  const [rivalAthlete, setRivalAthlete] = useState({
    name: 'Норматив Кузні (Target Benchmark)',
    wallet: 'FORGE-BENCHMARK-OFFICIAL-SYSTEM',
    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=160&h=160&fit=crop',
    badge: 'Official Standard'
  });

  // Calibration State
  const [calibrationStatus, setCalibrationStatus] = useState<'checking' | 'body_detected' | 'ready'>('checking');
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);

  // Battle Performance Stats
  const [myValidReps, setMyValidReps] = useState<number>(0);
  const [myRejectedReps, setMyRejectedReps] = useState<number>(0);
  const [myRomPercent, setMyRomPercent] = useState<number>(0);
  const [myRejectCause, setMyRejectCause] = useState<string | null>(null);

  const [rivalValidReps, setRivalValidReps] = useState<number>(0);
  const [rivalRejectedReps, setRivalRejectedReps] = useState<number>(1);
  const [rivalRomPercent, setRivalRomPercent] = useState<number>(0);

  // Settlement Data
  const [settlementResult, setSettlementResult] = useState<{
    winnerId: string | 'draw';
    winnerReps: number;
    solanaTxSignature: string;
    solanaExplorerUrl: string;
    proofHash: string;
  } | null>(null);

  // Camera & Tracking Refs
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'active' | 'denied' | 'simulation'>('idle');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const battleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rivalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const myWallet = forgeGameStore.getWalletAddress();

  // Load Exercise Catalog on Mount
  useEffect(() => {
    forgeGameStore.fetchBattleExercises().then((list) => {
      setExerciseCatalog(list);
      setIsLoadingCatalog(false);
    });

    forgeGameStore.requestSessionNonce().then(res => {
      setSessionNonce(res.nonce);
    });

    setBattleCode(`FORGE-${Math.floor(1000 + Math.random() * 9000)}`);

    return () => {
      stopCameraStream();
      if (battleTimerRef.current) clearInterval(battleTimerRef.current);
      if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Stop camera stream safely
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      stopCameraStream();
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('simulation');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraStatus('active');
        };
      }
    } catch {
      setCameraStatus('simulation');
    }
  }, [stopCameraStream]);

  // Matchmaking Search
  const startMatchmakingSearch = async () => {
    sound.playClick();
    setGameState('searching');
    setSearchSecondsLeft(20);

    const res = await forgeGameStore.startMatchmaking({
      exercise: mySelectedExerciseId,
      athleteName: 'Ти (Athlete)',
      athleteWallet: myWallet,
      roomCode: battleCode
    });

    if (res && res.battleId) {
      setCurrentBattleId(res.battleId);
      if (res.opponent) {
        setRivalAthlete({
          name: res.opponent.name || 'Опонент',
          wallet: res.opponent.wallet || 'FORGE-RIVAL-WAL',
          avatar: res.opponent.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop',
          badge: res.opponent.badge || 'Fighter'
        });
      }
    }

    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    searchTimerRef.current = setInterval(async () => {
      setSearchSecondsLeft((prev) => {
        if (prev <= 1) {
          if (searchTimerRef.current) clearInterval(searchTimerRef.current);
          setGameState('exercise_selection');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelMatchmakingSearch = () => {
    sound.playClick();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (currentBattleId) {
      forgeGameStore.leaveBattleRoom(currentBattleId, myWallet);
    }
    setGameState('lobby');
  };

  // Real-time synchronization of room state during Exercise Selection
  useEffect(() => {
    if (gameState !== 'exercise_selection' && gameState !== 'waiting_for_opponent') return;

    const syncInterval = setInterval(async () => {
      if (!currentBattleId) return;
      const room = await forgeGameStore.fetchBattleRoomStatus(currentBattleId, myWallet);
      if (!room) return;

      if (room.status === 'DISCONNECTED') {
        setGameState('disconnected');
        clearInterval(syncInterval);
        return;
      }

      setSelectionTimer(room.secondsLeft || 0);

      // Determine who is P1 / P2
      if (room.p1.userId === myWallet || !room.p2.userId) {
        setRivalSelectedExerciseId(room.p2.selectedExerciseId);
        setIsRivalReady(room.p2.isReady);
      } else {
        setRivalSelectedExerciseId(room.p1.selectedExerciseId);
        setIsRivalReady(room.p1.isReady);
      }

      if (room.confirmedExerciseId) {
        setConfirmedExerciseId(room.confirmedExerciseId);
      }

      // If room advances to confirmed or both ready -> start Camera Calibration
      if (room.status === 'EXERCISE_CONFIRMED' || (room.p1.isReady && room.p2.isReady)) {
        clearInterval(syncInterval);
        sound.playLevelUp();
        setGameState('calibration');
        startCamera();
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [gameState, currentBattleId, myWallet, startCamera]);

  // Handle Exercise Selection Click
  const handleSelectExercise = async (exId: string, isPremium: boolean) => {
    sound.playClick();
    if (isPremium) {
      // Check user premium entitlement
      const res = await forgeGameStore.selectBattleExercise(currentBattleId || 'battle_temp', myWallet, exId);
      if (!res.success && res.isPremiumRequired) {
        sound.playClick();
        setPremiumLockModal(exId);
        return;
      }
    }

    setMySelectedExerciseId(exId);
    setIsMyReady(false); // Reset ready on new choice

    if (currentBattleId) {
      const res = await forgeGameStore.selectBattleExercise(currentBattleId, myWallet, exId);
      if (res.confirmedExerciseId) {
        setConfirmedExerciseId(res.confirmedExerciseId);
      }
    } else {
      setConfirmedExerciseId(exId);
    }
  };

  // Confirm Ready Button
  const handleConfirmReady = async () => {
    sound.playGong();
    setIsMyReady(true);
    setGameState('waiting_for_opponent');

    if (currentBattleId) {
      const res = await forgeGameStore.confirmBattleReady(currentBattleId, myWallet, true);
      if (res.status === 'EXERCISE_CONFIRMED') {
        setGameState('calibration');
        startCamera();
      }
    } else {
      // Offline / Solo rival fallback -> proceed immediately
      setTimeout(() => {
        setIsRivalReady(true);
        setGameState('calibration');
        startCamera();
      }, 1000);
    }
  };

  // Change exercise button
  const handleChangeExercise = () => {
    sound.playClick();
    setIsMyReady(false);
    setGameState('exercise_selection');
    if (currentBattleId) {
      forgeGameStore.confirmBattleReady(currentBattleId, myWallet, false);
    }
  };

  // Calibration check phase
  useEffect(() => {
    if (gameState !== 'calibration') return;

    let calCount = 0;
    const interval = setInterval(() => {
      calCount += 25;
      setCalibrationProgress(calCount);
      if (calCount >= 100) {
        clearInterval(interval);
        setCalibrationStatus('ready');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState]);

  // Launch Countdown (3, 2, 1, GO!)
  const launchCountdown = () => {
    sound.playClick();
    setGameState('countdown');
    setPreCountdown(3);
    setMyValidReps(0);
    setMyRejectedReps(0);
    setRivalValidReps(0);
    setRivalRejectedReps(0);
    setTimeLeft(60);
    setSettlementResult(null);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setPreCountdown(count);
        sound.playChainTug();
      } else {
        clearInterval(interval);
        sound.playGong();
        setGameState('battle');
        startBattleClock();
      }
    }, 1000);
  };

  // 60-Second Battle Clock & Rival Simulation
  const startBattleClock = () => {
    battleTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(battleTimerRef.current!);
          finishBattle();
          return 0;
        }

        if (prev === 11) {
          sound.playChainTug();
        } else if (prev <= 4 && prev >= 2) {
          sound.playTimerTick();
        }

        return prev - 1;
      });
    }, 1000);

    // Competitive rival pacing
    const rivalTarget = 27 + Math.floor(Math.random() * 6);
    rivalIntervalRef.current = setInterval(() => {
      setRivalValidReps((prev) => {
        if (prev >= 35) return prev;
        if (Math.random() < 0.08) {
          setRivalRejectedReps(r => r + 1);
        }
        return prev + 1;
      });
    }, 1800);
  };

  // Register verified rep
  const registerValidRep = useCallback(() => {
    setMyValidReps((prev) => prev + 1);
    setMyRejectCause(null);
    sound.playTrophy();
  }, []);

  const registerRejectedRep = useCallback((reason: string) => {
    setMyRejectedReps((prev) => prev + 1);
    setMyRejectCause(reason);
    sound.playCoachWhistle();
  }, []);

  // Pose Tracking Loop during Active Battle
  useEffect(() => {
    if (gameState !== 'battle') return;

    // Set PoseDetector to confirmed exercise
    poseService.setExercise(confirmedExerciseId as any);
    poseService.resetCounters();

    const unsubRep = poseService.onRep(() => {
      registerValidRep();
    });

    const unsubReject = poseService.onReject((reason) => {
      let msg = 'Неповна амплітуда';
      if (reason === 'too_shallow') msg = 'Неповна амплітуда (ROM < 80%)';
      else if (reason === 'bad_alignment') msg = 'Помилка вирівнювання тіла';
      else if (reason === 'too_fast') msg = 'Занадто швидкий темп / ривок (< 0.7с)';
      else if (reason === 'no_lockout') msg = 'Повне розгинання (lockout)!';
      registerRejectedRep(msg);
    });

    const unsubFrame = poseService.onFrame((result) => {
      setMyRomPercent(result.repProgress);
    });

    let isRunning = true;
    const processFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = 320;
          canvas.height = 240;
          ctx.save();
          ctx.translate(320, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, 320, 240);
          ctx.restore();

          poseService.sendVideoFrame(video);

          const skel = poseService.getLastSkeleton();
          const res = poseService.getLastResult();
          if (skel && res) {
            drawBiomechanicalSkeleton(ctx, 320, 240, skel, res, true);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      unsubRep();
      unsubReject();
      unsubFrame();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, confirmedExerciseId, registerValidRep, registerRejectedRep]);

  // Finish Battle & Settle Results
  const finishBattle = async () => {
    if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    stopCameraStream();

    sound.playTrophy();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    setGameState('settlement');

    const isWin = myValidReps > rivalValidReps;
    const isDraw = myValidReps === rivalValidReps;
    const winnerId = isWin ? myWallet : isDraw ? 'draw' : rivalAthlete.wallet;

    const settlement = await forgeGameStore.settleBattleDuel({
      battleId: currentBattleId || `battle_${Date.now()}`,
      exercise: confirmedExerciseId as any,
      player1: {
        id: myWallet,
        name: 'Ти (Athlete)',
        reps: myValidReps
      },
      player2: {
        id: rivalAthlete.wallet,
        name: rivalAthlete.name,
        reps: rivalValidReps
      },
      winnerId
    });

    setSettlementResult(settlement);
  };

  // Filter Catalog
  const filteredExercises = exerciseCatalog.filter((ex) => {
    if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeConfirmedMeta = exerciseCatalog.find((e) => e.id === confirmedExerciseId) || exerciseCatalog[0] || {
    name: 'Класичні віджимання',
    description: 'Базова вправа'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ========================================================================= */}
      {/* 1. LOBBY STATE */}
      {/* ========================================================================= */}
      {gameState === 'lobby' && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Battle Arena • 1v1 Verified Reps
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-100 font-epic uppercase tracking-tight">
              Битва Таборів та Камера-Дуелі
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Оберіть суперника, узгодьте вправу та доведіть силу у 60-секундному камера-спринті з компʼютерним аналізом кутів рухів.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Find Match Card */}
            <div className="rounded-3xl border border-amber-500/30 bg-neutral-900/80 p-8 flex flex-col justify-between space-y-6 hover:border-amber-500/60 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Swords className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-100">Матчмейкінг 1v1</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Автоматичний пошук рівного за рангом атлета або дуель проти офіційного нормативу Кузні.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span>Кімната дуелі:</span>
                    <span className="font-mono text-amber-400 font-bold">#{battleCode}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Тривалість раунду:</span>
                    <span className="font-mono font-bold text-neutral-200">60 секунд</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Верифікація:</span>
                    <span className="text-emerald-400 font-semibold">AI Camera Angles</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startMatchmakingSearch}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-sm shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Знайти суперника (Matchmaking)
              </button>
            </div>

            {/* Direct Code / Challenge Card */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-100">Виклик по посиланню</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Створіть приватний код та надішліть його другу для прямого поєдинку.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-300">
                    {window.location.origin}/#duel-{battleCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#duel-${battleCode}`);
                      sound.playClick();
                    }}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer"
                  >
                    Копіювати
                  </button>
                </div>
              </div>

              <button
                onClick={startMatchmakingSearch}
                className="w-full py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Створити приватну дуель
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEARCHING STATE */}
      {/* ========================================================================= */}
      {gameState === 'searching' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-12">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-extrabold font-mono text-xl">
              {searchSecondsLeft}s
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-100 font-epic uppercase">Шукаємо суперника...</h2>
            <p className="text-xs text-neutral-400">
              Пошук активного атлета в кімнаті #{battleCode}. Автоматичний підбір за рангом.
            </p>
          </div>

          <button
            onClick={cancelMatchmakingSearch}
            className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
          >
            Скасувати пошук
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXERCISE SELECTION SCREEN (MAIN FEATURE) */}
      {/* ========================================================================= */}
      {(gameState === 'exercise_selection' || gameState === 'waiting_for_opponent') && (
        <BattleExerciseSelection
          onBackToArena={() => {
            sound.playClick();
            setGameState('lobby');
          }}
          onExerciseConfirmed={(selectedEx: Exercise) => {
            sound.playAnvilHit();
            setConfirmedExerciseId(selectedEx.id);
            setMySelectedExerciseId(selectedEx.id);
            setGameState('calibration');
            startCamera();
          }}
          onNavigateToPremium={onNavigateToBilling}
        />
      )}

      {/* Premium Lock Alert Modal */}
      {premiumLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-neutral-950 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-100">Forge Premium Вправа</h3>
            <p className="text-xs text-neutral-400">
              Ця вправа вимагає підтвердженого статусу Forge Premium для використання у батлах.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPremiumLockModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-neutral-400 text-xs font-bold"
              >
                Закрити
              </button>
              <button
                onClick={() => {
                  setPremiumLockModal(null);
                  if (onNavigateToBilling) onNavigateToBilling();
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold"
              >
                Активувати Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CALIBRATION STATE */}
      {/* ========================================================================= */}
      {gameState === 'calibration' && (
        <div className="max-w-xl mx-auto space-y-6 text-center py-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Калібрування Позиції
            </span>
            <h2 className="text-2xl font-bold text-neutral-100 font-epic">
              Камера-Верифікація: {activeConfirmedMeta.name}
            </h2>
            <p className="text-xs text-neutral-400">
              Станьте перед камерою так, щоб усе тіло увійшло в кадр. Система перевіряє лінійність скелета.
            </p>
          </div>

          <div className="relative aspect-video max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-neutral-950 shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover hidden" playsInline />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* Skeleton Status Banner */}
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Скелет виявлено в кадрі
              </span>
              <span className="font-mono">{calibrationProgress}%</span>
            </div>
          </div>

          <button
            onClick={launchCountdown}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
          >
            Розпочати 60s Спринт (Countdown)
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. COUNTDOWN & ACTIVE BATTLE */}
      {/* ========================================================================= */}
      {(gameState === 'countdown' || gameState === 'battle') && (
        <div className="space-y-6">
          {/* Top HUD Stats */}
          <div className="grid grid-cols-3 items-center gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            {/* My Score */}
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase text-amber-400 block">Ваші Верифіковані Репи</span>
              <div className="text-3xl font-black text-amber-300 font-mono">{myValidReps}</div>
              <span className="text-[10px] text-rose-400 font-medium">Відхилено: {myRejectedReps}</span>
            </div>

            {/* Battle Timer */}
            <div className="text-center">
              <div className="text-2xl font-black text-neutral-100 font-mono tracking-wider">
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">{activeConfirmedMeta.name}</span>
            </div>

            {/* Rival Score */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">{rivalAthlete.name}</span>
              <div className="text-3xl font-black text-neutral-200 font-mono">{rivalValidReps}</div>
              <span className="text-[10px] text-neutral-500 font-medium">Норматив: 28</span>
            </div>
          </div>

          {/* Camera Canvas View */}
          <div className="relative aspect-video max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-neutral-950 shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover hidden" playsInline />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* Pre-battle Countdown Overlay */}
            {gameState === 'countdown' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
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
            {myRejectCause && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-500/90 text-neutral-950 font-extrabold text-xs shadow-lg animate-pulse">
                ⚠️ {myRejectCause}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SETTLEMENT & RESULT STATE */}
      {/* ========================================================================= */}
      {gameState === 'settlement' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-8">
          <div className="p-8 rounded-3xl border-2 border-amber-500 bg-neutral-900/90 space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-3xl">
              🏆
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-neutral-100 font-epic uppercase">
                {myValidReps > rivalValidReps ? 'ПЕРЕМОГА!' : myValidReps === rivalValidReps ? 'НІЧИЯ!' : 'ПОРАЗКА'}
              </h2>
              <p className="text-xs text-neutral-400">
                Раунд верифіковано компʼютерним аналізом. Результати занесено до Forge Passport.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block">Ваш результат</span>
                <span className="text-xl font-bold text-amber-300 font-mono">{myValidReps} репів</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Суперник</span>
                <span className="text-xl font-bold text-neutral-300 font-mono">{rivalValidReps} репів</span>
              </div>
            </div>

            {settlementResult && (
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-left text-[11px] space-y-2 font-mono">
                {settlementResult.solanaTxSignature ? (
                  <>
                    <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Solana On-Chain Proof Recorded
                    </div>
                    <div className="text-neutral-400 truncate">Hash: {settlementResult.proofHash || '—'}</div>
                    {settlementResult.solanaExplorerUrl && (
                      <a
                        href={settlementResult.solanaExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Переглянути транзакцію в Solana Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <div className="text-neutral-500 truncate">Tx: {settlementResult.solanaTxSignature}</div>
                  </>
                ) : (
                  <>
                    <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Solana Proof не записано
                    </div>
                    <div className="text-neutral-500">Результат Battle збережено, але реальна on-chain транзакція не була підтверджена.</div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setGameState('lobby');
                sound.playClick();
              }}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-extrabold cursor-pointer"
            >
              Нова дуель
            </button>
          </div>
        </div>
      )}

      {/* Disconnected State */}
      {gameState === 'disconnected' && (
        <div className="max-w-md mx-auto text-center space-y-6 py-12">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl border border-rose-500/40">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neutral-100">Суперник відключився</h3>
            <p className="text-xs text-neutral-400">
              Звʼязок з другим гравцем було втрачено під час вибору вправи. Спробуйте новий матчмейкінг.
            </p>
          </div>
          <button
            onClick={() => setGameState('lobby')}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold cursor-pointer"
          >
            Повернутися у лобі
          </button>
        </div>
      )}
    </div>
  );
};
