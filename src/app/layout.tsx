import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // We will update this file next

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IP Thread',
  description: 'The Future of Creative Provenance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}