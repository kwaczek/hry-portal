import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: 'amber' | 'green' | 'red' | 'none';
}

export function Card({ children, hover = false, glow = 'none', className = '', ...props }: CardProps) {
  const glowStyles = {
    amber: 'hover:shadow-amber-900/20 hover:border-amber-400/20',
    green: 'hover:shadow-felt-800/30 hover:border-felt-500/20',
    red: 'hover:shadow-card-red-600/20 hover:border-card-red-500/15',
    none: '',
  };

  return (
    <div
      className={`
        rounded-xl bg-bg-card border border-border-subtle
        ${hover ? 'transition-all duration-300 hover:bg-bg-elevated hover:shadow-xl cursor-pointer' : ''}
        ${glowStyles[glow]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
