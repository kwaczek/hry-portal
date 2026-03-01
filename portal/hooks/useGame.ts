'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PrsiGameState, GameResult, Card, Suit, ChatMessage, PrsiAction } from '@hry/shared';
import type { GameSocket } from '@/lib/socket';

interface UseGameOptions {
  socket: GameSocket | null;
  roomCode: string;
}

const ACTION_DEBOUNCE_MS = 300;

export function useGame({ socket, roomCode }: UseGameOptions) {
  const router = useRouter();
  const [gameState, setGameState] = useState<PrsiGameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastActionTime = useRef(0);

  // Debounce guard for game actions
  function canAct(): boolean {
    const now = Date.now();
    if (now - lastActionTime.current < ACTION_DEBOUNCE_MS) return false;
    lastActionTime.current = now;
    return true;
  }

  // Wire up socket listeners
  useEffect(() => {
    if (!socket) return;

    // Join room once connected
    if (socket.connected) {
      socket.emit('room:join', roomCode);
    }
    const onConnect = () => socket.emit('room:join', roomCode);
    socket.on('connect', onConnect);

    const onState = (state: PrsiGameState) => setGameState(state);
    const onError = (message: string) => {
      // Room not found — redirect back to /prsi
      if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('nenalezena')) {
        router.push('/prsi');
        return;
      }
      setError(message);
      setTimeout(() => setError(null), 4000);
    };
    const onEnded = (result: GameResult) => setGameResult(result);
    const onChat = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };

    const onTurnTimer = (secondsRemaining: number) => {
      setGameState(prev => prev ? { ...prev, turnTimeRemaining: secondsRemaining } : prev);
    };

    socket.on('room:state', onState);
    socket.on('room:error', onError);
    socket.on('game:ended', onEnded);
    socket.on('chat:message', onChat);
    socket.on('game:turnTimer', onTurnTimer);

    return () => {
      socket.off('connect', onConnect);
      socket.off('room:state', onState);
      socket.off('room:error', onError);
      socket.off('game:ended', onEnded);
      socket.off('chat:message', onChat);
      socket.off('game:turnTimer', onTurnTimer);
    };
  }, [socket, roomCode, router]);

  // Actions with debounce
  const playCard = useCallback((card: Card, suitOverride?: Suit) => {
    if (!canAct()) return;
    const action: PrsiAction = suitOverride
      ? { type: 'play', card, suitOverride }
      : { type: 'play', card };
    socket?.emit('game:action', action);
  }, [socket]);

  const drawCard = useCallback(() => {
    if (!canAct()) return;
    socket?.emit('game:action', { type: 'draw' });
  }, [socket]);

  const ready = useCallback(() => {
    socket?.emit('room:ready');
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('room:start');
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket?.emit('room:leave');
  }, [socket]);

  const sendChat = useCallback((text: string) => {
    socket?.emit('chat:message', text);
  }, [socket]);

  const sendReaction = useCallback((emoji: string) => {
    socket?.emit('chat:reaction', emoji);
  }, [socket]);

  const clearResult = useCallback(() => {
    setGameResult(null);
  }, []);

  return {
    gameState,
    gameResult,
    chatMessages,
    error,
    actions: {
      playCard,
      drawCard,
      ready,
      startGame,
      leaveRoom,
      sendChat,
      sendReaction,
      clearResult,
    },
  };
}
