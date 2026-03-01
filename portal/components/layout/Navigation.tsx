'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';

const navLinks = [
  { href: '/', label: 'Hry' },
  { href: '/zebricek', label: 'Žebříček' },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, isGuest, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Hráč';

  return (
    <nav className="sticky top-0 z-40 border-b border-border-subtle bg-bg-root/85 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            {/* Card suit icon — amber glow */}
            <div className="relative h-8 w-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
                <path
                  d="M16 6C16 6 10 12 10 17C10 20.3 12.7 23 16 23C19.3 23 22 20.3 22 17C22 12 16 6 16 6Z"
                  fill="#d4a04a"
                  className="group-hover:fill-amber-300 transition-colors"
                />
                <circle cx="13" cy="24" r="3" fill="#d4a04a" opacity="0.5" />
                <circle cx="19" cy="24" r="3" fill="#d4a04a" opacity="0.5" />
              </svg>
            </div>
            <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
              Hry<span className="text-amber-400">.cz</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200
                    ${isActive
                      ? 'text-text-primary bg-bg-elevated'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side — auth */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-bg-elevated" />
            ) : user && !isGuest ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-hover cursor-pointer"
                >
                  <Avatar name={displayName} size="sm" />
                  <span className="hidden sm:block text-sm text-text-secondary">{displayName}</span>
                  <svg className="h-4 w-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border-default bg-bg-elevated py-1 shadow-xl animate-[fadeIn_0.15s_ease-out]">
                      <Link
                        href={`/profil/${encodeURIComponent(user?.id ?? '')}`}
                        className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Můj profil
                      </Link>
                      <div className="my-1 border-t border-border-subtle" />
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
                      >
                        Odhlásit se
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/prihlaseni"
                className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-bg-root transition-all hover:bg-amber-300 shadow-lg shadow-amber-900/20"
              >
                Přihlásit se
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border-subtle bg-bg-root/95 backdrop-blur-xl animate-[fadeIn_0.15s_ease-out]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    block px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'text-text-primary bg-bg-elevated'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
