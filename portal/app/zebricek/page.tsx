'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ELO_MIN_GAMES_FOR_LEADERBOARD } from '@hry/shared';

interface LeaderboardEntry {
  user_id: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const PAGE_SIZE = 25;

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    const supabase = createClient();

    const from = pageNum * PAGE_SIZE;
    // Fetch one extra row to detect if there's a next page
    const to = from + PAGE_SIZE;

    const { data } = await supabase
      .from('ratings')
      .select(`
        user_id,
        elo,
        games_played,
        wins,
        losses,
        profile:profiles!inner(username, display_name, avatar_url)
      `)
      .eq('game_type', 'prsi')
      .gte('games_played', ELO_MIN_GAMES_FOR_LEADERBOARD)
      .order('elo', { ascending: false })
      .range(from, to + 1);

    if (data) {
      // Supabase returns profile as object, normalize
      const normalized = data.map((row) => ({
        ...row,
        profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
      })) as LeaderboardEntry[];
      setHasMore(normalized.length > PAGE_SIZE);
      setEntries(normalized.slice(0, PAGE_SIZE));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse,rgba(212,160,74,0.04)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse,rgba(45,139,80,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Championship board header */}
        <div className="text-center mb-10 animate-[fadeInUp_0.4s_ease-out]">
          {/* Decorative suit line */}
          <div className="flex items-center justify-center gap-3 mb-4 text-text-faint text-xs">
            <span className="text-card-red-400/40">♥</span>
            <span className="text-felt-400/40">♠</span>
            <span className="text-card-red-400/40">♦</span>
            <span className="text-felt-400/40">♣</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight">
            Hospodský žebříček
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            Nejlepší karbaníci u stolu — minimum {ELO_MIN_GAMES_FOR_LEADERBOARD} odehraných her
          </p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/20" />
            <span className="text-amber-400/30 text-xs">♠</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/20" />
          </div>
        </div>

        {/* Championship table */}
        <div className="animate-[fadeInUp_0.5s_ease-out]">
          {loading ? (
            <div className="space-y-1 animate-pulse">
              {/* Header skeleton */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-3 rounded bg-bg-elevated" />
                <div className="flex-1 h-3 rounded bg-bg-elevated" />
                <div className="w-14 h-3 rounded bg-bg-elevated" />
              </div>
              {/* Row skeletons */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-subtle bg-bg-card">
                  <div className="w-8 h-8 rounded-lg bg-bg-elevated" />
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-7 h-7 rounded-full bg-bg-elevated" />
                    <div className="h-4 w-24 rounded bg-bg-elevated" />
                  </div>
                  <div className="w-10 h-4 rounded bg-bg-elevated" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-bg-card p-8 text-center">
              <div className="text-4xl opacity-20 mb-3">🃏</div>
              <p className="text-text-muted">Zatím žádní karbaníci v žebříčku</p>
              <p className="text-xs text-text-faint mt-1">Odehraj {ELO_MIN_GAMES_FOR_LEADERBOARD} her pro zařazení</p>
            </div>
          ) : (
            <>
              {/* Column header */}
              <div className="flex items-center gap-3 px-4 py-2 text-[11px] text-text-faint uppercase tracking-wider font-[family-name:var(--font-display)]">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Hráč</span>
                <span className="w-14 text-right">Elo</span>
                <span className="w-12 text-right hidden sm:block">Hry</span>
                <span className="w-14 text-right hidden sm:block">Win %</span>
              </div>

              {/* Rows */}
              <div className="space-y-1">
                {entries.slice(0, PAGE_SIZE).map((entry, idx) => {
                  const rank = page * PAGE_SIZE + idx + 1;
                  const winRate = entry.games_played > 0
                    ? Math.round((entry.wins / entry.games_played) * 100)
                    : 0;
                  const displayName = entry.profile.display_name || entry.profile.username;
                  const isTopThree = rank <= 3;

                  return (
                    <Link
                      key={entry.user_id}
                      href={`/profil/${encodeURIComponent(entry.profile.username)}`}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                        hover:bg-bg-hover group
                        ${rank === 1
                          ? 'border-amber-400/20 bg-amber-400/[0.04] shadow-[0_0_20px_rgba(212,160,74,0.05)]'
                          : rank === 2
                          ? 'border-text-faint/15 bg-text-faint/[0.03]'
                          : rank === 3
                          ? 'border-amber-700/15 bg-amber-700/[0.03]'
                          : 'border-border-subtle bg-bg-card'
                        }
                      `}
                    >
                      {/* Rank */}
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${rank === 1
                          ? 'bg-amber-400/15 text-amber-300'
                          : rank === 2
                          ? 'bg-text-faint/15 text-text-secondary'
                          : rank === 3
                          ? 'bg-amber-700/15 text-amber-500'
                          : 'bg-bg-elevated text-text-muted'
                        }
                      `}>
                        {isTopThree ? RANK_MEDALS[rank - 1] : rank}
                      </div>

                      {/* Player */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`relative ${rank === 1 ? 'ring-1 ring-amber-400/30 rounded-full' : ''}`}>
                          <Avatar
                            src={entry.profile.avatar_url}
                            name={displayName}
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-secondary truncate group-hover:text-text-primary transition-colors">
                            {displayName}
                          </p>
                        </div>
                      </div>

                      {/* Elo */}
                      <span className={`
                        w-14 text-right text-sm font-mono font-bold flex-shrink-0
                        ${rank <= 3 ? 'text-amber-400' : 'text-text-secondary'}
                      `}>
                        {entry.elo}
                      </span>

                      {/* Games */}
                      <span className="w-12 text-right text-xs text-text-muted hidden sm:block flex-shrink-0">
                        {entry.games_played}
                      </span>

                      {/* Win rate */}
                      <span className={`
                        w-14 text-right text-xs hidden sm:block flex-shrink-0
                        ${winRate >= 60 ? 'text-felt-300' : 'text-text-muted'}
                      `}>
                        {winRate}%
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 mt-6">
                {page > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => p - 1)}>
                    &larr; Předchozí
                  </Button>
                )}
                <span className="text-xs text-text-faint">
                  Strana {page + 1}
                </span>
                {hasMore && (
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>
                    Další &rarr;
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom decoration + back link */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-text-faint/30 text-xs">
            <span>♥</span>
            <span>♠</span>
            <span>♦</span>
            <span>♣</span>
          </div>
          <Link href="/" className="text-sm text-text-muted hover:text-amber-400 transition-colors">
            &larr; Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    </div>
  );
}
