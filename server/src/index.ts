import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '@hry/shared';
import { authMiddleware, type AuthenticatedSocket } from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.PORTAL_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware — verifies Supabase JWT from handshake
io.use(authMiddleware);

io.on('connection', (socket) => {
  const authedSocket = socket as AuthenticatedSocket;
  const { userId, isGuest } = authedSocket.data;
  console.log(`Client connected: ${socket.id} (user: ${userId}, guest: ${isGuest})`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});
