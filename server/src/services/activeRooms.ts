import { REDIS_ROOMS_ACTIVE } from '@hry/shared';
import type { PrsiRuleVariant } from '@hry/shared';
import { redis } from './redis.js';

interface ActiveRoomInfo {
  code: string;
  playerCount: number;
  maxPlayers: number;
  ruleVariant: PrsiRuleVariant;
  phase: string;
}

// In-memory fallback when Redis is not configured
const localActiveRooms = new Map<string, ActiveRoomInfo>();

export class ActiveRoomsService {
  async publishRoom(info: ActiveRoomInfo): Promise<void> {
    if (redis) {
      await redis.hset(REDIS_ROOMS_ACTIVE, {
        [info.code]: JSON.stringify(info),
      });
    } else {
      localActiveRooms.set(info.code, info);
    }
  }

  async removeRoom(code: string): Promise<void> {
    if (redis) {
      await redis.hdel(REDIS_ROOMS_ACTIVE, code);
    } else {
      localActiveRooms.delete(code);
    }
  }

  async getActiveRooms(): Promise<ActiveRoomInfo[]> {
    if (redis) {
      const all = await redis.hgetall<Record<string, string>>(REDIS_ROOMS_ACTIVE);
      if (!all) return [];
      return Object.values(all).map(v =>
        typeof v === 'string' ? JSON.parse(v) : v
      );
    }

    return Array.from(localActiveRooms.values());
  }

  async getActiveCount(): Promise<number> {
    if (redis) {
      return await redis.hlen(REDIS_ROOMS_ACTIVE);
    }
    return localActiveRooms.size;
  }
}
