'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ProfileEditor } from '@/components/profile/ProfileEditor';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  created_at: string;
}

interface Rating {
  game_type: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  win_streak: number;
  best_streak: number;
}

interface RecentMatch {
  id: string;
  game_type: string;
  players: { id: string; username: string; placement: number; eloChange?: number }[];
  played_at: string;
  duration_sec: number | null;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  const isOwnProfile = user?.id === profile?.id;

  useEffect(() => {
    const supabase = createClient();

    async function fetchProfile() {
      setLoading(true);

      // Try lookup by UUID first, then by username
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedUsername);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq(isUuid ? 'id' : 'username', decodedUsername)
        .single();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('game_type, elo, games_played, wins, losses, win_streak, best_streak')
        .eq('user_id', profileData.id);

      if (ratingsData) setRatings(ratingsData);

      // Fetch recent matches
      const { data: matchesData } = await supabase
        .from('game_results')
        .select('id, game_type, players, played_at, duration_sec')
        .order('played_at', { ascending: false })
        .limit(10);

      if (matchesData) {
        // Filter matches that include this player
        const playerMatches = matchesData.filter((m: RecentMatch) =>
          m.players.some((p) => p.id === profileData.id)
        );
        setRecentMatches(playerMatches);
      }

      setLoading(false);
    }

    fetchProfile();
  }, [decodedUsername]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl opacity-20">?</div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">Hráč nenalezen</h2>
        <p className="text-gray-400 text-sm">Uživatel &quot;{decodedUsername}&quot; neexistuje.</p>
        <Link href="/" className="text-sm text-red-400 hover:text-red-300 transition-colors">
          &larr; Zpět na hlavní stránku
        </Link>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username;
  const memberSince = new Date(profile.created_at).toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
  });

  const prsiRating = ratings.find(r => r.game_type === 'prsi');

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(196,30,58,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 animate-[fadeInUp_0.4s_ease-out]">
          <Avatar
            src={profile.avatar_url}
            name={displayName}
            size="lg"
            className="!h-20 !w-20 !text-2xl ring-2 ring-white/[0.06]"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
                {displayName}
              </h1>
              {profile.is_guest && <Badge>Host</Badge>}
            </div>
            <p className="text-sm text-gray-500 mt-1">@{profile.username}</p>
            <p className="text-xs text-gray-600 mt-1">
              Členem od {memberSince}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => setEditing(true)}
                className="mt-2 text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Upravit profil
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        {prsiRating && (
          <div className="mb-8 animate-[fadeInUp_0.5s_ease-out]">
            <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-3 font-[family-name:var(--font-display)]">
              Prší — Statistiky
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBlock label="Elo" value={prsiRating.elo.toString()} accent="red" />
              <StatBlock label="Odehráno" value={prsiRating.games_played.toString()} />
              <StatBlock
                label="Výhry"
                value={
                  prsiRating.games_played > 0
                    ? `${Math.round((prsiRating.wins / prsiRating.games_played) * 100)}%`
                    : '—'
                }
                sub={`${prsiRating.wins}V / ${prsiRating.losses}P`}
              />
              <StatBlock
                label="Série"
                value={prsiRating.win_streak.toString()}
                sub={`Nej: ${prsiRating.best_streak}`}
                accent={prsiRating.win_streak >= 3 ? 'green' : undefined}
              />
            </div>
          </div>
        )}

        {!prsiRating && (
          <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center animate-[fadeInUp_0.5s_ease-out]">
            <p className="text-gray-500 text-sm">Zatím žádné odehrané hry</p>
          </div>
        )}

        {/* Recent matches */}
        <div className="animate-[fadeInUp_0.6s_ease-out]">
          <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-3 font-[family-name:var(--font-display)]">
            Poslední zápasy
          </h2>

          {recentMatches.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <p className="text-gray-500 text-sm">Žádné zápasy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((match) => {
                const me = match.players.find(p => p.id === profile.id);
                const won = me?.placement === 1;
                const opponents = match.players.filter(p => p.id !== profile.id);
                const date = new Date(match.played_at).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'short',
                });

                return (
                  <div
                    key={match.id}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
                      ${won
                        ? 'bg-green-500/[0.03] border-green-500/10'
                        : 'bg-white/[0.02] border-white/[0.06]'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${won
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-white/[0.06] text-gray-500'
                      }
                    `}>
                      {me?.placement ?? '—'}.
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">
                        vs {opponents.map(o => o.username).join(', ')}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">{match.game_type}</p>
                    </div>

                    {me?.eloChange != null && (
                      <span className={`
                        text-sm font-mono font-medium flex-shrink-0
                        ${me.eloChange > 0 ? 'text-green-400' : me.eloChange < 0 ? 'text-red-400' : 'text-gray-500'}
                      `}>
                        {me.eloChange > 0 ? '+' : ''}{me.eloChange}
                      </span>
                    )}

                    <span className="text-xs text-gray-600 flex-shrink-0">{date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/zebricek" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Zobrazit žebříček &rarr;
          </Link>
        </div>
      </div>

      {/* Profile editor */}
      {editing && (
        <ProfileEditor
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setProfile({ ...profile, ...updated });
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'red' | 'green';
}) {
  const accentColor = accent === 'red' ? 'text-red-400' : accent === 'green' ? 'text-green-400' : 'text-gray-100';
  const borderGlow = accent === 'red'
    ? 'border-red-500/10 bg-red-500/[0.03]'
    : accent === 'green'
    ? 'border-green-500/10 bg-green-500/[0.03]'
    : 'border-white/[0.06] bg-white/[0.02]';

  return (
    <div className={`rounded-xl border p-3 ${borderGlow}`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold font-[family-name:var(--font-display)] ${accentColor}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}
