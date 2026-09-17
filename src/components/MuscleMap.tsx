import React, { useState } from 'react';
import { MuscleGroup } from '../types';
import { sound } from '../services/soundEngine';

interface MuscleMapProps {
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup | null) => void;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({
  selectedMuscle,
  onSelectMuscle
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const handleMuscleClick = (muscle: MuscleGroup) => {
    sound.playClick();
    if (selectedMuscle === muscle) {
      onSelectMuscle(null);
    } else {
      onSelectMuscle(muscle);
    }
  };

  const getFill = (muscle: MuscleGroup) => {
    if (selectedMuscle === muscle) {
      return '#f59e0b'; // Amber-500
    }
    return '#27272a'; // Neutral-800
  };

  const getStroke = (muscle: MuscleGroup) => {
    if (selectedMuscle === muscle) {
      return '#fbbf24'; // Amber-400
    }
    return '#52525b'; // Neutral-600
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            АНАТОМІЧНА КАРТА МʼЯЗІВ
          </h3>
          <p className="text-xs text-neutral-400 font-sans">
            Клікни на групу мʼязів для швидкої фільтрації
          </p>
        </div>

        {/* Front / Back Toggle */}
        <div className="inline-flex rounded-lg border border-neutral-700 bg-neutral-950 p-1">
          <button
            onClick={() => {
              sound.playClick();
              setView('front');
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              view === 'front'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Спереду
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setView('back');
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              view === 'back'
                ? 'bg-amber-500 text-neutral-950 shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ззаду
          </button>
        </div>
      </div>

      {/* SVG Anatomy Silhouette */}
      <div className="relative flex justify-center py-2">
        <svg
          viewBox="0 0 240 380"
          className="w-56 h-80 drop-shadow-[0_0_15px_rgba(245,158,11,0.15)] select-none"
        >
          {/* Head & Neck */}
          <ellipse cx="120" cy="35" rx="18" ry="24" fill="#3f3f46" stroke="#71717a" strokeWidth="1.5" />
          <path d="M110 58 Q120 64 130 58 L133 72 L107 72 Z" fill="#3f3f46" stroke="#71717a" strokeWidth="1" />

          {view === 'front' ? (
            /* FRONT VIEW */
            <g>
              {/* SHOULDERS (Front Delts) */}
              <g
                onClick={() => handleMuscleClick('shoulders')}
                className="cursor-pointer group"
              >
                <path
                  d="M78 80 C70 90 70 108 80 115 C88 108 88 92 88 80 Z"
                  fill={getFill('shoulders')}
                  stroke={getStroke('shoulders')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <path
                  d="M162 80 C170 90 170 108 160 115 C152 108 152 92 152 80 Z"
                  fill={getFill('shoulders')}
                  stroke={getStroke('shoulders')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
              </g>

              {/* CHEST (Pectorals) */}
              <g
                onClick={() => handleMuscleClick('chest')}
                className="cursor-pointer group"
              >
                <path
                  d="M90 82 C105 82 118 88 118 118 C105 125 90 118 88 102 Z"
                  fill={getFill('chest')}
                  stroke={getStroke('chest')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <path
                  d="M150 82 C135 82 122 88 122 118 C135 125 150 118 152 102 Z"
                  fill={getFill('chest')}
                  stroke={getStroke('chest')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
              </g>

              {/* BICEPS */}
              <g
                onClick={() => handleMuscleClick('biceps')}
                className="cursor-pointer group"
              >
                <ellipse
                  cx="70"
                  cy="135"
                  rx="9"
                  ry="18"
                  fill={getFill('biceps')}
                  stroke={getStroke('biceps')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <ellipse
                  cx="170"
                  cy="135"
                  rx="9"
                  ry="18"
                  fill={getFill('biceps')}
                  stroke={getStroke('biceps')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
              </g>

              {/* FOREARMS */}
              <path d="M64 158 L58 195 L68 195 L74 158 Z" fill="#27272a" stroke="#52525b" strokeWidth="1" />
              <path d="M176 158 L182 195 L172 195 L166 158 Z" fill="#27272a" stroke="#52525b" strokeWidth="1" />

              {/* ABS (Rectus Abdominis) */}
              <g
                onClick={() => handleMuscleClick('abs')}
                className="cursor-pointer group"
              >
                {/* 6 pack rectangles */}
                <rect x="104" y="125" width="14" height="12" rx="2" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" className="group-hover:fill-amber-500/70" />
                <rect x="122" y="125" width="14" height="12" rx="2" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" className="group-hover:fill-amber-500/70" />
                <rect x="104" y="140" width="14" height="13" rx="2" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" className="group-hover:fill-amber-500/70" />
                <rect x="122" y="140" width="14" height="13" rx="2" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" className="group-hover:fill-amber-500/70" />
                <rect x="104" y="156" width="14" height="14" rx="2" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" className="group-hover:fill-amber-500/70" />
                <rect x="122" y="156" width="14" height="14" rx="2" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" className="group-hover:fill-amber-500/70" />
              </g>

              {/* LEGS (Quadriceps) */}
              <g
                onClick={() => handleMuscleClick('legs')}
                className="cursor-pointer group"
              >
                <path
                  d="M92 190 C85 200 82 230 88 260 C98 262 108 245 112 210 C114 195 105 190 92 190 Z"
                  fill={getFill('legs')}
                  stroke={getStroke('legs')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <path
                  d="M148 190 C155 200 158 230 152 260 C142 262 132 245 128 210 C126 195 135 190 148 190 Z"
                  fill={getFill('legs')}
                  stroke={getStroke('legs')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                {/* Calves front */}
                <path d="M88 275 L84 330 L98 330 L102 275 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="1" />
                <path d="M152 275 L156 330 L142 330 L138 275 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="1" />
              </g>
            </g>
          ) : (
            /* BACK VIEW */
            <g>
              {/* TRAPEZIUS & UPPER BACK */}
              <g
                onClick={() => handleMuscleClick('back')}
                className="cursor-pointer group"
              >
                <path
                  d="M104 74 L136 74 L146 100 L120 140 L94 100 Z"
                  fill={getFill('back')}
                  stroke={getStroke('back')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                {/* LATS (Latissimus dorsi) */}
                <path
                  d="M90 95 C82 110 84 145 102 165 C108 140 106 110 94 95 Z"
                  fill={getFill('back')}
                  stroke={getStroke('back')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <path
                  d="M150 95 C158 110 156 145 138 165 C132 140 134 110 146 95 Z"
                  fill={getFill('back')}
                  stroke={getStroke('back')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
              </g>

              {/* SHOULDERS (Rear Delts) */}
              <g
                onClick={() => handleMuscleClick('shoulders')}
                className="cursor-pointer group"
              >
                <path
                  d="M78 80 C72 90 72 105 82 112 C88 102 88 90 88 80 Z"
                  fill={getFill('shoulders')}
                  stroke={getStroke('shoulders')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <path
                  d="M162 80 C168 90 168 105 158 112 C152 102 152 90 152 80 Z"
                  fill={getFill('shoulders')}
                  stroke={getStroke('shoulders')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
              </g>

              {/* TRICEPS (Back of arm) */}
              <g
                onClick={() => handleMuscleClick('triceps')}
                className="cursor-pointer group"
              >
                <ellipse
                  cx="68"
                  cy="135"
                  rx="9"
                  ry="19"
                  fill={getFill('triceps')}
                  stroke={getStroke('triceps')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
                <ellipse
                  cx="172"
                  cy="135"
                  rx="9"
                  ry="19"
                  fill={getFill('triceps')}
                  stroke={getStroke('triceps')}
                  strokeWidth="1.5"
                  className="transition-colors group-hover:fill-amber-500/70"
                />
              </g>

              {/* GLUTES & HAMSTRINGS (Legs) */}
              <g
                onClick={() => handleMuscleClick('legs')}
                className="cursor-pointer group"
              >
                {/* Glutes */}
                <circle cx="106" cy="188" r="15" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="1.5" />
                <circle cx="134" cy="188" r="15" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="1.5" />
                {/* Hamstrings */}
                <path
                  d="M93 205 C88 220 86 245 92 265 C102 265 110 240 114 210 Z"
                  fill={getFill('legs')}
                  stroke={getStroke('legs')}
                  strokeWidth="1.5"
                />
                <path
                  d="M147 205 C152 220 154 245 148 265 C138 265 130 240 126 210 Z"
                  fill={getFill('legs')}
                  stroke={getStroke('legs')}
                  strokeWidth="1.5"
                />
                {/* Calves back */}
                <ellipse cx="94" cy="300" rx="9" ry="22" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="1.5" />
                <ellipse cx="146" cy="300" rx="9" ry="22" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="1.5" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Selected Muscle Indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
        <span className="text-neutral-400">
          Обраний фокус:{' '}
          <strong className="text-amber-400">
            {selectedMuscle ? selectedMuscle.toUpperCase() : 'Всі групи мʼязів'}
          </strong>
        </span>
        {selectedMuscle && (
          <button
            onClick={() => {
              sound.playClick();
              onSelectMuscle(null);
            }}
            className="text-amber-400 hover:text-amber-300 underline cursor-pointer font-medium"
          >
            Скинути фільтр
          </button>
        )}
      </div>
    </div>
  );
};
