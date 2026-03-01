'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';

const navLinks = [
  { href: '/', label: 'Hry', icon: '♠' },
  { href: '/zebricek', label: 'Žebříček', icon: '♦' },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, isGuest, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Hráč';

  // Track scroll for enhanced nav shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`
        sticky top-0 z-40 transition-all duration-300
        bg-bg-root/90 backdrop-blur-xl
        ${scrolled
          ? 'border-b border-amber-400/8 shadow-[0_1px_12px_rgba(212,160,74,0.04)]'
          : 'border-b border-border-subtle'}
      `}
    >
      {/* Warm glow line at bottom of nav */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" fill="none">
                <path
                  d="M16 6C16 6 10 12 10 17C10 20.3 12.7 23 16 23C19.3 23 22 20.3 22 17C22 12 16 6 16 6Z"
                  fill="#d4a04a"
                  className="group-hover:fill-amber-300 transition-colors duration-300"
                />
                <circle cx="13" cy="24" r="3" fill="#d4a04a" opacity="0.5" />
                <circle cx="19" cy="24" r="3" fill="#d4a04a" opacity="0.5" />
              </svg>
              {/* Subtle glow behind logo on hover */}
              <div className="absolute inset-0 rounded-full bg-amber-400/0 group-hover:bg-amber-400/10 blur-md transition-all duration-500" />
            </div>
            <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
              Hry<span className="text-amber-400 group-hover:text-amber-300 transition-colors">.cz</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-0.5">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'text-amber-300'
                      : 'text-text-muted hover:text-text-secondary'}
                  `}
                >
                  {link.label}
                  {/* Active indicator — warm amber underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber-400/60" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side — auth */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-bg-elevated" />
            ) : user && !isGuest ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:bg-bg-hover cursor-pointer group"
                >
                  <Avatar name={displayName} size="sm" />
                  <span className="hidden sm:block text-sm text-text-secondary group-hover:text-text-primary transition-colors">{displayName}</span>
                  <svg
                    className={`h-3.5 w-3.5 text-text-faint transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border-default bg-bg-elevated/95 backdrop-blur-xl py-1.5 shadow-2xl shadow-black/20 animate-[fadeIn_0.12s_ease-out]">
                      <Link
                        href={`/profil/${encodeURIComponent(user?.id ?? '')}`}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="h-4 w-4 text-text-faint" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                        </svg>
                        Můj profil
                      </Link>
                      <div className="my-1 mx-3 border-t border-border-subtle" />
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <svg className="h-4 w-4 text-text-faint" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
                        </svg>
                        Odhlásit se
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/prihlaseni"
                className="
                  rounded-lg bg-gradient-to-b from-amber-400 to-amber-500
                  hover:from-amber-300 hover:to-amber-400
                  px-4 py-1.5 text-sm font-semibold text-bg-root
                  transition-all duration-200
                  shadow-lg shadow-amber-900/20 hover:shadow-amber-800/30
                  border border-amber-300/20
                "
              >
                Přihlásit se
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <div className="relative h-5 w-5">
                {/* Animated hamburger → X */}
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-200 ${
                    mobileOpen ? 'top-2.5 rotate-45' : 'top-1'
                  }`}
                />
                <span
                  className={`absolute left-0 top-2.5 block h-0.5 w-5 bg-current transition-opacity duration-200 ${
                    mobileOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-200 ${
                    mobileOpen ? 'top-2.5 -rotate-45' : 'top-4'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`
          sm:hidden overflow-hidden transition-all duration-300 ease-out
          ${mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="border-t border-border-subtle bg-bg-root/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'text-amber-300 bg-amber-400/5'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}
                  `}
                >
                  <span className={`text-xs ${isActive ? 'text-amber-400/50' : 'text-text-faint/40'}`}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
