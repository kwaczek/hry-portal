'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

function CardSuitDecoration({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      {/* Heart / Červený */}
      <svg
        className="absolute top-[8%] left-[5%] w-24 h-24 text-red-900/20 animate-[drift_20s_ease-in-out_infinite]"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 88C25 65 5 50 5 32 5 18 15 8 28 8c8 0 16 5 22 15C56 13 64 8 72 8c13 0 23 10 23 24 0 18-20 33-45 56z" />
      </svg>
      {/* Leaf / Zelený */}
      <svg
        className="absolute top-[15%] right-[8%] w-20 h-20 text-green-900/20 animate-[drift_25s_ease-in-out_infinite_reverse]"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 10c-20 20-40 35-40 55 0 15 18 27 40 27s40-12 40-27c0-20-20-35-40-55z" />
      </svg>
      {/* Bell / Kule */}
      <svg
        className="absolute bottom-[20%] left-[10%] w-16 h-16 text-amber-800/15 animate-[drift_22s_ease-in-out_2s_infinite]"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <ellipse cx="50" cy="55" rx="35" ry="38" />
        <circle cx="50" cy="18" r="10" />
      </svg>
      {/* Acorn / Žaludy */}
      <svg
        className="absolute bottom-[12%] right-[12%] w-18 h-18 text-amber-900/15 animate-[drift_18s_ease-in-out_4s_infinite_reverse]"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <rect x="25" y="10" width="50" height="18" rx="9" />
        <path d="M30 28c0 0-5 15-5 35 0 18 11 30 25 30s25-12 25-30c0-20-5-35-5-35H30z" />
      </svg>
    </div>
  );
}

export default function PrihlaseniPage() {
  return (
    <Suspense>
      <PrihlaseniContent />
    </Suspense>
  );
}

function PrihlaseniContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') ?? '/';
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Atmospheric background */}
      <div className="fixed inset-0 bg-[#08080e]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,30,58,0.08)_0%,_transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(45,80,22,0.06)_0%,_transparent_50%)]" />

      <CardSuitDecoration />

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md animate-[fadeInUp_0.6s_ease-out]"
      >
        {/* Card glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent" />

        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="mb-4 inline-block font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white transition-colors hover:text-red-400"
            >
              Hry.cz
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white/90">
              {isSignUp ? 'Vytvořit účet' : 'Přihlášení'}
            </h1>
            <p className="mt-1.5 text-sm text-white/40">
              {isSignUp
                ? 'Zaregistruj se a sleduj svůj pokrok'
                : 'Přihlas se a hraj s přáteli'}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={signInWithGoogle}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/90 transition-all hover:border-white/[0.15] hover:bg-white/[0.07] active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Pokračovat přes Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs uppercase tracking-wider text-white/20">nebo</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/30">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="jan@email.cz"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/30">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition-all hover:from-red-500 hover:to-red-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Načítání...'
                : isSignUp
                  ? 'Zaregistrovat se'
                  : 'Přihlásit se'}
            </button>
          </form>

          {/* Toggle sign up / sign in */}
          <p className="mt-6 text-center text-sm text-white/30">
            {isSignUp ? 'Už máš účet?' : 'Nemáš účet?'}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-medium text-white/60 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/40"
            >
              {isSignUp ? 'Přihlásit se' : 'Zaregistrovat se'}
            </button>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
