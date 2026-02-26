import { ReactNode } from 'react';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import '@/styles/globals.css'; // Ensure global styles are imported
import Providers from '@/components/Providers';

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
