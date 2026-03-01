'use client';

import type { Suit } from '@hry/shared';
import { SUIT_NAMES, SUITS } from '@hry/shared';
import { SuitSymbol, SUIT_COLORS } from './CardSvg';

interface PrsiSuitPickerProps {
  open: boolean;
  onPick: (suit: Suit) => void;
}

export function PrsiSuitPicker({ open, onPick }: PrsiSuitPickerProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-40 animate-[fadeInUp_0.2s_ease-out]">
      <div className="bg-bg-elevated/95 backdrop-blur-md border border-border-default rounded-xl p-4 shadow-2xl shadow-black/30">
        <p className="text-center text-xs font-semibold text-text-secondary mb-3 font-[family-name:var(--font-display)]">
          Vyber barvu
        </p>

        <div className="flex gap-2">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onPick(suit)}
              className="
                flex flex-col items-center gap-1.5 p-3 rounded-lg
                bg-bg-surface border border-border-subtle
                hover:bg-bg-hover hover:border-border-default
                transition-all duration-150 group cursor-pointer
                hover:scale-105 active:scale-95
              "
            >
              <SuitSymbol suit={suit} size={28} />
              <span
                className="text-[11px] font-semibold"
                style={{ color: SUIT_COLORS[suit] }}
              >
                {SUIT_NAMES[suit]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
