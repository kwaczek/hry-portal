import Link from 'next/link';

/* ─── Suit Icons ─── */
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C9.24 2 7 4.24 7 7v4l-2 3v1h14v-1l-2-3V7c0-2.76-2.24-5-5-5zm0 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" />
    </svg>
  );
}

function AcornIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C9 2 6.5 4 6 7h12c-.5-3-3-5-6-5zM5 8c-.6 0-1 .4-1 1v1c0 .6.4 1 1 1h14c.6 0 1-.4 1-1V9c0-.6-.4-1-1-1H5zm2 4c0 3.3 2.2 6 5 7 2.8-1 5-3.7 5-7H7z" />
    </svg>
  );
}

/* ─── Decorative card fan for hero ─── */
function CardFan() {
  const cards = [
    { rotate: -18, x: -40, suit: '♥', color: '#c41e3a', rank: 'K' },
    { rotate: -8, x: -15, suit: '♣', color: '#2d8b50', rank: 'A' },
    { rotate: 3, x: 10, suit: '♦', color: '#d4a04a', rank: '7' },
    { rotate: 14, x: 35, suit: '♠', color: '#8c7e6a', rank: 'S' },
  ];

  return (
    <div className="relative h-32 sm:h-40 w-48 sm:w-56 mx-auto">
      {cards.map((card, i) => (
        <div
          key={i}
          className="absolute top-0 left-1/2 w-16 sm:w-20 h-24 sm:h-28 rounded-lg border border-amber-400/10 shadow-xl"
          style={{
            transform: `translateX(${card.x}px) rotate(${card.rotate}deg)`,
            transformOrigin: 'bottom center',
            background: 'linear-gradient(135deg, #1e1711 0%, #231c14 50%, #1a1410 100%)',
            animationDelay: `${i * 0.1}s`,
          }}
        >
          <div className="absolute inset-[3px] rounded-md border border-amber-400/5 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[10px] sm:text-xs font-bold" style={{ color: card.color }}>{card.rank}</span>
            <span className="text-lg sm:text-xl" style={{ color: card.color }}>{card.suit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Pub Table Game Card ─── */
interface GameTableProps {
  title: string;
  description: string;
  href?: string;
  playable: boolean;
  suitIcon: React.ReactNode;
  playerLabel?: string;
  delay: string;
}

function GameTable({ title, description, href, playable, suitIcon, playerLabel, delay }: GameTableProps) {
  const inner = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        transition-all duration-500
        ${playable
          ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1'
          : 'opacity-50 grayscale-[0.3]'}
      `}
      style={{ animationDelay: delay }}
    >
      {/* Wood frame border */}
      <div className={`
        rounded-2xl p-[2px]
        ${playable
          ? 'bg-gradient-to-b from-amber-700/40 via-amber-900/30 to-amber-950/40'
          : 'bg-gradient-to-b from-text-faint/20 to-text-faint/10'}
      `}>
        <div className={`
          relative rounded-[14px] overflow-hidden
          ${playable ? 'bg-felt-900' : 'bg-bg-card'}
        `}>
          {/* Felt texture overlay for playable tables */}
          {playable && (
            <div
              className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
                backgroundSize: '64px 64px',
              }}
            />
          )}

          {/* Table lamp glow from top */}
          {playable && (
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212,160,74,0.15) 0%, transparent 70%)',
              }}
            />
          )}

          <div className="relative p-6 sm:p-7">
            {/* Status indicator */}
            <div className="flex items-center justify-between mb-5">
              {playable ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-felt-400 shadow-[0_0_6px_rgba(61,190,112,0.4)] animate-[pulse-glow_3s_ease-in-out_infinite]" />
                  <span className="text-xs font-medium text-felt-300 tracking-wide">{playerLabel ?? 'Online'}</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-text-faint tracking-widest uppercase">Brzy</span>
              )}
            </div>

            {/* Suit icon — large, atmospheric */}
            <div className="mb-5 relative">
              <div className={`
                h-14 w-14 rounded-xl flex items-center justify-center
                ${playable
                  ? 'bg-felt-800/60 shadow-inner'
                  : 'bg-bg-hover/40'}
              `}>
                {suitIcon}
              </div>
            </div>

            {/* Title & description */}
            <h3 className={`
              text-xl font-bold font-[family-name:var(--font-display)] mb-2
              ${playable ? 'text-amber-50' : 'text-text-muted'}
            `}>
              {title}
            </h3>
            <p className={`
              text-sm leading-relaxed
              ${playable ? 'text-felt-200/60' : 'text-text-faint'}
            `}>
              {description}
            </p>

            {/* CTA */}
            {playable && (
              <div className="mt-6 flex items-center gap-2">
                <span className="
                  inline-flex items-center gap-2 rounded-lg
                  bg-amber-400/10 border border-amber-400/20
                  px-4 py-2 text-sm font-semibold text-amber-300
                  group-hover:bg-amber-400/20 group-hover:border-amber-400/30
                  group-hover:text-amber-200
                  transition-all duration-300
                ">
                  Sednout ke stolu
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            )}

            {/* Empty table sign for "coming soon" */}
            {!playable && (
              <div className="mt-6">
                <span className="
                  inline-block rounded-md border border-dashed border-text-faint/30
                  px-3 py-1.5 text-xs text-text-faint
                  font-[family-name:var(--font-display)] italic
                ">
                  Stůl se připravuje...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (playable && href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return inner;
}

/* ─── Homepage ─── */
export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Warm overhead light cone */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px]"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,160,74,0.07) 0%, rgba(212,160,74,0.02) 40%, transparent 70%)',
          }}
        />
        {/* Subtle green ambient from tables below */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(45,139,80,0.04) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Floating suit icons — very subtle */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <HeartIcon className="absolute top-[12%] left-[8%] h-6 w-6 text-card-red-500/8 animate-[drift_25s_ease-in-out_infinite]" />
        <LeafIcon className="absolute top-[18%] right-[12%] h-5 w-5 text-felt-600/8 animate-[drift_28s_ease-in-out_infinite_2s]" />
        <BellIcon className="absolute top-[45%] left-[5%] h-5 w-5 text-amber-500/6 animate-[drift_22s_ease-in-out_infinite_4s]" />
        <AcornIcon className="absolute top-[35%] right-[7%] h-4 w-4 text-amber-700/6 animate-[drift_30s_ease-in-out_infinite_1s]" />
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center animate-[fadeInUp_0.7s_ease-out]">
            {/* Card fan decoration */}
            <div className="mb-6 sm:mb-8 animate-[fadeIn_1s_ease-out_0.3s_both]">
              <CardFan />
            </div>

            {/* Tagline chip */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-[pulse-glow_2s_ease-in-out_infinite]" />
              <span className="text-xs font-medium text-amber-300/80 tracking-wide">Česká hospodská hra online</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight leading-[1.08]">
              <span className="text-text-primary">Sedni ke stolu,</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 animate-[flicker_8s_ease-in-out_infinite]">
                rozdej karty
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-text-secondary max-w-md mx-auto leading-relaxed">
              České karetní hry v prohlížeči.
              <br className="hidden sm:block" />
              Bez registrace, zdarma, s přáteli nebo proti botům.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/prsi"
                className="
                  group/cta relative inline-flex items-center gap-2.5 rounded-xl
                  bg-gradient-to-b from-amber-400 to-amber-500
                  hover:from-amber-300 hover:to-amber-400
                  px-8 py-3.5 text-base font-bold text-bg-root
                  shadow-xl shadow-amber-900/30 hover:shadow-amber-800/40
                  transition-all duration-300 hover:scale-105
                  border border-amber-300/30
                "
              >
                <svg className="h-5 w-5 transition-transform group-hover/cta:scale-110" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
                </svg>
                Hrát Prší
              </Link>
              <Link
                href="/zebricek"
                className="
                  inline-flex items-center gap-2 rounded-xl
                  bg-bg-elevated/80 hover:bg-bg-hover px-7 py-3.5
                  text-sm font-medium text-text-secondary hover:text-text-primary
                  border border-border-default hover:border-border-strong
                  transition-all duration-300 backdrop-blur-sm
                "
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505l4.457.519a.75.75 0 01-.174 1.489l-9.06-1.056a.75.75 0 01.174-1.489L10.25 16.014V4.51a31.743 31.743 0 00-3.339.254l1.77 7.849a.75.75 0 01-.387.832A4.981 4.981 0 016 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.702-7.545c-.37.07-.738.148-1.103.232a.75.75 0 01-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2zM5.092 12.35L6 8.348l.908 4.003a3.503 3.503 0 01-1.816 0zm8 0L14 8.348l.908 4.003a3.503 3.503 0 01-1.816 0z" clipRule="evenodd" />
                </svg>
                Žebříček hráčů
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divider — subtle wood grain line */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/15 to-transparent" />
      </div>

      {/* ── GAME TABLES ── */}
      <section className="relative pt-10 pb-20 sm:pt-14 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-8 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            <div className="h-px flex-1 bg-gradient-to-r from-border-subtle to-transparent" />
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-[0.2em] font-[family-name:var(--font-display)]">
              Herní stoly
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-border-subtle to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
              <GameTable
                title="Prší"
                description="Český karetní klasik. Klasická pravidla nebo s kumštem — stohování sedmiček a es."
                href="/prsi"
                playable
                playerLabel="2–4 hráči"
                suitIcon={<HeartIcon className="h-7 w-7 text-card-red-400" />}
                delay="0s"
              />
            </div>

            <div className="animate-[fadeInUp_0.6s_ease-out_0.25s_both]">
              <GameTable
                title="Dáma"
                description="Přeskoč soupeřovy kameny a ovládni celou desku. Česká verze klasické strategie."
                playable={false}
                suitIcon={
                  <svg viewBox="0 0 28 28" className="h-7 w-7 text-text-faint" fill="currentColor">
                    <rect x="2" y="2" width="6" height="6" rx="0.5" opacity="0.7" />
                    <rect x="14" y="2" width="6" height="6" rx="0.5" opacity="0.3" />
                    <rect x="8" y="8" width="6" height="6" rx="0.5" opacity="0.5" />
                    <rect x="20" y="8" width="6" height="6" rx="0.5" opacity="0.2" />
                    <rect x="2" y="14" width="6" height="6" rx="0.5" opacity="0.4" />
                    <rect x="14" y="14" width="6" height="6" rx="0.5" opacity="0.6" />
                    <rect x="8" y="20" width="6" height="6" rx="0.5" opacity="0.3" />
                    <rect x="20" y="20" width="6" height="6" rx="0.5" opacity="0.5" />
                  </svg>
                }
                delay="0.1s"
              />
            </div>

            <div className="animate-[fadeInUp_0.6s_ease-out_0.35s_both]">
              <GameTable
                title="Žolíky"
                description="Sbírej skupiny a řady karet. Rodinná hra plná taktiky pro 2–4 hráče."
                playable={false}
                suitIcon={
                  <svg viewBox="0 0 28 28" className="h-7 w-7 text-text-faint" fill="currentColor">
                    <rect x="3" y="7" width="13" height="17" rx="1.5" opacity="0.25" />
                    <rect x="7" y="4" width="13" height="17" rx="1.5" opacity="0.4" />
                    <rect x="11" y="1" width="13" height="17" rx="1.5" opacity="0.6" />
                  </svg>
                }
                delay="0.2s"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM ATMOSPHERE — hospoda closing line ── */}
      <section className="relative pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/10 to-transparent mb-8" />
          <p className="text-sm text-text-faint font-[family-name:var(--font-display)] italic">
            &ldquo;V hospodě u karet — kde jinde?&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}
