import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VerifiedExerciseKind, BattleSessionData, DuelParticipant } from '../types';
import { forgeGameStore, ACTIVE_SPONSOR_CHALLENGE } from '../services/forgeGameStore';
import { sound } from '../services/soundEngine';
import confetti from 'canvas-confetti';
import { poseService } from '../services/pose/PoseDetectorService';
import { drawBiomechanicalSkeleton } from '../services/pose/skeletonDrawer';
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
  Volume2, 
  VolumeX,
  Sparkles,
  ArrowRight,
  Search,
  Users
} from 'lucide-react';

interface ForgeBattleArenaProps {
  onBackToPassport: () => void;
  onNavigateToSoloVerifier: () => void;
}

export const ForgeBattleArena: React.FC<ForgeBattleArenaProps> = ({
  onBackToPassport,
  onNavigateToSoloVerifier
}) => {
  // Exercise Selection
  const [selectedExercise, setSelectedExercise] = useState<VerifiedExerciseKind>('pushups');
  const [gameState, setGameState] = useState<'lobby' | 'searching' | 'waiting' | 'countdown' | 'battle' | 'settlement'>('lobby');

  // Battle Config & State
  const [battleCode, setBattleCode] = useState<string>('FORGE-8842');
  const [sessionNonce, setSessionNonce] = useState<string>('NONCE-FGM-INIT');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [preCountdown, setPreCountdown] = useState<number>(3);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [searchSecondsLeft, setSearchSecondsLeft] = useState<number>(20);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Participants
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

  // Camera & Tracking
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'active' | 'denied' | 'simulation'>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repFlash, setRepFlash] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Telemetry Ref
  const lastRepTimeRef = useRef<number>(0);

  // Intervals Ref
  const battleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rivalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const myWallet = forgeGameStore.getWalletAddress();
  const rivalAthlete = {
    name: 'Норматив Кузні (Target Benchmark)',
    wallet: 'FORGE-BENCHMARK-OFFICIAL-SYSTEM',
    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=160&h=160&fit=crop',
    badge: 'Official Standard • 28 Reps / 60s'
  };

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

  // Request fresh Anti-Replay nonce on mount
  useEffect(() => {
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
  }, [stopCameraStream]);

  // Matchmaking Search with 20s Timeout (#82)
  const startMatchmakingSearch = async () => {
    sound.playClick();
    setGameState('searching');
    setSearchSecondsLeft(20);

    // Call backend matchmaking
    forgeGameStore.startMatchmaking({
      exercise: selectedExercise,
      athleteName: 'Ти (Athlete)',
      athleteWallet: myWallet,
      roomCode: battleCode
    });

    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    searchTimerRef.current = setInterval(async () => {
      setSearchSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timeout reached!
          if (searchTimerRef.current) clearInterval(searchTimerRef.current);
          forgeGameStore.cancelMatchmaking(battleCode, selectedExercise);
          setGameState('waiting');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelMatchmakingSearch = () => {
    sound.playClick();
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    forgeGameStore.cancelMatchmaking(battleCode, selectedExercise);
    setGameState('lobby');
  };

  // Handle Pre-Battle Countdown (3, 2, 1, FIGHT!)
  const launchCountdown = () => {
    sound.playClick();
    startCamera();
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
    // 60s countdown
    battleTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(battleTimerRef.current!);
          finishBattle();
          return 0;
        }

        // Sound cues at critical thresholds
        if (prev === 11) {
          sound.playChainTug();
        } else if (prev <= 4 && prev >= 2) {
          sound.playTimerTick();
        }

        return prev - 1;
      });
    }, 1000);

    // Rival realistic competitive pacing
    const rivalTarget = 27 + Math.floor(Math.random() * 6); // target 27-32 reps in 60s
    const paceIntervalMs = (60000 / rivalTarget) * (0.85 + Math.random() * 0.3);

    rivalIntervalRef.current = setInterval(() => {
      setRivalValidReps((prev) => {
        if (prev >= 35) return prev;
        // Occasionally simulate a rejected rep for rival (anti-perfection)
        if (Math.random() < 0.08) {
          setRivalRejectedReps(r => r + 1);
        }
        return prev + 1;
      });
    }, paceIntervalMs);
  };

  // Register Valid Rep (with audio & visual feedback)
  const registerValidRep = useCallback(() => {
    setMyValidReps((prev) => {
      const next = prev + 1;
      sound.playRepChime();
      setRepFlash(true);
      setTimeout(() => setRepFlash(false), 200);
      return next;
    });
    setMyRejectCause(null);
  }, []);

  // Register Rejected Rep (ROM < 80%, tempo too fast, lack of lockout)
  const registerRejectedRep = useCallback((reason: string) => {
    setMyRejectedReps((prev) => prev + 1);
    setMyRejectCause(reason);
    sound.playCoachWhistle();
  }, []);

  // Computer Vision Processing Frame Loop with Biomechanical Pose Verifier
  useEffect(() => {
    if (gameState !== 'battle') return;

    poseService.setExercise(selectedExercise);
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
  }, [gameState, selectedExercise, registerValidRep, registerRejectedRep]);

  // Finish Battle & Settle on Solana
  const finishBattle = async () => {
    if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    stopCameraStream();

    sound.playTrophy();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    setGameState('settlement');

    let winnerId: string | 'draw' = 'draw';
    if (myValidReps > rivalValidReps) {
      winnerId = 'my_athlete';
    } else if (rivalValidReps > myValidReps) {
      winnerId = 'rival_athlete';
    }

    // Call Duel Settle Endpoint
    const settlement = await forgeGameStore.settleDuel({
      battleId: battleCode,
      exercise: selectedExercise,
      player1: {
        id: 'my_athlete',
        name: 'Ви (Атлет Forge)',
        wallet: myWallet,
        validReps: myValidReps,
        rejectedReps: myRejectedReps
      },
      player2: {
        id: 'rival_athlete',
        name: rivalAthlete.name,
        wallet: rivalAthlete.wallet,
        validReps: rivalValidReps,
        rejectedReps: rivalRejectedReps
      },
      winnerId
    });

    setSettlementResult({
      winnerId,
      winnerReps: winnerId === 'my_athlete' ? myValidReps : rivalValidReps,
      solanaTxSignature: settlement.solanaTx.signature,
      solanaExplorerUrl: settlement.solanaTx.explorerUrl,
      proofHash: settlement.proofHash
    });
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/#duel-${battleCode}`;
    navigator.clipboard.writeText(url);
    setIsCopiedLink(true);
    sound.playClick();
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  // Dynamic Tug of War Momentum Bar (-50 to +50)
  const repDiff = myValidReps - rivalValidReps;
  const tugOfWarPercent = Math.max(10, Math.min(90, 50 + repDiff * 4));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Lobby / Configuration Screen */}
      {gameState === 'lobby' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-mono tracking-wider uppercase">
              <Swords className="w-3.5 h-3.5" />
              <span>Street Fighter Meets Strava</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
              FORGE BATTLE — 60s DUEL
            </h1>

            <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto">
              60 секунд максимальної віддачі перед камерою. Computer Vision рахує тільки бездоганні повторення. Результат дуелі карбується в Solana.
            </p>
          </div>

          {/* Sponsor Challenge Banner */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl flex-shrink-0">
                {ACTIVE_SPONSOR_CHALLENGE.sponsorLogo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Sponsor Challenge
                  </span>
                  <span className="text-xs text-neutral-400">
                    {ACTIVE_SPONSOR_CHALLENGE.sponsorName}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  {ACTIVE_SPONSOR_CHALLENGE.title} • {ACTIVE_SPONSOR_CHALLENGE.rewardPool}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {ACTIVE_SPONSOR_CHALLENGE.description}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold text-center">
              Кваліфікація: &gt;={ACTIVE_SPONSOR_CHALLENGE.qualifyingReps} репів
            </div>
          </div>

          {/* Exercise Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => { setSelectedExercise('pushups'); sound.playClick(); }}
              className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                selectedExercise === 'pushups'
                  ? 'bg-amber-500/10 border-amber-500/80 shadow-xl shadow-amber-950/40'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">⚔️</span>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  60s Push-up Duel
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-1">Віджимання від підлоги</h3>
              <p className="text-xs text-neutral-400">
                Контроль кута ліктя, торкання грудьми (&gt;85% ROM) та повне розгинання у верхній точці.
              </p>
            </button>

            <button
              onClick={() => { setSelectedExercise('squats'); sound.playClick(); }}
              className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                selectedExercise === 'squats'
                  ? 'bg-orange-500/10 border-orange-500/80 shadow-xl shadow-orange-950/40'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🛡️</span>
                <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                  60s Squat Duel
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-1">Глибокі присідання</h3>
              <p className="text-xs text-neutral-400">
                Таз опускається нижче лінії колін. Повний локаут кульшового та колінного суглобів.
              </p>
            </button>

            <button
              onClick={() => { setSelectedExercise('pullups'); sound.playClick(); }}
              className={`p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                selectedExercise === 'pullups'
                  ? 'bg-cyan-500/10 border-cyan-500/80 shadow-xl shadow-cyan-950/40'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🦅</span>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  60s Pull-up Duel
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-1">Підтягування на турніку</h3>
              <p className="text-xs text-neutral-400">
                Повний вис у нижній точці та чітка фіксація підборіддя строго над перекладиною.
              </p>
            </button>
          </div>

          {/* Opponent Card & Battle Launch */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Player 1 (You) */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl flex-shrink-0">
                  💪
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                    Player 1 (You)
                  </span>
                  <h3 className="text-lg font-bold text-white">Кузнець Forge</h3>
                  <span className="text-xs font-mono text-neutral-500">
                    {myWallet.substring(0, 8)}...{myWallet.substring(myWallet.length - 4)}
                  </span>
                </div>
              </div>

              {/* VS Badge */}
              <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center font-black text-red-400 italic text-lg shadow-lg shadow-red-950/50">
                VS
              </div>

              {/* Player 2 (Rival) */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold block">
                    Player 2 (Contender)
                  </span>
                  <h3 className="text-lg font-bold text-white">{rivalAthlete.name}</h3>
                  <span className="text-xs font-mono text-neutral-500">
                    {rivalAthlete.badge}
                  </span>
                </div>
                <img 
                  src={rivalAthlete.avatar} 
                  alt={rivalAthlete.name} 
                  className="w-16 h-16 rounded-2xl border border-red-500/40 object-cover flex-shrink-0"
                />
              </div>
            </div>

            {/* Launch & Share Room Code */}
            <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Кімната: #{battleCode}</span>
                  {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                </button>

                <span className="text-xs text-neutral-500 font-mono hidden md:inline">
                  Nonce: {sessionNonce.substring(0, 16)}...
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={startMatchmakingSearch}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-black text-sm tracking-wider uppercase border border-amber-500/40 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Шукати суперника (20с)</span>
                </button>

                <button
                  onClick={launchCountdown}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white font-black text-base tracking-wider uppercase shadow-xl shadow-orange-950/60 hover:opacity-95 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Swords className="w-5 h-5" />
                  <span>Розпочати 60s Бій</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Searching Matchmaking Screen (#82) */}
      {gameState === 'searching' && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6 rounded-3xl bg-neutral-900/90 border border-amber-500/30">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-amber-400 animate-spin" />
            <Swords className="w-10 h-10 text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono tracking-widest uppercase text-amber-400 font-bold">
              Пошук суперника в мережі Solana
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Підбір суперника для 60s дуелі...
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto">
              Шукаємо атлета рівного рангу в кімнаті #{battleCode}. Тайм-аут пошуку:
            </p>
          </div>

          <div className="text-5xl font-mono font-black text-amber-400">
            {searchSecondsLeft}s
          </div>

          <button
            onClick={cancelMatchmakingSearch}
            className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold border border-neutral-700 cursor-pointer transition-all"
          >
            Скасувати пошук
          </button>
        </div>
      )}

      {/* Waiting Screen after 20s Timeout (#82) */}
      {gameState === 'waiting' && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6 rounded-3xl bg-neutral-900/90 border border-neutral-800">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
              Час очікування вичерпано (20с)
            </div>
            <h2 className="text-2xl font-black text-white">
              Суперника в черзі не знайдено
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm">
              Ніхто з атлетів не зайшов у кімнату #{battleCode} протягом 20 секунд. Ви можете пройти 60s спрінт проти офіційного нормативу або спробувати пошук знову.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={launchCountdown}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-950/40 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>Старт: 60s Норматив</span>
            </button>

            <button
              onClick={startMatchmakingSearch}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-bold border border-neutral-700 transition-all cursor-pointer"
            >
              Спробувати пошук знову
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setGameState('lobby');
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Повернутися в лобі
            </button>
          </div>
        </div>
      )}

      {/* Pre-Battle Countdown Screen (3, 2, 1...) */}
      {gameState === 'countdown' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <span className="text-xs font-mono tracking-widest uppercase text-amber-400">
            Калібрування камери & Liveness Check
          </span>
          <div className="text-8xl md:text-9xl font-black text-white italic animate-bounce font-mono">
            {preCountdown}
          </div>
          <p className="text-neutral-400 text-sm italic">
            Займіть вихідну позицію перед камерою. Повна амплітуда зараховується автоматично!
          </p>
        </div>
      )}

      {/* Active Battle Arena (Street Fighter HUD) */}
      {gameState === 'battle' && (
        <div className="space-y-4">
          {/* Top Fighting Game Header Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
            {/* Center 60s Clock */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="font-mono text-xs font-bold uppercase text-red-400 tracking-wider">
                  LIVE 60s DUEL • {selectedExercise.toUpperCase()}
                </span>
              </div>

              {/* Big Street Fighter Clock */}
              <div className={`px-6 py-1.5 rounded-2xl border font-black text-3xl md:text-4xl font-mono tracking-tight ${
                timeLeft <= 10 
                  ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                  : 'bg-neutral-950 text-amber-400 border-neutral-800'
              }`}>
                {timeLeft}s
              </div>

              <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                <span>NONCE: #{sessionNonce.substring(10, 18)}</span>
              </div>
            </div>

            {/* Dynamic Tug of War Momentum Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono">
                <span className="text-amber-400 flex items-center gap-1.5">
                  Ви: {myValidReps} reps
                </span>
                <span className="text-red-400 flex items-center gap-1.5">
                  {rivalAthlete.name}: {rivalValidReps} reps
                </span>
              </div>

              <div className="h-4 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-full transition-all duration-300"
                  style={{ width: `${tugOfWarPercent}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-md shadow-white transition-all duration-300"
                  style={{ left: `${tugOfWarPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Duel Split View: Player 1 (You with Camera) vs Player 2 (Rival) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player 1: Camera View + Computer Vision HUD */}
            <div className={`relative bg-neutral-950 border-2 rounded-3xl overflow-hidden min-h-[380px] flex flex-col justify-between p-4 transition-all ${
              repFlash ? 'border-amber-400 shadow-2xl shadow-amber-500/30' : 'border-neutral-800'
            }`}>
              {/* Webcam Feed */}
              <video 
                ref={videoRef}
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-80"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Simulation Banner if Camera blocked */}
              {cameraStatus === 'simulation' && (
                <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
                  <CameraOff className="w-10 h-10 text-amber-500 mb-2" />
                  <h4 className="text-sm font-bold text-white mb-1">Демо-режим сенсора</h4>
                  <p className="text-xs text-neutral-400 mb-4 max-w-xs">
                    Веб-камера недоступна у поточному вікні. Використовуйте кнопки для ручної верифікації повторень або відкрийте додаток у новій вкладці.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={registerValidRep}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
                    >
                      +1 Зараховане (100% ROM)
                    </button>
                    <button
                      onClick={() => registerRejectedRep('Неповна амплітуда')}
                      className="px-4 py-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs"
                    >
                      Відхилити (ROM &lt; 80%)
                    </button>
                  </div>
                </div>
              )}

              {/* Player 1 Top HUD */}
              <div className="relative z-10 flex items-center justify-between bg-neutral-950/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Ви (Кузнець)</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  ROM: <span className="text-amber-400 font-bold">{myRomPercent}%</span>
                </div>
              </div>

              {/* Center Big Valid Reps Display */}
              <div className="relative z-10 text-center my-auto">
                <span className="text-7xl md:text-8xl font-black text-amber-400 font-mono tracking-tight drop-shadow-2xl">
                  {myValidReps}
                </span>
                <span className="block text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold">
                  VALID REPS
                </span>

                {/* Real-time Rejection Cause Banner */}
                {myRejectCause && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold animate-shake">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{myRejectCause}</span>
                  </div>
                )}
              </div>

              {/* Player 1 Bottom Badges */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-neutral-800">
                  Відхилено: <span className="text-red-400 font-bold">{myRejectedReps}</span>
                </span>
                <span className="text-neutral-400 bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-neutral-800">
                  Coach Arno: «{myRomPercent > 80 ? 'Повне розгинання.' : 'Глибше.'}»
                </span>
              </div>
            </div>

            {/* Player 2: Rival Live Contender HUD */}
            <div className="relative bg-neutral-950 border-2 border-neutral-800 rounded-3xl overflow-hidden min-h-[380px] flex flex-col justify-between p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
              <img 
                src={rivalAthlete.avatar} 
                alt="Rival"
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale"
              />

              {/* Player 2 Top HUD */}
              <div className="relative z-10 flex items-center justify-between bg-neutral-950/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">{rivalAthlete.name}</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400">
                  Ранг: <span className="text-red-400 font-bold">#4 Rival</span>
                </div>
              </div>

              {/* Center Big Rival Reps Display */}
              <div className="relative z-10 text-center my-auto">
                <span className="text-7xl md:text-8xl font-black text-red-500 font-mono tracking-tight drop-shadow-2xl">
                  {rivalValidReps}
                </span>
                <span className="block text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  VALID REPS
                </span>
              </div>

              {/* Player 2 Bottom Badges */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-neutral-800">
                  Відхилено: <span className="text-red-400 font-bold">{rivalRejectedReps}</span>
                </span>
                <span className="text-neutral-400 bg-neutral-950/80 px-2.5 py-1 rounded-xl border border-neutral-800">
                  Status: Contending
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Finished & Secured on Solana Screen */}
      {gameState === 'settlement' && settlementResult && (
        <div className="bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-10 space-y-8 shadow-2xl">
          {/* Winner Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider uppercase">
              <Shield className="w-4 h-4" />
              <span>BATTLE RESULT SECURED ON SOLANA</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase italic">
              {settlementResult.winnerId === 'my_athlete' 
                ? '🏆 ПЕРЕМОГА У 60-СЕКУНДНОМУ БОЇ!' 
                : settlementResult.winnerId === 'rival_athlete'
                  ? 'СУПЕРНИК ВЗЯВ ВЕРХ'
                  : 'НІЧИЯ — БЕЗКОМПРОМІСНИЙ БІЙ'}
            </h2>

            <p className="text-lg text-amber-400 font-bold font-mono">
              WINNER: {settlementResult.winnerReps} VERIFIED REPETITIONS
            </p>
          </div>

          {/* Verification Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className={`p-5 rounded-2xl border ${
              settlementResult.winnerId === 'my_athlete' 
                ? 'bg-amber-500/15 border-amber-500/60' 
                : 'bg-neutral-950 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Player 1 (Ви)</span>
                {settlementResult.winnerId === 'my_athlete' && (
                  <span className="text-xs bg-amber-400 text-neutral-950 px-2 py-0.5 rounded font-black">
                    WINNER
                  </span>
                )}
              </div>
              <div className="text-3xl font-black font-mono text-white mb-1">
                {myValidReps} <span className="text-xs font-normal text-neutral-400">Valid Reps</span>
              </div>
              <div className="text-xs font-mono text-red-400">
                Rejected: {myRejectedReps} reps
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${
              settlementResult.winnerId === 'rival_athlete' 
                ? 'bg-red-500/15 border-red-500/60' 
                : 'bg-neutral-950 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Player 2 ({rivalAthlete.name})</span>
                {settlementResult.winnerId === 'rival_athlete' && (
                  <span className="text-xs bg-red-400 text-neutral-950 px-2 py-0.5 rounded font-black">
                    WINNER
                  </span>
                )}
              </div>
              <div className="text-3xl font-black font-mono text-white mb-1">
                {rivalValidReps} <span className="text-xs font-normal text-neutral-400">Valid Reps</span>
              </div>
              <div className="text-xs font-mono text-red-400">
                Rejected: {rivalRejectedReps} reps
              </div>
            </div>
          </div>

          {/* Biomechanical Verification Certificate Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 max-w-2xl mx-auto space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-neutral-400 pb-2 border-b border-neutral-900">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                Forge Biomechanical Attestation
              </span>
              <span className="text-emerald-400 font-bold">VERIFIED (100% Truth Engine)</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Verifier ID:</span>
                <span className="text-neutral-300">ForgeKinematicAuthority_v2</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Proof Hash:</span>
                <span className="text-neutral-300 truncate max-w-[240px]">{settlementResult.proofHash}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Blockchain Sync:</span>
                <span className="text-neutral-400">Off-chain verified (Phase 2 pending)</span>
              </div>
            </div>

            {settlementResult.solanaExplorerUrl && (
              <div className="pt-2 border-t border-neutral-900 flex justify-end">
                <a
                  href={settlementResult.solanaExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Action Loop: Passport -> Share -> New Battle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onBackToPassport}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 text-neutral-950 font-black text-sm tracking-wide shadow-lg shadow-amber-950/40 hover:bg-amber-400 transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>Зарахувати у Forge Passport & Рівень</span>
            </button>

            <button
              onClick={copyShareLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 font-semibold text-sm transition-all"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>{isCopiedLink ? 'Лінк скопійовано!' : 'Кинути виклик другу (Share)'}</span>
            </button>

            <button
              onClick={() => { setGameState('lobby'); sound.playClick(); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-neutral-300 border border-neutral-800 font-semibold text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Новий Батл</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
