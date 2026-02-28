'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PrsiGameState,
  PrsiAction,
  GameResult,
  Card,
  Suit,
  ChatMessage,
} from '@hry/shared';
import { useAuth } from '@/hooks/useAuth';
import { PrsiTable } from './PrsiTable';
import { PrsiHand } from './PrsiHand';
import { PrsiSuitPicker } from './PrsiSuitPicker';
import { PrsiResults } from './PrsiResults';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

interface PrsiGameProps {
  roomCode: string;
}

export function PrsiGame({ roomCode }: PrsiGameProps) {
  const { session, user } = useAuth();
  const socketRef = useRef<GameSocket | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [gameState, setGameState] = useState<PrsiGameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Suit picker state
  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingSvrsekCard, setPendingSvrsekCard] = useState<Card | null>(null);

  const myPlayerId = user?.id ?? '';

  // Connect to game server
  useEffect(() => {
    if (!session?.access_token) return;

    const serverUrl = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';
    const socket: GameSocket = io(serverUrl, {
      auth: { token: session.access_token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('connected');
      setError(null);
      // Join the room
      socket.emit('room:join', roomCode);
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnectionState('error');
      setError(err.message);
    });

    socket.on('room:state', (state) => {
      setGameState(state);
    });

    socket.on('room:error', (message) => {
      setError(message);
      setTimeout(() => setError(null), 4000);
    });

    socket.on('game:ended', (result) => {
      setGameResult(result);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.access_token, roomCode]);

  // Game actions
  const playCard = useCallback((card: Card, suitOverride?: Suit) => {
    const action: PrsiAction = suitOverride
      ? { type: 'play', card, suitOverride }
      : { type: 'play', card };
    socketRef.current?.emit('game:action', action);
  }, []);

  const drawCard = useCallback(() => {
    socketRef.current?.emit('game:action', { type: 'draw' });
  }, []);

  const handleReady = useCallback(() => {
    socketRef.current?.emit('room:ready');
  }, []);

  const handleStart = useCallback(() => {
    socketRef.current?.emit('room:start');
  }, []);

  const handleLeave = useCallback(() => {
    socketRef.current?.emit('room:leave');
  }, []);

  const handleSuitPick = useCallback((card: Card) => {
    setPendingSvrsekCard(card);
    setSuitPickerOpen(true);
  }, []);

  const handleSuitSelected = useCallback((suit: Suit) => {
    if (pendingSvrsekCard) {
      playCard(pendingSvrsekCard, suit);
    }
    setSuitPickerOpen(false);
    setPendingSvrsekCard(null);
  }, [pendingSvrsekCard, playCard]);

  const handlePlayAgain = useCallback(() => {
    setGameResult(null);
    // Re-ready up in the same room
    socketRef.current?.emit('room:ready');
  }, []);

  const handleBackToLobby = useCallback(() => {
    handleLeave();
    window.location.href = '/prsi';
  }, [handleLeave]);

  // --- Render ---

  // Connection states
  if (connectionState === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm">Připojování k serveru...</p>
      </div>
    );
  }

  if (connectionState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <div className="text-red-400 text-lg font-semibold">Chyba připojení</div>
        <p className="text-gray-400 text-sm">{error ?? 'Nelze se připojit k hernímu serveru'}</p>
        <Button onClick={() => window.location.reload()}>Zkusit znovu</Button>
      </div>
    );
  }

  if (connectionState === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm">Odpojeno. Připojování...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm">Načítání herní místnosti...</p>
      </div>
    );
  }

  // Game result screen
  if (gameResult) {
    return (
      <div className="mx-auto max-w-lg px-4">
        <PrsiResults
          result={gameResult}
          myPlayerId={myPlayerId}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      </div>
    );
  }

  // Lobby (waiting phase)
  if (gameState.phase === 'waiting') {
    const isHost = gameState.players[0]?.id === myPlayerId;
    const myPlayer = gameState.players.find(p => p.id === myPlayerId);

    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)]">Herní místnost</h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <code className="text-lg font-mono text-red-400 bg-white/[0.06] px-3 py-1 rounded-lg tracking-wider">
              {gameState.roomCode}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(gameState.roomCode)}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Kopírovat kód"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="space-y-2 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Hráči ({gameState.players.length})
          </p>
          {gameState.players.map(player => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <Avatar name={player.username} size="sm" />
              <span className="flex-1 text-sm font-medium text-gray-200 truncate">
                {player.username}
                {player.id === myPlayerId && <span className="text-gray-500 ml-1">(ty)</span>}
              </span>
              {player.isBot && <Badge>Bot</Badge>}
              {player.isReady ? (
                <Badge variant="success">Připraven</Badge>
              ) : (
                <Badge>Čeká</Badge>
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant={myPlayer?.isReady ? 'secondary' : 'primary'}
            size="lg"
            onClick={handleReady}
          >
            {myPlayer?.isReady ? 'Zrušit připravenost' : 'Jsem připraven'}
          </Button>

          {isHost && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
            >
              Začít hru
            </Button>
          )}

          <Button variant="ghost" size="md" onClick={handleBackToLobby}>
            Opustit místnost
          </Button>
        </div>
      </div>
    );
  }

  // Playing phase
  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const myPlayerData = gameState.players.find(p => p.id === myPlayerId);
  const myHand = myPlayerData?.hand ?? [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Error toast */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 animate-[fadeInUp_0.3s_ease-out]">
          {error}
        </div>
      )}

      {/* Table area */}
      <div className="flex-1 flex items-center justify-center">
        <PrsiTable
          gameState={gameState}
          myPlayerId={myPlayerId}
          onDrawCard={drawCard}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* My hand */}
      <div className="sticky bottom-0 bg-gradient-to-t from-[#08080e] via-[#08080e] to-transparent pt-8 pb-4">
        <PrsiHand
          hand={myHand}
          gameState={gameState}
          isMyTurn={isMyTurn}
          onPlayCard={playCard}
          onDrawCard={drawCard}
          onSuitPick={handleSuitPick}
        />
      </div>

      {/* Suit picker overlay */}
      <PrsiSuitPicker
        open={suitPickerOpen}
        onPick={handleSuitSelected}
      />
    </div>
  );
}
