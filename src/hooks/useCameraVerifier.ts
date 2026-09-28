import React, { useState, useEffect, useRef, useCallback } from 'react';
import { poseService } from '../services/pose/PoseDetectorService';
import { drawBiomechanicalSkeleton } from '../services/pose/skeletonDrawer';
import { NormalizedSkeleton, VerificationFrameResult } from '../services/pose/poseTypes';
import { generateSimulatedSkeleton } from '../services/pose/simulationGenerator';
import { analyticsTracker } from '../services/analyticsTracker';
import { TelemetryFrame } from '../services/pose/serverWorkoutVerifier';

export type { TelemetryFrame };

export interface UseCameraVerifierOptions {
  exerciseId?: string; // 'push_up' | 'squat' | 'pull_up'
  autoStart?: boolean;
  onRep?: (validReps: number) => void;
  onReject?: (reason: string) => void;
  onFrame?: (result: VerificationFrameResult, skeleton: NormalizedSkeleton | null) => void;
}

export interface UseCameraVerifierReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStatus: 'idle' | 'loading' | 'active' | 'simulation' | 'error';
  errorMessage: string | null;
  validReps: number;
  rejectedReps: number;
  currentRomPercent: number;
  currentSkeleton: NormalizedSkeleton | null;
  telemetry: VerificationFrameResult | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  resetCounters: () => void;
  setExercise: (exerciseId: string) => void;
  isSimulated: boolean;
  getFrameLog: () => TelemetryFrame[];
  frameLog: TelemetryFrame[];
}

