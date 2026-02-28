'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PrsiGameState, PrsiAction, GameResult, Card, Suit, ChatMessage } from '@hry/shared';
import type { GameSocket } from '@/lib/socket';

interface UseGameOptions {
  socket: GameSocket | null;
  roomCode: string;
}

export function useGame({ socket, roomCode }: UseGameOptions) {
  const [gameState, setGameState] = useState<PrsiGameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setError(message);
      setTimeout(() => setError(null), 4000);
    };
    const onEnded = (result: GameResult) => setGameResult(result);
    const onChat = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };

    socket.on('room:state', onState);
    socket.on('room:error', onError);
    socket.on('game:ended', onEnded);
    socket.on('chat:message', onChat);

    return () => {
      socket.off('connect', onConnect);
      socket.off('room:state', onState);
      socket.off('room:error', onError);
      socket.off('game:ended', onEnded);
      socket.off('chat:message', onChat);
    };
  }, [socket, roomCode]);

  // Actions
  const playCard = useCallback((card: Card, suitOverride?: Suit) => {
    const action: PrsiAction = suitOverride
      ? { type: 'play', card, suitOverride }
      : { type: 'play', card };
    socket?.emit('game:action', action);
  }, [socket]);

  const drawCard = useCallback(() => {
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
