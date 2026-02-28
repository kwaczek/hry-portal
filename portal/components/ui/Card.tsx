import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: 'red' | 'green' | 'none';
}

export function Card({ children, hover = false, glow = 'none', className = '', ...props }: CardProps) {
  const glowStyles = {
    red: 'hover:shadow-red-900/20 hover:border-red-500/15',
    green: 'hover:shadow-green-900/20 hover:border-green-500/15',
    none: '',
  };

  return (
    <div
      className={`
        rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm
        ${hover ? 'transition-all duration-300 hover:bg-white/[0.05] hover:shadow-xl cursor-pointer' : ''}
        ${glowStyles[glow]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
