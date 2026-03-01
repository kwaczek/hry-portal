'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { SuitSymbol } from '@/components/game/prsi/CardSvg';
import type { PrsiRuleVariant } from '@hry/shared';

export default function PrsiPage() {
  const router = useRouter();
  const { session, loading: authLoading, anonSignInFailed, retryAnonSignIn } = useAuth();
  const { socket, connectionState } = useSocket();

  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(ellipse,rgba(212,160,74,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse,rgba(45,139,80,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10 animate-[fadeInUp_0.5s_ease-out]">
          <div className="flex justify-center gap-2 mb-4">
            <SuitSymbol suit="cerveny" size={28} />
            <SuitSymbol suit="zeleny" size={28} />
            <SuitSymbol suit="kule" size={28} />
            <SuitSymbol suit="zaludy" size={28} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight">
            <span className="bg-gradient-to-r from-card-red-400 via-amber-300 to-felt-400 bg-clip-text text-transparent">
              Prší Online
            </span>
          </h1>
          <p className="mt-3 text-text-secondary max-w-md mx-auto text-sm sm:text-base">
            Česká karetní klasika. Hraj proti přátelům nebo náhodným soupeřům z celého světa.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-12 animate-[fadeInUp_0.6s_ease-out]">
          {/* Quick match */}
          <div className="relative group rounded-2xl border border-border-subtle bg-bg-card p-6 hover:bg-bg-elevated hover:border-amber-400/20 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-400/[0.03] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20">
                  <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8H1v6.5A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5V8zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold font-[family-name:var(--font-display)]">Rychlá hra</h2>
              </div>
              <p className="text-sm text-text-muted mb-4">
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
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={retryAnonSignIn}
                  >
                    Zkusit znovu
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/prihlaseni')}
                  >
                    Nebo se přihlásit
                  </Button>
                </div>
              ) : needsLogin ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => router.push('/prihlaseni')}
                >
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

          {/* Private room */}
          <div className="relative group rounded-2xl border border-border-subtle bg-bg-card p-6 hover:bg-bg-elevated hover:border-felt-500/20 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-felt-500/[0.03] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-felt-500/10 border border-felt-500/20">
                  <svg className="w-5 h-5 text-felt-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold font-[family-name:var(--font-display)]">Soukromá hra</h2>
              </div>
              <p className="text-sm text-text-muted mb-4">
                Vytvoř místnost a pozvi přátele. Sdílej jim kód nebo odkaz.
              </p>
              {needsLogin && anonSignInFailed ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-amber-400/80 text-center">
                    Hostovský přístup je dočasně nedostupný.
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={retryAnonSignIn}
                  >
                    Zkusit znovu
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/prihlaseni')}
                  >
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

        {/* Join by code */}
        <div className="max-w-sm mx-auto mb-14 animate-[fadeInUp_0.7s_ease-out]">
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Kód místnosti"
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

        {/* Rules section */}
        <div className="max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out]">
          <h2 className="text-xl font-bold font-[family-name:var(--font-display)] mb-5 text-center">
            Jak se hraje Prší
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <RuleCard
              title="Základní pravidla"
              items={[
                'Každý hráč dostane 4 karty',
                'Hraj kartu stejné barvy nebo hodnoty',
                'Nemůžeš hrát? Lízni z balíčku',
                'Kdo se první zbaví karet, vyhrává',
              ]}
            />
            <RuleCard
              title="Speciální karty"
              items={[
                '7 — Protihráč lízne 2 karty',
                'Eso — Přeskoč dalšího hráče',
                'Svršek — Změň barvu hry',
                '7 se dají stohovat (2, 4, 6...)',
              ]}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              &larr; Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <h3 className="font-semibold text-text-primary mb-2.5 font-[family-name:var(--font-display)]">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-text-secondary">
            <span className="text-amber-400/50 mt-0.5 flex-shrink-0">&#x2022;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
