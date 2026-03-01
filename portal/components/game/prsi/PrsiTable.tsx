'use client';

import type { PrsiGameState, PrsiPlayer } from '@hry/shared';
import { SUIT_NAMES } from '@hry/shared';
import { PrsiCard } from './PrsiCard';
import { SuitSymbol, SUIT_COLORS } from './CardSvg';
import { Avatar } from '@/components/ui/Avatar';

interface PrsiTableProps {
  gameState: PrsiGameState;
  myPlayerId: string;
  onDrawCard: () => void;
  isMyTurn: boolean;
}

function OpponentArea({ player, isCurrent }: { player: PrsiPlayer; isCurrent: boolean }) {
  return (
    <div className={`
      flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-300
      ${isCurrent ? 'bg-white/[0.04] ring-1 ring-red-500/30' : ''}
      ${!player.isConnected ? 'opacity-40' : ''}
    `}>
      <div className="flex items-center gap-2">
        <Avatar name={player.username} size="sm" />
        <div className="text-left">
          <p className={`text-xs font-medium truncate max-w-[80px] ${isCurrent ? 'text-red-400' : 'text-gray-300'}`}>
            {player.username}
          </p>
          <p className="text-[10px] text-gray-500">
            {player.cardCount} {player.cardCount === 1 ? 'karta' : player.cardCount < 5 ? 'karty' : 'karet'}
          </p>
        </div>
      </div>

      {/* Mini card backs representing their hand */}
      <div className="flex gap-0.5">
        {Array.from({ length: Math.min(player.cardCount, 8) }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-6 rounded-sm bg-gray-800 border border-white/[0.06]"
            style={{ marginLeft: i > 0 ? -4 : 0 }}
          />
        ))}
        {player.cardCount > 8 && (
          <span className="text-[9px] text-gray-500 ml-0.5">+{player.cardCount - 8}</span>
        )}
      </div>

      {isCurrent && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-400">Hraje</span>
        </div>
      )}
    </div>
  );
}

export function PrsiTable({ gameState, myPlayerId, onDrawCard, isMyTurn }: PrsiTableProps) {
  // Get opponents (everyone except me)
  const opponents = gameState.players.filter(p => p.id !== myPlayerId);

  return (
    <div className="relative flex flex-col items-center gap-4 py-4">
      {/* Opponents row */}
      <div className="flex justify-center gap-3 flex-wrap">
        {opponents.map(player => (
          <OpponentArea
            key={player.id}
            player={player}
            isCurrent={gameState.currentPlayerId === player.id}
          />
        ))}
      </div>

      {/* Table center — discard + draw piles */}
      <div className="relative flex items-center justify-center gap-6 py-4">
        {/* Draw pile */}
        <button
          onClick={isMyTurn ? onDrawCard : undefined}
          disabled={!isMyTurn}
          className={`
            relative group
            ${isMyTurn ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}
          `}
        >
          <PrsiCard faceUp={false} size="md" />
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
            Balíček ({gameState.drawPileCount})
          </div>
          {isMyTurn && (
            <div className="absolute inset-0 rounded-lg border border-white/[0.1] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Discard pile */}
        <div className="relative">
          {gameState.topCard ? (
            <PrsiCard card={gameState.topCard} faceUp size="md" />
          ) : (
            <div className="w-[80px] h-[112px] rounded-lg border-2 border-dashed border-white/[0.08] flex items-center justify-center">
              <span className="text-xs text-gray-600">Prázdné</span>
            </div>
          )}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
            Odhazovací
          </div>
        </div>
      </div>

      {/* Suit override indicator */}
      {gameState.suitOverride && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
          <SuitSymbol suit={gameState.suitOverride} size={16} />
          <span className="text-xs font-medium" style={{ color: SUIT_COLORS[gameState.suitOverride] }}>
            {SUIT_NAMES[gameState.suitOverride]}
          </span>
        </div>
      )}

      {/* Pending draw count */}
      {gameState.pendingDrawCount > 0 && (
        <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
          +{gameState.pendingDrawCount} karet k líznutí
        </div>
      )}

      {/* Pending skip (Eso) indicator */}
      {gameState.pendingSkipCount > 0 && (
        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400">
          Eso — zahraj Eso nebo budeš přeskočen!
        </div>
      )}

      {/* Turn timer */}
      {gameState.phase === 'playing' && gameState.turnTimeRemaining > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1 w-24 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(gameState.turnTimeRemaining / 30) * 100}%`,
                backgroundColor: gameState.turnTimeRemaining <= 10 ? '#ef4444' : gameState.turnTimeRemaining <= 20 ? '#f59e0b' : '#22c55e',
              }}
            />
          </div>
          <span className={`text-xs font-mono ${gameState.turnTimeRemaining <= 10 ? 'text-red-400' : 'text-gray-500'}`}>
            {gameState.turnTimeRemaining}s
          </span>
        </div>
      )}
    </div>
  );
}
