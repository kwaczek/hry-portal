'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UpgradePromptProps {
  onDismiss: () => void;
}

export function UpgradePrompt({ onDismiss }: UpgradePromptProps) {
  const { upgradeWithGoogle, upgradeWithEmail, isGuest } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isGuest) return null;

  const handleEmailUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await upgradeWithEmail(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border-default bg-bg-elevated p-6 shadow-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
          Chceš si uložit svůj pokrok?
        </h2>
        <p className="mt-1.5 text-sm text-text-muted">
          Zaregistruj se a tvoje výsledky, Elo a historie her se uloží natrvalo.
        </p>

        <div className="mt-5 space-y-3">
          <button
            onClick={upgradeWithGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-border-strong hover:bg-bg-hover cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Propojit s Google
          </button>

          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="w-full rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-text-muted transition-colors hover:text-text-secondary cursor-pointer"
            >
              Nebo použít e-mail
            </button>
          ) : (
            <form onSubmit={handleEmailUpgrade} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-mail"
                className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-faint outline-none focus:border-amber-400/40"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Heslo"
                className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-faint outline-none focus:border-amber-400/40"
              />
              {error && (
                <p className="text-xs text-card-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-bg-root transition-colors hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Ukládání...' : 'Zaregistrovat se'}
              </button>
            </form>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="mt-4 w-full text-center text-xs text-text-faint transition-colors hover:text-text-muted cursor-pointer"
        >
          Teď ne, pokračovat jako host
        </button>
      </div>
    </div>
  );
}
