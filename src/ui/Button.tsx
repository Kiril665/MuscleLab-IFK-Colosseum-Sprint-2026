import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-xl';

  const sizeClasses = {
    sm: 'text-xs px-3 py-2 min-h-[38px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2 font-semibold',
    lg: 'text-base px-6 py-3.5 min-h-[50px] gap-2.5 font-bold'
  };

  const variantClasses = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-md shadow-[var(--accent)]/20',
    secondary: 'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/80 border border-[var(--border-subtle)] active:scale-[0.98]',
    outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] hover:border-[var(--accent)]/50 active:scale-[0.98]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
    danger: 'bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]',
    gold: 'bg-[var(--accent-secondary)] text-[#0B0D11] hover:brightness-110 active:scale-[0.98] font-bold shadow-md'
  };

  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
