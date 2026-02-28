import type { Metadata } from 'next';
import Script from 'next/script';
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
    <html lang="cs" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="bg-[#08080e] text-gray-100 font-[family-name:var(--font-body)] antialiased min-h-screen">
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
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