export function useCameraVerifier(options: UseCameraVerifierOptions = {}): UseCameraVerifierReturn {
  const { exerciseId = 'push_up', autoStart = false, onRep, onReject, onFrame } = options;

  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'active' | 'simulation' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validReps, setValidReps] = useState<number>(0);
  const [rejectedReps, setRejectedReps] = useState<number>(0);
  const [currentRomPercent, setCurrentRomPercent] = useState<number>(0);
  const [currentSkeleton, setCurrentSkeleton] = useState<NormalizedSkeleton | null>(null);
  const [telemetry, setTelemetry] = useState<VerificationFrameResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const simStepRef = useRef<number>(0);
  const frameLogRef = useRef<TelemetryFrame[]>([]);
  const lastSampleTimeRef = useRef<number>(0);

  // Set initial exercise
  useEffect(() => {
    poseService.setExercise(exerciseId);
  }, [exerciseId]);

  // Teardown camera helper
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
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
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Subscribe to pose detector events
  useEffect(() => {
    const unsubFrame = poseService.onFrame((result, skeleton) => {
      if (!isComponentMounted.current) return;
      setTelemetry(result);
      setCurrentSkeleton(skeleton);
      setCurrentRomPercent(result.repProgress);
      setValidReps(result.validReps);
      setRejectedReps(result.rejectedReps);

      // Compact telemetry frame logging (~20 fps)
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

      if (onFrame) onFrame(result, skeleton);
    });

    const unsubRep = poseService.onRep((count) => {
      if (!isComponentMounted.current) return;
      setValidReps(count);
      if (onRep) onRep(count);
    });

    const unsubReject = poseService.onReject((reason) => {
      if (!isComponentMounted.current) return;
      if (onReject) onReject(reason);
    });

    return () => {
      unsubFrame();
      unsubRep();
      unsubReject();
    };
  }, [onRep, onReject, onFrame]);

  // Unified Frame Processing & Canvas Rendering Loop
  const startRenderLoop = useCallback((isSimMode: boolean) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const render = () => {
      if (!isComponentMounted.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width || 640;
          const height = canvas.height || 480;

          if (isSimMode) {
            // Virtual AI Simulation loop
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);

            // Grid background
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let x = 0; x < width; x += 40) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.stroke();
            }
            for (let y = 0; y < height; y += 40) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(width, y);
              ctx.stroke();
            }

            // Simulate realistic rep cycle
            simStepRef.current = (simStepRef.current + 1) % 120;
            const simSkeleton = generateSimulatedSkeleton(exerciseId, Date.now());
            const frameRes = poseService.handleSkeletonFrame(simSkeleton, Date.now());

            drawBiomechanicalSkeleton(ctx, width, height, simSkeleton, frameRes, false);

            // Log simulation telemetry frame (~20 fps)
            const now = Date.now();
            if (now - lastSampleTimeRef.current >= 45) {
              lastSampleTimeRef.current = now;
              const primaryAngle = frameRes.primaryElbowAngle ?? frameRes.primaryKneeAngle ?? 160;
              frameLogRef.current.push({
                timestamp: now,
                primaryAngle,
                torsoAngle: frameRes.torsoAngle ?? 0,
                confidence: frameRes.confidence ?? 0.95,
                state: frameRes.state,
                isAlignmentValid: frameRes.isAlignmentValid,
                leftWristY: simSkeleton.leftWrist?.y,
                rightWristY: simSkeleton.rightWrist?.y,
                leftShoulderY: simSkeleton.leftShoulder?.y,
                rightShoulderY: simSkeleton.rightShoulder?.y,
                noseY: simSkeleton.nose?.y
              });
              if (frameLogRef.current.length > 2500) {
                frameLogRef.current.shift();
              }
            }

            // Simulation badge
            ctx.fillStyle = 'rgba(234, 88, 12, 0.85)';
            ctx.fillRect(10, 10, 180, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('AI SKELETON SIMULATION', 18, 26);
          } else if (video && video.readyState >= 2) {
            // Real Webcam Mirror
            ctx.save();
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, width, height);
            ctx.restore();

            // Send video frame to MediaPipe Pose
            poseService.sendVideoFrame(video);

            // Draw current detected skeleton overlay
            const lastSkeleton = poseService.getLastSkeleton();
            const lastResult = poseService.getLastResult();
            if (lastSkeleton && lastResult) {
              drawBiomechanicalSkeleton(ctx, width, height, lastSkeleton, lastResult, true);
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, [exerciseId]);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    setErrorMessage(null);
    analyticsTracker.track('camera_started', { exerciseId });

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('error');
      setErrorMessage('Камера недоступна. Для верифікації потрібен реальний відеопотік.');
      return;
    }

    try {
      // First, try loading MediaPipe Pose
      const modelReady = await poseService.initMediaPipe();
      if (!modelReady) {
        setCameraStatus('error');
        setErrorMessage('AI-модель зору недоступна. Для реальної верифікації повторіть спробу.');
        return;
      }

      stopCamera();

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
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
        throw new Error('Веб-камера недоступна або відсутня');
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
          setTimeout(done, 800);
        });
      }

      setCameraStatus('active');
      analyticsTracker.track('camera_success', { exerciseId });
      startRenderLoop(false);
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraStatus('error');
      setErrorMessage(err?.message || 'Камера недоступна або доступ відхилено.');
      analyticsTracker.track('camera_failure', { exerciseId, error: err?.message });
      stopCamera();
    }
  }, [exerciseId, stopCamera, startRenderLoop]);

  const resetCounters = useCallback(() => {
    poseService.resetCounters();
    frameLogRef.current = [];
    setValidReps(0);
    setRejectedReps(0);
    setCurrentRomPercent(0);
  }, []);

  const setExercise = useCallback((newExerciseId: string) => {
    poseService.setExercise(newExerciseId);
  }, []);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
  }, [autoStart, startCamera]);

  return {
    videoRef,
    canvasRef,
    cameraStatus,
    errorMessage,
    validReps,
    rejectedReps,
    currentRomPercent,
    currentSkeleton,
    telemetry,
    startCamera,
    stopCamera,
    resetCounters,
    setExercise,
    isSimulated: cameraStatus === 'simulation',
    getFrameLog: useCallback(() => [...frameLogRef.current], []),
    frameLog: frameLogRef.current
  };
}
