import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const base = 'rounded-2xl transition-all duration-150 border';

  const variantClasses = {
    default: 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-primary)]',
    subtle: 'bg-[var(--bg-subtle)]/70 border-[var(--border-subtle)]/50 text-[var(--text-primary)]',
    interactive: 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--accent)]/60 hover:shadow-lg cursor-pointer text-[var(--text-primary)] active:scale-[0.99]',
    accent: 'bg-[var(--bg-card)] border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]'
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7'
  };

  return (
    <div
      className={`${base} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
