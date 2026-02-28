import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PrsiAction,
  PrsiGameState,
  Suit,
  GameResult,
} from '@hry/shared';
import { MIN_PLAYERS, TURN_TIMER_SECONDS, RECONNECT_GRACE_SECONDS } from '@hry/shared';
import { PrsiEngine } from './PrsiEngine.js';
import { PrsiBot } from './PrsiBot.js';
import type { Room, RoomPlayer } from '../RoomManager.js';
import type { RoomManager } from '../RoomManager.js';
import { saveGameResult } from '../../services/gameResults.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface DisconnectTimer {
  playerId: string;
  timeout: ReturnType<typeof setTimeout>;
}

export class PrsiRoom {
  private engine: PrsiEngine | null = null;
  private bot = new PrsiBot();
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private turnInterval: ReturnType<typeof setInterval> | null = null;
  private turnTimeRemaining = TURN_TIMER_SECONDS;
  private disconnectTimers = new Map<string, DisconnectTimer>();
  private socketMap = new Map<string, string>(); // playerId → socketId
  private startedAt: number | null = null;

  constructor(
    private io: GameServer,
    private room: Room,
    private roomManager: RoomManager
  ) {}

  get code(): string {
    return this.room.code;
  }

  // === Player Management ===

  registerSocket(playerId: string, socketId: string): void {
    this.socketMap.set(playerId, socketId);
  }

  unregisterSocket(playerId: string): void {
    this.socketMap.delete(playerId);
  }

  handleReady(playerId: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;
    player.isReady = !player.isReady;
    this.broadcastState();
  }

  handleStart(playerId: string): void {
    if (playerId !== this.room.config.hostId) return;
    if (this.room.phase !== 'waiting') return;

    const humanCount = this.room.players.filter(p => !p.isBot).length;
    if (humanCount < 1) return;

    // Fill remaining slots with bots
    while (this.room.players.length < MIN_PLAYERS) {
      this.addBot();
    }

    this.startGame();
  }

  handleDisconnect(playerId: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;

    player.isConnected = false;
    this.unregisterSocket(playerId);

    if (this.room.phase === 'playing') {
      // Start reconnection grace period
      const timeout = setTimeout(() => {
        this.replaceWithBot(playerId);
      }, RECONNECT_GRACE_SECONDS * 1000);

      this.disconnectTimers.set(playerId, { playerId, timeout });
      this.broadcastState();
    } else {
      // In lobby, just remove the player
      this.roomManager.leaveRoom(this.code, playerId);
      this.broadcastState();
    }
  }

