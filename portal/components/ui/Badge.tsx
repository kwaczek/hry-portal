import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-elevated text-text-secondary border-border-default',
  success: 'bg-felt-600/15 text-felt-300 border-felt-500/20',
  warning: 'bg-amber-400/15 text-amber-300 border-amber-400/20',
  danger: 'bg-card-red-500/15 text-card-red-400 border-card-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-medium border border-transparent
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
