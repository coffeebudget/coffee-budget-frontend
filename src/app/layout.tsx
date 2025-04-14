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
        <Menu />
        <SessionProvider>
          <main>{children}</main>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
