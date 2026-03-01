import type { Metadata } from 'next';
import Script from 'next/script';
import { Bitter, Source_Sans_3 } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const bitter = Bitter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Hry.cz — České online hry',
    template: '%s | Hry.cz',
  },
  description: 'Hrací portál s českými karetními a deskovými hrami online. Hraj zdarma!',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hry.cz'),
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    siteName: 'Hry.cz',
    title: 'Hry.cz — České online hry',
    description: 'Hrací portál s českými karetními a deskovými hrami online. Hraj zdarma!',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={`${bitter.variable} ${sourceSans.variable}`}>
      <body className="bg-[var(--bg-root)] text-[var(--text-primary)] font-[family-name:var(--font-body)] antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
