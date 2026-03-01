'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { SuitSymbol } from '@/components/game/prsi/CardSvg';
import { createClient } from '@/lib/supabase/client';
import { ELO_MIN_GAMES_FOR_LEADERBOARD } from '@hry/shared';
import type { PrsiRuleVariant } from '@hry/shared';

interface LeaderboardEntry {
  user_id: string;
  elo: number;
  games_played: number;
  wins: number;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function PrsiPage() {
  const router = useRouter();
  const { session, loading: authLoading, anonSignInFailed, retryAnonSignIn } = useAuth();
  const { socket, connectionState } = useSocket();

  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mini leaderboard
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    async function fetchTop() {
      const supabase = createClient();
      const { data } = await supabase
        .from('ratings')
        .select(`
          user_id,
          elo,
          games_played,
          wins,
          profile:profiles!inner(username, display_name, avatar_url)
        `)
        .eq('game_type', 'prsi')
        .gte('games_played', ELO_MIN_GAMES_FOR_LEADERBOARD)
        .order('elo', { ascending: false })
        .limit(5);

      if (data) {
        const normalized = data.map((row) => ({
          ...row,
          profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
        })) as LeaderboardEntry[];
        setTopPlayers(normalized);
      }
      setLeaderboardLoading(false);
    }
    fetchTop();
  }, []);

  // Quick match
  const handleQuickMatch = useCallback(() => {
    if (!socket || connectionState !== 'connected') return;
    const s = socket;
    setMatchmaking(true);
    setError(null);

    s.emit('matchmaking:join', { maxPlayers: 2, ruleVariant: 'classic' as PrsiRuleVariant });

    const onFound = (roomCode: string) => {
      setMatchmaking(false);
      cleanup();
      router.push(`/prsi/${roomCode}`);
    };
    const onError = (msg: string) => {
      setMatchmaking(false);
      setError(msg);
      cleanup();
    };

    s.on('matchmaking:found', onFound);
    s.on('room:error', onError);

    function cleanup() {
      s.off('matchmaking:found', onFound);
      s.off('room:error', onError);
    }
  }, [socket, connectionState, router]);

  const handleCancelMatchmaking = useCallback(() => {
    socket?.emit('matchmaking:leave');
    setMatchmaking(false);
  }, [socket]);

  // Create private room
  const handleCreateRoom = useCallback(() => {
    if (!socket || connectionState !== 'connected') return;
    const s = socket;
    setCreating(true);
    setError(null);

    s.emit('room:create', { maxPlayers: 2, ruleVariant: 'classic' as PrsiRuleVariant, isPrivate: true });

    const onCreated = (roomCode: string) => {
      setCreating(false);
      cleanup();
      router.push(`/prsi/${roomCode}`);
    };
    const onError = (msg: string) => {
      setCreating(false);
      setError(msg);
      cleanup();
    };

    s.on('room:created', onCreated);
    s.on('room:error', onError);

    function cleanup() {
      s.off('room:created', onCreated);
      s.off('room:error', onError);
    }
  }, [socket, connectionState, router]);

  // Join existing room
  const handleJoinRoom = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Zadej kód místnosti');
      return;
    }
    setJoining(true);
    router.push(`/prsi/${code}`);
  }, [joinCode, router]);

  const isConnected = connectionState === 'connected';
  const needsLogin = !authLoading && !session;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(196,30,58,0.05) 0%, rgba(212,160,74,0.03) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[400px]"
          style={{
            background: 'radial-gradient(ellipse at 80% 80%, rgba(45,139,80,0.04) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Hero ── */}
        <div className="text-center mb-10 animate-[fadeInUp_0.5s_ease-out]">
          {/* Suit row */}
          <div className="flex justify-center gap-3 mb-5">
            {(['cerveny', 'zeleny', 'kule', 'zaludy'] as const).map((suit, i) => (
              <div
                key={suit}
                className="opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <SuitSymbol suit={suit} size={24} />
              </div>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight">
            <span className="bg-gradient-to-r from-card-red-400 via-amber-300 to-felt-400 bg-clip-text text-transparent">
              Prší Online
            </span>
          </h1>
          <p className="mt-3 text-text-secondary max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Česká karetní klasika. Hraj proti přátelům nebo náhodným soupeřům.
          </p>
        </div>

        {/* ── Action tables ── */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-xl mx-auto mb-8 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
          {/* Quick match table */}
          <div className="rounded-2xl p-[2px] bg-gradient-to-b from-amber-700/30 via-amber-900/20 to-amber-950/30">
            <div className="relative group rounded-[14px] overflow-hidden bg-felt-900">
              {/* Felt texture */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
                  backgroundSize: '64px 64px',
                }}
              />
              {/* Lamp glow */}
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-24 pointer-events-none opacity-60"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(212,160,74,0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/15 shadow-inner">
                    <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-amber-50">Rychlá hra</h2>
                </div>
                <p className="text-sm text-felt-200/50 mb-5 leading-relaxed">
                  Najdi soupeře během pár sekund. Pokud nikdo není, doplní se bot.
                </p>

                {matchmaking ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                      <Spinner size="sm" />
                      <span>Hledám soupeře...</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCancelMatchmaking}>
                      Zrušit
                    </Button>
                  </div>
                ) : needsLogin && anonSignInFailed ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-amber-400/80 text-center">
                      Hostovský přístup je dočasně nedostupný.
                    </p>
                    <Button variant="primary" size="lg" className="w-full" onClick={retryAnonSignIn}>
                      Zkusit znovu
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push('/prihlaseni')}>
                      Nebo se přihlásit
                    </Button>
                  </div>
                ) : needsLogin ? (
                  <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/prihlaseni')}>
                    Přihlásit se a hrát
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleQuickMatch}
                    disabled={!isConnected}
                  >
                    {isConnected ? 'Hrát' : 'Připojování...'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Private room table */}
          <div className="rounded-2xl p-[2px] bg-gradient-to-b from-felt-700/25 via-felt-900/15 to-felt-950/25">
            <div className="relative group rounded-[14px] overflow-hidden bg-bg-card">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-felt-500/10 border border-felt-500/15 shadow-inner">
                    <svg className="w-5 h-5 text-felt-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold font-[family-name:var(--font-display)]">Soukromá hra</h2>
                </div>
                <p className="text-sm text-text-muted mb-5 leading-relaxed">
                  Vytvoř místnost a pozvi přátele. Sdílej jim kód nebo odkaz.
                </p>

                {needsLogin && anonSignInFailed ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-amber-400/80 text-center">
                      Hostovský přístup je dočasně nedostupný.
                    </p>
                    <Button variant="secondary" size="lg" className="w-full" onClick={retryAnonSignIn}>
                      Zkusit znovu
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push('/prihlaseni')}>
                      Nebo se přihlásit
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    loading={creating}
                    onClick={needsLogin ? () => router.push('/prihlaseni') : handleCreateRoom}
                    disabled={!needsLogin && !isConnected}
                  >
                    {needsLogin ? 'Přihlásit se' : 'Vytvořit místnost'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Join by code ── */}
        <div className="max-w-sm mx-auto mb-12 animate-[fadeInUp_0.7s_ease-out_0.15s_both]">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-[11px] text-text-faint uppercase tracking-widest">Nebo se připoj kódem</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="font-mono tracking-widest text-center uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleJoinRoom}
              loading={joining}
              disabled={!joinCode.trim()}
            >
              Připojit
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-sm mx-auto mb-6 px-4 py-2 rounded-lg bg-card-red-500/10 border border-card-red-500/20 text-sm text-card-red-400 text-center animate-[fadeInUp_0.3s_ease-out]">
            {error}
          </div>
        )}

        {/* ── Chalkboard Rules Section ── */}
        <div className="max-w-2xl mx-auto mb-12 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          <div className="rounded-2xl overflow-hidden border border-border-subtle">
            {/* Chalkboard header */}
            <div className="bg-bg-elevated/80 px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-400/20" />
                <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-text-primary">
                  Jak se hraje Prší
                </h2>
              </div>
            </div>

            {/* Rules on dark "slate" background */}
            <div
              className="relative px-6 py-5"
              style={{
                background: 'linear-gradient(175deg, #12100d 0%, #0d0b09 100%)',
              }}
            >
              {/* Chalk dust texture */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundSize: '128px 128px',
                }}
              />

              <div className="relative grid sm:grid-cols-2 gap-5">
                <ChalkRuleCard
                  title="Základní pravidla"
                  items={[
                    'Každý hráč dostane 4 karty',
                    'Hraj kartu stejné barvy nebo hodnoty',
                    'Nemůžeš hrát? Lízni z balíčku',
                    'Kdo se první zbaví karet, vyhrává',
                  ]}
                />
                <ChalkRuleCard
                  title="Speciální karty"
                  items={[
                    '7 — Protihráč lízne 2 karty',
                    'Eso — Přeskoč dalšího hráče',
                    'Svršek — Změň barvu hry',
                    '7 se dají stohovat (2, 4, 6...)',
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Mini Pub Scoreboard ── */}
        <div className="max-w-sm mx-auto mb-10 animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border-subtle" />
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-[0.15em] font-[family-name:var(--font-display)]">
              Hospodský žebříček
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border-subtle" />
          </div>

          <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
            {leaderboardLoading ? (
              <div className="p-4 space-y-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-bg-elevated" />
                    <div className="h-3 flex-1 rounded bg-bg-elevated" />
                    <div className="w-8 h-3 rounded bg-bg-elevated" />
                  </div>
                ))}
              </div>
            ) : topPlayers.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm text-text-muted">Žebříček je zatím prázdný</p>
                <p className="text-xs text-text-faint mt-1">Buď první, kdo se zapíše!</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {topPlayers.map((entry, idx) => {
                  const displayName = entry.profile.display_name || entry.profile.username;
                  return (
                    <Link
                      key={entry.user_id}
                      href={`/profil/${encodeURIComponent(entry.profile.username)}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors"
                    >
                      <span className={`
                        w-5 text-center text-xs font-bold
                        ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-text-secondary' : idx === 2 ? 'text-amber-700' : 'text-text-faint'}
                      `}>
                        {idx + 1}.
                      </span>
                      <Avatar src={entry.profile.avatar_url} name={displayName} size="sm" />
                      <span className="flex-1 text-sm text-text-secondary truncate">{displayName}</span>
                      <span className="text-xs font-mono font-bold text-amber-400/80">{entry.elo}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* View full leaderboard */}
            <div className="border-t border-border-subtle">
              <Link
                href="/zebricek"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Celý žebříček
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center animate-[fadeInUp_0.8s_ease-out_0.35s_both]">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            &larr; Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Chalk-styled rule card ── */
function ChalkRuleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-amber-200/80 mb-3 font-[family-name:var(--font-display)] text-sm tracking-wide">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-text-secondary/80 leading-relaxed">
            <span className="text-amber-400/30 mt-0.5 flex-shrink-0">&#x25C6;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
