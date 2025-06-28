"use client";

import { ReactNode } from 'react';
import Menu from '@/components/Menu';
import '@/styles/globals.css'; // Ensure global styles are imported
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body 
        data-new-gr-c-s-check-loaded="" 
        data-gr-ext-installed=""
        suppressHydrationWarning={true}
      >
        <div className="relative z-0">
          <SessionProvider>
            <Menu />
            <main>{children}</main>
          </SessionProvider>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 6000,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              fontSize: '14px',
              maxWidth: '500px',
              padding: '16px',
              zIndex: 9999,
            },
            success: {
              duration: 8000,
              style: {
                background: '#10b981',
                color: '#ffffff',
                border: '1px solid #059669',
              },
            },
            error: {
              duration: 6000,
              style: {
                background: '#ef4444',
                color: '#ffffff',
                border: '1px solid #dc2626',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
