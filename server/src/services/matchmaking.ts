import {
  REDIS_MATCH_PREFIX,
  MATCHMAKING_TIMEOUT_SECONDS,
  MIN_PLAYERS,
} from '@hry/shared';
import type { PrsiRuleVariant } from '@hry/shared';
import { redis } from './redis.js';

interface QueueEntry {
  playerId: string;
  username: string;
  isGuest: boolean;
  socketId: string;
  joinedAt: number;
}

interface MatchConfig {
  maxPlayers: number;
  ruleVariant: PrsiRuleVariant;
}

// In-memory fallback when Redis is not configured
const localQueues = new Map<string, QueueEntry[]>();

function queueKey(config: MatchConfig): string {
  return `${REDIS_MATCH_PREFIX}${config.maxPlayers}:${config.ruleVariant}`;
}

export class MatchmakingService {
  async joinQueue(
    config: MatchConfig,
    entry: QueueEntry
  ): Promise<QueueEntry[] | null> {
    const key = queueKey(config);

    if (redis) {
      // Add to Redis list
      await redis.rpush(key, JSON.stringify(entry));
      await redis.expire(key, MATCHMAKING_TIMEOUT_SECONDS * 2);

      // Check if we have enough players
      const len = await redis.llen(key);
      if (len >= config.maxPlayers) {
        // Pop all needed players atomically
        const entries: QueueEntry[] = [];
        for (let i = 0; i < config.maxPlayers; i++) {
          const raw = await redis.lpop<string>(key);
          if (raw) {
            entries.push(typeof raw === 'string' ? JSON.parse(raw) : raw);
          }
        }
        return entries.length >= MIN_PLAYERS ? entries : null;
      }
    } else {
      // Local fallback
      if (!localQueues.has(key)) localQueues.set(key, []);
      const queue = localQueues.get(key)!;

      // Remove stale entries
      const now = Date.now();
      const fresh = queue.filter(e =>
        now - e.joinedAt < MATCHMAKING_TIMEOUT_SECONDS * 1000
      );
      fresh.push(entry);
      localQueues.set(key, fresh);

      if (fresh.length >= config.maxPlayers) {
        const matched = fresh.splice(0, config.maxPlayers);
        localQueues.set(key, fresh);
        return matched;
      }
    }

    return null;
  }

  async leaveQueue(
    config: MatchConfig,
    playerId: string
  ): Promise<void> {
    const key = queueKey(config);

    if (redis) {
      // Remove player from queue by scanning
      const all = await redis.lrange<string>(key, 0, -1);
      for (const raw of all) {
        const entry: QueueEntry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (entry.playerId === playerId) {
          await redis.lrem(key, 1, typeof raw === 'string' ? raw : JSON.stringify(raw));
          break;
        }
      }
    } else {
      const queue = localQueues.get(key);
      if (queue) {
        localQueues.set(key, queue.filter(e => e.playerId !== playerId));
      }
    }
  }

  async getQueueSize(config: MatchConfig): Promise<number> {
    const key = queueKey(config);

    if (redis) {
      return await redis.llen(key);
    }

    return localQueues.get(key)?.length ?? 0;
  }

  /**
   * Get timed-out entries (waiting longer than MATCHMAKING_TIMEOUT_SECONDS).
   * Returns entries that should be matched with bots.
   */
  async getTimedOutEntries(config: MatchConfig): Promise<QueueEntry[]> {
    const key = queueKey(config);
    const now = Date.now();
    const timeout = MATCHMAKING_TIMEOUT_SECONDS * 1000;
    const timedOut: QueueEntry[] = [];

    if (redis) {
      const all = await redis.lrange<string>(key, 0, -1);
      for (const raw of all) {
        const entry: QueueEntry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (now - entry.joinedAt > timeout) {
          timedOut.push(entry);
          await redis.lrem(key, 1, typeof raw === 'string' ? raw : JSON.stringify(raw));
        }
      }
    } else {
      const queue = localQueues.get(key);
      if (queue) {
        const remaining: QueueEntry[] = [];
        for (const entry of queue) {
          if (now - entry.joinedAt > timeout) {
            timedOut.push(entry);
          } else {
            remaining.push(entry);
          }
        }
        localQueues.set(key, remaining);
      }
    }

    return timedOut;
  }
}
