import { ReactNode } from 'react';
import '@/styles/globals.css'; // Ensure global styles are imported
import Providers from '@/components/Providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
