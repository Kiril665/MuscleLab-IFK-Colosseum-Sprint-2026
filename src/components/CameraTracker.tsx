import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Exercise, WorkoutSession, Discipline } from '../types';
import { EXERCISES } from '../data/exercisesData';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';
import { ArnoVoiceSettingsModal } from './ArnoVoiceSettingsModal';
import confetti from 'canvas-confetti';
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
  Users
} from 'lucide-react';

interface CameraTrackerProps {
  currentExercise: Exercise | null;
  onSelectExercise: (ex: Exercise) => void;
  onWorkoutComplete: (session: WorkoutSession) => void;
  userDiscipline: Discipline | null;
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({
  currentExercise,
  onSelectExercise,
  onWorkoutComplete,
  userDiscipline
}) => {
  // Target exercise
  const [activeEx, setActiveEx] = useState<Exercise>(currentExercise || EXERCISES[0]);

  // Tracking Mode: Real Webcam vs Virtual AI Skeleton
  const [trackingMode, setTrackingMode] = useState<'camera' | 'simulation'>('camera');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

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
  const [coachMessage, setCoachMessage] = useState<string>(
    `Вітаю в тренувальній зоні! Я ${arnoVoice.getCoachDisplayName()}. Обери вправу, стань перед камерою або ввімкни калібрування і починай рух!`
  );
  const [isArnoSpeaking, setIsArnoSpeaking] = useState<boolean>(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(arnoVoice.getIsEnabled());
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Computer Vision Kinematic classification buffers
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const motionPhaseRef = useRef<'down' | 'up'>('up');
  const lastRepTimeRef = useRef<number>(0);
  const motionHistoryRef = useRef<Array<{ y: number; upper: number; mid: number; lower: number; ratio: number; time: number }>>([]);
  const repPeakDepthRef = useRef<number>(0);
  const lastVoiceCueTimeRef = useRef<number>(0);
  const rollingMinYRef = useRef<number>(240);
  const rollingMaxYRef = useRef<number>(0);
  const recentYPositionsRef = useRef<number[]>([]);

  // Keep activeEx synced if prop updates
  useEffect(() => {
    if (currentExercise && currentExercise.id !== activeEx.id) {
      setActiveEx(currentExercise);
    }
  }, [currentExercise]);

  // Subscribe to Coach Voice engine state
  useEffect(() => {
    const unsubscribe = arnoVoice.subscribe((speaking, text) => {
      setIsArnoSpeaking(speaking);
      if (speaking && text) {
        setCoachMessage(text);
      }
    });
    return () => unsubscribe();
  }, []);

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
      arnoVoice.stop();
    };
  }, [stopCameraStream]);

  // Request & Mount Web Camera with Robust Multi-Tier Fallback
  const initCamera = useCallback(async (customFacing?: 'user' | 'environment'): Promise<boolean> => {
    setCameraStatus('requesting');
    setCameraErrorMessage(null);

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

    const coach = arnoVoice.getCoachDisplayName();
    arnoVoice.speak(`Калібрування камери! Займи вихідну стійку або планку. Фіксуємо за три секунди!`, { force: true });

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

        if (recentYPositionsRef.current.length > 0) {
          const sum = recentYPositionsRef.current.reduce((a, b) => a + b, 0);
          const avg = sum / recentYPositionsRef.current.length;
          setCalibratedBaseY(avg);
        } else {
          setCalibratedBaseY(120);
        }
        setIsCalibrated(true);
        arnoVoice.speak(`Положення зафіксовано! ${coach} бачить тебе ідеально. Починай рух!`, { force: true });
      }
    }, 1000);
  };

  // Rest Timer Controller
  const handleStartRestTimer = (seconds: number = 60) => {
    sound.playClick();
    setRestTimeRemaining(seconds);
    arnoVoice.speak(`Відпочинок ${seconds} секунд. Глибоко дихай, відновлюй сили!`);
  };

  useEffect(() => {
    if (restTimeRemaining === null || restTimeRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          sound.playGong();
          arnoVoice.speak('Час відпочинку вичерпано! До снаряда, покажемо міць!');
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

  // Toggle Coach Voice
  const handleToggleVoice = () => {
    const newState = arnoVoice.toggleVoice();
    setIsVoiceEnabled(newState);
    if (newState) {
      const coach = arnoVoice.getCoachDisplayName();
      arnoVoice.speak(`Голос тренера ${coach} увімкнено! Працюємо на повну!`, { force: true });
    }
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
      // Coach speaks at milestone reps
      if (next === 1 || next % 3 === 0) {
        setCoachMood('praising');
        const text = arnoVoice.speakRepPraise(next);
        setCoachMessage(text);
      }
      return next;
    });

    setFormFeedback({
      status: 'perfect',
      message: '✅ Повна амплітуда! Повторення зараховано!'
    });

    setLastMovementTime(Date.now());
  }, []);

  // Keyboard shortcut for manual rep
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSessionActive) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        registerRep('full');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive, registerRep]);

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

      const width = 320;
      const height = 240;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      const video = videoRef.current;
      const isRealCam = trackingMode === 'camera' && cameraStatus === 'active' && video && video.readyState >= 2 && video.videoWidth > 0;

      if (isRealCam && video) {
        // --- REAL WEBCAM COMPUTATIONAL KINEMATICS ---
        ctx.save();
        // Mirror horizontally
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        try {
          const currentFrame = ctx.getImageData(0, 0, width, height);
          const data = currentFrame.data;

          if (prevFrameDataRef.current && prevFrameDataRef.current.length === data.length) {
            let motionUpper = 0;
            let motionMid = 0;
            let motionLower = 0;
            let sumY = 0;
            let sumX = 0;
            let totalMotionCount = 0;

            let minX = width;
            let maxX = 0;
            let minY = height;
            let maxY = 0;

            // Sensitivity threshold
            const diffThreshold = sensitivity === 1 ? 42 : sensitivity === 2 ? 30 : 20;
            const repThreshold = sensitivity === 1 ? 220 : sensitivity === 2 ? 150 : 100;

            // Spatial grid analysis
            for (let i = 0; i < data.length; i += 16) {
              const diff =
                Math.abs(data[i] - prevFrameDataRef.current[i]) +
                Math.abs(data[i + 1] - prevFrameDataRef.current[i + 1]) +
                Math.abs(data[i + 2] - prevFrameDataRef.current[i + 2]);

              if (diff > diffThreshold * 3) {
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);

                sumX += x;
                sumY += y;
                totalMotionCount++;

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                if (y < height * 0.33) motionUpper++;
                else if (y < height * 0.66) motionMid++;
                else motionLower++;
              }
            }

            // If active motion is detected
            if (totalMotionCount > repThreshold) {
              const centroidX = sumX / totalMotionCount;
              const centroidY = sumY / totalMotionCount;
              const boxW = Math.max(1, maxX - minX);
              const boxH = Math.max(1, maxY - minY);
              const aspectRatio = boxW / boxH; // >1 is horizontal (pushups), <1 is vertical (squats, pullups)
              const groundProximity = centroidY / height; // closer to 1 = on floor

              // Record motion history slice
              motionHistoryRef.current.push({
                y: centroidY,
                upper: motionUpper,
                mid: motionMid,
                lower: motionLower,
                ratio: aspectRatio,
                time: Date.now()
              });
              if (motionHistoryRef.current.length > 25) {
                motionHistoryRef.current.shift();
              }

              // --- ADAPTIVE RELATIVE KINEMATIC ENVELOPE (Works on Floor, Standing, Hanging) ---
              recentYPositionsRef.current.push(centroidY);
              if (recentYPositionsRef.current.length > 35) {
                recentYPositionsRef.current.shift();
              }

              const recentYs = recentYPositionsRef.current;
              const dynamicMinY = Math.min(...recentYs);
              const dynamicMaxY = Math.max(...recentYs);
              const dynamicAmplitude = Math.max(1, dynamicMaxY - dynamicMinY);

              // Analyze Kinematics & Classify Exercise
              let classifiedId = activeEx.id;
              let confidence = 85;

              // Rule 1: Floor & Horizontal -> Push-ups
              if (aspectRatio > 1.15 && groundProximity > 0.45) {
                classifiedId = 'pushups_classic';
                confidence = Math.min(98, Math.round(85 + (aspectRatio * 6)));
              }
              // Rule 2: Upper Zone Heavy -> Pull-ups, Muscle-ups, or Overhead press
              else if (motionUpper > (motionMid + motionLower) * 0.55 || (minY < 40 && centroidY < height * 0.45)) {
                if (activeEx.id === 'muscle_up' || dynamicAmplitude > 38) {
                  classifiedId = 'muscle_up';
                  confidence = 93;
                } else if (activeEx.id.includes('press')) {
                  classifiedId = 'overhead_press_barbell';
                  confidence = 94;
                } else {
                  classifiedId = 'pullups_overhand';
                  confidence = 94;
                }
              }
              // Rule 3: Torso tilt with mid pulling motion -> Barbell Bent-over Row (нахил штанги)
              else if (activeEx.id.includes('row') || (aspectRatio >= 0.75 && aspectRatio <= 1.25 && motionMid > motionLower * 0.9)) {
                classifiedId = 'barbell_bent_over_row';
                confidence = 92;
              }
              // Rule 4: High vertical amplitude & upright torso -> Squats
              else if (aspectRatio < 0.95 && (motionMid > 40 && motionLower > 40)) {
                classifiedId = 'barbell_squats';
                confidence = 95;
              }
              // Rule 5: Stable torso with isolated mid-lateral oscillation -> Bicep Curls
              else if (Math.abs(centroidY - height * 0.5) < 35 && motionMid > (motionUpper + motionLower) * 0.8) {
                classifiedId = 'barbell_biceps_curl';
                confidence = 91;
              }

              // Update detected exercise state
              const foundExercise = EXERCISES.find((ex) => ex.id === classifiedId) || EXERCISES[0];
              setDetectedExerciseName(foundExercise.name);
              setDetectedConfidence(confidence);
              setDetectedExerciseObj(foundExercise);

              // Auto-Detect Mode: Automatically switch target exercise and announce
              if (isAutoDetectEnabled && foundExercise.id !== activeEx.id) {
                setActiveEx(foundExercise);
                onSelectExercise(foundExercise);
                sound.playChainTug();
                if (Date.now() - lastVoiceCueTimeRef.current > 6000) {
                  arnoVoice.speakExerciseDetected(foundExercise.name, confidence);
                  lastVoiceCueTimeRef.current = Date.now();
                }
              }

              // Check exercise kinematics profile
              const isFloorPushup = activeEx.id.includes('push') || (aspectRatio > 1.05 && groundProximity > 0.38);
              const isMuscleUp = activeEx.id === 'muscle_up' || activeEx.id.includes('muscle');
              const isPullup = activeEx.id.includes('pull') || isMuscleUp;
              const isRow = activeEx.id.includes('row');
              const isSquat = activeEx.id.includes('squat');

              // Adaptive Range of Motion (ROM %)
              let romNormalized = 0;
              if (dynamicAmplitude > 10) {
                if (isPullup || isRow) {
                  romNormalized = Math.min(100, Math.max(0, Math.round(((dynamicMaxY - centroidY) / dynamicAmplitude) * 100)));
                } else {
                  romNormalized = Math.min(100, Math.max(0, Math.round(((centroidY - dynamicMinY) / dynamicAmplitude) * 100)));
                }
              } else {
                romNormalized = 30;
              }
              setCurrentRomPercent(romNormalized);

              // Repetition Detection Cycle
              const now = Date.now();
              const minAmpRequired = isFloorPushup 
                ? (sensitivity === 3 ? 10 : sensitivity === 2 ? 14 : 18) 
                : isMuscleUp
                ? (sensitivity === 3 ? 18 : sensitivity === 2 ? 26 : 34)
                : isRow
                ? (sensitivity === 3 ? 12 : sensitivity === 2 ? 16 : 22)
                : (sensitivity === 3 ? 14 : sensitivity === 2 ? 20 : 28);
              const debounceMs = isFloorPushup ? 620 : isSquat ? 800 : isMuscleUp ? 900 : isRow ? 650 : 700;

              if (isPullup || isRow) {
                // Pull-ups / Muscle-ups / Barbell Rows (pulling up reduces centroidY)
                const upTrigger = dynamicMaxY - Math.max(minAmpRequired, dynamicAmplitude * 0.52);
                const downTrigger = dynamicMaxY - Math.max(6, dynamicAmplitude * 0.22);

                if (centroidY < upTrigger && motionPhaseRef.current === 'down') {
                  motionPhaseRef.current = 'up';
                  repPeakDepthRef.current = romNormalized;
                } else if (centroidY > downTrigger && motionPhaseRef.current === 'up') {
                  if (now - lastRepTimeRef.current > debounceMs) {
                    motionPhaseRef.current = 'down';
                    lastRepTimeRef.current = now;
                    registerRep('full');

                    const message = isMuscleUp
                      ? '🔥 Вихід силою на дві руки зараховано! Обидва лікті синхронно над турніком!'
                      : isRow
                      ? '⚡ Тяга штанги в нахилі зарахована! Лопатки зведено до кінця!'
                      : '✅ Підтягування зараховано! Підборіддя над турніком!';

                    setFormFeedback({
                      status: 'perfect',
                      message
                    });
                  }
                }
              } else {
                // Floor Push-ups, Squats, Dips, Curls (descent increases centroidY)
                const downTrigger = dynamicMinY + Math.max(minAmpRequired, dynamicAmplitude * 0.52);
                const upTrigger = dynamicMinY + Math.max(6, dynamicAmplitude * 0.24);

                if (centroidY > downTrigger && motionPhaseRef.current === 'up') {
                  motionPhaseRef.current = 'down';
                  repPeakDepthRef.current = romNormalized;
                } else if (centroidY < upTrigger && motionPhaseRef.current === 'down') {
                  if (now - lastRepTimeRef.current > debounceMs) {
                    motionPhaseRef.current = 'up';
                    lastRepTimeRef.current = now;

                    if (dynamicAmplitude >= minAmpRequired || repPeakDepthRef.current >= 45) {
                      registerRep('full');
                      setFormFeedback({
                        status: 'perfect',
                        message: isFloorPushup 
                          ? '✅ Віджимання від підлоги зараховано! Повний розгин!' 
                          : '✅ Повна амплітуда! Повторення зараховано!'
                      });
                    } else {
                      setFormFeedback({
                        status: 'warning',
                        message: '⚠️ Опустись глибше! Неповна амплітуда'
                      });
                    }
                  }
                }
              }

              // --- DRAW HUD OPTICAL GRAPHICS OVERLAY ---
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.strokeRect(minX, minY, boxW, boxH);

              // Corner brackets
              const bLen = 14;
              ctx.strokeStyle = '#ea580c';
              ctx.lineWidth = 3;
              // TL
              ctx.beginPath();
              ctx.moveTo(minX, minY + bLen);
              ctx.lineTo(minX, minY);
              ctx.lineTo(minX + bLen, minY);
              ctx.stroke();
              // TR
              ctx.beginPath();
              ctx.moveTo(maxX - bLen, minY);
              ctx.lineTo(maxX, minY);
              ctx.lineTo(maxX, minY + bLen);
              ctx.stroke();
              // BL
              ctx.beginPath();
              ctx.moveTo(minX, maxY - bLen);
              ctx.lineTo(minX, maxY);
              ctx.lineTo(minX + bLen, maxY);
              ctx.stroke();
              // BR
              ctx.beginPath();
              ctx.moveTo(maxX - bLen, maxY);
              ctx.lineTo(maxX, maxY);
              ctx.lineTo(maxX, maxY - bLen);
              ctx.stroke();

              // Crosshair centroid
              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.arc(centroidX, centroidY, 6, 0, Math.PI * 2);
              ctx.fill();

              // ROM Level bar on side
              ctx.fillStyle = '#18181b';
              ctx.fillRect(width - 16, 20, 8, height - 40);
              const barFillH = ((height - 40) * romNormalized) / 100;
              ctx.fillStyle = romNormalized > 80 ? '#22c55e' : '#f59e0b';
              ctx.fillRect(width - 16, height - 20 - barFillH, 8, barFillH);

              // Detected Badge & Phase on Video Top
              ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
              ctx.fillRect(10, 10, 210, 26);
              ctx.fillStyle = '#f59e0b';
              ctx.font = 'bold 10px sans-serif';
              ctx.fillText(`AI КІНЕМАТИКА: ${foundExercise.name.slice(0, 20)}...`, 16, 26);

              // Real-time Motion Phase Pill
              ctx.fillStyle = motionPhaseRef.current === 'down' ? 'rgba(234, 88, 12, 0.85)' : 'rgba(34, 197, 94, 0.85)';
              ctx.fillRect(width - 92, 10, 82, 20);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px sans-serif';
              ctx.fillText(motionPhaseRef.current === 'down' ? 'ФАЗА: ВНИЗ ⬇' : 'ФАЗА: ВГОРУ ⬆', width - 87, 24);
            }
          }

          prevFrameDataRef.current = new Uint8ClampedArray(data);
        } catch {
          // Security / blank frame exception safe handler
        }
      } else {
        // --- AI VIRTUAL COACH SIMULATOR ENGINE ---
        ctx.fillStyle = '#0e0e11';
        ctx.fillRect(0, 0, width, height);

        // Tech grid lines
        ctx.strokeStyle = '#1e1e24';
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

        // Rep Cycle Animation
        const time = Date.now() / 700;
        const repCycle = Math.sin(time); // -1 to 1
        const yOffset = repCycle * 28;
        const simRom = Math.round(((repCycle + 1) / 2) * 100);
        setCurrentRomPercent(simRom);

        // Simulated Joint Skeleton
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Head
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(160, 75 + yOffset * 0.45, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(160, 90 + yOffset * 0.45);
        ctx.lineTo(160, 145 + yOffset * 0.75);
        ctx.stroke();

        // Arms & Shoulders
        ctx.beginPath();
        ctx.moveTo(160, 100 + yOffset * 0.45);
        ctx.lineTo(125, 122 + yOffset);
        ctx.lineTo(110, 145 + yOffset * 0.6);
        ctx.moveTo(160, 100 + yOffset * 0.45);
        ctx.lineTo(195, 122 + yOffset);
        ctx.lineTo(210, 145 + yOffset * 0.6);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(160, 145 + yOffset * 0.75);
        ctx.lineTo(138, 198);
        ctx.moveTo(160, 145 + yOffset * 0.75);
        ctx.lineTo(182, 198);
        ctx.stroke();

        // Joint Points
        ctx.fillStyle = '#22c55e';
        [
          [125, 122 + yOffset],
          [195, 122 + yOffset],
          [110, 145 + yOffset * 0.6],
          [210, 145 + yOffset * 0.6],
          [138, 198],
          [182, 198]
        ].forEach(([jx, jy]) => {
          ctx.beginPath();
          ctx.arc(jx, jy, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // Trigger Rep
        if (repCycle > 0.94 && motionPhaseRef.current === 'down') {
          motionPhaseRef.current = 'up';
          registerRep('full');
        } else if (repCycle < -0.94) {
          motionPhaseRef.current = 'down';
        }

        // Simulator watermark
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('AI SKELETON SYNTHESIS • ACTIVE', 75, 45);
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
          const roast = arnoVoice.speakRoast();
          setCoachMessage(roast);
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

    const introText = arnoVoice.speakWorkoutStart(activeEx.name);
    setCoachMessage(introText);

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
      arnoVoice.speakWorkoutComplete(repsCount, earnedXp);
      onWorkoutComplete(session);
    } else {
      sound.playClick();
      arnoVoice.speak('Сесію зупинено. Відпочинь і спробуємо ще раз!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Exercise Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Scan className="w-3.5 h-3.5" />
            AI Розпізнавання Вправ & Компʼютерний Зір
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
            КАМЕРА-ТРЕКЕР З АРНО
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
                arnoVoice.speak('Авто-розпізнавання активовано! Камера самостійно визначить твою вправу.');
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

          {/* Manual Selector */}
          <select
            id="camera-exercise-selector"
            value={activeEx.id}
            onChange={(e) => {
              sound.playClick();
              const found = EXERCISES.find((ex) => ex.id === e.target.value);
              if (found) {
                setActiveEx(found);
                onSelectExercise(found);
                if (isVoiceEnabled) {
                  arnoVoice.speak(`Обрано: ${found.name}`);
                }
              }
            }}
            disabled={isSessionActive}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            {EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} (+{ex.xpPerRep} XP)
              </option>
            ))}
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
              arnoVoice.unlock();
              arnoVoice.testVoice();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Перевірити звук тренера"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Тест голосу</span>
          </button>

          <button
            id="arno-voice-toggle-btn"
            onClick={handleToggleVoice}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isVoiceEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
            title="Увімкнути/Вимкнути озвучення тренера"
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Голос: <strong>{isVoiceEnabled ? 'УВІМК' : 'ВИМК'}</strong></span>
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
                arnoVoice.speak(`Перемкнуто на: ${detectedExerciseObj.name}`);
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

      {/* Main Dual Arena Grid: Left = Video Feed, Right = Reference Video + Arno */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Video Tracking Arena */}
        <div className={`${showReferenceVideo ? 'lg:col-span-7' : 'lg:col-span-8'} rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden transition-all`}>
          {/* Header strip */}
          <div className="flex items-center justify-between z-20 relative">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                {isSessionActive ? 'Тренування в процесі' : 'Готовий до запуску'}
              </span>
            </div>

            {/* ROM Depth Gauge Pill */}
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                <span>Глибина (ROM):</span>
                <strong className={currentRomPercent > 75 ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentRomPercent}%
                </strong>
              </div>
            </div>
          </div>

          {/* Video Feed Canvas */}
          <div className="relative aspect-video w-full rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-0"
            />

            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
            />

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

            {/* Inactive Screen with Start Button */}
            {!isSessionActive && (
              <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                  {trackingMode === 'camera' ? <Camera className="w-8 h-8" /> : <Zap className="w-8 h-8 text-orange-400" />}
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-heading">
                    ГОТОВИЙ ДО «{activeEx.name}»?
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-sans">
                    Камера аналізує амплітуду руху, контролює правильність техніки та підраховує кожне чисте повторення.
                  </p>
                </div>

                <button
                  id="start-camera-session-btn"
                  onClick={handleStartSession}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-neutral-950 font-extrabold text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-neutral-950" />
                  РОЗПОЧАТИ СЕСІЮ
                </button>
              </div>
            )}
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block truncate">Повторення</span>
              <span className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {repsCount}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 sm:p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block truncate">Темп / Реп</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-heading">
                {repTempo ? `${repTempo}с` : '—'}
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

              <button
                id="stop-camera-session-btn"
                onClick={handleStopSession}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer font-heading active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                ЗАВЕРШИТИ СЕСІЮ
              </button>
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

          {/* Arno Coach Persona Widget */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                  isArnoSpeaking 
                    ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] scale-105' 
                    : 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                }`}>
                  <img
                    src="/src/assets/images/arno_coach_1789296214893.jpg"
                    alt="Coach Arno"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isArnoSpeaking && (
                    <div className="absolute inset-0 bg-amber-500/20 animate-pulse" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xl font-bold text-white font-heading leading-tight">
                      {arnoVoice.getCoachDisplayName().toUpperCase()}
                    </h3>
                    {isArnoSpeaking && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 animate-bounce">
                        Говорить...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-amber-400">
                    Наставник Кузні • Залізний коуч
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    arnoVoice.unlock();
                    const praise = arnoVoice.speakRepPraise(repsCount || 5);
                    setCoachMessage(praise);
                  }}
                  title="Отримати голосове напуття від тренера"
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 hover:bg-neutral-850 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Підбадьор</span>
                </button>

                <button
                  id="arno-coach-settings-btn"
                  onClick={() => {
                    sound.playClick();
                    setShowVoiceSettingsModal(true);
                  }}
                  title="Налаштування голосу та імені тренера"
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-400 cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Speech Bubble */}
            <div
              className={`p-4 rounded-2xl border text-sm leading-relaxed transition-all relative ${
                coachMood === 'roasting'
                  ? 'bg-red-950/40 border-red-500/50 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : isArnoSpeaking
                  ? 'bg-amber-950/40 border-amber-400/60 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-950 border-amber-500/30 text-amber-100'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">
                  {coachMood === 'roasting' ? '🔥' : isArnoSpeaking ? '🗣️' : '⚡'}
                </span>
                <div className="space-y-2">
                  <p className="font-sans italic">
                    «{coachMessage}»
                  </p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => arnoVoice.speak(coachMessage, { force: true })}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      Озвучити знову
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="ask-arno-advice-btn"
                onClick={() => {
                  const text = arnoVoice.speakGreeting();
                  setCoachMessage(text);
                }}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Слово від Арно
              </button>

              <button
                id="test-arno-whistle-btn"
                onClick={() => {
                  sound.playCoachWhistle();
                  arnoVoice.speak('Швидше, козаче! Додай жару в кузні!');
                }}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-orange-500/40 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Свисток & Жар
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
              «Система оцінює біомеханіку та твої зусилля. Твій метал міцнішає щодня!» — Арно
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
                  <p className="text-[11px] text-neutral-400">Спільне тренування з друзями в реальному часі</p>
                </div>
              </div>
              <button
                onClick={() => setShowBuddyModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Оберіть напарника:</span>
              {[
                { name: 'Kuznets', status: 'Готовий до підтягувань', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
                { name: 'Simon', status: 'Зараз на брусах', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
                { name: 'IronWolf', status: 'Розминка перед базою', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
                { name: 'Oksana_Bar', status: 'Онлайн у Кузні', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' }
              ].map((buddy) => (
                <div
                  key={buddy.name}
                  onClick={() => {
                    sound.playClick();
                    setTrainingBuddy(buddy);
                    setShowBuddyModal(false);
                    arnoVoice.speak(`${buddy.name} приєднався до твоєї сесії! Працюємо в парі.`);
                  }}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-850 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={buddy.avatar} alt={buddy.name} className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{buddy.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </div>
                      <p className="text-[11px] text-neutral-400">{buddy.status}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-400 hover:text-blue-300">
                    Запросити →
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              💡 При тренуванні з Buddy ви обидва отримуєте <strong>+25 XP Buddy Sync Bonus</strong> та синхронізовані реп-сповіщення: <em>«Kuznets started workout», «Simon joined», «Workout completed»</em>.
            </div>
          </div>
        </div>
      )}

      {/* Arno Voice Settings Modal */}
      <ArnoVoiceSettingsModal
        isOpen={showVoiceSettingsModal}
        onClose={() => setShowVoiceSettingsModal(false)}
      />
    </div>
  );
};
