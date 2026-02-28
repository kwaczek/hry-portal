'use client';

import type { Card } from '@hry/shared';
import { CardFace, CardBack, SUIT_COLORS } from './CardSvg';

type CardSize = 'sm' | 'md' | 'lg';

interface PrsiCardProps {
  card?: Card | null;
  faceUp?: boolean;
  selected?: boolean;
  playable?: boolean;
  size?: CardSize;
  onClick?: () => void;
  className?: string;
}

const sizes: Record<CardSize, { w: number; h: number }> = {
  sm: { w: 56, h: 78 },
  md: { w: 80, h: 112 },
  lg: { w: 100, h: 140 },
};

export function PrsiCard({
  card,
  faceUp = true,
  selected = false,
  playable = false,
  size = 'md',
  onClick,
  className = '',
}: PrsiCardProps) {
  const { w, h } = sizes[size];
  const suitColor = card && faceUp ? SUIT_COLORS[card.suit] : undefined;

  return (
    <div
      onClick={onClick}
      className={`
        relative inline-block flex-shrink-0 rounded-lg
        transition-all duration-200 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? '-translate-y-3 scale-105' : ''}
        ${playable && !selected ? 'hover:-translate-y-1.5' : ''}
        ${!playable && faceUp && onClick ? 'opacity-60' : ''}
        ${className}
      `}
      style={{
        width: w,
        height: h,
        boxShadow: selected && suitColor
          ? `0 8px 24px ${suitColor}40, 0 0 0 2px ${suitColor}60`
          : playable && suitColor
          ? `0 4px 12px ${suitColor}20`
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {faceUp && card ? (
        <CardFace card={card} width={w} height={h} />
      ) : (
        <CardBack width={w} height={h} />
      )}

      {/* Playable glow pulse */}
      {playable && !selected && suitColor && (
        <div
          className="absolute inset-0 rounded-lg animate-[pulse-glow_2s_ease-in-out_infinite] pointer-events-none"
          style={{
            boxShadow: `inset 0 0 12px ${suitColor}15`,
            border: `1px solid ${suitColor}20`,
            borderRadius: '8px',
          }}
        />
      )}
    </div>
  );
}
