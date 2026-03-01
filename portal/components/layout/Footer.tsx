import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-border-subtle">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/8 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                <path
                  d="M16 6C16 6 10 12 10 17C10 20.3 12.7 23 16 23C19.3 23 22 20.3 22 17C22 12 16 6 16 6Z"
                  fill="#d4a04a"
                  opacity="0.6"
                />
                <circle cx="13" cy="24" r="3" fill="#d4a04a" opacity="0.3" />
                <circle cx="19" cy="24" r="3" fill="#d4a04a" opacity="0.3" />
              </svg>
              <span className="text-sm font-bold font-[family-name:var(--font-display)] text-text-secondary">
                Hry<span className="text-amber-400/60">.cz</span>
              </span>
            </div>
            <p className="text-xs text-text-faint leading-relaxed max-w-[200px]">
              České karetní a deskové hry online. Zdarma, bez registrace, česky.
            </p>
          </div>

          {/* Games column */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
              Hry
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/prsi" className="text-sm text-text-faint hover:text-text-secondary transition-colors">
                  Prší
                </Link>
              </li>
              <li>
                <span className="text-sm text-text-faint/50">
                  Dáma <span className="text-[10px]">(brzy)</span>
                </span>
              </li>
              <li>
                <span className="text-sm text-text-faint/50">
                  Žolíky <span className="text-[10px]">(brzy)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Links column */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
              Portál
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/zebricek" className="text-sm text-text-faint hover:text-text-secondary transition-colors">
                  Žebříček
                </Link>
              </li>
              <li>
                <Link href="/prihlaseni" className="text-sm text-text-faint hover:text-text-secondary transition-colors">
                  Přihlášení
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Suit icons as decorative divider */}
            <div className="flex items-center gap-2 text-text-faint/30 text-xs">
              <span>♥</span>
              <span>♠</span>
              <span>♦</span>
              <span>♣</span>
            </div>

            <p className="text-xs text-text-faint/50 font-[family-name:var(--font-display)] italic">
              &ldquo;Kdo neumí prohrávat, neumí ani vyhrávat.&rdquo;
            </p>

            <p className="text-[11px] text-text-faint/40">
              &copy; {currentYear} Hry.cz
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
