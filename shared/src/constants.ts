import type { Suit, Rank, Card } from './types';

// === Suits ===

export const SUITS: Suit[] = ['cerveny', 'zeleny', 'kule', 'zaludy'];

export const SUIT_NAMES: Record<Suit, string> = {
  cerveny: 'Červený',
  zeleny: 'Zelený',
  kule: 'Kule',
  zaludy: 'Žaludy',
};

// === Ranks ===

export const RANKS: Rank[] = ['7', '8', '9', '10', 'spodek', 'svrsek', 'kral', 'eso'];

export const RANK_NAMES: Record<Rank, string> = {
  '7': 'Sedmička',
  '8': 'Osmička',
  '9': 'Devítka',
  '10': 'Desítka',
  spodek: 'Spodek',
  svrsek: 'Svršek',
  kral: 'Král',
  eso: 'Eso',
};

// === Full Czech 32-Card Deck ===

export const FULL_DECK: Card[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ suit, rank }))
);

// === Game Settings ===

export const ELO_K_FACTOR = 32;
export const TURN_TIMER_SECONDS = 30;
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const RECONNECT_GRACE_SECONDS = 60;
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CLEANUP_MINUTES = 5;

// === Chat Settings ===

export const CHAT_RATE_LIMIT_MS = 2000;
export const CHAT_MAX_LENGTH = 200;

export const QUICK_REACTIONS = ['👍', '😂', '😤', '🎉', '💀', '🃏'] as const;

// === Matchmaking ===

export const MATCHMAKING_TIMEOUT_SECONDS = 30;

// === Elo ===

export const ELO_MIN_GAMES_FOR_LEADERBOARD = 5;
export const ELO_DEFAULT_RATING = 1000;

// === Redis Key Prefixes ===

export const REDIS_PREFIX = 'hry:';
export const REDIS_MATCH_PREFIX = 'hry:match:';
export const REDIS_ROOMS_ACTIVE = 'hry:rooms:active';
