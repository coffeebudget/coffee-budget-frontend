import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';

// Mock session for testing
export const mockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2024-12-31T23:59:59.999Z',
  accessToken: 'mock-access-token',
};

// Create a test query client with disabled retries
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions & {
    session?: typeof mockSession;
    queryClient?: QueryClient;
  }
) => {
  const { session = mockSession, queryClient = createTestQueryClient(), ...renderOptions } = options || {};
  
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );

  return render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
