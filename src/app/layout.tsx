import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LaguKu — Editor Not Angka Indonesia',
  description:
    'Platform kolaboratif untuk membuat, mengedit, dan memainkan lagu dengan not angka Indonesia. Mirip Google Docs untuk musik rohani.',
  keywords: 'not angka, lagu rohani, editor musik, kolaborasi, not angka indonesia',
  openGraph: {
    title: 'LaguKu — Editor Not Angka Indonesia',
    description: 'Platform kolaboratif editor not angka Indonesia',
    type: 'website',
  },
};

import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-music-surface text-music-text border border-music-border',
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
