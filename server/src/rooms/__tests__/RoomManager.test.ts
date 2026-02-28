import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { RoomManager } from '../RoomManager';
import type { RoomConfig } from '@hry/shared';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultConfig: Omit<RoomConfig, 'hostId'> = {
    maxPlayers: 2,
    ruleVariant: 'classic',
    isPrivate: false,
  };

  describe('createRoom', () => {
    test('returns a 6-character alphanumeric room code', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('creates a retrievable room', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      const room = manager.getRoom(code);
      expect(room).toBeDefined();
      expect(room!.config.hostId).toBe('host1');
      expect(room!.config.maxPlayers).toBe(2);
      expect(room!.config.ruleVariant).toBe('classic');
    });

    test('room starts with host as first player', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      const room = manager.getRoom(code);
      expect(room!.players).toHaveLength(1);
      expect(room!.players[0].id).toBe('host1');
      expect(room!.players[0].username).toBe('Alice');
    });

    test('generates unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const code = manager.createRoom(`host${i}`, `Player${i}`, defaultConfig);
        codes.add(code);
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('joinRoom', () => {
    test('adds player to existing room', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      const result = manager.joinRoom(code, 'p2', 'Bob');
      expect(result.success).toBe(true);

      const room = manager.getRoom(code);
      expect(room!.players).toHaveLength(2);
    });

    test('rejects join to non-existent room', () => {
      const result = manager.joinRoom('ZZZZZZ', 'p2', 'Bob');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects join when room is full', () => {
      const code = manager.createRoom('host1', 'Alice', { ...defaultConfig, maxPlayers: 2 });
      manager.joinRoom(code, 'p2', 'Bob');
      const result = manager.joinRoom(code, 'p3', 'Charlie');
      expect(result.success).toBe(false);
    });

    test('rejects duplicate player', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      const result = manager.joinRoom(code, 'host1', 'Alice');
      expect(result.success).toBe(false);
    });
  });

  describe('leaveRoom', () => {
    test('removes player from room', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      manager.joinRoom(code, 'p2', 'Bob');
      manager.leaveRoom(code, 'p2');

      const room = manager.getRoom(code);
      expect(room!.players).toHaveLength(1);
      expect(room!.players[0].id).toBe('host1');
    });

    test('deletes room when last player leaves', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      manager.leaveRoom(code, 'host1');

      expect(manager.getRoom(code)).toBeUndefined();
    });

    test('transfers host when host leaves and others remain', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      manager.joinRoom(code, 'p2', 'Bob');
      manager.leaveRoom(code, 'host1');

      const room = manager.getRoom(code);
      expect(room!.config.hostId).toBe('p2');
    });
  });

  describe('getRoom / listRooms', () => {
    test('getRoom returns undefined for non-existent code', () => {
      expect(manager.getRoom('NOPE00')).toBeUndefined();
    });

    test('listRooms returns all rooms', () => {
      manager.createRoom('h1', 'A', defaultConfig);
      manager.createRoom('h2', 'B', defaultConfig);
      manager.createRoom('h3', 'C', defaultConfig);

      const rooms = manager.listRooms();
      expect(rooms).toHaveLength(3);
    });

    test('listRooms returns empty array when no rooms', () => {
      expect(manager.listRooms()).toHaveLength(0);
    });
  });

  describe('cleanupStaleRooms', () => {
    test('removes rooms that finished more than 5 minutes ago', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      const room = manager.getRoom(code)!;
      room.phase = 'finished';
      room.finishedAt = Date.now();

      // Advance 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);
      manager.cleanupStaleRooms();

      expect(manager.getRoom(code)).toBeUndefined();
    });

    test('keeps rooms that finished less than 5 minutes ago', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);
      const room = manager.getRoom(code)!;
      room.phase = 'finished';
      room.finishedAt = Date.now();

      // Advance 3 minutes
      vi.advanceTimersByTime(3 * 60 * 1000);
      manager.cleanupStaleRooms();

      expect(manager.getRoom(code)).toBeDefined();
    });

    test('keeps active (non-finished) rooms', () => {
      const code = manager.createRoom('host1', 'Alice', defaultConfig);

      vi.advanceTimersByTime(30 * 60 * 1000);
      manager.cleanupStaleRooms();

      expect(manager.getRoom(code)).toBeDefined();
    });
  });
});
