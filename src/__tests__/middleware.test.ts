import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware } from '../middleware';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock Next.js server utilities
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url: URL) => ({ type: 'redirect', url: url.toString() })),
  },
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default implementations
    mockNextResponse.next.mockReturnValue({ type: 'next' } as any);
    mockNextResponse.redirect.mockImplementation((url: URL) => ({
      type: 'redirect',
      url: url.toString()
    } as any));
  });

  // Helper function to create mock NextRequest
  const createMockRequest = (pathname: string, baseUrl = 'http://localhost:3000'): NextRequest => {
    const url = new URL(pathname, baseUrl);
    return {
      nextUrl: {
        pathname,
        href: url.href,
      },
      url: url.href,
    } as NextRequest;
  };

  describe('Public Routes (No Authentication Required)', () => {
    it('should allow access to homepage (/) without authentication', async () => {
      const request = createMockRequest('/');

      const response = await middleware(request);

      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('should allow access to API routes without authentication', async () => {
      const apiRoutes = [
        '/api/auth/signin',
        '/api/auth/callback',
        '/api/transactions',
        '/api/categories',
      ];

      for (const route of apiRoutes) {
        jest.clearAllMocks();
        const request = createMockRequest(route);

        const response = await middleware(request);

        expect(response).toEqual({ type: 'next' });
        expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
        expect(mockGetToken).not.toHaveBeenCalled();
      }
    });

    it('should allow access to static files (paths with dots)', async () => {
      const staticPaths = [
        '/favicon.ico',
        '/logo.png',
        '/styles.css',
        '/script.js',
        '/images/banner.jpg',
      ];

      for (const path of staticPaths) {
        jest.clearAllMocks();
        const request = createMockRequest(path);

        const response = await middleware(request);

        expect(response).toEqual({ type: 'next' });
        expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
        expect(mockGetToken).not.toHaveBeenCalled();
      }
    });
  });

  describe('Protected Routes (Authentication Required)', () => {
    it('should allow authenticated users to access /dashboard', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/dashboard');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
    });

    it('should allow authenticated users to access /transactions', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/transactions');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
    });

    it('should allow authenticated users to access /categories', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/categories');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
    });

    it('should allow authenticated users to access nested protected routes', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const protectedRoutes = [
        '/dashboard/overview',
        '/transactions/import',
        '/categories/manage',
        '/budget-management',
        '/bank-accounts',
        '/credit-cards',
        '/pending-duplicates',
      ];

      for (const route of protectedRoutes) {
        jest.clearAllMocks();
        const request = createMockRequest(route);

        const response = await middleware(request);

        expect(mockGetToken).toHaveBeenCalledWith({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });
        expect(response).toEqual({ type: 'next' });
        expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Unauthenticated Access to Protected Routes', () => {
    it('should redirect unauthenticated users from /dashboard to homepage', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = createMockRequest('/dashboard');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', 'http://localhost:3000')
      );
      expect(response).toEqual({
        type: 'redirect',
        url: 'http://localhost:3000/',
      });
    });

    it('should redirect unauthenticated users from /transactions to homepage', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = createMockRequest('/transactions');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', 'http://localhost:3000')
      );
      expect(response).toEqual({
        type: 'redirect',
        url: 'http://localhost:3000/',
      });
    });

    it('should redirect unauthenticated users from nested routes to homepage', async () => {
      mockGetToken.mockResolvedValue(null);

      const protectedRoutes = [
        '/dashboard/overview',
        '/transactions/import',
        '/categories/manage',
        '/budget-management',
        '/bank-accounts/connect',
      ];

      for (const route of protectedRoutes) {
        jest.clearAllMocks();
        const request = createMockRequest(route);

        const response = await middleware(request);

        expect(mockGetToken).toHaveBeenCalledWith({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });
        expect(mockNextResponse.redirect).toHaveBeenCalledWith(
          new URL('/', 'http://localhost:3000')
        );
        expect(response).toEqual({
          type: 'redirect',
          url: 'http://localhost:3000/',
        });
      }
    });
  });

  describe('Token Validation', () => {
    it('should call getToken with correct parameters', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/dashboard');

      await middleware(request);

      expect(mockGetToken).toHaveBeenCalledWith({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      expect(mockGetToken).toHaveBeenCalledTimes(1);
    });

    it('should handle null token (no session)', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = createMockRequest('/dashboard');

      const response = await middleware(request);

      expect(mockNextResponse.redirect).toHaveBeenCalled();
      expect(response).toEqual({
        type: 'redirect',
        url: 'http://localhost:3000/',
      });
    });

    it('should handle undefined token', async () => {
      mockGetToken.mockResolvedValue(undefined as any);

      const request = createMockRequest('/dashboard');

      const response = await middleware(request);

      expect(mockNextResponse.redirect).toHaveBeenCalled();
      expect(response).toEqual({
        type: 'redirect',
        url: 'http://localhost:3000/',
      });
    });

    it('should accept valid token with minimal fields', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
      } as any);

      const request = createMockRequest('/dashboard');

      const response = await middleware(request);

      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
    });

    it('should accept valid token with complete user data', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      } as any);

      const request = createMockRequest('/dashboard');

      const response = await middleware(request);

      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with query parameters on public routes', async () => {
      const request = createMockRequest('/api/auth/callback?callbackUrl=%2Fdashboard');

      const response = await middleware(request);

      expect(response).toEqual({ type: 'next' });
      expect(mockGetToken).not.toHaveBeenCalled();
    });

    it('should handle requests with query parameters on protected routes', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/dashboard?tab=overview');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
    });

    it('should handle requests with hash fragments', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/transactions#recent');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
    });

    it('should redirect from protected route with different base URL', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = createMockRequest('/dashboard', 'https://coffeebudget.com');

      const response = await middleware(request);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', 'https://coffeebudget.com')
      );
      expect(response).toEqual({
        type: 'redirect',
        url: 'https://coffeebudget.com/',
      });
    });

    it('should handle trailing slashes on protected routes', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      const request = createMockRequest('/dashboard/');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
    });

    it('should handle case sensitivity in pathnames', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
      } as any);

      // Next.js routes are case-sensitive
      const request = createMockRequest('/Dashboard');

      const response = await middleware(request);

      expect(mockGetToken).toHaveBeenCalled();
      expect(response).toEqual({ type: 'next' });
    });
  });

  describe('Middleware Configuration', () => {
    it('should have correct matcher configuration', () => {
      const { config } = require('../middleware');

      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
      expect(config.matcher.length).toBeGreaterThan(0);
    });
  });
});
