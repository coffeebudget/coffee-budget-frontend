import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Mock session for testing
 * Can be overridden per test by passing custom session
 */
export const defaultMockSession = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    accessToken: 'mock-access-token',
  },
  expires: '2024-12-31T23:59:59.999Z',
};

/**
 * Create a test query client with disabled retries and caching
 * This ensures tests run quickly and don't interfere with each other
 */
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Options for createWrapper
 */
export interface CreateWrapperOptions {
  session?: typeof defaultMockSession;
  queryClient?: QueryClient;
}

/**
 * Create a reusable wrapper component with all necessary providers
 *
 * @example
 * ```tsx
 * const Wrapper = createWrapper({
 *   session: customSession,
 *   queryClient: customQueryClient,
 * });
 *
 * render(<MyComponent />, { wrapper: Wrapper });
 * ```
 */
export function createWrapper(options: CreateWrapperOptions = {}) {
  const { session = defaultMockSession, queryClient = createTestQueryClient() } = options;

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    );
  };
}

/**
 * Custom render function with providers pre-configured
 *
 * @example
 * ```tsx
 * renderWithProviders(<MyComponent />, {
 *   session: customSession,
 *   queryClient: customQueryClient,
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & CreateWrapperOptions
) {
  const { session, queryClient, ...renderOptions } = options || {};

  const Wrapper = createWrapper({ session, queryClient });

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

/**
 * Create a wrapper with custom session
 * Useful for testing authenticated vs unauthenticated states
 *
 * @example
 * ```tsx
 * // Test unauthenticated state
 * const UnauthWrapper = createWrapperWithSession(null);
 * render(<MyComponent />, { wrapper: UnauthWrapper });
 *
 * // Test with custom user
 * const AdminWrapper = createWrapperWithSession({
 *   user: { ...defaultMockSession.user, role: 'admin' }
 * });
 * ```
 */
export function createWrapperWithSession(session: typeof defaultMockSession | null) {
  return createWrapper({ session: session || undefined });
}

/**
 * Create a wrapper with custom query client
 * Useful for testing specific React Query configurations
 *
 * @example
 * ```tsx
 * const queryClient = new QueryClient({
 *   defaultOptions: {
 *     queries: { staleTime: 5000 }
 *   }
 * });
 *
 * const Wrapper = createWrapperWithQueryClient(queryClient);
 * render(<MyComponent />, { wrapper: Wrapper });
 * ```
 */
export function createWrapperWithQueryClient(queryClient: QueryClient) {
  return createWrapper({ queryClient });
}
