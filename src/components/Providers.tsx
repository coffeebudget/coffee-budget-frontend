"use client";

import { ReactNode, useState } from 'react';
import Menu from '@/components/Menu';
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance with configuration
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
      <div className="relative z-0">
        <Menu />
        <main>{children}</main>
      </div>
      <Toaster
        position="top-right"
        containerClassName=""
        containerStyle={{
          top: 16,
          right: 16,
          left: 'auto',
          bottom: 'auto',
          pointerEvents: 'none',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            maxWidth: '400px',
            minWidth: '200px',
            padding: '16px',
            zIndex: 9999,
            wordBreak: 'break-word' as const,
            pointerEvents: 'auto',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#ffffff',
              border: '1px solid #059669',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#ffffff',
              border: '1px solid #dc2626',
            },
          },
        }}
      />
    </SessionProvider>
    </QueryClientProvider>
  );
}
