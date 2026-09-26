import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Exercise, WorkoutSession, Discipline, VerifiedExerciseKind, CameraViewMode } from '../types';
import { 
  EXERCISES, 
  getExerciseCategory, 
  getExerciseCategoryTitle, 
  getCameraViewLabel, 
  getExerciseInstructions, 
  getExerciseDifficultyDisplay 
} from '../data/exercisesData';
import { sound } from '../services/soundEngine';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';
import confetti from 'canvas-confetti';
import { poseService } from '../services/pose/PoseDetectorService';
import { VerificationFrameResult, NormalizedSkeleton, UniversalExerciseState, mapRepPhaseToUniversalState } from '../services/pose/poseTypes';
import { CameraDebugPanel } from './CameraDebugPanel';

export function getUniversalStateDisplay(state: UniversalExerciseState): { label: string; color: string } {
  switch (state) {
    case 'ready':
      return { label: 'Готовий: Займіть стійку', color: 'bg-blue-950/85 border-blue-500/50 text-blue-300' };
    case 'movingDown':
      return { label: 'Опускання ↓', color: 'bg-amber-950/85 border-amber-500/50 text-amber-300' };
    case 'bottom':
      return { label: 'Нижня точка (Фіксація)', color: 'bg-orange-950/85 border-orange-500/50 text-orange-300' };
    case 'movingUp':
      return { label: 'Підйом ↑', color: 'bg-cyan-950/85 border-cyan-500/50 text-cyan-300' };
    case 'completed':
      return { label: 'Зараховано! +1', color: 'bg-emerald-950/85 border-emerald-500/50 text-emerald-300' };
  }
}
import { drawBiomechanicalSkeleton } from '../services/pose/skeletonDrawer';
import { generateSimulatedSkeleton } from '../services/pose/simulationGenerator';
import { forgeGameStore } from '../services/forgeGameStore';
import { TelemetryFrame } from '../services/pose/serverWorkoutVerifier';
import { 
  Camera, 
  Play, 
  Square, 
  Flame, 
  Award, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  MessageSquare,
  Zap,
  Eye,
  Tv,
  Scan,
  Crosshair,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Users,
  Maximize,
  Minimize,
  ArrowLeft,
  Clock,
  Info,
  Dumbbell
} from 'lucide-react';

interface CameraTrackerProps {
  currentExercise: Exercise | null;
  onSelectExercise: (ex: Exercise) => void;
  onWorkoutComplete: (session: WorkoutSession) => void;
  userDiscipline: Discipline | null;
  onBack?: () => void;
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({
  currentExercise,
  onSelectExercise,
  onWorkoutComplete,
  userDiscipline,
  onBack
}) => {
  // Target exercise
  const [activeEx, setActiveEx] = useState<Exercise>(currentExercise || EXERCISES[0]);
  const [cameraView, setCameraView] = useState<CameraViewMode>(
    (currentExercise?.cameraView as CameraViewMode) || (activeEx.cameraView as CameraViewMode) || 'side'
  );

  // Biomechanical Pose Verifier Telemetry
  const [debugTelemetry, setDebugTelemetry] = useState<VerificationFrameResult | null>(null);
  const [currentSkeleton, setCurrentSkeleton] = useState<NormalizedSkeleton | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true);

  // Tracking Mode: Real Webcam vs Virtual AI Skeleton
  const [trackingMode, setTrackingMode] = useState<'camera' | 'simulation'>('camera');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // MediaPipe AI Model status & Telemetry buffer
  const [mediaPipeStatus, setMediaPipeStatus] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const frameLogRef = useRef<TelemetryFrame[]>([]);
  const lastSampleTimeRef = useRef<number>(0);

