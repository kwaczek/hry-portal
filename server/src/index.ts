import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '@hry/shared';
import { ROOM_CLEANUP_MINUTES } from '@hry/shared';
import { authMiddleware, type AuthenticatedSocket } from './middleware/auth.js';
import { RoomManager } from './rooms/RoomManager.js';
import { PrsiRoom } from './rooms/prsi/PrsiRoom.js';
import { MatchmakingService } from './services/matchmaking.js';
import { ActiveRoomsService } from './services/activeRooms.js';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.PORTAL_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

// === Services ===

const roomManager = new RoomManager();
const matchmaking = new MatchmakingService();
const activeRooms = new ActiveRoomsService();

// PrsiRoom instances keyed by room code
const prsiRooms = new Map<string, PrsiRoom>();

// Track which room each socket is in: socketId → roomCode
const socketRoomMap = new Map<string, string>();

// Track matchmaking state: socketId → config
const socketMatchmakingMap = new Map<string, { maxPlayers: number; ruleVariant: 'classic' | 'stacking' }>();

// === Health Check ===

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rooms: roomManager.listRooms().length,
  });
});

// === Auth Middleware ===

io.use(authMiddleware);

// === Helpers ===

function getOrCreatePrsiRoom(roomCode: string): PrsiRoom | null {
  let prsiRoom = prsiRooms.get(roomCode);
  if (prsiRoom) return prsiRoom;

  const room = roomManager.getRoom(roomCode);
  if (!room) return null;

  prsiRoom = new PrsiRoom(io, room, roomManager);
  prsiRooms.set(roomCode, prsiRoom);
  return prsiRoom;
}

async function publishRoomState(roomCode: string): Promise<void> {
  const room = roomManager.getRoom(roomCode);
  if (!room) {
    await activeRooms.removeRoom(roomCode);
    return;
  }
  await activeRooms.publishRoom({
    code: room.code,
    playerCount: room.players.filter(p => !p.isBot).length,
    maxPlayers: room.config.maxPlayers,
    ruleVariant: room.config.ruleVariant,
    phase: room.phase,
  });
}

function cleanupRoom(roomCode: string): void {
  const prsiRoom = prsiRooms.get(roomCode);
  if (prsiRoom) {
    prsiRoom.cleanup();
    prsiRooms.delete(roomCode);
  }
  roomManager.deleteRoom(roomCode);
  activeRooms.removeRoom(roomCode);
}

// === Socket.IO Connection Handler ===

