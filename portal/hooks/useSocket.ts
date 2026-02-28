'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createSocket, type GameSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';

export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

export function useSocket() {
  const { session } = useAuth();
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!session?.access_token) return;

    const s = createSocket(session.access_token);
    setSocket(s);
    reconnectAttempts.current = 0;

    s.on('connect', () => {
      setConnectionState('connected');
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    s.on('disconnect', (reason) => {
      setConnectionState('disconnected');
      if (reason === 'io server disconnect') {
        s.connect();
      }
    });

    s.on('connect_error', (err) => {
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionState('error');
        setConnectionError(err.message);
      } else {
        setConnectionState('disconnected');
      }
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [session?.access_token]);

  const reconnect = useCallback(() => {
    if (socket) {
      reconnectAttempts.current = 0;
      setConnectionState('connecting');
      setConnectionError(null);
      socket.connect();
    }
  }, [socket]);

  return {
    socket,
    connectionState,
    connectionError,
    reconnect,
  };
}
