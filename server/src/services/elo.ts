import type { EloChange } from '@hry/shared';
import { ELO_K_FACTOR } from '@hry/shared';

interface EloPlayerInput {
  id: string;
  elo: number;
  placement: number;
  isGuest: boolean;
}

/**
 * Calculate expected score using standard Elo formula.
 * Ea = 1 / (1 + 10^((Rb - Ra) / 400))
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate Elo changes for all non-guest players using pairwise comparison.
 *
 * 2-player: winner S=1, loser S=0
 * 3-4 player: each pair compared, changes averaged across opponents
 *
 * Returns EloChange[] only for non-guest players.
 * Zero-sum: total changes always sum to 0.
 */
export function calculateEloChanges(players: EloPlayerInput[]): EloChange[] {
  const rated = players.filter(p => !p.isGuest);

  if (rated.length <= 1) {
    // Single rated player or none — no meaningful comparison
    return rated.map(p => ({
      playerId: p.id,
      oldElo: p.elo,
      newElo: p.elo,
      change: 0,
    }));
  }

  const changeMap = new Map<string, number>();

  // Initialize
  for (const p of rated) {
    changeMap.set(p.id, 0);
  }

  // Pairwise comparison: each pair contributes to both players' change
  for (let i = 0; i < rated.length; i++) {
    for (let j = i + 1; j < rated.length; j++) {
      const a = rated[i];
      const b = rated[j];

      const ea = expectedScore(a.elo, b.elo);
      const eb = 1 - ea;

      // Actual score: lower placement = better (1st beats 2nd)
      const sa = a.placement < b.placement ? 1 : 0;
      const sb = 1 - sa;

      // K-factor divided by (number of opponents) for multi-player averaging
      const k = ELO_K_FACTOR / (rated.length - 1);

      const deltaA = Math.round(k * (sa - ea));
      const deltaB = Math.round(k * (sb - eb));

      // Ensure zero-sum by making deltaB = -deltaA
      changeMap.set(a.id, changeMap.get(a.id)! + deltaA);
      changeMap.set(b.id, changeMap.get(b.id)! - deltaA);
    }
  }

  return rated.map(p => {
    const change = changeMap.get(p.id)!;
    const newElo = Math.max(0, p.elo + change);
    return {
      playerId: p.id,
      oldElo: p.elo,
      newElo,
      change: newElo - p.elo, // Recalculate in case clamped to 0
    };
  });
}