io.on('connection', (socket) => {
  const authedSocket = socket as AuthenticatedSocket;
  const { userId, isGuest } = authedSocket.data;
  const username = `Hráč_${userId.slice(0, 6)}`;

  console.log(`Client connected: ${socket.id} (user: ${userId}, guest: ${isGuest})`);

  // --- Room: Create ---
  socket.on('room:create', async (config) => {
    const code = roomManager.createRoom(userId, username, config);
    const prsiRoom = getOrCreatePrsiRoom(code);
    if (!prsiRoom) return;

    prsiRoom.registerSocket(userId, socket.id);
    socket.join(code);
    socketRoomMap.set(socket.id, code);

    socket.emit('room:created', code);
    prsiRoom.broadcastState();
    await publishRoomState(code);
  });

  // --- Room: Join ---
  socket.on('room:join', async (roomCode) => {
    // Check if reconnecting to an existing room
    const existingRoom = roomManager.getRoom(roomCode);
    if (existingRoom) {
      const existingPlayer = existingRoom.players.find(p => p.id === userId);
      if (existingPlayer && !existingPlayer.isConnected) {
        const prsiRoom = getOrCreatePrsiRoom(roomCode);
        if (prsiRoom) {
          prsiRoom.handleReconnect(userId, socket.id);
          socket.join(roomCode);
          socketRoomMap.set(socket.id, roomCode);
          await publishRoomState(roomCode);
          return;
        }
      }
    }

    const result = roomManager.joinRoom(roomCode, userId, username, isGuest);
    if (!result.success) {
      socket.emit('room:error', result.error ?? 'Nelze se připojit');
      return;
    }

    const prsiRoom = getOrCreatePrsiRoom(roomCode);
    if (!prsiRoom) return;

    prsiRoom.registerSocket(userId, socket.id);
    socket.join(roomCode);
    socketRoomMap.set(socket.id, roomCode);

    prsiRoom.broadcastState();
    await publishRoomState(roomCode);
  });

  // --- Room: Leave ---
  socket.on('room:leave', async () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const prsiRoom = prsiRooms.get(roomCode);
    if (prsiRoom) {
      prsiRoom.handleDisconnect(userId);
    }

    roomManager.leaveRoom(roomCode, userId);
    socket.leave(roomCode);
    socketRoomMap.delete(socket.id);

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      cleanupRoom(roomCode);
    } else {
      prsiRoom?.broadcastState();
      await publishRoomState(roomCode);
    }
  });

  // --- Room: Ready Toggle ---
  socket.on('room:ready', () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const prsiRoom = prsiRooms.get(roomCode);
    prsiRoom?.handleReady(userId);
  });

  // --- Room: Start Game ---
  socket.on('room:start', async () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const prsiRoom = prsiRooms.get(roomCode);
    prsiRoom?.handleStart(userId);
    await publishRoomState(roomCode);
  });

  // --- Game: Action (play/draw) ---
  socket.on('game:action', (action) => {
    const roomCode = socketRoomMap.get(socket.id);
    if (!roomCode) return;

    const prsiRoom = prsiRooms.get(roomCode);
    prsiRoom?.handleAction(userId, action);
  });

  // --- Matchmaking: Join Queue ---
  socket.on('matchmaking:join', async (config) => {
    socketMatchmakingMap.set(socket.id, config);

    const matched = await matchmaking.joinQueue(
      { maxPlayers: config.maxPlayers, ruleVariant: config.ruleVariant },
      {
        playerId: userId,
        username,
        isGuest,
        socketId: socket.id,
        joinedAt: Date.now(),
      }
    );

    if (matched) {
      // Create room for matched players
      const hostEntry = matched[0];
      const code = roomManager.createRoom(
        hostEntry.playerId,
        hostEntry.username,
        { maxPlayers: config.maxPlayers, ruleVariant: config.ruleVariant, isPrivate: false }
      );

      // Add remaining players
      for (let i = 1; i < matched.length; i++) {
        roomManager.joinRoom(code, matched[i].playerId, matched[i].username, matched[i].isGuest);
      }

      const prsiRoom = getOrCreatePrsiRoom(code);
      if (!prsiRoom) return;

      // Register all matched players' sockets and notify
      for (const entry of matched) {
        const matchSocket = io.sockets.sockets.get(entry.socketId);
        if (matchSocket) {
          prsiRoom.registerSocket(entry.playerId, entry.socketId);
          matchSocket.join(code);
          socketRoomMap.set(entry.socketId, code);
          socketMatchmakingMap.delete(entry.socketId);
          matchSocket.emit('matchmaking:found', code);
        }
      }

      prsiRoom.broadcastState();
      await publishRoomState(code);
    } else {
      const queueSize = await matchmaking.getQueueSize({
        maxPlayers: config.maxPlayers,
        ruleVariant: config.ruleVariant,
      });
      socket.emit('matchmaking:waiting', queueSize);
    }
  });

  // --- Matchmaking: Leave Queue ---
  socket.on('matchmaking:leave', async () => {
    const config = socketMatchmakingMap.get(socket.id);
    if (!config) return;

    await matchmaking.leaveQueue(
      { maxPlayers: config.maxPlayers, ruleVariant: config.ruleVariant },
      userId
    );
    socketMatchmakingMap.delete(socket.id);
  });

  // --- Disconnect ---
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Handle room disconnect
    const roomCode = socketRoomMap.get(socket.id);
    if (roomCode) {
      const prsiRoom = prsiRooms.get(roomCode);
      if (prsiRoom) {
        prsiRoom.handleDisconnect(userId);
      }
      socketRoomMap.delete(socket.id);

      const room = roomManager.getRoom(roomCode);
      if (room) {
        await publishRoomState(roomCode);
      }
    }

    // Handle matchmaking disconnect
    const config = socketMatchmakingMap.get(socket.id);
    if (config) {
      await matchmaking.leaveQueue(
        { maxPlayers: config.maxPlayers, ruleVariant: config.ruleVariant },
        userId
      );
      socketMatchmakingMap.delete(socket.id);
    }
  });
});

// === Periodic Cleanup ===

setInterval(() => {
  const before = roomManager.listRooms().length;
  roomManager.cleanupStaleRooms();
  const after = roomManager.listRooms().length;

  if (before !== after) {
    console.log(`Cleaned up ${before - after} stale room(s)`);

    for (const [code] of prsiRooms) {
      if (!roomManager.getRoom(code)) {
        prsiRooms.get(code)?.cleanup();
        prsiRooms.delete(code);
        activeRooms.removeRoom(code);
      }
    }
  }
}, ROOM_CLEANUP_MINUTES * 60 * 1000);

// === Matchmaking Timeout Check ===

setInterval(async () => {
  const configs = [
    { maxPlayers: 2, ruleVariant: 'classic' as const },
    { maxPlayers: 2, ruleVariant: 'stacking' as const },
    { maxPlayers: 4, ruleVariant: 'classic' as const },
    { maxPlayers: 4, ruleVariant: 'stacking' as const },
  ];

  for (const config of configs) {
    const timedOut = await matchmaking.getTimedOutEntries(config);

    for (const entry of timedOut) {
      const code = roomManager.createRoom(
        entry.playerId,
        entry.username,
        { maxPlayers: config.maxPlayers, ruleVariant: config.ruleVariant, isPrivate: false }
      );

      const prsiRoom = getOrCreatePrsiRoom(code);
      if (!prsiRoom) continue;

      const matchSocket = io.sockets.sockets.get(entry.socketId);
      if (matchSocket) {
        prsiRoom.registerSocket(entry.playerId, entry.socketId);
        matchSocket.join(code);
        socketRoomMap.set(entry.socketId, code);
        socketMatchmakingMap.delete(entry.socketId);
        matchSocket.emit('matchmaking:found', code);
      }

      prsiRoom.broadcastState();
      await publishRoomState(code);
    }
  }
}, 10_000);

// === Start Server ===

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});
