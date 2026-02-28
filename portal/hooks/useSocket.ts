'use client';

import { useEffect, useRef, useState } from 'react';
import { createSocket, type GameSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

export function useSocket() {
  const { session } = useAuth();
  const socketRef = useRef<GameSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const socket = createSocket(session.access_token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionState('connected');
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnectionState('error');
      setConnectionError(err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.access_token]);

  return {
    socket: socketRef.current,
    connectionState,
    connectionError,
  };
}
