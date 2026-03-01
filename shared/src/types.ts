// === Card Types ===

export type Suit = 'cerveny' | 'zeleny' | 'kule' | 'zaludy';
export type Rank = '7' | '8' | '9' | '10' | 'spodek' | 'svrsek' | 'kral' | 'eso';

export interface Card {
  suit: Suit;
  rank: Rank;
}

// === Game Types ===

export type GamePhase = 'waiting' | 'playing' | 'finished';
export type PrsiRuleVariant = 'classic' | 'stacking';

export interface PrsiPlayer {
  id: string;
  username: string;
  displayName: string;
  isGuest: boolean;
  isBot: boolean;
  isReady: boolean;
  isConnected: boolean;
  cardCount: number;
  hand?: Card[]; // only visible to the player themselves
}

export interface PrsiGameState {
  phase: GamePhase;
  roomCode: string;
  players: PrsiPlayer[];
  currentPlayerId: string | null;
  topCard: Card | null;
  drawPileCount: number;
  suitOverride: Suit | null; // set when Svršek is played
  pendingDrawCount: number; // stacked 7s
  pendingSkipCount: number; // stacked Esos
  turnTimeRemaining: number;
  ruleVariant: PrsiRuleVariant;
  winnerId: string | null;
  placements: string[]; // player IDs in finishing order
}

export type PrsiAction =
  | { type: 'play'; card: Card; suitOverride?: Suit }
  | { type: 'draw' };

// === Room Types ===

export interface RoomConfig {
  maxPlayers: number;
  ruleVariant: PrsiRuleVariant;
  isPrivate: boolean;
  hostId: string;
}

// === Chat Types ===

export type ChatMessageType = 'text' | 'reaction' | 'system';

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

// === Socket Events ===

export interface ClientToServerEvents {
  'room:create': (config: Omit<RoomConfig, 'hostId'>) => void;
  'room:join': (roomCode: string) => void;
  'room:leave': () => void;
  'room:ready': () => void;
  'room:start': () => void;
  'game:action': (action: PrsiAction) => void;
  'chat:message': (text: string) => void;
  'chat:reaction': (emoji: string) => void;
  'matchmaking:join': (config: { maxPlayers: number; ruleVariant: PrsiRuleVariant }) => void;
  'matchmaking:leave': () => void;
}

export interface ServerToClientEvents {
  'room:state': (state: PrsiGameState) => void;
  'room:error': (message: string) => void;
  'room:created': (roomCode: string) => void;
  'room:playerJoined': (player: PrsiPlayer) => void;
  'room:playerLeft': (playerId: string) => void;
  'game:started': () => void;
  'game:ended': (results: GameResult) => void;
  'game:turnTimer': (secondsRemaining: number) => void;
  'chat:message': (message: ChatMessage) => void;
  'matchmaking:found': (roomCode: string) => void;
  'matchmaking:waiting': (playersInQueue: number) => void;
}

// === Results & Elo ===

export interface EloChange {
  playerId: string;
  oldElo: number;
  newElo: number;
  change: number;
}

export interface GameResult {
  gameType: string;
  roomId: string;
  players: {
    id: string;
    username: string;
    placement: number;
    isGuest: boolean;
  }[];
  ruleVariant: PrsiRuleVariant;
  durationSec: number;
  eloChanges: EloChange[];
}
