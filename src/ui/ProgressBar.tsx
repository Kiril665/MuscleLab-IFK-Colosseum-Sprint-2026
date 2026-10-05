import React from 'react';

export interface ProgressBarProps {
  value: number; // 0..100
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'primary' | 'gold' | 'success';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 'md',
  showLabel = false,
  variant = 'primary',
  className = ''
}) => {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const fillColors = {
    primary: 'bg-[var(--accent)]',
    gold: 'bg-[var(--accent-secondary)]',
    success: 'bg-emerald-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-[var(--text-secondary)]">
          <span>{value} / {max}</span>
          <span>{percent}%</span>
        </div>
      )}
      <div className={`w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden ${heightClasses[height]} border border-[var(--border-subtle)]`}>
        <div
          className={`h-full ${fillColors[variant]} transition-all duration-300 rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
