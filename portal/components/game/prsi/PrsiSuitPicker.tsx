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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Picker */}
      <div className="relative bg-gray-900 border border-white/[0.08] rounded-2xl p-6 shadow-2xl animate-[fadeInUp_0.3s_ease-out] max-w-sm w-full">
        <h3 className="text-center text-lg font-bold font-[family-name:var(--font-display)] text-white mb-1">
          Vyber barvu
        </h3>
        <p className="text-center text-sm text-gray-400 mb-5">
          Svršek mění barvu hry
        </p>

        <div className="grid grid-cols-2 gap-3">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onPick(suit)}
              className="
                flex flex-col items-center gap-2 p-4 rounded-xl
                bg-white/[0.03] border border-white/[0.06]
                hover:bg-white/[0.08] hover:border-white/[0.12]
                transition-all duration-200 group cursor-pointer
                hover:scale-105 active:scale-95
              "
              style={{
                '--suit-color': SUIT_COLORS[suit],
              } as React.CSSProperties}
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                <SuitSymbol suit={suit} size={36} />
              </div>
              <span
                className="text-sm font-semibold transition-colors"
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
