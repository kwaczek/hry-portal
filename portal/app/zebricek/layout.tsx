import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Žebříček',
  description: 'Žebříček nejlepších hráčů na Hry.cz — Elo hodnocení, výherní statistiky.',
  openGraph: {
    title: 'Žebříček — Hry.cz',
    description: 'Nejlepší hráči karetních her online. Elo rating, výhry, statistiky.',
  },
};

export default function ZebricekLayout({ children }: { children: React.ReactNode }) {
  return children;
}
