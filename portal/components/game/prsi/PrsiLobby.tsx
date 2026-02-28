'use client';

import type { PrsiGameState } from '@hry/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PrsiLobbyProps {
  gameState: PrsiGameState;
  myPlayerId: string;
  error: string | null;
  onReady: () => void;
  onStart: () => void;
  onLeave: () => void;
}

export function PrsiLobby({ gameState, myPlayerId, error, onReady, onStart, onLeave }: PrsiLobbyProps) {
  const isHost = gameState.players[0]?.id === myPlayerId;
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 animate-[fadeInUp_0.4s_ease-out]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">Herní místnost</h2>
        <div className="mt-2 flex items-center justify-center gap-2">
          <code className="text-lg font-mono text-red-400 bg-white/[0.06] px-3 py-1 rounded-lg tracking-wider">
            {gameState.roomCode}
          </code>
          <button
            onClick={() => {
              const url = `${window.location.origin}/prsi/${gameState.roomCode}`;
              navigator.clipboard.writeText(url);
            }}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Kopírovat odkaz"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Sdílej odkaz přátelům pro připojení
        </p>
      </div>

      {/* Player list */}
      <div className="space-y-2 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          Hráči ({gameState.players.length})
        </p>
        {gameState.players.map((player, idx) => (
          <div
            key={player.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <Avatar name={player.username} size="sm" />
            <span className="flex-1 text-sm font-medium text-gray-200 truncate">
              {player.username}
              {player.id === myPlayerId && <span className="text-gray-500 ml-1">(ty)</span>}
            </span>
            {idx === 0 && <Badge variant="info">Host</Badge>}
            {player.isBot && <Badge>Bot</Badge>}
            {player.isReady ? (
              <Badge variant="success">Připraven</Badge>
            ) : (
              <Badge>Čeká</Badge>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - gameState.players.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/[0.06]"
          >
            <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-dashed border-white/[0.08]" />
            <span className="text-sm text-gray-600">Čeká na hráče...</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant={myPlayer?.isReady ? 'secondary' : 'primary'}
          size="lg"
          onClick={onReady}
        >
          {myPlayer?.isReady ? 'Zrušit připravenost' : 'Jsem připraven'}
        </Button>

        {isHost && (
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
          >
            Začít hru
          </Button>
        )}

        <Button variant="ghost" size="md" onClick={onLeave}>
          Opustit místnost
        </Button>
      </div>
    </div>
  );
}
