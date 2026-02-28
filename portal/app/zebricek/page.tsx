'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
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

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    const supabase = createClient();

    const from = pageNum * PAGE_SIZE;
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
      .range(from, to);

    if (data) {
      // Supabase returns profile as object, normalize
      const normalized = data.map((row) => ({
        ...row,
        profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
      })) as LeaderboardEntry[];
      setEntries(normalized);
      setHasMore(normalized.length > PAGE_SIZE);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse,rgba(196,30,58,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 animate-[fadeInUp_0.4s_ease-out]">
          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight">
            Žebříček
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Nejlepší hráči Prší — minimum {ELO_MIN_GAMES_FOR_LEADERBOARD} odehraných her
          </p>
        </div>

        {/* Table */}
        <div className="animate-[fadeInUp_0.5s_ease-out]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-gray-500">Zatím žádní hráči v žebříčku</p>
              <p className="text-xs text-gray-600 mt-1">Odehraj {ELO_MIN_GAMES_FOR_LEADERBOARD} her pro zařazení</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-2 text-[11px] text-gray-600 uppercase tracking-wider">
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

                  return (
                    <Link
                      key={entry.user_id}
                      href={`/profil/${encodeURIComponent(entry.profile.username)}`}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                        hover:bg-white/[0.04] group
                        ${rank === 1
                          ? 'border-amber-500/15 bg-amber-500/[0.03]'
                          : rank === 2
                          ? 'border-gray-400/10 bg-gray-400/[0.02]'
                          : rank === 3
                          ? 'border-orange-700/10 bg-orange-700/[0.02]'
                          : 'border-white/[0.06] bg-white/[0.02]'
                        }
                      `}
                    >
                      {/* Rank */}
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${rank === 1
                          ? 'bg-amber-500/15 text-amber-400'
                          : rank === 2
                          ? 'bg-gray-400/15 text-gray-300'
                          : rank === 3
                          ? 'bg-orange-700/15 text-orange-400'
                          : 'bg-white/[0.04] text-gray-500'
                        }
                      `}>
                        {rank}
                      </div>

                      {/* Player */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Avatar
                          src={entry.profile.avatar_url}
                          name={displayName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                            {displayName}
                          </p>
                        </div>
                      </div>

                      {/* Elo */}
                      <span className={`
                        w-14 text-right text-sm font-mono font-bold flex-shrink-0
                        ${rank <= 3 ? 'text-red-400' : 'text-gray-200'}
                      `}>
                        {entry.elo}
                      </span>

                      {/* Games */}
                      <span className="w-12 text-right text-xs text-gray-500 hidden sm:block flex-shrink-0">
                        {entry.games_played}
                      </span>

                      {/* Win rate */}
                      <span className="w-14 text-right text-xs text-gray-500 hidden sm:block flex-shrink-0">
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
                <span className="text-xs text-gray-600">
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

        {/* Back */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            &larr; Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    </div>
  );
}
