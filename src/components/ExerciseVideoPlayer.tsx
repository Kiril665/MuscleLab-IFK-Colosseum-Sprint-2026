import React, { useState, useRef, useEffect } from 'react';
import { Exercise } from '../types';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  Tv,
  Activity,
  Maximize2
} from 'lucide-react';

interface ExerciseVideoPlayerProps {
  exercise: Exercise;
  compact?: boolean;
  onClose?: () => void;
}

export const ExerciseVideoPlayer: React.FC<ExerciseVideoPlayerProps> = ({
  exercise,
  compact = false,
  onClose
}) => {
  // Mode: 'youtube' (Real video tutorial) vs 'biomechanics' (Interactive canvas 60 FPS)
  const [playerMode, setPlayerMode] = useState<'youtube' | 'biomechanics'>(
    exercise.youtubeId ? 'youtube' : 'biomechanics'
  );

  // Canvas biomechanics state
  const [isPlayingCanvas, setIsPlayingCanvas] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 0.5, 1.0, 1.5
  const [viewAngle, setViewAngle] = useState<'front' | 'side'>('side');
  const [showMusclesOverlay, setShowMusclesOverlay] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isSpeakingGuide, setIsSpeakingGuide] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  // Switch to YouTube whenever exercise changes if it has youtubeId
  useEffect(() => {
    if (exercise.youtubeId) {
      setPlayerMode('youtube');
    } else {
      setPlayerMode('biomechanics');
    }
  }, [exercise.id, exercise.youtubeId]);

  // Subscribe to voice state
  useEffect(() => {
    const unsub = arnoVoice.subscribe((speaking) => {
      setIsSpeakingGuide(speaking);
    });
    return () => unsub();
  }, []);

  // Voice explanation of technique by Arno
  const handleExplainTechnique = () => {
    sound.playClick();
    const goodPoints = exercise.techniqueGood.slice(0, 2).join('. ');
    const speechText = `Розбір техніки: ${exercise.name}. ${goodPoints}. Порада від Арно: ${exercise.tips}`;
    arnoVoice.speak(speechText, { force: true });
  };

  // High-precision Biomechanical Canvas Animation Engine (60 FPS)
  useEffect(() => {
    if (playerMode !== 'biomechanics') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localTime = 0;

    const render = () => {
      if (isPlayingCanvas) {
        localTime += 0.03 * playbackSpeed;
        progressRef.current = (localTime % (Math.PI * 2)) / (Math.PI * 2);
        setProgress(progressRef.current);
      }

      const w = canvas.width;
      const h = canvas.height;

      // Dark gym background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      // Soft gym spotlight
      const spotGrad = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.5, w * 0.6);
      spotGrad.addColorStop(0, 'rgba(39, 39, 42, 0.6)');
      spotGrad.addColorStop(1, 'rgba(9, 9, 11, 0.95)');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, w, h);

      // Gym floor platform
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.82);
      ctx.lineTo(w * 0.9, h * 0.82);
      ctx.stroke();

      // Floor grid perspective
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + i * (w * 0.08), h * 0.82);
        ctx.lineTo(w * 0.5 + i * (w * 0.14), h);
        ctx.strokeStyle = '#18181b';
        ctx.stroke();
      }

      // Sine wave calculation for smooth repetition (eccentric / concentric)
      const repWave = Math.sin(localTime); 
      const isContraction = repWave > 0;

      const centerX = w / 2;
      const floorY = h * 0.82;

      // Exercise biomechanics classification
      const exId = exercise.id;
      const isSquat = exId.includes('squat') || exercise.muscle === 'legs';
      const isPushup = exId.includes('pushups') || (exercise.muscle === 'chest' && exercise.location === 'home');
      const isPullup = exId.includes('pullup') || exercise.muscle === 'back';
      const isBicep = exId.includes('curl') || exercise.muscle === 'biceps';
      const isDip = exId.includes('dips');

      const activeMuscleColor = isContraction ? 'rgba(249, 115, 22, 0.9)' : 'rgba(245, 158, 11, 0.6)';

      if (isPushup) {
        // Push-up animation
        const drop = (repWave + 1) * 16;
        const headX = viewAngle === 'side' ? centerX - 60 : centerX;
        const headY = floorY - 38 + drop;
        const feetX = viewAngle === 'side' ? centerX + 75 : centerX;
        const feetY = floorY - 10;

        ctx.strokeStyle = '#f4f4f5';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(feetX, feetY);
        ctx.stroke();

        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 4;
        const shoulderX = headX + (viewAngle === 'side' ? 20 : 0);
        const shoulderY = headY + 5;
        const elbowX = shoulderX - (viewAngle === 'side' ? 12 : 25);
        const elbowY = floorY - 20 + drop * 0.5;
        const handX = shoulderX - (viewAngle === 'side' ? 10 : 25);
        const handY = floorY;

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(headX - (viewAngle === 'side' ? 14 : 0), headY - 8, 10, 0, Math.PI * 2);
        ctx.fill();

        if (showMusclesOverlay) {
          ctx.fillStyle = activeMuscleColor;
          ctx.beginPath();
          ctx.arc(shoulderX + 10, shoulderY + 4, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (isSquat) {
        // Squat animation
        const squatDepth = (repWave + 1) * 22;
        const hipX = centerX;
        const hipY = floorY - 80 + squatDepth;
        const kneeX = centerX + (viewAngle === 'side' ? 24 : 18);
        const kneeY = floorY - 40 + squatDepth * 0.5;
        const ankleX = centerX + (viewAngle === 'side' ? 6 : 14);
        const ankleY = floorY - 5;
        const shoulderX = centerX - (viewAngle === 'side' ? 12 : 0);
        const shoulderY = hipY - 50;

        ctx.strokeStyle = '#f4f4f5';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(ankleX, ankleY);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(shoulderX, shoulderY - 14, 11, 0, Math.PI * 2);
        ctx.fill();

        if (showMusclesOverlay) {
          ctx.fillStyle = activeMuscleColor;
          ctx.beginPath();
          ctx.arc((hipX + kneeX) / 2, (hipY + kneeY) / 2, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Universal / Pullup / Standing animation
        const pullUpShift = (repWave + 1) * 22;
        const barY = floorY - 140;

        // Pullup bar
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX - 60, barY);
        ctx.lineTo(centerX + 60, barY);
        ctx.stroke();

        const headY = barY + 30 - pullUpShift;
        const hipY = headY + 50;
        const feetY = hipY + 45;

        ctx.strokeStyle = '#f4f4f5';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(centerX, headY);
        ctx.lineTo(centerX, hipY);
        ctx.lineTo(centerX, feetY);
        ctx.stroke();

        // Arms to bar
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX - 25, barY);
        ctx.lineTo(centerX - 10, headY + 10);
        ctx.lineTo(centerX + 10, headY + 10);
        ctx.lineTo(centerX + 25, barY);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(centerX, headY - 10, 11, 0, Math.PI * 2);
        ctx.fill();

        if (showMusclesOverlay) {
          ctx.fillStyle = activeMuscleColor;
          ctx.beginPath();
          ctx.arc(centerX, headY + 22, 13, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rep progress line
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fillRect(0, h - 4, w * progressRef.current, 4);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlayingCanvas, playbackSpeed, viewAngle, showMusclesOverlay, exercise, playerMode]);

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-4 sm:p-5 space-y-4 shadow-xl overflow-hidden">
      {/* Header Bar with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        {/* Mode Selector */}
        <div className="inline-flex rounded-xl border border-neutral-800 bg-neutral-950 p-1 gap-1">
          {exercise.youtubeId && (
            <button
              onClick={() => {
                sound.playClick();
                setPlayerMode('youtube');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                playerMode === 'youtube'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>YouTube Відео-Урок</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              setPlayerMode('biomechanics');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              playerMode === 'biomechanics'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3D Біомеханіка (60 FPS)</span>
          </button>
        </div>

        {/* Arno Voice Cue Button */}
        <button
          onClick={handleExplainTechnique}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isSpeakingGuide
              ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
              : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-amber-300'
          }`}
          title="Послухати голосовий розбір техніки від тренера Арно"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isSpeakingGuide ? 'Арно говорить...' : 'Арно: розбір техніки'}</span>
        </button>
      </div>

      {/* PLAYER CONTAINER */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-inner">
        {playerMode === 'youtube' && exercise.youtubeId ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${exercise.youtubeId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`}
              title={exercise.youtubeTitle || exercise.name}
              className="w-full h-full border-0 rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full h-full object-contain"
            />

            {/* Overlaid Biomechanics Stage Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-700 text-cyan-400 uppercase tracking-wide">
                {viewAngle === 'side' ? 'Вид збоку' : 'Вид спереду'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300">
                {Math.round(progress * 100)}% фази
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Video Details & External Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-300 font-medium">
          {playerMode === 'youtube' && exercise.youtubeTitle ? (
            <span className="text-neutral-300">
              📺 <strong>Джерело:</strong> {exercise.youtubeTitle}
            </span>
          ) : (
            <span className="text-neutral-300">
              🧬 <strong>Біомеханіка:</strong> Комп'ютерна симуляція траєкторії та навантаження (60 FPS)
            </span>
          )}
        </div>

        {playerMode === 'youtube' && exercise.youtubeId && (
          <a
            href={`https://www.youtube.com/watch?v=${exercise.youtubeId}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold hover:underline"
          >
            <span>Відкрити на YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Biomechanics Canvas Controls (only active when in biomechanics mode) */}
      {playerMode === 'biomechanics' && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-850">
          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <button
              onClick={() => {
                sound.playClick();
                setIsPlayingCanvas(!isPlayingCanvas);
              }}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all cursor-pointer shadow"
            >
              {isPlayingCanvas ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Speed selector */}
            <div className="flex items-center bg-neutral-950 rounded-xl border border-neutral-800 p-0.5 text-xs font-semibold">
              {[0.5, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    sound.playClick();
                    setPlaybackSpeed(spd);
                  }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title={spd === 0.5 ? 'Уповільнене відтворення (Slow-Motion)' : 'Швидкість'}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Camera angle toggle */}
            <div className="flex items-center bg-neutral-950 rounded-xl border border-neutral-800 p-0.5 text-xs font-semibold">
              <button
                onClick={() => {
                  sound.playClick();
                  setViewAngle('side');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewAngle === 'side'
                    ? 'bg-orange-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Збоку
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setViewAngle('front');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewAngle === 'front'
                    ? 'bg-orange-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Спереду
              </button>
            </div>
          </div>

          {/* Muscle Highlight toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setShowMusclesOverlay(!showMusclesOverlay);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showMusclesOverlay
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Мʼязи: <strong>{showMusclesOverlay ? 'УВІМК' : 'ВИМК'}</strong></span>
          </button>
        </div>
      )}

      {/* Technique Cues checklist under video */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-850 text-xs">
          <div className="flex items-start gap-2 text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Темп:</strong> 2 сек опускання (контроль), 1 сек підйом (вибух).</span>
          </div>
          <div className="flex items-start gap-2 text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Дихання:</strong> Вдих на опусканні, видих у точці найбільшого зусилля.</span>
          </div>
        </div>
      )}
    </div>
  );
};
