import type { Metadata } from 'next';
import { Outfit, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Navigation } from '@/components/layout/Navigation';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hry.cz — České online hry',
  description: 'Hrací portál s českými karetními a deskovými hrami online. Hraj zdarma!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="bg-[#08080e] text-gray-100 font-[family-name:var(--font-body)] antialiased min-h-screen">
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
