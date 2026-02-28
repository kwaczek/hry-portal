import type { RoomConfig, GamePhase, PrsiRuleVariant } from '@hry/shared';
import { ROOM_CODE_LENGTH, ROOM_CLEANUP_MINUTES } from '@hry/shared';

export interface RoomPlayer {
  id: string;
  username: string;
  isBot: boolean;
  isGuest: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface Room {
  code: string;
  config: RoomConfig;
  players: RoomPlayer[];
  phase: GamePhase;
  createdAt: number;
  finishedAt: number | null;
}

interface JoinResult {
  success: boolean;
  error?: string;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(
    hostId: string,
    hostUsername: string,
    config: Omit<RoomConfig, 'hostId'>
  ): string {
    const code = this.generateCode();
    const room: Room = {
      code,
      config: { ...config, hostId },
      players: [
        {
          id: hostId,
          username: hostUsername,
          isBot: false,
          isGuest: false,
          isReady: false,
          isConnected: true,
        },
      ],
      phase: 'waiting',
      createdAt: Date.now(),
      finishedAt: null,
    };
    this.rooms.set(code, room);
    return code;
  }

  joinRoom(code: string, playerId: string, username: string, isGuest = false): JoinResult {
    const room = this.rooms.get(code);
    if (!room) {
      return { success: false, error: 'Místnost neexistuje' };
    }

    if (room.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Už jsi v místnosti' };
    }

    if (room.players.length >= room.config.maxPlayers) {
      return { success: false, error: 'Místnost je plná' };
    }

    room.players.push({
      id: playerId,
      username,
      isBot: false,
      isGuest,
      isReady: false,
      isConnected: true,
    });

    return { success: true };
  }

  leaveRoom(code: string, playerId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return;
    }

    // Transfer host if host left
    if (room.config.hostId === playerId) {
      room.config.hostId = room.players[0].id;
    }
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  cleanupStaleRooms(): void {
    const now = Date.now();
    const cleanupMs = ROOM_CLEANUP_MINUTES * 60 * 1000;

    for (const [code, room] of this.rooms) {
      if (room.phase === 'finished' && room.finishedAt && now - room.finishedAt > cleanupMs) {
        this.rooms.delete(code);
      }
    }
  }

  deleteRoom(code: string): void {
    this.rooms.delete(code);
  }

  private generateCode(): string {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }
}
