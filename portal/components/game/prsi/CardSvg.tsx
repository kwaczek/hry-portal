import type { Suit, Rank, Card } from '@hry/shared';
import { SUIT_NAMES, RANK_NAMES } from '@hry/shared';

// Suit colors
const SUIT_COLORS: Record<Suit, string> = {
  cerveny: '#c41e3a',
  zeleny: '#2d7a2d',
  kule: '#d4a017',
  zaludy: '#8b5e3c',
};

// Suit SVG paths (small symbols for corners)
function SuitSymbol({ suit, size = 20 }: { suit: Suit; size?: number }) {
  const color = SUIT_COLORS[suit];

  switch (suit) {
    case 'cerveny':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'zeleny':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
        </svg>
      );
    case 'kule':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2C9 2 7 4.5 7 7.5c0 2 .8 3.6 2 4.8V20l3 2 3-2v-7.7c1.2-1.2 2-2.8 2-4.8C17 4.5 15 2 12 2zm0 2c2 0 3 1.8 3 3.5S14 11 12 11 9 9.2 9 7.5 10 4 12 4z" />
        </svg>
      );
    case 'zaludy':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 1.5.7 2.8 1.8 3.7-.2.2-.3.5-.3.8v1c0 .6.4 1 1 1h5c.6 0 1-.4 1-1v-1c0-.3-.1-.6-.3-.8 1.1-.9 1.8-2.2 1.8-3.7C16.5 4 14.5 2 12 2zm-2 14h4v2c0 2.2-1.8 4-4 4h0v-2c1.1 0 2-.9 2-2v-2h-2z" />
        </svg>
      );
  }
}

// Large center suit symbol for the card face
function LargeSuitSymbol({ suit }: { suit: Suit }) {
  const color = SUIT_COLORS[suit];

  switch (suit) {
    case 'cerveny':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill={color} opacity="0.25">
          <path d="M24 42.7l-2.9-2.64C10.8 30.72 4 24.56 4 17c0-5.16 3.84-9 8-9 2.88 0 5.64 1.34 7.44 3.44l4.56 5.2 4.56-5.2C30.36 9.34 33.12 8 36 8c4.16 0 8 3.84 8 9 0 7.56-6.8 13.72-17.1 23.08L24 42.7z" />
        </svg>
      );
    case 'zeleny':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill={color} opacity="0.25">
          <path d="M34 16C16 20 11.8 32.34 7.64 42.68l3.78 1.32 1.9-4.6c.96.34 1.96.6 2.68.6C38 40 44 6 44 6c-2 4-16 4.5-26 6.5S4 23 4 27s3.5 7.5 3.5 7.5C14 16 34 16 34 16z" />
        </svg>
      );
    case 'kule':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill={color} opacity="0.25">
          <path d="M24 4c-6 0-10 5-10 11 0 4 1.6 7.2 4 9.6V40l6 4 6-4V24.6c2.4-2.4 4-5.6 4-9.6C34 9 30 4 24 4zm0 4c4 0 6 3.6 6 7S28 22 24 22s-6-3.6-6-7 2-7 6-7z" />
        </svg>
      );
    case 'zaludy':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill={color} opacity="0.25">
          <path d="M24 4c-5 0-9 4-9 9 0 3 1.4 5.6 3.6 7.4-.4.4-.6 1-.6 1.6v2c0 1.2.8 2 2 2h8c1.2 0 2-.8 2-2v-2c0-.6-.2-1.2-.6-1.6C31.6 18.6 33 16 33 13c0-5-4-9-9-9zm-4 28h8v4c0 4.4-3.6 8-8 8h0v-4c2.2 0 4-1.8 4-4v-4h-4z" />
        </svg>
      );
  }
}

// Rank display text (short form)
function rankText(rank: Rank): string {
  switch (rank) {
    case 'spodek': return 'Sp';
    case 'svrsek': return 'Sv';
    case 'kral': return 'Kr';
    case 'eso': return 'A';
    default: return rank;
  }
}

interface CardFaceProps {
  card: Card;
  width: number;
  height: number;
}

