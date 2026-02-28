import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prší Online',
  description: 'Hraj Prší online zdarma! Česká karetní klasika — hraj proti přátelům nebo soupeřům z celého světa.',
  openGraph: {
    title: 'Prší Online — Hry.cz',
    description: 'Česká karetní klasika online. 2-4 hráči, Elo žebříček, chat.',
  },
};

export default function PrsiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
