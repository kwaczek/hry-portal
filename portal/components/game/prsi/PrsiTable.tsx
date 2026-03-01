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
      relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-300
      ${isCurrent ? 'bg-amber-400/[0.08] ring-2 ring-amber-400/40 shadow-[0_0_12px_rgba(212,160,74,0.15)]' : 'bg-bg-surface/60'}
      ${!player.isConnected ? 'opacity-40' : ''}
    `}>
      <div className="flex items-center gap-2">
        <div className={`relative ${isCurrent ? 'ring-2 ring-amber-400/50 rounded-full' : ''}`}>
          <Avatar name={player.username} size="sm" />
        </div>
        <div className="text-left">
          <p className={`text-xs font-semibold truncate max-w-[80px] ${isCurrent ? 'text-amber-300' : 'text-text-secondary'}`}>
            {player.username}
          </p>
          <p className="text-[10px] text-text-faint">
            {player.cardCount} {player.cardCount === 1 ? 'karta' : player.cardCount < 5 ? 'karty' : 'karet'}
          </p>
        </div>
      </div>

      {/* Mini card backs representing their hand */}
      <div className="flex gap-0.5">
        {Array.from({ length: Math.min(player.cardCount, 8) }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-6 rounded-sm bg-bg-elevated border border-border-subtle"
            style={{ marginLeft: i > 0 ? -4 : 0 }}
          />
        ))}
        {player.cardCount > 8 && (
          <span className="text-[9px] text-text-faint ml-0.5">+{player.cardCount - 8}</span>
        )}
      </div>

      {isCurrent && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-amber-300">Hraje</span>
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
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-text-faint whitespace-nowrap">
            Balíček ({gameState.drawPileCount})
          </div>
          {isMyTurn && (
            <div className="absolute inset-0 rounded-lg border border-amber-400/15 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Discard pile */}
        <div className="relative">
          {gameState.topCard ? (
            <PrsiCard card={gameState.topCard} faceUp size="md" />
          ) : (
            <div className="w-[80px] h-[112px] rounded-lg border-2 border-dashed border-border-default flex items-center justify-center">
              <span className="text-xs text-text-faint">Prázdné</span>
            </div>
          )}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-text-faint whitespace-nowrap">
            Odhazovací
          </div>
        </div>
      </div>

      {/* Suit override indicator */}
      {gameState.suitOverride && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface border border-border-default">
          <SuitSymbol suit={gameState.suitOverride} size={16} />
          <span className="text-xs font-medium" style={{ color: SUIT_COLORS[gameState.suitOverride] }}>
            {SUIT_NAMES[gameState.suitOverride]}
          </span>
        </div>
      )}

      {/* Pending draw count */}
      {gameState.pendingDrawCount > 0 && (
        <div className="px-3 py-1 rounded-full bg-card-red-500/10 border border-card-red-500/20 text-xs font-medium text-card-red-400">
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
      {gameState.phase === 'playing' && (
        <div className="flex items-center gap-3 w-full max-w-xs px-4">
          <div className="h-2.5 flex-1 rounded-full bg-bg-surface overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                gameState.turnTimeRemaining <= 5 ? 'animate-pulse' : ''
              }`}
              style={{
                width: `${(gameState.turnTimeRemaining / 30) * 100}%`,
                backgroundColor: gameState.turnTimeRemaining <= 10 ? '#c41e3a' : gameState.turnTimeRemaining <= 20 ? '#d4a04a' : '#2d8b50',
              }}
            />
          </div>
          <span className={`text-sm font-mono font-bold tabular-nums min-w-[3ch] text-right ${
            gameState.turnTimeRemaining <= 10 ? 'text-card-red-400' : gameState.turnTimeRemaining <= 20 ? 'text-amber-400' : 'text-text-muted'
          }`}>
            {gameState.turnTimeRemaining}s
          </span>
        </div>
      )}
    </div>
  );
}
