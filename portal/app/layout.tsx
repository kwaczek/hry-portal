import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="cs">
      <body className="bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
