import React, { useEffect, useRef, useState } from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  FlipHorizontal, 
  Eye, 
  EyeOff,
  SwitchCamera,
  Hand,
  ShieldCheck
} from 'lucide-react';
import { ExerciseId } from '../../types';
import { mediaPipeTracker } from '../../services/mediaPipeTracker';
import { RepCounter, RepError } from '../../services/repCounter';
import { estimateView, ViewHysteresis } from '../../services/viewEstimator';
import { EXERCISE_RULES } from '../../services/exerciseRules';
import { LandmarkPoint, LANDMARKS } from '../../services/poseGeometry';
import { mediaSettingsStore } from '../../services/mediaSettingsStore';
import { useI18n } from '../../services/i18n';
import { Button } from '../../ui/Button';

export interface CameraEngineProps {
  exerciseId: ExerciseId;
  isActive: boolean;
  onRepCounted?: (repCount: number, rom: number, accuracy: number, errorType?: string) => void;
  onCalibrationStatus?: (isReady: boolean, message: string) => void;
  onSwitchToManualMode?: () => void;
}

const SKELETON_CONNECTIONS: [number, number][] = [
  [LANDMARKS.NOSE, LANDMARKS.LEFT_SHOULDER],
  [LANDMARKS.NOSE, LANDMARKS.RIGHT_SHOULDER],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
  [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
  [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
  [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
  [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
  [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE]
];

export const CameraEngine: React.FC<CameraEngineProps> = ({
  exerciseId,
  isActive,
  onRepCounted,
  onCalibrationStatus,
  onSwitchToManualMode
}) => {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraRunIdRef = useRef(0);

  const [mediaSettings, setMediaSettings] = useState(mediaSettingsStore.getSettings());
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'connected' | 'error'>('idle');
  const [romValue, setRomValue] = useState<number>(0);
  const [repCount, setRepCount] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [viewLabel, setViewLabel] = useState<string>('—');
  const [phaseLabel, setPhaseLabel] = useState<string>('Вгору');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [calibrated, setCalibrated] = useState<boolean>(false);
  const [isInitializingModel, setIsInitializingModel] = useState<boolean>(true);
  const [initFailed, setInitFailed] = useState<boolean>(false);
  const onRepCountedRef = useRef(onRepCounted);
  const onCalibrationStatusRef = useRef(onCalibrationStatus);
  useEffect(() => { onRepCountedRef.current = onRepCounted; onCalibrationStatusRef.current = onCalibrationStatus; }, [onRepCounted, onCalibrationStatus]);

  const counterRef = useRef<RepCounter>(new RepCounter(exerciseId, 'standard'));
  const animFrameRef = useRef<number | null>(null);
  const consecutiveFramedCountRef = useRef<number>(0);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const viewHysteresisRef = useRef(new ViewHysteresis(4));
  const lastUiUpdateRef = useRef(0);

  useEffect(() => {
    counterRef.current = new RepCounter(exerciseId, 'standard');
  }, [exerciseId]);

  useEffect(() => {
    const unsub = mediaSettingsStore.subscribe(() => {
      setMediaSettings(mediaSettingsStore.getSettings());
    });
    return () => unsub();
  }, []);

  const stopStream = () => {
    setCameraStatus('idle');
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  const handleToggleFacingMode = () => {
    const nextFacingMode: 'user' | 'environment' =
      mediaSettings.facingMode === 'user' ? 'environment' : 'user';

    // A concrete deviceId overrides facingMode in getUserMedia, so clear it
    // when explicitly switching between front and rear camera preferences.
    mediaSettingsStore.updateSettings({
      facingMode: nextFacingMode,
      selectedCameraId: ''
    });
  };

  const waitForVideoReady = (video: HTMLVideoElement): Promise<void> => new Promise((resolve, reject) => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0) {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => reject(new Error('Відеопотік не запустився вчасно')), 8000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('error', onError);
    };
    const onReady = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Браузер не зміг відкрити відеопотік')); };
    video.addEventListener('loadedmetadata', onReady, { once: true });
    video.addEventListener('error', onError, { once: true });
  });

  const startCameraAndModel = async () => {
    const runId = ++cameraRunIdRef.current;

    if (!isActive || !mediaSettings.cameraEnabled) {
      stopStream();
      setHasPermission(false);
      setIsInitializingModel(false);
      return;
    }

    setPermissionError(null);
    setInitFailed(false);
    setHasPermission(null);
    setCameraStatus('requesting');
    setIsInitializingModel(true);
    consecutiveFramedCountRef.current = 0;
    lastCenterRef.current = null;
    mediaPipeTracker.resetFilter();
    viewHysteresisRef.current.reset();
    stopStream();
    setCameraStatus('requesting');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Камера доступна лише в захищеному HTTPS-контексті або на localhost.');
      }

      const preferredConstraints: MediaStreamConstraints = {
        video: mediaSettings.selectedCameraId
          ? { deviceId: { exact: mediaSettings.selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: mediaSettings.facingMode },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
      } catch (firstError) {
        const name = firstError instanceof DOMException ? firstError.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'NotReadableError') throw firstError;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mediaSettings.facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      }

      if (runId !== cameraRunIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (mediaStreamRef.current === stream) {
            setHasPermission(false);
            setCameraStatus('error');
            setPermissionError('Камера була відключена або стала недоступною.');
          }
        };
      });

      const video = videoRef.current;
      if (!video) throw new Error('Відеоелемент камери не знайдено');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      await waitForVideoReady(video);
      if (runId !== cameraRunIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      try {
        await video.play();
      } catch (playError) {
        console.warn('[CameraEngine] video.play() failed:', playError);
        // A second attempt after metadata/layout is available fixes browsers that
        // defer autoplay until the element has been attached to the active document.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await video.play();
      }

      if (runId !== cameraRunIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setHasPermission(true);
      setCameraStatus('connected');
      await mediaSettingsStore.refreshDevices();

      if (runId !== cameraRunIdRef.current) {
        return;
      }

      const ok = await mediaPipeTracker.initialize();
      if (runId !== cameraRunIdRef.current) {
        return;
      }
      setIsInitializingModel(false);
      if (!ok) {
        setInitFailed(true);
        setPermissionError('Камера підключена, але модуль аналізу пози не вдалося запустити.');
      }
    } catch (err: any) {
      console.warn('[CameraEngine] Camera access error:', err);
      stopStream();
      setHasPermission(false);
      setCameraStatus('error');
      const name = err instanceof DOMException ? err.name : '';
      const message = name === 'NotAllowedError'
        ? 'Дозвольте доступ до камери в налаштуваннях браузера.'
        : name === 'NotFoundError'
          ? 'Камера не знайдена. Підключіть камеру та спробуйте ще раз.'
          : name === 'NotReadableError'
            ? 'Камера зайнята іншою програмою або браузер не може її прочитати.'
            : err?.message || t.battle.noCameraMode;
      setPermissionError(message);
      setIsInitializingModel(false);
      setInitFailed(false);
    }
  };

  useEffect(() => {
    const run = () => { void startCameraAndModel(); };
    run();
    const handleVisibility = () => {
      if (document.hidden) {
        ++cameraRunIdRef.current;
        stopStream();
      } else if (isActive) {
        run();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      ++cameraRunIdRef.current;
      stopStream();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, mediaSettings.selectedCameraId, mediaSettings.facingMode, mediaSettings.cameraEnabled]);

  // Main Landmark Tracking & Verification Loop
  useEffect(() => {
    if (!hasPermission || isInitializingModel || initFailed) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const processLoop = () => {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.save();
        const effectiveMirror = mediaSettings.facingMode === 'user' && mediaSettings.mirrorVideo;
        if (effectiveMirror) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const now = performance.now();
        const detection = mediaPipeTracker.detect(video, now);

        if (detection && detection.image.length >= 33) {
          const landmarks = detection.image;
          const world = detection.world;
          setFps(mediaPipeTracker.lastFps);

          const vis = (p?: LandmarkPoint) => p?.visibility ?? 0;
          const required = EXERCISE_RULES[exerciseId]?.required ?? [LANDMARKS.NOSE,LANDMARKS.LEFT_SHOULDER,LANDMARKS.RIGHT_SHOULDER,LANDMARKS.LEFT_HIP,LANDMARKS.RIGHT_HIP,LANDMARKS.LEFT_ANKLE,LANDMARKS.RIGHT_ANKLE];
          const missing = required.filter(i => !landmarks[i] || vis(landmarks[i]) < .45);
          const isCurrentlyFramed = missing.length === 0;

          consecutiveFramedCountRef.current = isCurrentlyFramed ? consecutiveFramedCountRef.current + 1 : 0;
          const isStableFramed = consecutiveFramedCountRef.current >= 6;
          setCalibrated(isStableFramed);
          onCalibrationStatusRef.current?.(
            isStableFramed,
            isStableFramed ? t.battle.bodyInFrame : t.battle.bodyOutOfFrame
          );

          const trackStable = detection.trackScore >= .55;
          if (trackStable && isStableFramed) {
            const estimate=viewHysteresisRef.current.update(estimateView(world));
            const res=counterRef.current.process(world,estimate, detection.timestamp);
            const nowUi=performance.now();
            if(nowUi-lastUiUpdateRef.current>=60 || res.counted || !!res.error){
              lastUiUpdateRef.current=nowUi;
              setViewLabel(`${estimate.view} · ${Math.round(estimate.quality*100)}%`);
              setRomValue(res.rom); setConfidence(Math.round(res.confidence*100));
              setPhaseLabel(res.phase==='down' ? t.battle.thresholdRom : res.phase==='hold' ? t.battle.calibration : t.battle.bodyInFrame);
              setErrorMessage(res.error === 'incomplete_rom' ? t.battle.thresholdRom : res.error === 'bad_view' ? t.battle.stepBack : res.error === 'low_confidence' ? t.battle.bodyOutOfFrame : res.error === 'rushing_tempo' ? t.battle.manualRepsNotice : res.error === 'poor_form' ? 'Виправ техніку руху' : null);
              setRepCount(res.count);
            }
            if(res.counted && isActive && onRepCountedRef.current){
              onRepCountedRef.current(res.count,res.rom,Math.round(res.confidence*100),res.error);
              try{navigator.vibrate?.(30);}catch{}
            }
            if(mediaSettings.showSkeleton){
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height, !!res.error, res.rom, effectiveMirror);
            }
          }
        } else {
          consecutiveFramedCountRef.current = 0;
          viewHysteresisRef.current.reset();
          setCalibrated(false);
        }
      }

      animFrameRef.current = requestAnimationFrame(processLoop);
    };

    animFrameRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hasPermission, isInitializingModel, initFailed, isActive, mediaSettings.showSkeleton, mediaSettings.mirrorVideo, mediaSettings.facingMode]);

  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    points: LandmarkPoint[],
    w: number,
    h: number,
    hasError: boolean,
    rom: number,
    mirror: boolean
  ) => {
    const getX = (val: number) => (mirror ? (1 - val) * w : val * w);
    const getY = (val: number) => val * h;

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = hasError
      ? '#EF4444'
      : rom >= 85
      ? '#FF4D00'
      : 'rgba(255, 77, 0, 0.65)';

    SKELETON_CONNECTIONS.forEach(([i1, i2]) => {
      const p1 = points[i1];
      const p2 = points[i2];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.5 && (p2.visibility ?? 1) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(getX(p1.x), getY(p1.y));
        ctx.lineTo(getX(p2.x), getY(p2.y));
        ctx.stroke();
      }
    });

    // Keypoint joints
    points.forEach((p) => {
      if ((p.visibility ?? 1) > 0.55) {
        ctx.beginPath();
        ctx.arc(getX(p.x), getY(p.y), 4.5, 0, Math.PI * 2);
        ctx.fillStyle = rom >= 85 ? '#FFA31A' : '#FFFFFF';
        ctx.fill();
      }
    });

    // Circular ROM Gauge in corner
    const gaugeX = w - 45;
    const gaugeY = 45;
    const radius = 22;

    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * (rom / 100));
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, radius, startAngle, endAngle);
    ctx.strokeStyle = rom >= 85 ? '#FF4D00' : '#FFB800';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${rom}%`, gaugeX, gaugeY);
  };

  // Fallback screen if camera is disabled or model init failed
  if (hasPermission === false || !mediaSettings.cameraEnabled || initFailed) {
    return (
      <div className="w-full aspect-[4/3] rounded-3xl bg-[var(--bg-card)] border border-amber-500/30 p-6 flex flex-col items-center justify-center text-center shadow-xl">
        <AlertCircle size={40} className="text-amber-400 mb-3" />
        <h4 className="font-heading font-bold text-base text-[var(--text-primary)] mb-1">
          {t.battle.noCameraMode}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4 leading-relaxed">
          {permissionError || t.battle.manualRepsNotice}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => startCameraAndModel()}>
            <RefreshCw size={14} className="mr-1.5" />
            {t.offline.retry}
          </Button>
          {onSwitchToManualMode && (
            <Button variant="primary" size="sm" onClick={onSwitchToManualMode} className="font-bold">
              <Hand size={14} className="mr-1.5" />
              {t.battle.manualRep}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-2xl">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ position: 'absolute', inset: 0, opacity: 0.001, pointerEvents: 'none', width: '100%', height: '100%', zIndex: -10 }}
      />
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <div className="text-white font-black leading-none drop-shadow-[0_3px_12px_rgba(0,0,0,.8)] text-6xl sm:text-7xl tabular-nums">{repCount}</div>
        <div className="mt-1 flex items-center gap-2 justify-center text-[10px] text-white/90 bg-black/55 rounded-full px-3 py-1 backdrop-blur">
          <span>{phaseLabel}</span><span>•</span><span>{viewLabel}</span><span>•</span><span>{confidence}%</span>
        </div>
      </div>

      {/* Loading overlay while MediaPipe initializes */}
      {isInitializingModel && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20">
          <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3 shadow-lg" />
          <div className="text-white font-heading font-bold text-sm tracking-wide">
            Підготовка камери…
          </div>
          <div className="text-slate-400 text-xs mt-1 max-w-xs">
            Підготовка відстеження пози на пристрої.
          </div>
        </div>
      )}

      {/* ROM depth progress bar along the bottom of the video */}
      <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-black/60 z-10">
        <div
          className={`h-full transition-all duration-75 ${
            romValue >= 85 ? 'bg-[var(--accent)]' : 'bg-amber-400'
          }`}
          style={{ width: `${romValue}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow"
          style={{ left: '85%' }}
        />
      </div>

      {/* 85% requirement tag */}
      <div className="absolute bottom-4 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 font-mono z-10">
        ROM &gt; 85%
      </div>

      {/* Form Error Alert Overlay */}
      {errorMessage && (
        <div className="absolute top-3 left-3 right-3 mx-auto max-w-xs bg-red-600/95 text-white backdrop-blur-md px-3.5 py-2 rounded-xl border border-red-400 font-bold text-xs flex items-center justify-center gap-2 shadow-2xl animate-bounce z-20">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Calibration & ON AIR indicator overlay tag */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <div className="bg-red-500/90 text-white font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow animate-pulse uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>{t.battle.onAirCamera}</span>
        </div>

        <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 font-medium flex items-center gap-1.5 shadow">
          <div className={`w-2 h-2 rounded-full ${calibrated ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span>{calibrated ? t.battle.bodyInFrame : t.battle.stepBack}</span>
        </div>

        {fps > 0 && (
          <div className="bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] text-slate-400 font-mono shadow">
            {fps} FPS
          </div>
        )}
      </div>

      {cameraStatus === 'connected' && (
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-400/20 text-[10px] text-emerald-300 font-medium z-10">Камера успішно підключена</div>
      )}

      {/* Camera controls toolbar in top-right */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          type="button"
          onClick={() => mediaSettingsStore.updateSettings({ mirrorVideo: !mediaSettings.mirrorVideo })}
          title={t.settings.mirrorVideo}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <FlipHorizontal size={14} />
        </button>

        <button
          type="button"
          onClick={() => mediaSettingsStore.updateSettings({ showSkeleton: !mediaSettings.showSkeleton })}
          title={t.settings.showSkeleton}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          {mediaSettings.showSkeleton ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <button
          type="button"
          onClick={handleToggleFacingMode}
          title="Камера"
          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <SwitchCamera size={14} />
        </button>
      </div>

      {/* On-device privacy indicator */}
      <div className="absolute bottom-4 left-3 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-slate-400 flex items-center gap-1 z-10">
        <ShieldCheck size={11} className="text-emerald-400" />
        <span>Обробка на пристрої</span>
      </div>
    </div>
  );
};