export function CardFace({ card, width, height }: CardFaceProps) {
  const color = SUIT_COLORS[card.suit];
  const rank = rankText(card.rank);
  const isSpecial = ['svrsek', 'kral', 'eso', '7'].includes(card.rank);

  return (
    <svg width={width} height={height} viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg">
      {/* Card background */}
      <rect
        x="0.5" y="0.5" width="119" height="167" rx="8"
        fill="#1a1a24"
        stroke={isSpecial ? color : 'rgba(255,255,255,0.1)'}
        strokeWidth={isSpecial ? '1.5' : '1'}
        opacity={isSpecial ? undefined : undefined}
      />

      {/* Subtle inner gradient */}
      <defs>
        <linearGradient id={`grad-${card.suit}-${card.rank}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="118" height="166" rx="7.5" fill={`url(#grad-${card.suit}-${card.rank})`} />

      {/* Top-left rank + suit */}
      <text
        x="10" y="24"
        fill={color}
        fontSize="16"
        fontWeight="700"
        fontFamily="var(--font-display), system-ui"
      >
        {rank}
      </text>
      <g transform="translate(7, 28)">
        <SuitSymbol suit={card.suit} size={14} />
      </g>

      {/* Bottom-right rank + suit (rotated) */}
      <g transform="translate(120, 168) rotate(180)">
        <text
          x="10" y="24"
          fill={color}
          fontSize="16"
          fontWeight="700"
          fontFamily="var(--font-display), system-ui"
        >
          {rank}
        </text>
        <g transform="translate(7, 28)">
          <SuitSymbol suit={card.suit} size={14} />
        </g>
      </g>

      {/* Center suit symbol */}
      <g transform="translate(36, 60)">
        <LargeSuitSymbol suit={card.suit} />
      </g>

      {/* Center rank text */}
      <text
        x="60" y="94"
        fill={color}
        fontSize="28"
        fontWeight="800"
        fontFamily="var(--font-display), system-ui"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {rank}
      </text>

      {/* Special card indicator glow */}
      {isSpecial && (
        <rect
          x="1" y="1" width="118" height="166" rx="7.5"
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.3"
        />
      )}
    </svg>
  );
}

export function CardBack({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 168" xmlns="http://www.w3.org/2000/svg">
      {/* Card background */}
      <rect x="0.5" y="0.5" width="119" height="167" rx="8" fill="#1a1a24" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Pattern background */}
      <defs>
        <pattern id="cardBackPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="none" />
          <circle cx="10" cy="10" r="1" fill="rgba(196,30,58,0.15)" />
          <circle cx="0" cy="0" r="1" fill="rgba(45,122,45,0.1)" />
          <circle cx="20" cy="0" r="1" fill="rgba(45,122,45,0.1)" />
          <circle cx="0" cy="20" r="1" fill="rgba(45,122,45,0.1)" />
          <circle cx="20" cy="20" r="1" fill="rgba(45,122,45,0.1)" />
        </pattern>
        <linearGradient id="cardBackGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(196,30,58,0.08)" />
          <stop offset="100%" stopColor="rgba(45,80,22,0.06)" />
        </linearGradient>
      </defs>

      {/* Inner border */}
      <rect x="6" y="6" width="108" height="156" rx="5" fill="url(#cardBackGrad)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

      {/* Dot pattern */}
      <rect x="6" y="6" width="108" height="156" rx="5" fill="url(#cardBackPattern)" />

      {/* Center branding */}
      <text
        x="60" y="80"
        fill="rgba(255,255,255,0.12)"
        fontSize="14"
        fontWeight="700"
        fontFamily="var(--font-display), system-ui"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Hry.cz
      </text>

      {/* Decorative suit icons */}
      <g transform="translate(48, 50)" opacity="0.08">
        <SuitSymbol suit="cerveny" size={10} />
      </g>
      <g transform="translate(62, 50)" opacity="0.08">
        <SuitSymbol suit="zeleny" size={10} />
      </g>
      <g transform="translate(48, 90)" opacity="0.08">
        <SuitSymbol suit="kule" size={10} />
      </g>
      <g transform="translate(62, 90)" opacity="0.08">
        <SuitSymbol suit="zaludy" size={10} />
      </g>
    </svg>
  );
}

// Export suit colors for use in other components
export { SUIT_COLORS, SuitSymbol };
