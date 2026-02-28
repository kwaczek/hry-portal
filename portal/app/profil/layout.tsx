import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil hráče',
  description: 'Profil hráče na Hry.cz — statistiky, Elo rating, historie zápasů.',
};

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
