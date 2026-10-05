import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
      {icon && <div className="mb-3 text-[var(--accent)]">{icon}</div>}
      <h4 className="font-heading font-semibold text-base text-[var(--text-primary)] mb-1">{title}</h4>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
