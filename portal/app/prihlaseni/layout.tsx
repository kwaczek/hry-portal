import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Přihlášení',
  description: 'Přihlas se na Hry.cz — Google účet nebo email. Zaregistruj se zdarma!',
};

export default function PrihlaseniLayout({ children }: { children: React.ReactNode }) {
  return children;
}
