import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // This line imports your global styles
import { Providers } from './providers'; // This wraps your app with necessary contexts

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