import React from 'react';

export interface MuscleMapProps {
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({
  selectedGroup,
  onSelectGroup
}) => {
  const groups = [
    { id: 'all', label: 'Всі м’язи' },
    { id: 'chest', label: 'Груди' },
    { id: 'arms', label: 'Руки' },
    { id: 'legs', label: 'Ноги' },
    { id: 'back', label: 'Спина' },
    { id: 'core', label: 'Прес / Кор' }
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g) => {
          const isSelected = selectedGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelectGroup(g.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#C6FF3D] text-[#0B0D10] font-bold shadow-sm'
                  : 'bg-[#1C222B] text-slate-300 hover:text-white hover:bg-[#28313D] border border-white/5'
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Vector silhouette with interactive zones */}
      <div className="relative bg-[#13171D] border border-[#242B36] rounded-2xl p-4 flex items-center justify-center overflow-hidden">
        <div className="relative w-48 h-64 flex items-center justify-center">
          <svg
            viewBox="0 0 200 260"
            className="w-full h-full drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head */}
            <circle cx="100" cy="28" r="18" fill="#242B36" />
            <path d="M92 46H108V54H92V46Z" fill="#242B36" />

            {/* Shoulders */}
            <path
              d="M62 58C62 55 68 53 78 53H122C132 53 138 55 138 58L148 76C148 80 144 83 140 82L132 80V96H68V80L60 82C56 83 52 80 52 76L62 58Z"
              fill={selectedGroup === 'arms' ? '#C6FF3D' : '#2A3340'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('arms')}
            />

            {/* Chest */}
            <path
              d="M72 74H128C132 74 135 77 134 81L128 108C127 112 123 115 119 115H81C77 115 73 112 72 108L66 81C65 77 68 74 72 74Z"
              fill={selectedGroup === 'chest' ? '#C6FF3D' : '#323E50'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('chest')}
            />

            {/* Core / Abs */}
            <path
              d="M80 118H120C124 118 126 121 125 125L120 155C119 158 116 160 113 160H87C84 160 81 158 80 155L75 125C74 121 76 118 80 118Z"
              fill={selectedGroup === 'core' ? '#C6FF3D' : '#2A3340'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('core')}
            />

            {/* Arms Left & Right */}
            <path
              d="M48 84L40 135C39 140 43 144 48 144C52 144 56 140 57 135L64 88L48 84Z"
              fill={selectedGroup === 'arms' ? '#C6FF3D' : '#323E50'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('arms')}
            />
            <path
              d="M152 84L160 135C161 140 157 144 152 144C148 144 144 140 143 135L136 88L152 84Z"
              fill={selectedGroup === 'arms' ? '#C6FF3D' : '#323E50'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('arms')}
            />

            {/* Legs (Quads & Calves) */}
            <path
              d="M74 165L68 215C67 220 71 224 76 224C80 224 84 220 85 215L94 165H74Z"
              fill={selectedGroup === 'legs' ? '#C6FF3D' : '#2A3340'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('legs')}
            />
            <path
              d="M126 165L132 215C133 220 129 224 124 224C120 224 116 220 115 215L106 165H126Z"
              fill={selectedGroup === 'legs' ? '#C6FF3D' : '#2A3340'}
              className="cursor-pointer transition-colors duration-200"
              onClick={() => onSelectGroup('legs')}
            />
          </svg>
        </div>

        {/* Info footnote */}
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-500">
          Натискай на зони для фільтрації
        </div>
      </div>
    </div>
  );
};
