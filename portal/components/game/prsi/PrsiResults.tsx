'use client';

import type { GameResult } from '@hry/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

interface PrsiResultsProps {
  result: GameResult;
  myPlayerId: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

const placementLabels = ['1.', '2.', '3.', '4.'];
const placementColors = ['text-amber-400', 'text-text-secondary', 'text-amber-700', 'text-text-faint'];
const placementBg = ['bg-amber-400/10 border-amber-400/20', 'bg-bg-surface border-border-subtle', 'bg-amber-700/10 border-amber-700/20', 'bg-bg-surface/50 border-border-subtle'];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PrsiResults({ result, myPlayerId, onPlayAgain, onBackToLobby }: PrsiResultsProps) {
  const myPlacement = result.players.find(p => p.id === myPlayerId)?.placement;
  const isWinner = myPlacement === 1;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-[fadeInUp_0.5s_ease-out]">
      {/* Result header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">
          {isWinner ? (
            <span className="text-amber-400">Vítězství!</span>
          ) : (
            <span className="text-text-secondary">Konec hry</span>
          )}
        </h2>
        <p className="text-sm text-text-faint mt-1">
          Doba hry: {formatDuration(result.durationSec)}
        </p>
      </div>

      {/* Placements */}
      <div className="w-full max-w-sm space-y-2">
        {result.players
          .sort((a, b) => a.placement - b.placement)
          .map((player) => {
            const eloChange = result.eloChanges.find(e => e.playerId === player.id);
            const isMe = player.id === myPlayerId;
            const idx = player.placement - 1;

            return (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border
                  ${placementBg[idx] ?? placementBg[3]}
                  ${isMe ? 'ring-1 ring-amber-400/15' : ''}
                `}
              >
                <span className={`text-lg font-bold w-8 ${placementColors[idx] ?? placementColors[3]}`}>
                  {placementLabels[idx]}
                </span>

                <Avatar name={player.username} size="sm" />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {player.username}
                    {isMe && <span className="text-text-faint ml-1">(ty)</span>}
                  </p>
                  {player.isGuest && (
                    <p className="text-[10px] text-text-faint">Host</p>
                  )}
                </div>

                {eloChange && eloChange.change !== 0 && (
                  <span className={`text-sm font-mono font-medium ${eloChange.change > 0 ? 'text-felt-400' : 'text-card-red-400'}`}>
                    {eloChange.change > 0 ? '+' : ''}{eloChange.change}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button variant="primary" size="lg" className="flex-1" onClick={onPlayAgain}>
          Hrát znovu
        </Button>
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBackToLobby}>
          Zpět do lobby
        </Button>
      </div>
    </div>
  );
}
