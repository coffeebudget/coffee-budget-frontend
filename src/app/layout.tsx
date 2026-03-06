import { ReactNode } from 'react';
import { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import '@/styles/globals.css'; // Ensure global styles are imported
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Coffee Budget',
  description: 'Your finances, brewed to perfection. Envelope budgeting, automatic bank sync, and AI-powered insights.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Coffee Budget',
    description: 'Your finances, brewed to perfection.',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const serif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-serif',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body
        data-new-gr-c-s-check-loaded=""
        data-gr-ext-installed=""
        suppressHydrationWarning={true}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
