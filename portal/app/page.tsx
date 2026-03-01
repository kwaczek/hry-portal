import Link from 'next/link';
import { Badge } from '@/components/ui';

// Suit SVG icons for decorative use
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

interface GameCardProps {
  title: string;
  description: string;
  href?: string;
  playable: boolean;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  playerLabel?: string;
}

function GameCard({ title, description, href, playable, icon, accentColor, glowColor, playerLabel }: GameCardProps) {
  const content = (
    <div className={`
      group relative overflow-hidden rounded-2xl border border-border-subtle
      bg-bg-card
      transition-all duration-500
      ${playable ? 'hover:border-border-strong hover:bg-bg-elevated hover:shadow-2xl cursor-pointer hover:scale-[1.02]' : 'opacity-60'}
    `}
    style={playable ? { '--glow': glowColor } as React.CSSProperties : undefined}
    >
      {/* Glow effect on hover */}
      {playable && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${glowColor}, transparent 70%)`,
          }}
        />
      )}

      <div className="relative p-6 sm:p-8">
        {/* Badge */}
        <div className="mb-5">
          {playable ? (
            <Badge variant="success">{playerLabel ?? 'Online'}</Badge>
          ) : (
            <Badge>Připravujeme</Badge>
          )}
        </div>

        {/* Icon */}
        <div className="mb-5" style={{ color: accentColor }}>
          {icon}
        </div>

        {/* Text */}
        <h3 className="text-xl font-bold font-[family-name:var(--font-display)] text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          {description}
        </p>

        {/* Play arrow */}
        {playable && (
          <div className="mt-6 flex items-center gap-2 text-sm font-medium transition-colors group-hover:text-text-primary" style={{ color: accentColor }}>
            Hrát
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (playable && href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function Home() {
  return (
    <div className="relative">
      {/* Atmospheric background — warm amber glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,160,74,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[500px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(45,107,59,0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          {/* Floating suit icons */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <HeartIcon className="absolute top-8 left-[15%] h-8 w-8 text-card-red-500/15 animate-[drift_20s_ease-in-out_infinite]" />
            <LeafIcon className="absolute top-20 right-[20%] h-6 w-6 text-felt-600/15 animate-[drift_23s_ease-in-out_infinite_1s]" />
            <BellIcon className="absolute bottom-4 left-[25%] h-7 w-7 text-amber-500/12 animate-[drift_18s_ease-in-out_infinite_2s]" />
            <AcornIcon className="absolute bottom-8 right-[15%] h-6 w-6 text-amber-700/12 animate-[drift_22s_ease-in-out_infinite_0.5s]" />
          </div>

          <div className="relative animate-[fadeInUp_0.6s_ease-out]">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight leading-[1.1]">
              České hry
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                online
              </span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-text-secondary max-w-lg mx-auto leading-relaxed">
              Karetní a deskové hry pro skvělou zábavu.
              <br className="hidden sm:block" />
              Bez registrace, zdarma, česky.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/prsi"
                className="
                  inline-flex items-center gap-2.5 rounded-xl
                  bg-amber-400 hover:bg-amber-300 px-8 py-3.5
                  text-base font-semibold text-bg-root
                  shadow-xl shadow-amber-900/25 hover:shadow-amber-800/35
                  transition-all duration-300 hover:scale-105
                  border border-amber-300/20
                "
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
                </svg>
                Hrát Prší
              </Link>
              <Link
                href="/zebricek"
                className="
                  inline-flex items-center gap-2 rounded-xl
                  bg-bg-elevated hover:bg-bg-hover px-7 py-3.5
                  text-sm font-medium text-text-secondary hover:text-text-primary
                  border border-border-default hover:border-border-strong
                  transition-all duration-300
                "
              >
                Žebříček hráčů
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <section className="relative pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-widest mb-6 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            Dostupné hry
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
              <GameCard
                title="Prší"
                description="Český národní karetní hra. Klasická pravidla nebo varianta se stohováním sedmiček. 2–4 hráči."
                href="/prsi"
                playable
                playerLabel="2–4 hráči"
                icon={<HeartIcon className="h-10 w-10" />}
                accentColor="#c41e3a"
                glowColor="rgba(196,30,58,0.06)"
              />
            </div>

            <div className="animate-[fadeInUp_0.6s_ease-out_0.25s_both]">
              <GameCard
                title="Dáma"
                description="Klasická desková strategie. Přeskoč soupeřovy kameny a ovládni celou desku."
                playable={false}
                icon={
                  <svg viewBox="0 0 40 40" className="h-10 w-10" fill="currentColor">
                    <rect x="4" y="4" width="8" height="8" rx="1" opacity="0.8" />
                    <rect x="20" y="4" width="8" height="8" rx="1" opacity="0.4" />
                    <rect x="12" y="12" width="8" height="8" rx="1" opacity="0.6" />
                    <rect x="28" y="12" width="8" height="8" rx="1" opacity="0.3" />
                    <rect x="4" y="20" width="8" height="8" rx="1" opacity="0.5" />
                    <rect x="20" y="20" width="8" height="8" rx="1" opacity="0.7" />
                  </svg>
                }
                accentColor="#6366f1"
                glowColor="rgba(99,102,241,0.06)"
              />
            </div>

            <div className="animate-[fadeInUp_0.6s_ease-out_0.35s_both]">
              <GameCard
                title="Žolíky"
                description="Sbírej skupiny a řady karet. Populární rodinná hra pro 2–4 hráče plná taktiky."
                playable={false}
                icon={
                  <svg viewBox="0 0 40 40" className="h-10 w-10" fill="currentColor">
                    <rect x="5" y="8" width="18" height="24" rx="2" opacity="0.3" />
                    <rect x="10" y="5" width="18" height="24" rx="2" opacity="0.5" />
                    <rect x="15" y="2" width="18" height="24" rx="2" opacity="0.8" />
                  </svg>
                }
                accentColor="#d4a04a"
                glowColor="rgba(212,160,74,0.06)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
