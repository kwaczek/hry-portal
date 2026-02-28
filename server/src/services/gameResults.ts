import type { GameResult, EloChange } from '@hry/shared';
import { ELO_DEFAULT_RATING } from '@hry/shared';
import { supabaseAdmin } from './supabase.js';
import { calculateEloChanges } from './elo.js';

/**
 * Save game result to Supabase and update Elo ratings.
 * Returns the computed EloChange[] for broadcasting to clients.
 */
export async function saveGameResult(result: GameResult): Promise<EloChange[]> {
  // 1. Fetch current ratings for all non-guest players
  const ratedPlayers = result.players.filter(p => !p.isGuest);
  const ratedIds = ratedPlayers.map(p => p.id);

  let currentRatings = new Map<string, { elo: number; gamesPlayed: number; wins: number; losses: number; winStreak: number; bestStreak: number }>();

  if (ratedIds.length > 0) {
    const { data: ratings } = await supabaseAdmin
      .from('ratings')
      .select('user_id, elo, games_played, wins, losses, win_streak, best_streak')
      .eq('game_type', result.gameType)
      .in('user_id', ratedIds);

    if (ratings) {
      for (const r of ratings) {
        currentRatings.set(r.user_id, {
          elo: r.elo,
          gamesPlayed: r.games_played,
          wins: r.wins,
          losses: r.losses,
          winStreak: r.win_streak,
          bestStreak: r.best_streak,
        });
      }
    }
  }

  // 2. Calculate Elo changes
  const eloInputs = result.players.map(p => ({
    id: p.id,
    elo: currentRatings.get(p.id)?.elo ?? ELO_DEFAULT_RATING,
    placement: p.placement,
    isGuest: p.isGuest,
  }));

  const eloChanges = calculateEloChanges(eloInputs);

  // 3. Insert game result
  await supabaseAdmin.from('game_results').insert({
    game_type: result.gameType,
    room_id: result.roomId,
    players: result.players.map(p => ({
      ...p,
      eloChange: eloChanges.find(e => e.playerId === p.id)?.change ?? 0,
    })),
    rule_variant: result.ruleVariant,
    duration_sec: result.durationSec,
  });

  // 4. Update ratings for each rated player
  for (const change of eloChanges) {
    const player = result.players.find(p => p.id === change.playerId);
    if (!player) continue;

    const current = currentRatings.get(change.playerId);
    const isWinner = player.placement === 1;

    if (current) {
      // Update existing rating
      const newStreak = isWinner ? current.winStreak + 1 : 0;
      await supabaseAdmin
        .from('ratings')
        .update({
          elo: change.newElo,
          games_played: current.gamesPlayed + 1,
          wins: current.wins + (isWinner ? 1 : 0),
          losses: current.losses + (isWinner ? 0 : 1),
          win_streak: newStreak,
          best_streak: Math.max(current.bestStreak, newStreak),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', change.playerId)
        .eq('game_type', result.gameType);
    } else {
      // Insert new rating
      await supabaseAdmin.from('ratings').insert({
        user_id: change.playerId,
        game_type: result.gameType,
        elo: change.newElo,
        games_played: 1,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        win_streak: isWinner ? 1 : 0,
        best_streak: isWinner ? 1 : 0,
      });
    }
  }

  return eloChanges;
}