  handleReconnect(playerId: string, socketId: string): void {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer.timeout);
      this.disconnectTimers.delete(playerId);
    }

    const player = this.room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = true;
      this.registerSocket(playerId, socketId);
    }

    this.broadcastState();
  }

  // === Game Actions ===

  handleAction(playerId: string, action: PrsiAction): void {
    if (!this.engine || this.room.phase !== 'playing') return;

    let result;
    if (action.type === 'play') {
      result = this.engine.playCard(playerId, action.card, action.suitOverride);
    } else {
      result = this.engine.drawCard(playerId);
    }

    if (!result.success) {
      const socketId = this.socketMap.get(playerId);
      if (socketId) {
        this.io.to(socketId).emit('room:error', result.error ?? 'Neplatný tah');
      }
      return;
    }

    this.broadcastState();

    const state = this.engine.getState();

    if (state.phase === 'finished') {
      this.endGame();
      return;
    }

    // Reset turn timer
    this.resetTurnTimer();

    // Check if current player is a bot
    this.processBotTurn();
  }

  // === Turn Timer ===

  private resetTurnTimer(): void {
    this.clearTurnTimer();
    this.turnTimeRemaining = TURN_TIMER_SECONDS;

    this.turnInterval = setInterval(() => {
      this.turnTimeRemaining--;
      this.io.to(this.code).emit('game:turnTimer', this.turnTimeRemaining);

      if (this.turnTimeRemaining <= 0) {
        this.handleTimerExpired();
      }
    }, 1000);
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.turnInterval) {
      clearInterval(this.turnInterval);
      this.turnInterval = null;
    }
  }

  private handleTimerExpired(): void {
    if (!this.engine) return;

    const state = this.engine.getState();
    if (!state.currentPlayerId || state.phase !== 'playing') return;

    // Auto-draw for the timed-out player
    this.engine.drawCard(state.currentPlayerId);
    this.broadcastState();

    if (this.engine.getState().phase === 'finished') {
      this.endGame();
      return;
    }

    this.resetTurnTimer();
    this.processBotTurn();
  }

  // === Bot Logic ===

  private addBot(): void {
    const botId = `bot_${this.room.players.length + 1}`;
    const botNames = ['Karel Bot', 'Jana Bot', 'Petr Bot', 'Eva Bot'];
    const name = botNames[this.room.players.length - 1] ?? `Bot ${this.room.players.length}`;

    this.room.players.push({
      id: botId,
      username: name,
      isBot: true,
      isGuest: false,
      isReady: true,
      isConnected: true,
    });
  }

  private processBotTurn(): void {
    if (!this.engine) return;

    const state = this.engine.getState();
    if (state.phase !== 'playing' || !state.currentPlayerId) return;

    const currentPlayer = this.room.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer?.isBot) return;

    // Small delay to make it feel natural
    setTimeout(() => {
      if (!this.engine) return;
      const botState = this.engine.getState();
      if (botState.currentPlayerId !== currentPlayer.id) return;

      const view = this.engine.getPlayerView(currentPlayer.id);
      const action = this.bot.chooseAction(botState, view.hand);
      this.handleAction(currentPlayer.id, action);
    }, 800 + Math.random() * 700);
  }

  private replaceWithBot(playerId: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;

    player.isBot = true;
    player.username = `${player.username} (Bot)`;
    this.disconnectTimers.delete(playerId);

    this.broadcastState();
    this.processBotTurn();
  }

  // === Game Lifecycle ===

  private startGame(): void {
    this.engine = new PrsiEngine(this.room.config.ruleVariant);

    for (const player of this.room.players) {
      this.engine.addPlayer(player.id, player.username, player.isBot, player.isGuest);
    }

    this.engine.startGame();
    this.room.phase = 'playing';
    this.startedAt = Date.now();

    this.io.to(this.code).emit('game:started');
    this.broadcastState();
    this.resetTurnTimer();
    this.processBotTurn();
  }

  private async endGame(): Promise<void> {
    this.clearTurnTimer();
    this.room.phase = 'finished';
    this.room.finishedAt = Date.now();

    const state = this.engine!.getState();
    const durationSec = this.startedAt
      ? Math.round((Date.now() - this.startedAt) / 1000)
      : 0;

    const result: GameResult = {
      gameType: 'prsi',
      roomId: this.code,
      players: state.placements.map((id, idx) => {
        const player = this.room.players.find(p => p.id === id);
        return {
          id,
          username: player?.username ?? 'Unknown',
          placement: idx + 1,
          isGuest: player?.isGuest ?? true,
        };
      }),
      ruleVariant: this.room.config.ruleVariant,
      durationSec,
      eloChanges: [],
    };

    // Save to Supabase and compute Elo (non-blocking — don't break game end if DB fails)
    try {
      const eloChanges = await saveGameResult(result);
      result.eloChanges = eloChanges;
    } catch (err) {
      console.error('Failed to save game result:', err);
    }

    this.io.to(this.code).emit('game:ended', result);
    this.broadcastState();

    // Clear disconnect timers
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer.timeout);
    }
    this.disconnectTimers.clear();
  }

  // === State Broadcasting ===

  broadcastState(): void {
    if (!this.engine && this.room.phase === 'waiting') {
      // Lobby state — build a minimal PrsiGameState
      const lobbyState: PrsiGameState = {
        phase: 'waiting',
        roomCode: this.code,
        players: this.room.players.map(p => ({
          id: p.id,
          username: p.username,
          displayName: p.username,
          isGuest: p.isGuest,
          isBot: p.isBot,
          isReady: p.isReady,
          isConnected: p.isConnected,
          cardCount: 0,
        })),
        currentPlayerId: null,
        topCard: null,
        drawPileCount: 0,
        suitOverride: null,
        pendingDrawCount: 0,
        turnTimeRemaining: 0,
        ruleVariant: this.room.config.ruleVariant,
        winnerId: null,
        placements: [],
      };

      // Send to all sockets in the room
      for (const [playerId, socketId] of this.socketMap) {
        this.io.to(socketId).emit('room:state', lobbyState);
      }
      return;
    }

    if (!this.engine) return;

    // Send per-player views (each player sees their own hand)
    for (const [playerId, socketId] of this.socketMap) {
      const view = this.engine.getPlayerView(playerId);
      const state: PrsiGameState = {
        ...view,
        roomCode: this.code,
        turnTimeRemaining: this.turnTimeRemaining,
      };
      this.io.to(socketId).emit('room:state', state);
    }
  }

  cleanup(): void {
    this.clearTurnTimer();
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer.timeout);
    }
    this.disconnectTimers.clear();
  }
}
