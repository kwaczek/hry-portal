import { describe, test, expect } from 'vitest';
import { calculateEloChanges } from '../elo.js';

describe('Elo Service', () => {
  // === 2-Player Games ===

  describe('2-player games', () => {
    test('equal ratings — winner gains, loser loses same amount', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: false },
      ]);

      expect(changes).toHaveLength(2);
      const winner = changes.find(c => c.playerId === 'a')!;
      const loser = changes.find(c => c.playerId === 'b')!;

      expect(winner.change).toBe(16); // K/2 = 32/2 = 16 for equal ratings
      expect(loser.change).toBe(-16);
      expect(winner.newElo).toBe(1016);
      expect(loser.newElo).toBe(984);
    });

    test('higher-rated player wins — gains less', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1400, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: false },
      ]);

      const winner = changes.find(c => c.playerId === 'a')!;
      const loser = changes.find(c => c.playerId === 'b')!;

      // Higher rated expected to win, so less gain
      expect(winner.change).toBeGreaterThan(0);
      expect(winner.change).toBeLessThan(16);
      expect(loser.change).toBeLessThan(0);
      expect(loser.change).toBeGreaterThan(-32);
    });

    test('lower-rated player wins (upset) — gains more', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1400, placement: 2, isGuest: false },
      ]);

      const winner = changes.find(c => c.playerId === 'a')!;
      const loser = changes.find(c => c.playerId === 'b')!;

      // Upset: winner gains more than 16 (expected to lose)
      expect(winner.change).toBeGreaterThan(16);
      expect(loser.change).toBeLessThan(-16);
    });

    test('changes are symmetric in 2-player (zero sum)', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1200, placement: 1, isGuest: false },
        { id: 'b', elo: 800, placement: 2, isGuest: false },
      ]);

      const total = changes.reduce((sum, c) => sum + c.change, 0);
      expect(total).toBe(0);
    });
  });

  // === Guest Exclusion ===

  describe('guest exclusion', () => {
    test('guests are excluded from Elo changes', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: true },
        { id: 'b', elo: 1000, placement: 2, isGuest: false },
      ]);

      expect(changes).toHaveLength(1);
      expect(changes[0].playerId).toBe('b');
    });

    test('all guests — returns empty array', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: true },
        { id: 'b', elo: 1000, placement: 2, isGuest: true },
      ]);

      expect(changes).toHaveLength(0);
    });

    test('single non-guest with guests — no change for lone player', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: true },
      ]);

      // Only one rated player, no one to compare against
      expect(changes).toHaveLength(1);
      expect(changes[0].change).toBe(0);
    });
  });

  // === 3-4 Player Games (Pairwise) ===

  describe('3-player games', () => {
    test('pairwise comparison — 1st place gains from both opponents', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: false },
        { id: 'c', elo: 1000, placement: 3, isGuest: false },
      ]);

      expect(changes).toHaveLength(3);
      const first = changes.find(c => c.playerId === 'a')!;
      const second = changes.find(c => c.playerId === 'b')!;
      const third = changes.find(c => c.playerId === 'c')!;

      // 1st beats both → positive change
      expect(first.change).toBeGreaterThan(0);
      // 3rd loses to both → negative change
      expect(third.change).toBeLessThan(0);
      // 2nd beats 3rd but loses to 1st → could be ~0
    });

    test('all equal ratings — changes sum to approximately zero', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: false },
        { id: 'c', elo: 1000, placement: 3, isGuest: false },
      ]);

      const total = changes.reduce((sum, c) => sum + c.change, 0);
      expect(total).toBe(0);
    });
  });

  describe('4-player games', () => {
    test('4-player all equal ratings — 1st gains most, 4th loses most', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: false },
        { id: 'c', elo: 1000, placement: 3, isGuest: false },
        { id: 'd', elo: 1000, placement: 4, isGuest: false },
      ]);

      const sorted = [...changes].sort((a, b) => b.change - a.change);
      expect(sorted[0].playerId).toBe('a'); // 1st gains most
      expect(sorted[3].playerId).toBe('d'); // 4th loses most
      expect(sorted[0].change).toBeGreaterThan(0);
      expect(sorted[3].change).toBeLessThan(0);
    });

    test('4-player changes sum to zero', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1200, placement: 1, isGuest: false },
        { id: 'b', elo: 1100, placement: 2, isGuest: false },
        { id: 'c', elo: 1000, placement: 3, isGuest: false },
        { id: 'd', elo: 900, placement: 4, isGuest: false },
      ]);

      const total = changes.reduce((sum, c) => sum + c.change, 0);
      expect(total).toBe(0);
    });

    test('4-player mixed guests — only rated players get changes', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1000, placement: 1, isGuest: false },
        { id: 'b', elo: 1000, placement: 2, isGuest: true },
        { id: 'c', elo: 1000, placement: 3, isGuest: false },
        { id: 'd', elo: 1000, placement: 4, isGuest: true },
      ]);

      // Only a and c are rated
      expect(changes).toHaveLength(2);
      expect(changes.every(c => !['b', 'd'].includes(c.playerId))).toBe(true);
    });
  });

  // === Edge Cases ===

  describe('edge cases', () => {
    test('preserves oldElo and newElo fields', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1200, placement: 1, isGuest: false },
        { id: 'b', elo: 800, placement: 2, isGuest: false },
      ]);

      const winner = changes.find(c => c.playerId === 'a')!;
      expect(winner.oldElo).toBe(1200);
      expect(winner.newElo).toBe(1200 + winner.change);
    });

    test('Elo never goes below 0', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 100, placement: 1, isGuest: false },
        { id: 'b', elo: 5, placement: 2, isGuest: false },
      ]);

      const loser = changes.find(c => c.playerId === 'b')!;
      expect(loser.newElo).toBeGreaterThanOrEqual(0);
    });

    test('changes are rounded to integers', () => {
      const changes = calculateEloChanges([
        { id: 'a', elo: 1234, placement: 1, isGuest: false },
        { id: 'b', elo: 1111, placement: 2, isGuest: false },
      ]);

      for (const c of changes) {
        expect(Number.isInteger(c.change)).toBe(true);
        expect(Number.isInteger(c.newElo)).toBe(true);
      }
    });
  });
});
