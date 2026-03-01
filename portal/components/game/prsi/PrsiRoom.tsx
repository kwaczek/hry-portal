'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Card, Suit } from '@hry/shared';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useGame } from '@/hooks/useGame';
import { PrsiTable } from './PrsiTable';
import { PrsiHand } from './PrsiHand';
import { PrsiSuitPicker } from './PrsiSuitPicker';
import { PrsiResults } from './PrsiResults';
import { PrsiLobby } from './PrsiLobby';
import { GameChat } from './GameChat';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

interface PrsiRoomProps {
  roomCode: string;
}

export function PrsiRoom({ roomCode }: PrsiRoomProps) {
  const router = useRouter();
  const { user, isGuest, session, loading: authLoading } = useAuth();
  const { socket, connectionState, connectionError, reconnect } = useSocket();
  const { gameState, gameResult, chatMessages, error, actions } = useGame({ socket, roomCode });

  const myPlayerId = user?.id ?? '';

  // Suit picker state
  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingSvrsekCard, setPendingSvrsekCard] = useState<Card | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const lastReadCount = useRef(0);

  const handleChatOpen = useCallback(() => {
    setChatOpen(true);
    lastReadCount.current = chatMessages.length;
  }, [chatMessages.length]);

  const handleChatClose = useCallback(() => {
    lastReadCount.current = chatMessages.length;
    setChatOpen(false);
  }, [chatMessages.length]);

  const unreadCount = chatMessages.length - lastReadCount.current;

  const handleSuitPick = useCallback((card: Card) => {
    setPendingSvrsekCard(card);
    setSuitPickerOpen(true);
  }, []);

  const handleSuitSelected = useCallback((suit: Suit) => {
    if (pendingSvrsekCard) {
      actions.playCard(pendingSvrsekCard, suit);
    }
    setSuitPickerOpen(false);
    setPendingSvrsekCard(null);
  }, [pendingSvrsekCard, actions]);

  const handlePlayAgain = useCallback(() => {
    actions.clearResult();
    actions.ready();
  }, [actions]);

  const handleBackToLobby = useCallback(() => {
    actions.leaveRoom();
    router.push('/prsi');
  }, [actions, router]);

  // --- Auth check ---
  if (!authLoading && !session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <div className="text-lg font-semibold">Pro hru je potřeba se přihlásit</div>
        <p className="text-gray-400 text-sm">Přihlas se nebo si vytvoř účet pro hraní.</p>
        <Button onClick={() => router.push('/prihlaseni')}>Přihlásit se</Button>
      </div>
    );
  }

  // --- Connection states ---

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
        <p className="text-gray-400 text-sm">{connectionError ?? 'Nelze se připojit k hernímu serveru'}</p>
        <Button onClick={reconnect}>Zkusit znovu</Button>
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

  // --- Game result screen ---
  if (gameResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <PrsiResults
          result={gameResult}
          myPlayerId={myPlayerId}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      </div>
    );
  }

  // --- Waiting / Lobby ---
  if (gameState.phase === 'waiting') {
    return (
      <PrsiLobby
        gameState={gameState}
        myPlayerId={myPlayerId}
        error={error}
        onReady={actions.ready}
        onStart={actions.startGame}
        onLeave={handleBackToLobby}
      />
    );
  }

  // --- Playing ---
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

      {/* Chat toggle */}
      <button
        onClick={chatOpen ? handleChatClose : handleChatOpen}
        className="fixed top-16 right-4 z-30 p-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer"
        title="Chat"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
        </svg>
        {unreadCount > 0 && !chatOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <GameChat
          messages={chatMessages}
          isGuest={isGuest}
          onSend={actions.sendChat}
          onReaction={actions.sendReaction}
          onClose={handleChatClose}
        />
      )}

      {/* Table area */}
      <div className="flex-1 flex items-center justify-center">
        <PrsiTable
          gameState={gameState}
          myPlayerId={myPlayerId}
          onDrawCard={actions.drawCard}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* My hand */}
      <div className="sticky bottom-0 bg-gradient-to-t from-[#08080e] via-[#08080e] to-transparent pt-8 pb-4">
        <PrsiHand
          hand={myHand}
          gameState={gameState}
          isMyTurn={isMyTurn}
          onPlayCard={actions.playCard}
          onDrawCard={actions.drawCard}
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
