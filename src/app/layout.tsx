"use client";

import { ReactNode } from 'react';
import Menu from '@/components/Menu';
import '@/styles/globals.css'; // Ensure global styles are imported
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="relative z-0">
          <SessionProvider>
            <Menu />
            <main>{children}</main>
          </SessionProvider>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
