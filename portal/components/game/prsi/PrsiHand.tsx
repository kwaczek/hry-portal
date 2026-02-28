'use client';

import { useState, useCallback } from 'react';
import type { Card, PrsiGameState, Suit } from '@hry/shared';
import { PrsiCard } from './PrsiCard';

interface PrsiHandProps {
  hand: Card[];
  gameState: PrsiGameState;
  isMyTurn: boolean;
  onPlayCard: (card: Card, suitOverride?: Suit) => void;
  onDrawCard: () => void;
  onSuitPick: (card: Card) => void;
}

function canPlayCard(card: Card, state: PrsiGameState): boolean {
  if (state.phase !== 'playing') return false;

  // Svršek can always be played
  if (card.rank === 'svrsek') return true;

  // If there's a pending draw count (stacked 7s), only 7 can be played
  if (state.pendingDrawCount > 0) {
    return card.rank === '7';
  }

  // If there's a suit override, must match that suit (or play svrsek)
  if (state.suitOverride) {
    return card.suit === state.suitOverride;
  }

  // Match suit or rank of top card
  if (!state.topCard) return true;
  return card.suit === state.topCard.suit || card.rank === state.topCard.rank;
}

export function PrsiHand({ hand, gameState, isMyTurn, onPlayCard, onDrawCard, onSuitPick }: PrsiHandProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleCardClick = useCallback((card: Card, index: number) => {
    if (!isMyTurn) return;

    if (!canPlayCard(card, gameState)) return;

    if (selectedIndex === index) {
      // Double-tap: play the card
      if (card.rank === 'svrsek') {
        // Need suit picker
        onSuitPick(card);
      } else {
        onPlayCard(card);
      }
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  }, [isMyTurn, gameState, selectedIndex, onPlayCard, onSuitPick]);

  // Calculate card overlap for responsive hand layout
  const cardWidth = 80; // md size
  const maxWidth = Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 32 : 600);
  const totalCardsWidth = hand.length * cardWidth;
  const overlap = totalCardsWidth > maxWidth
    ? Math.max(20, cardWidth - (maxWidth - cardWidth) / (hand.length - 1 || 1))
    : 0;

  return (
    <div className="w-full">
      {/* Hand label */}
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Tvoje karty ({hand.length})
        </span>
        {isMyTurn && (
          <span className="text-xs font-medium text-red-400 animate-pulse">
            Tvůj tah!
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex justify-center items-end pb-2 px-2">
        <div className="flex items-end" style={{ gap: overlap > 0 ? undefined : '4px' }}>
          {hand.map((card, i) => {
            const playable = isMyTurn && canPlayCard(card, gameState);
            return (
              <div
                key={`${card.suit}-${card.rank}-${i}`}
                style={overlap > 0 ? { marginLeft: i === 0 ? 0 : -overlap } : undefined}
                className="transition-all duration-200"
              >
                <PrsiCard
                  card={card}
                  faceUp
                  selected={selectedIndex === i}
                  playable={playable}
                  size="md"
                  onClick={() => handleCardClick(card, i)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Draw button */}
      {isMyTurn && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => { onDrawCard(); setSelectedIndex(null); }}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-white/[0.06] border border-white/[0.08]
              text-gray-300 hover:text-white hover:bg-white/[0.1]
              transition-all duration-200 cursor-pointer
            "
          >
            {gameState.pendingDrawCount > 0
              ? `Líznout ${gameState.pendingDrawCount} karet`
              : 'Líznout kartu'}
          </button>
        </div>
      )}
    </div>
  );
}
