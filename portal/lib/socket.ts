'use client';

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@hry/shared';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';

/**
 * Create a new Socket.IO connection to the game server.
 * Each call returns a NEW socket — callers are responsible for disconnecting.
 */
export function createSocket(token: string): GameSocket {
  return io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