  // Auto-Detect Exercise Mode
  const [isAutoDetectEnabled, setIsAutoDetectEnabled] = useState<boolean>(false);
  const [detectedExerciseName, setDetectedExerciseName] = useState<string | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0);
  const [detectedExerciseObj, setDetectedExerciseObj] = useState<Exercise | null>(null);

  // Reference Video Demonstration Side-by-Side Toggle
  const [showReferenceVideo, setShowReferenceVideo] = useState<boolean>(true);

  // Range of Motion & Form Quality
  const [currentRomPercent, setCurrentRomPercent] = useState<number>(0);
  const [formFeedback, setFormFeedback] = useState<{ status: 'perfect' | 'warning' | 'idle'; message: string }>({
    status: 'idle',
    message: 'Займіть вихідну позицію перед камерою'
  });

  // Motion Sensitivity (1 = Low, 2 = Medium, 3 = High)
  const [sensitivity, setSensitivity] = useState<number>(2);

  // Reps & Session Metrics
  const [repsCount, setRepsCount] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [lastMovementTime, setLastMovementTime] = useState<number>(Date.now());
  const [sessionCompletedSummary, setSessionCompletedSummary] = useState<WorkoutSession | null>(null);

  // Camera Settings & Calibration
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [calibratedBaseY, setCalibratedBaseY] = useState<number | null>(null);

  // Performance & Rest Metrics
  const [repTempo, setRepTempo] = useState<number | null>(null);
  const [repTempoFeedback, setRepTempoFeedback] = useState<string | null>(null);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number | null>(null);

  // Coach Persona (Arno / Arthur)
  const [coachMood, setCoachMood] = useState<'idle' | 'praising' | 'roasting'>('idle');

  // Training Buddy (Point 32)
  const [trainingBuddy, setTrainingBuddy] = useState<{ name: string; status: string; avatar: string } | null>(null);
  const [showBuddyModal, setShowBuddyModal] = useState<boolean>(false);
  const [buddyUsernameInput, setBuddyUsernameInput] = useState<string>('');
  const [buddyLinkCopied, setBuddyLinkCopied] = useState<boolean>(false);
  const [coachMessage, setCoachMessage] = useState<string>(
    'Вітаємо в тренувальній зоні! Обери вправу, займи стійку перед камерою або ввімкни калібрування і починай рух!'
  );
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(sound.isMuted());

  // Fullscreen Camera state and ref
  const fullscreenArenaRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenNotice, setFullscreenNotice] = useState<string | null>(null);

  // Universal Rep Counter & Phase State Machine
  const [currentFsmState, setCurrentFsmState] = useState<UniversalExerciseState>('ready');
  const [showPlusOne, setShowPlusOne] = useState<boolean>(false);
  const plusOneTimeoutRef = useRef<number | null>(null);

  // Sync fullscreen state with browser events (including Escape key and system gestures)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentFs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement
        ) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Safe Fullscreen Toggle with error handling and fallback
  const toggleFullscreen = useCallback(async () => {
    sound.playClick();
    const elem = fullscreenArenaRef.current;

    try {
      if (isFullscreen) {
        if (
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        ) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }
        }
        setIsFullscreen(false);
      } else {
        if (!elem) return;

        // Try standard Fullscreen API with vendor prefixes
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
          setIsFullscreen(true);
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
          setIsFullscreen(true);
        } else {
          // Fallback when Fullscreen API is unsupported by browser or blocked in frame
          setIsFullscreen(true);
          setFullscreenNotice('Повноекранний вигляд активовано (віконний адаптивний режим)');
          setTimeout(() => setFullscreenNotice(null), 3500);
        }
      }
    } catch (err: any) {
      console.warn('Fullscreen API notice:', err);
      // Seamlessly switch to CSS pseudo-fullscreen so the workout is not interrupted
      setIsFullscreen((prev) => !prev);
      setFullscreenNotice('Повноекранний вигляд увімкнено (режим адаптивного вікна)');
      setTimeout(() => setFullscreenNotice(null), 3500);
    }
  }, [isFullscreen]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Biomechanical MediaPipe telemetry buffers
  const lastMediaPipeSkeletonRef = useRef<NormalizedSkeleton | null>(null);
  const lastMediaPipeResultRef = useRef<VerificationFrameResult | null>(null);
  const lastRepTimeRef = useRef<number>(0);
  const lastFeedbackWarningRef = useRef<{ message: string; timestamp: number }>({ message: '', timestamp: 0 });

  // Keep activeEx and cameraView synced if prop updates
  useEffect(() => {
    if (currentExercise && currentExercise.id !== activeEx.id) {
      setActiveEx(currentExercise);
      if (currentExercise.cameraView) {
        setCameraView(currentExercise.cameraView);
      }
    }
  }, [currentExercise]);

  // Safely stop active camera tracks
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
    setCameraStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stopCameraStream]);

  // Pre-initialize MediaPipe Pose model on component mount
  useEffect(() => {
    setMediaPipeStatus('loading');
    poseService
      .initMediaPipe()
      .then((ready) => {
        setMediaPipeStatus(ready ? 'ready' : 'fallback');
      })
      .catch(() => {
        setMediaPipeStatus('fallback');
      });
  }, []);

  // Request & Mount Web Camera with Robust Multi-Tier Fallback
  const initCamera = useCallback(async (customFacing?: 'user' | 'environment'): Promise<boolean> => {
    setCameraStatus('requesting');
    setCameraErrorMessage(null);

    // Pre-initialize MediaPipe Pose if not ready yet
    try {
      if (!poseService.isReady()) {
        setMediaPipeStatus('loading');
        poseService.initMediaPipe().then((ready) => {
          setMediaPipeStatus(ready ? 'ready' : 'fallback');
        }).catch(() => {
          setMediaPipeStatus('fallback');
        });
      }
    } catch {
      setMediaPipeStatus('fallback');
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('error');
      setCameraErrorMessage('Браузер або середовище не підтримує WebRTC доступ до камери. Скористайтеся AI-симулятором.');
      return false;
    }

    const targetFacing = customFacing || facingMode;

    try {
      stopCameraStream();

      let stream: MediaStream | null = null;
      // Tier 1: Ideal 640x480 resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: targetFacing
          },
          audio: false
        });
      } catch {
        // Tier 2: Flexible without width/height
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
            audio: false
          });
        } catch {
          // Tier 3: Universal fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (!stream) {
        throw new Error('Не вдалося отримати потік камери.');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          let resolved = false;
          const complete = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          video.onloadedmetadata = complete;
          video.onloadeddata = complete;
          video.play().then(complete).catch(complete);
          setTimeout(complete, 1200);
        });
      }

      setCameraStatus('active');
      setCameraErrorMessage(null);
      return true;
    } catch (err: unknown) {
      console.warn('Webcam access error:', err);
      const error = err as Error;
      let msg = 'Не вдалося підключитися до веб-камери.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        msg = 'Доступ до камери відхилено в налаштуваннях браузера. Перевірте дозволи або скористайтеся AI-симулятором.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        msg = 'Камеру не знайдено на цьому пристрої. Скористайтеся режимом AI-симуляції.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        msg = 'Камера зайнята іншою програмою (Zoom, Teams, Skype тощо). Закрийте її та спробуйте знову.';
      }
      setCameraStatus('error');
      setCameraErrorMessage(msg);
      return false;
    }
  }, [facingMode, stopCameraStream]);

  // Flip Camera Front / Back
  const handleToggleFacingMode = async () => {
    sound.playClick();
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (isSessionActive && trackingMode === 'camera') {
      await initCamera(newFacing);
    }
  };

  // 3-Second Camera Calibration Routine
  const handleStartCalibration = () => {
    sound.playClick();
    setIsCalibrating(true);
    setCalibrationCountdown(3);
    sound.playCalibrationBeep(false);

    setCoachMessage('Калібрування камери! Займіть вихідну стійку або планку. Фіксація за 3 секунди!');

    let counter = 3;
    const interval = window.setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        setCalibrationCountdown(counter);
        sound.playCalibrationBeep(false);
      } else {
        window.clearInterval(interval);
        setIsCalibrating(false);
        setCalibrationCountdown(0);
        sound.playCalibrationBeep(true);

        if (lastMediaPipeSkeletonRef.current) {
          const skel = lastMediaPipeSkeletonRef.current;
          const avgY = (skel.leftShoulder.y + skel.rightShoulder.y) / 2;
          setCalibratedBaseY(avgY * 240);
        } else {
          setCalibratedBaseY(120);
        }
        setIsCalibrated(true);
        setCoachMessage('Положення зафіксовано! Камера бачить вас ідеально. Починайте рух!');
      }
    }, 1000);
  };

  // Rest Timer Controller
  const handleStartRestTimer = (seconds: number = 60) => {
    sound.playClick();
    setRestTimeRemaining(seconds);
    setCoachMessage(`Відпочинок ${seconds} секунд. Глибоко дихайте, відновлюйте сили!`);
  };

  useEffect(() => {
    if (restTimeRemaining === null || restTimeRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          sound.playGong();
          setCoachMessage('Час відпочинку вичерпано! До снаряда, покажемо міць!');
          return null;
        }
        if (prev <= 4 && prev > 1) {
          sound.playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restTimeRemaining]);

  // Toggle Sound Effects
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsSoundMuted(muted);
  };

  // Register Valid Rep + Audio + Cadence + Score + Coach Phrase
  const registerRep = useCallback((quality: 'full' | 'partial' = 'full') => {
    sound.playRepChime();

    // Calculate Rep Cadence / Tempo
    const now = Date.now();
    if (lastRepTimeRef.current > 0) {
      const diffSec = Math.round(((now - lastRepTimeRef.current) / 1000) * 10) / 10;
      if (diffSec >= 0.8 && diffSec <= 15) {
        setRepTempo(diffSec);
        if (diffSec < 1.6) {
          setRepTempoFeedback('⚡ Дуже швидкий темп! Контролюй опускання');
        } else if (diffSec <= 3.8) {
          setRepTempoFeedback('🎯 Ідеальний темп гіпертрофії (2-3с)!');
        } else {
          setRepTempoFeedback('🔥 Потужне повторення з паузою!');
        }
      }
    }
    lastRepTimeRef.current = now;

    setRepsCount((prev) => {
      const next = prev + 1;
      // Coach UI praise at milestone reps
      if (next === 1 || next % 3 === 0) {
        setCoachMood('praising');
        const praises = [
          `Відмінно! ${next} повторень зараховано!`,
          `Потужно! Продовжуй рух (${next} репів)!`,
          `Ідеальна амплітуда! Так тримати!`,
          `Гарна робота мʼязів! Додай жару в кузні!`
        ];
        setCoachMessage(praises[next % praises.length]);
      }
      return next;
    });

    // Trigger on-screen +1 animation and completed state
    setShowPlusOne(true);
    setCurrentFsmState('completed');
    if (plusOneTimeoutRef.current) {
      window.clearTimeout(plusOneTimeoutRef.current);
    }
    plusOneTimeoutRef.current = window.setTimeout(() => {
      setShowPlusOne(false);
    }, 850);

    setFormFeedback({
      status: 'perfect',
      message: '✅ Повна амплітуда! Повторення зараховано!'
    });

    setLastMovementTime(Date.now());
  }, []);

  // --- SYNC POSE VERIFIER WITH SELECTED EXERCISE & CAMERA VIEW ---
  useEffect(() => {
    poseService.setExercise(activeEx.id, cameraView);
    poseService.resetCounters();
  }, [activeEx.id, cameraView]);

  const handleSelectCameraView = (view: CameraViewMode) => {
    sound.playClick();
    setCameraView(view);
    poseService.setViewMode(view);
    const viewUk = view === 'front' ? 'спереду' : view === 'side' ? 'збоку' : 'зі спини';
    setCoachMessage(`Ракурс камери перемкнуто: ${viewUk}`);
  };

  // Subscribe to Biomechanical Pose Verifier events
  useEffect(() => {
    const unsubFrame = poseService.onFrame((result, skeleton) => {
      lastMediaPipeSkeletonRef.current = skeleton;
      lastMediaPipeResultRef.current = result;
      setDebugTelemetry(result);
      if (skeleton) {
        setCurrentSkeleton(skeleton);
        setLastMovementTime(Date.now());
      }
      setCurrentRomPercent(result.repProgress);

      if (result.universalState) {
        setCurrentFsmState(result.universalState);
      } else if (result.state) {
        setCurrentFsmState(mapRepPhaseToUniversalState(result.state));
      }

      if (activeEx.id.toLowerCase().includes('plank')) {
        if (typeof result.validReps === 'number') {
          setRepsCount(result.validReps);
        }
      }

      if (result.isAlignmentValid) {
        setFormFeedback({
          status: 'perfect',
          message: result.feedback || '✓ Правильна техніка'
        });
      } else {
        const now = Date.now();
        const lastMsg = lastFeedbackWarningRef.current.message;
        const lastTime = lastFeedbackWarningRef.current.timestamp;
        
        // Debounce warning feedback to avoid visual flicker
        if (result.feedback !== lastMsg || now - lastTime > 1500) {
          lastFeedbackWarningRef.current = { message: result.feedback, timestamp: now };
          setFormFeedback({
            status: 'warning',
            message: result.feedback
          });
        }
      }

      // Compact telemetry frame logging for authoritative server verification (~20fps)
      const now = Date.now();
      if (now - lastSampleTimeRef.current >= 45) {
        lastSampleTimeRef.current = now;
        const primaryAngle = result.primaryElbowAngle ?? result.primaryKneeAngle ?? 160;
        frameLogRef.current.push({
          timestamp: now,
          primaryAngle,
          torsoAngle: result.torsoAngle ?? 0,
          confidence: result.confidence ?? 0.95,
          state: result.state,
          isAlignmentValid: result.isAlignmentValid,
          leftWristY: skeleton?.leftWrist?.y,
          rightWristY: skeleton?.rightWrist?.y,
          leftShoulderY: skeleton?.leftShoulder?.y,
          rightShoulderY: skeleton?.rightShoulder?.y,
          noseY: skeleton?.nose?.y
        });
        if (frameLogRef.current.length > 2500) {
          frameLogRef.current.shift();
        }
      }
    });

    const unsubRep = poseService.onRep(() => {
      // Only register camera reps if tracking is supported for the current exercise
      if (poseService.getIsTrackingSupported()) {
        registerRep('full');
      }
    });

    const unsubReject = poseService.onReject((reason) => {
      if (!poseService.getIsTrackingSupported()) return;

      let msg = '⚠️ Помилка амплітуди або стійки';
      if (reason === 'too_shallow') msg = '⚠️ Занадто мала амплітуда (опустіться глибше)';
      else if (reason === 'bad_alignment') msg = '⚠️ Виправте положення тіла';
      else if (reason === 'too_fast') msg = '⚠️ Занадто швидкий ривок! Контролюйте темп';
      else if (reason === 'no_lockout') msg = '⚠️ Випрямляйте руки у верхній точці';

      const now = Date.now();
      if (msg !== lastFeedbackWarningRef.current.message || now - lastFeedbackWarningRef.current.timestamp > 2000) {
        lastFeedbackWarningRef.current = { message: msg, timestamp: now };
        setFormFeedback({
          status: 'warning',
          message: msg
        });
        sound.playCoachWhistle();
      }
    });

    return () => {
      unsubFrame();
      unsubRep();
      unsubReject();
    };
  }, [registerRep]);

  // --- COMPUTER VISION KINEMATIC CLASSIFIER & REP COUNTER ---
  useEffect(() => {
    if (!isSessionActive) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const processFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const video = videoRef.current;
      const isRealCam = trackingMode === 'camera' && cameraStatus === 'active' && video && video.readyState >= 2 && video.videoWidth > 0;

      const width = isRealCam && video.videoWidth > 0 ? video.videoWidth : 640;
      const height = isRealCam && video.videoHeight > 0 ? video.videoHeight : 480;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      if (isRealCam && video) {
        // --- 1. REAL WEBCAM FRAME PROCESSING ---
        // Mirror camera preview on canvas for intuitive orientation
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        // Feed to MediaPipe Pose model (Single Source of Truth)
        poseService.sendVideoFrame(video);

        // Draw biomechanical skeleton and telemetry aligned with mirrored canvas
        const currentSkel = lastMediaPipeSkeletonRef.current || poseService.getLastSkeleton();
        const currentRes = lastMediaPipeResultRef.current || poseService.getLastResult();
        if (currentSkel && currentRes) {
          drawBiomechanicalSkeleton(ctx, width, height, currentSkel, currentRes, true);
        }
      } else {
        // --- 2. AI SIMULATOR ENGINE WITH SYNTHESIZED SKELETON ---
        ctx.fillStyle = '#0a0a0d';
        ctx.fillRect(0, 0, width, height);

        // Tech grid lines
        ctx.strokeStyle = '#18181f';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 25) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Generate anatomical skeleton for active exercise
        const skeleton = generateSimulatedSkeleton(poseService.getExerciseType(), Date.now());

        // Process through exact same state machine
        const result = poseService.handleSkeletonFrame(skeleton, Date.now());

        // Draw skeleton & telemetry on canvas
        drawBiomechanicalSkeleton(ctx, width, height, skeleton, result, false);

        // Watermark
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText('AI SKELETON SIMULATOR • CALIBRATED', 75, 45);
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSessionActive, trackingMode, cameraStatus, sensitivity, isAutoDetectEnabled, activeEx, registerRep]);

  // Session duration timer & idle roast
  useEffect(() => {
    let timer: number | null = null;
    if (isSessionActive) {
      timer = window.setInterval(() => {
        setSessionDuration((prev) => prev + 1);

        const idleMs = Date.now() - lastMovementTime;
        if (idleMs > 10000) {
          setCoachMood('roasting');
          setCoachMessage('Час додати жару в кузні! Не зупиняйся, продовжуй серію!');
          sound.playCoachWhistle();
          setLastMovementTime(Date.now());
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSessionActive, lastMovementTime]);

  // Start Session
  const handleStartSession = async () => {
    sound.playAnvilHit();
    sound.playCoachWhistle();
    setRepsCount(0);
    setSessionDuration(0);
    setLastMovementTime(Date.now());
    setIsSessionActive(true);
    setCoachMood('praising');

    // Reset frame log and request fresh session nonce
    frameLogRef.current = [];
    forgeGameStore.requestSessionNonce().catch(() => {});

    setCoachMessage(`Тренування розпочато: ${activeEx.name}. Працюємо на повну!`);

    if (trackingMode === 'camera') {
      const ok = await initCamera();
      if (!ok) {
        setTrackingMode('simulation');
      }
    }
  };

  // Stop Session
  const handleStopSession = () => {
    setIsSessionActive(false);
    stopCameraStream();

    const earnedXp = repsCount * activeEx.xpPerRep;
    const session: WorkoutSession = {
      id: `ses_${Date.now()}`,
      date: new Date().toISOString(),
      exerciseName: activeEx.name,
      muscleGroup: activeEx.muscle,
      discipline: activeEx.discipline,
      reps: repsCount,
      totalXp: earnedXp,
      durationSeconds: sessionDuration
    };

    setSessionCompletedSummary(session);

    if (earnedXp > 0) {
      sound.playLevelUp();
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 }
      });
      setCoachMessage(`Сесію завершено! Виконано ${repsCount} повторень (+${earnedXp} XP)!`);

      // Submit raw frame journal to authoritative server verifier for cryptographic proof & passport update
      const exerciseKind: VerifiedExerciseKind = (
        activeEx.id.toLowerCase().includes('squat') ? 'squats' : (activeEx.id.toLowerCase().includes('pull') ? 'pullups' : 'pushups')
      );
      const currentFrames = [...frameLogRef.current];

      forgeGameStore.submitWorkoutVerification({
        exercise: exerciseKind,
        durationSeconds: sessionDuration,
        validReps: repsCount,
        rejectedReps: 0,
        rejectionReasons: [],
        repDetails: [],
        frames: currentFrames
      }).then((envelope) => {
        if (envelope) {
          session.proofHash = envelope.proofHash;
          session.serverStatus = envelope.status;
          session.solanaTxSignature = envelope.solanaTxSignature;
        }
        onWorkoutComplete(session);
      }).catch((err) => {
        console.warn('Backend verifier submission notice:', err);
        onWorkoutComplete(session);
      });
    } else {
      sound.playClick();
      setCoachMessage('Сесію зупинено. Відпочиньте та спробуйте ще раз.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Exercise Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              type="button"
              id="camera-header-back-btn"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all cursor-pointer mb-2.5 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-400" />
              <span>Назад до списку вправ</span>
            </button>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Scan className="w-3.5 h-3.5" />
            AI Розпізнавання Вправ & Компʼютерний Зір
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
            КАМЕРА-ТРЕКЕР FORGEMUSCLE
          </h1>
          <p className="text-neutral-400 text-sm font-sans mt-1">
            Інтелектуальне розпізнавання біомеханіки, перевірка глибини (ROM), підрахунок репів та синхронне відео техніки.
          </p>
        </div>

        {/* Current Exercise Selector & Auto-Detect Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-Detect Exercise Mode Toggle */}
          <button
            id="toggle-autodetect-btn"
            onClick={() => {
              sound.playClick();
              const next = !isAutoDetectEnabled;
              setIsAutoDetectEnabled(next);
              if (next) {
                setCoachMessage('Авто-розпізнавання активовано! Камера самостійно визначить твою вправу.');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              isAutoDetectEnabled
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-amber-500/50'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Авто-розпізнавання вправи: <strong>{isAutoDetectEnabled ? 'УВІМК' : 'ВИМК'}</strong></span>
          </button>

          {/* Exercise Selector */}
          <select
            id="camera-exercise-selector"
            value={activeEx.id}
            onChange={(e) => {
              sound.playClick();
              const found = EXERCISES.find((ex) => ex.id === e.target.value);
              if (found) {
                setActiveEx(found);
                if (found.cameraView) {
                  setCameraView(found.cameraView);
                }
                onSelectExercise(found);
                setCoachMessage(`Обрано вправу: ${found.name}`);
              }
            }}
            disabled={isSessionActive}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            {EXERCISES.map((ex) => {
              const isSupported = ex.cameraTrackingSupported || Boolean(ex.cameraVerifierId) || poseService.isTrackingSupportedForExercise(ex.id);
              return (
                <option key={ex.id} value={ex.id}>
                  {isSupported ? '✓ ' : ''}{ex.name} {isSupported ? '(AI-Трекінг)' : '(Гайд)'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Control Bar: Camera vs AI Simulation & Reference Video Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-neutral-900/70 border border-neutral-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2">Режим:</span>
          <button
            id="mode-camera-btn"
            onClick={async () => {
              sound.playClick();
              setTrackingMode('camera');
              if (isSessionActive) {
                await initCamera();
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              trackingMode === 'camera'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Веб-камера (Відео-трекінг)
          </button>

          <button
            id="mode-simulation-btn"
            onClick={() => {
              sound.playClick();
              stopCameraStream();
              setTrackingMode('simulation');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              trackingMode === 'simulation'
                ? 'bg-orange-500 text-neutral-950 shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            AI-Симулятор (Без камери)
          </button>

          {/* Reference Video Demonstration Toggle */}
          <button
            id="toggle-ref-video-btn"
            onClick={() => {
              sound.playClick();
              setShowReferenceVideo(!showReferenceVideo);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showReferenceVideo
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Показати/сховати еталонне відео з технікою виконання вправи"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>Відео-зразок: <strong>{showReferenceVideo ? 'ВИДНО' : 'ПРИХОВАНО'}</strong></span>
          </button>

          {/* Camera Flip Button (Front / Rear) */}
          {trackingMode === 'camera' && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title="Перемкнути фронтальну або задню камеру"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Камера: {facingMode === 'user' ? 'Фронтальна' : 'Тильна'}</span>
            </button>
          )}

          {/* 3-Second Camera Calibration Button */}
          {trackingMode === 'camera' && (
            <button
              type="button"
              onClick={handleStartCalibration}
              disabled={isCalibrating || !isSessionActive}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-40 ${
                isCalibrated
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-900 border-neutral-800 text-amber-300 hover:border-amber-500/40'
              }`}
              title="3-секундна фіксація вихідного положення тіла та горизонту підлоги"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isCalibrating ? `Калібрування (${calibrationCountdown})...` : isCalibrated ? 'Калібровано ✓' : 'Калібрувати (3с)'}</span>
            </button>
          )}

          {/* Fullscreen Camera Toggle Button */}
          <button
            id="camera-fullscreen-toggle-btn"
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
            }`}
            title={isFullscreen ? 'Вийти з повного екрана (Esc)' : 'На весь екран'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Вийти з повного екрана</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-amber-400" />
                <span>На весь екран</span>
              </>
            )}
          </button>
        </div>

        {/* Coach Voice Quick Switch & Direct Test */}
        <div className="flex items-center gap-2 px-2">
          {/* Training Buddy (Point 32) */}
          <button
            id="training-buddy-btn"
            type="button"
            onClick={() => setShowBuddyModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              trainingBuddy
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Запросити друга до спільного онлайн-тренування"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{trainingBuddy ? `Buddy: ${trainingBuddy.name}` : 'Training Buddy'}</span>
          </button>

          <button
            id="test-coach-voice-btn"
            type="button"
            onClick={() => {
              sound.playRepChime();
              sound.playCoachWhistle();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Перевірити звукові ефекти"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Тест звуків</span>
          </button>

          <button
            id="sound-toggle-btn"
            onClick={handleToggleSound}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              !isSoundMuted
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
            title="Увімкнути/Вимкнути звуки повторень та свистка"
          >
            {!isSoundMuted ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Звуки: <strong>{!isSoundMuted ? 'УВІМК' : 'ВИМК'}</strong></span>
          </button>
        </div>
      </div>

      {/* Training Buddy Active Pill */}
      {trainingBuddy && (
        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <img src={trainingBuddy.avatar} alt={trainingBuddy.name} className="w-8 h-8 rounded-full border border-blue-400 object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Training Buddy: {trainingBuddy.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">ONLINE</span>
              </div>
              <p className="text-blue-300/80 text-[11px]">{trainingBuddy.status} • Синхронізація сесії активна (+25 XP бонус)</p>
            </div>
          </div>
          <button
            onClick={() => setTrainingBuddy(null)}
            className="text-neutral-500 hover:text-neutral-300 text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            Відʼєднати
          </button>
        </div>
      )}

      {/* Auto-Detection Banner (if active) */}
      {detectedExerciseName && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-transparent border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crosshair className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-amber-400">AI Сканер Біомеханіки:</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                  {detectedConfidence}% точність
                </span>
              </div>
              <p className="text-sm font-bold text-white font-heading">
                Виявлена вправа: <span className="text-amber-300">{detectedExerciseName}</span>
              </p>
            </div>
          </div>

          {/* Quick switch if user manually selected something else */}
          {detectedExerciseObj && detectedExerciseObj.id !== activeEx.id && (
            <button
              onClick={() => {
                sound.playClick();
                setActiveEx(detectedExerciseObj);
                onSelectExercise(detectedExerciseObj);
                setCoachMessage(`Перемкнуто на: ${detectedExerciseObj.name}`);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition-all cursor-pointer"
            >
              Перемкнути на «{detectedExerciseObj.name}»
            </button>
          )}
        </div>
      )}

      {/* Camera Error / Permission Notice */}
      {trackingMode === 'camera' && cameraErrorMessage && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">Повідомлення веб-камери</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">{cameraErrorMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => initCamera()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Спробувати знову
            </button>
            <button
              onClick={() => {
                setTrackingMode('simulation');
                setCameraErrorMessage(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold text-xs hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Перейти на AI-симулятор
            </button>
          </div>
        </div>
      )}

      {/* Exercise Information & Camera View Panel (ФУНКЦІЯ №4 та ФУНКЦІЯ №5) */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden">
        {/* Top bar with back button & quick exercise badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {onBack && (
              <button
                type="button"
                id="camera-back-to-exercises-btn"
                onClick={onBack}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-400" />
                <span>Назад до вправ</span>
              </button>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wide">
                {getExerciseCategoryTitle(getExerciseCategory(activeEx))}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getExerciseDifficultyDisplay(activeEx.difficulty).color}`}>
                Складність: {getExerciseDifficultyDisplay(activeEx.difficulty).label}
              </span>
              {activeEx.duration && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {activeEx.duration}
                </span>
              )}
            </div>
          </div>

          {/* Fullscreen Button Quick Access */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isFullscreen
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Вийти з повного екрана</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5 text-amber-400" />
                  <span>На весь екран</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Exercise Main Header & Description */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
              {activeEx.name}
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>+{activeEx.xpPerRep} XP за реп / фіксацію</span>
            </div>
          </div>
          <p className="text-sm text-neutral-300 font-sans leading-relaxed">
            {activeEx.description}
          </p>

          {!activeEx.cameraVerifierId && !poseService.isTrackingSupportedForExercise(activeEx.id) && (
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300 block">Автоматичний підрахунок для цієї вправи поки недоступний.</span>
                <span className="text-neutral-400">Вправа залишається повністю доступною: переглядайте 3D/відео-техніку, використовуйте таймер та фіксуйте повторення кнопкою «+1 Реп».</span>
              </div>
            </div>
          )}
        </div>

        {/* Camera View Control & Requirement */}
        <div className="rounded-2xl bg-neutral-950 border border-neutral-800/90 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5 mb-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Ракурс позиціонування камери</span>
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>Необхідний ракурс:</span>
                <span className="text-amber-400 underline decoration-amber-500/40 underline-offset-4">
                  {getCameraViewLabel(cameraView)}
                </span>
                {activeEx.cameraView === cameraView && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                    Рекомендовано для {activeEx.name}
                  </span>
                )}
              </div>
            </div>

            {/* View Switcher: Спереду | Збоку | Зі спини */}
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex-wrap">
              <span className="text-[11px] font-bold text-neutral-400 px-2 hidden md:inline">
                Виберіть ракурс:
              </span>
              {(['front', 'side', 'back'] as CameraViewMode[]).map((view) => {
                const isActive = cameraView === view;
                const isRecommended = activeEx.cameraView === view;
                return (
                  <button
                    key={view}
                    id={`camera-view-btn-${view}`}
                    type="button"
                    onClick={() => handleSelectCameraView(view)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] font-extrabold'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <span>{getCameraViewLabel(view)}</span>
                    {isRecommended && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Рекомендований ракурс" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step-by-step Structured Instructions */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Інструкція виконання вправи</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {getExerciseInstructions(activeEx).map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] border border-amber-500/40">
                  {idx + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dual Arena Grid: Left = Video Feed, Right = Reference Video + Arno */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Video Tracking Arena */}
        <div
          ref={fullscreenArenaRef}
          className={`${
            isFullscreen
              ? 'fixed inset-0 z-50 bg-neutral-950 p-3 sm:p-5 flex flex-col justify-between overflow-hidden w-screen h-screen'
              : `${showReferenceVideo ? 'lg:col-span-7' : 'lg:col-span-8'} rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden transition-all`
          }`}
        >
          {/* Header strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-20 relative">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                {isSessionActive ? 'Тренування в процесі' : 'Готовий до запуску'}
              </span>
              {isFullscreen && (
                <>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    Повний екран
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[11px] text-white font-bold">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeEx.name}</span>
                  </div>
                </>
              )}

              {/* In-Arena Camera View Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                <Camera className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Ракурс:</span>
                <strong className="text-amber-300">{getCameraViewLabel(cameraView)}</strong>
              </div>

              {/* In-Arena Quick View Switcher */}
              <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800 text-[10px]">
                {(['front', 'side', 'back'] as CameraViewMode[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleSelectCameraView(v)}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      cameraView === v
                        ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title={`Перемкнути ракурс: ${getCameraViewLabel(v)}`}
                  >
                    {v === 'front' ? 'Спереду' : v === 'side' ? 'Збоку' : 'Зі спини'}
                  </button>
                ))}
              </div>
            </div>

            {/* ROM Depth Gauge Pill, Telemetry & Fullscreen Toggle */}
            <div className="flex items-center gap-2">
              {/* Fullscreen Button in Arena Header */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isFullscreen
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                }`}
                title={isFullscreen ? 'Вийти з повного екрана (Esc)' : 'На весь екран'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="w-3.5 h-3.5" />
                    <span>Вийти з повного екрана</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5 text-amber-400" />
                    <span>На весь екран</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showDebugPanel
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Перемкнути панель біомеханічної телеметрії та анти-чіт тестів"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>{showDebugPanel ? 'Телеметрія ON' : 'Телеметрія OFF'}</span>
              </button>

              <div className="text-[11px] font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                <span>Глибина (ROM):</span>
                <strong className={currentRomPercent > 75 ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentRomPercent}%
                </strong>
              </div>
            </div>
          </div>

          {/* Fullscreen fallback notice if needed */}
          {fullscreenNotice && (
            <div className="px-3.5 py-2 rounded-xl bg-neutral-900/95 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{fullscreenNotice}</span>
            </div>
          )}

          {/* Video Feed Canvas */}
          <div className={`relative w-full rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden transition-all ${
            isFullscreen ? 'flex-1 w-full h-full min-h-0 my-1 border-0' : 'aspect-video'
          }`}>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-0"
            />

            <canvas
              ref={canvasRef}
              className={`w-full h-full ${isFullscreen ? 'object-cover' : 'object-contain'} max-h-full`}
            />

            {/* Live MediaPipe / Camera Status Pill in Top Left */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
              {trackingMode === 'camera' && cameraStatus === 'active' && (
                <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-[11px] font-bold flex items-center gap-1.5 shadow-lg ${
                  mediaPipeStatus === 'ready'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : mediaPipeStatus === 'loading'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse'
                    : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    mediaPipeStatus === 'ready' ? 'bg-emerald-400' : mediaPipeStatus === 'loading' ? 'bg-amber-400 animate-ping' : 'bg-neutral-400'
                  }`} />
                  <span>
                    {mediaPipeStatus === 'ready'
                      ? 'AI-зір (MediaPipe Pose) активний'
                      : mediaPipeStatus === 'loading'
                      ? 'Завантаження AI-моделі MediaPipe...'
                      : 'AI-модель офлайн (автономний трекінг)'}
                  </span>
                </div>
              )}
              {trackingMode === 'simulation' && (
                <div className="px-2.5 py-1 rounded-lg bg-orange-950/80 border border-orange-500/50 text-orange-300 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <Zap className="w-3 h-3 text-orange-400" />
                  <span>AI-Симулятор Біомеханіки (Без камери)</span>
                </div>
              )}
            </div>

            {/* Calibration Countdown Overlay */}
            {isCalibrating && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-30 animate-in fade-in">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500 flex items-center justify-center text-4xl font-extrabold text-amber-400 font-heading animate-pulse">
                  {calibrationCountdown}
                </div>
                <h4 className="text-lg font-bold text-white font-heading">
                  КАЛІБРУВАННЯ ПОЛОЖЕННЯ ТІЛА
                </h4>
                <p className="text-xs text-neutral-300 max-w-sm">
                  Замри у вихідній стійці (або планці на підлозі). Камера фіксує твій нульовий рівень!
                </p>
              </div>
            )}

            {/* Rest Timer Active Overlay */}
            {restTimeRemaining !== null && restTimeRemaining > 0 && (
              <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-20 animate-in fade-in">
                <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-cyan-400 animate-spin" />
                  ВІДНОВЛЕННЯ ТА ДИХАННЯ
                </div>
                <div className="text-6xl font-black text-cyan-300 font-heading tracking-tight drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  {restTimeRemaining}с
                </div>
                <p className="text-xs text-neutral-300">
                  Відпочинь, попий води. Тренер попередить звуковим сигналом!
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRestTimeRemaining((prev) => (prev ? prev + 15 : 15))}
                    className="px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-xs hover:bg-cyan-900/60 transition-all cursor-pointer"
                  >
                    +15 сек
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestTimeRemaining(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    Пропустити відпочинок
                  </button>
                </div>
              </div>
            )}

            {/* Inactive Screen with Start Button & Framing Guide */}
            {!isSessionActive && (
              <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-3 z-10 overflow-y-auto">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  {trackingMode === 'camera' ? <Camera className="w-6 h-6" /> : <Zap className="w-6 h-6 text-orange-400" />}
                </div>
                <div className="max-w-md space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
                    ГОТОВИЙ ДО «{activeEx.name}»?
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-400 font-sans">
                    Камера аналізує амплітуду руху та підраховує кожне чисте повторення.
                  </p>
                </div>

                {/* Framing Guide Sketch Component (Requirement 4) */}
                <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-left space-y-2">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>Поставте камеру так, щоб бачити себе ПОВНІСТЮ збоку:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {/* Wrong Framing */}
                    <div className="p-2 rounded-lg border border-red-500/40 bg-red-950/20 flex flex-col items-center text-center space-y-1">
                      <div className="w-full h-14 bg-neutral-950 rounded border border-red-500/30 flex items-center justify-center relative overflow-hidden">
                        <svg className="w-10 h-10 text-red-400" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="32" cy="18" r="7" />
                          <path d="M18 46c0-7 7-11 14-11s14 4 14 11" />
                          <line x1="10" y1="52" x2="54" y2="52" stroke="#ef4444" strokeWidth="2" strokeDasharray="2 2" />
                        </svg>
                        <span className="absolute top-1 right-1 text-[9px] font-bold text-red-400 bg-red-950/80 px-1 rounded">❌</span>
                      </div>
                      <span className="font-bold text-red-300">НЕПРАВИЛЬНО</span>
                      <span className="text-neutral-400 text-[9px] leading-tight">Сидячи / тільки обличчя і плечі</span>
                    </div>

                    {/* Correct Framing */}
                    <div className="p-2 rounded-lg border border-emerald-500/40 bg-emerald-950/20 flex flex-col items-center text-center space-y-1">
                      <div className="w-full h-14 bg-neutral-950 rounded border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
                        <svg className="w-16 h-10 text-emerald-400" viewBox="0 0 80 48" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="20" cy="16" r="5" />
                          <line x1="24" y1="18" x2="56" y2="28" />
                          <line x1="28" y1="20" x2="28" y2="38" />
                          <line x1="56" y1="28" x2="68" y2="38" />
                          <line x1="12" y1="38" x2="76" y2="38" stroke="#10b981" strokeWidth="1.5" />
                        </svg>
                        <span className="absolute top-1 right-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1 rounded">✅</span>
                      </div>
                      <span className="font-bold text-emerald-300">ПРАВИЛЬНО</span>
                      <span className="text-neutral-400 text-[9px] leading-tight">Відійдіть на 2-3м: від голови до пʼят</span>
                    </div>
                  </div>
                </div>

                <button
                  id="start-camera-session-btn"
                  onClick={handleStartSession}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-neutral-950 font-extrabold text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-neutral-950" />
                  РОЗПОЧАТИ СЕСІЮ
                </button>
              </div>
            )}

            {/* Live On-Screen Exercise Status & Camera View (Requirements 5 & 8) */}
            {isSessionActive && (
              <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none select-none">
                <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-black flex items-center gap-2 shadow-xl ${getUniversalStateDisplay(currentFsmState).color}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span>{getUniversalStateDisplay(currentFsmState).label}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-neutral-950/85 border border-neutral-700/80 text-[11px] font-bold text-neutral-200 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Необхідний ракурс:</span>
                  <strong className="text-amber-300">{getCameraViewLabel(activeEx.cameraView || cameraView)}</strong>
                </div>
              </div>
            )}

            {/* Live Camera Framing Error Status (Requirement 7) */}
            {isSessionActive && trackingMode === 'camera' && (
              (!currentSkeleton || debugTelemetry?.isFullBodyVisible === false || (!currentSkeleton.leftShoulder && !currentSkeleton.rightShoulder))
            ) && (
              <div className="absolute bottom-4 left-4 z-20 max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl bg-amber-950/95 border-2 border-amber-500/80 text-amber-200 text-xs font-bold flex items-center gap-3 backdrop-blur-md shadow-2xl animate-pulse pointer-events-none select-none">
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                <div className="space-y-0.5 leading-snug">
                  <div className="text-amber-300 font-extrabold uppercase text-[10px] tracking-wider">
                    Не вдалося визначити положення тіла
                  </div>
                  <div>Розташуйтеся повністю в кадрі (від голови до ніг)</div>
                </div>
              </div>
            )}

            {/* BIG ON-SCREEN REP COUNTER OVERLAY + "+1" ANIMATION (Requirements 3 & 8) */}
            {isSessionActive && (
              <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center bg-neutral-950/90 backdrop-blur-md border border-amber-500/40 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(0,0,0,0.85)] pointer-events-none select-none">
                {showPlusOne && !activeEx.id.toLowerCase().includes('plank') && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce text-amber-400 font-black text-3xl sm:text-4xl drop-shadow-[0_0_20px_rgba(245,158,11,1)]">
                    +1
                  </div>
                )}
                <span className="text-5xl sm:text-6xl font-black text-white font-heading tracking-tight leading-none drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                  {activeEx.id.toLowerCase().includes('plank') ? `${repsCount}с` : repsCount}
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-amber-400 uppercase mt-1">
                  {activeEx.id.toLowerCase().includes('plank')
                    ? 'СЕКУНД УТРИМАННЯ'
                    : repsCount === 1 ? 'ПОВТОРЕННЯ' : (repsCount >= 2 && repsCount <= 4) ? 'ПОВТОРЕННЯ' : 'ПОВТОРЕНЬ'}
                </span>
              </div>
            )}
          </div>

          {/* Incomplete Body Warning Banner */}
          {isSessionActive && debugTelemetry?.isFullBodyVisible === false && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-950/70 border border-amber-500/60 text-xs font-semibold text-amber-200 flex items-center gap-2 animate-pulse shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>⚠️ Позиціонування: не видно все тіло від голови до пʼят. Повторення не зараховуються до виправлення ракурсу камери!</span>
            </div>
          )}

          {/* Biomechanical Telemetry & Anti-Cheat Suite (Points 13 & 15) */}
          {showDebugPanel && (
            <CameraDebugPanel
              telemetry={debugTelemetry}
              exerciseName={activeEx.name}
            />
          )}

          {/* Real-time Metrics */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block truncate">
                {activeEx.id.toLowerCase().includes('plank') ? 'Утримання' : 'Повторення'}
              </span>
              <span className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {activeEx.id.toLowerCase().includes('plank') ? `${repsCount}с` : repsCount}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block truncate">
                {activeEx.id.toLowerCase().includes('plank') ? 'Статус' : 'Темп / Реп'}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-heading">
                {activeEx.id.toLowerCase().includes('plank')
                  ? (currentFsmState === 'target' ? 'Утримання' : 'Старт')
                  : (repTempo ? `${repTempo}с` : '—')}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block truncate">XP</span>
              <span className="text-2xl sm:text-4xl font-extrabold text-orange-400 font-heading">
                +{repsCount * activeEx.xpPerRep}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block truncate">Час</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-200 font-heading">
                {Math.floor(sessionDuration / 60)}:{('0' + (sessionDuration % 60)).slice(-2)}
              </span>
            </div>
          </div>

          {/* Tempo Feedback / Form Feedback */}
          {repTempoFeedback && (
            <div className="px-3 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>{repTempoFeedback}</span>
            </div>
          )}

          {/* Real-time Form Feedback Pill */}
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            formFeedback.status === 'perfect'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : formFeedback.status === 'warning'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}>
            <Activity className="w-4 h-4 shrink-0" />
            <span>{formFeedback.message}</span>
          </div>

          {/* Active Session Controls */}
          {isSessionActive && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="manual-rep-btn"
                  onClick={() => registerRep('full')}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Клавіша Пробіл або Стрілка Вгору"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  +1 Реп (Пробіл)
                </button>

                {/* Rest Timer Buttons */}
                <button
                  type="button"
                  onClick={() => handleStartRestTimer(45)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Таймер відпочинку 45 секунд"
                >
                  <Flame className="w-3.5 h-3.5 text-cyan-400" />
                  Пауза 45с
                </button>

                <button
                  type="button"
                  onClick={() => handleStartRestTimer(60)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Таймер відпочинку 60 секунд"
                >
                  <Flame className="w-3.5 h-3.5 text-cyan-400" />
                  Пауза 60с
                </button>

                <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs text-neutral-400">
                  <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Чутливість:</span>
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSensitivity(lvl)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        sensitivity === lvl ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'
                      }`}
                    >
                      {lvl === 1 ? 'Низ' : lvl === 2 ? 'Норм' : 'Вис'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isFullscreen && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Вийти з повного екрана (Esc)"
                  >
                    <Minimize className="w-3.5 h-3.5 text-amber-400" />
                    <span>Вийти з повного екрана</span>
                  </button>
                )}

                <button
                  id="stop-camera-session-btn"
                  onClick={handleStopSession}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer font-heading active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  ЗАВЕРШИТИ СЕСІЮ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reference Video Player + Arno Coach Voice Widget */}
        <div className={`${showReferenceVideo ? 'lg:col-span-5' : 'lg:col-span-4'} space-y-6 transition-all`}>
          {/* Synchronized Exercise Video Player */}
          {showReferenceVideo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  Еталонна техніка виконання (Відео 60 FPS)
                </span>
                <span className="text-[11px] text-neutral-400">
                  Синхронізуй свій темп
                </span>
              </div>
              <ExerciseVideoPlayer
                exercise={activeEx}
                compact={true}
              />
            </div>
          )}

          {/* Coach Persona Widget */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <img
                    src="/src/assets/images/arno_coach_1789296214893.jpg"
                    alt="Coach"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xl font-bold text-white font-heading leading-tight">
                      НАСТАВНИК КУЗНІ
                    </h3>
                  </div>
                  <p className="text-[11px] font-semibold text-amber-400">
                    Залізний коуч • Мотивація та техніка
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    const praises = [
                      'Не відступати і не здаватися! Кожне повторення будує твою силу!',
                      'Мʼязи горять — це гартується твоя міць!',
                      'Слідкуй за диханням та амплітудою. Тримай контроль!',
                      'Ти сильніший, ніж думаєш. Працюй до кінця!'
                    ];
                    setCoachMessage(praises[Math.floor(Math.random() * praises.length)]);
                    setCoachMood('praising');
                  }}
                  title="Отримати напуття від тренера"
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 hover:bg-neutral-850 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Підбадьор</span>
                </button>
              </div>
            </div>

            {/* Speech Bubble */}
            <div
              className={`p-4 rounded-2xl border text-sm leading-relaxed transition-all relative ${
                coachMood === 'roasting'
                  ? 'bg-red-950/40 border-red-500/50 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-neutral-950 border-amber-500/30 text-amber-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">
                  {coachMood === 'roasting' ? '🔥' : '⚡'}
                </span>
                <div className="space-y-1">
                  <p className="font-sans italic">
                    «{coachMessage}»
                  </p>
                </div>
              </div>
            </div>

            {/* Coach Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="ask-coach-advice-btn"
                onClick={() => {
                  sound.playClick();
                  const tips = [
                    'Техніка важливіша за вагу чи швидкість. Повний діапазон руху дає 100% результат.',
                    'Тримай спину рівною, напружуй мʼязи кору під час кожного повтору.',
                    'Опускайся повільно (2 секунди) — саме ексцентрична фаза запускає гіпертрофію.',
                    'Пий воду під час відпочинку і відновлюй дихання.'
                  ];
                  setCoachMessage(tips[Math.floor(Math.random() * tips.length)]);
                }}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Порада тренера
              </button>

              <button
                id="test-coach-whistle-btn"
                onClick={() => {
                  sound.playCoachWhistle();
                  setCoachMessage('Швидше, атлете! Додай жару в кузні!');
                }}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-orange-500/40 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Свисток тренера
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SESSION SUMMARY MODAL (Point 9) */}
      {sessionCompletedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-amber-500/50 p-6 sm:p-8 space-y-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Сесію успішно завершено
              </span>
              <h2 className="text-3xl font-extrabold text-white font-heading tracking-wide">
                WORKOUT COMPLETE
              </h2>
              <p className="text-sm text-neutral-300 font-sans">
                Вправа: <strong>{sessionCompletedSummary.exerciseName}</strong>
              </p>
            </div>

            {/* Metrics grid aligned with Point 9 spec */}
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs text-neutral-500 block uppercase font-bold">Виконано</span>
                <span className="text-2xl font-black text-white font-heading">
                  {sessionCompletedSummary.reps} reps
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs text-neutral-500 block uppercase font-bold">Отримано XP</span>
                <span className="text-2xl font-black text-amber-400 font-heading">
                  +{sessionCompletedSummary.totalXp} XP
                </span>
              </div>
            </div>

            {/* Quests & Streak tags */}
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Quest Complete
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Streak +1
              </span>
              {trainingBuddy && (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  +25 XP Buddy
                </span>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 italic">
              «Система оцінює біомеханіку та твої зусилля. Твій метал міцнішає щодня!»
            </p>

            <button
              id="close-summary-modal-btn"
              onClick={() => {
                sound.playClick();
                setSessionCompletedSummary(null);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading"
            >
              ПРИЙНЯТИ РЕЗУЛЬТАТ
            </button>
          </div>
        </div>
      )}

      {/* TRAINING BUDDY MODAL (Point 32) */}
      {showBuddyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">TRAINING BUDDY</h3>
                  <p className="text-[11px] text-neutral-400">Спільне тренування з реальним напарником</p>
                </div>
              </div>
              <button
                onClick={() => setShowBuddyModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Invite Partner by Username */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Підключити напарника за нікнеймом:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-mono font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={buddyUsernameInput}
                    onChange={(e) => setBuddyUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="username_друга"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-blue-500 pl-8 pr-3 py-2.5 rounded-xl text-white font-mono text-sm focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && buddyUsernameInput.trim()) {
                        sound.playClick();
                        const name = buddyUsernameInput.trim().startsWith('@') ? buddyUsernameInput.trim() : `@${buddyUsernameInput.trim()}`;
                        setTrainingBuddy({
                          name,
                          status: 'Підключено до сесії',
                          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                        });
                        setShowBuddyModal(false);
                        setCoachMessage(`${name} приєднався до твоєї сесії! Працюємо в парі.`);
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={!buddyUsernameInput.trim()}
                  onClick={() => {
                    if (!buddyUsernameInput.trim()) return;
                    sound.playClick();
                    const name = buddyUsernameInput.trim().startsWith('@') ? buddyUsernameInput.trim() : `@${buddyUsernameInput.trim()}`;
                    setTrainingBuddy({
                      name,
                      status: 'Підключено до сесії',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                    });
                    setShowBuddyModal(false);
                    setCoachMessage(`${name} приєднався до твоєї сесії! Працюємо в парі.`);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Зʼєднати
                </button>
              </div>
            </div>

            {/* Quick Share Link */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Або надішліть посилання для спільного підходу:
              </span>
              <div className="flex items-center justify-between gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl">
                <span className="text-xs font-mono text-neutral-300 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}?buddy_session=${Math.floor(100000 + Math.random() * 900000)}` : 'https://forgemuscle.app?session=sync'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      setBuddyLinkCopied(true);
                      setTimeout(() => setBuddyLinkCopied(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                >
                  {buddyLinkCopied ? 'Скопійовано ✓' : 'Копіювати'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              💡 При синхронному тренуванні з напарником ви обидва отримуєте <strong>+25 XP Buddy Sync Bonus</strong> та бачите взаємний прогрес повторень у реальному часі.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
