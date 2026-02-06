// Mock fetch
global.fetch = jest.fn();

// Mock next/server to avoid NextRequest polyfill issues
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    method: string;
    private _body: string | undefined;
    constructor(url: string, init?: { method?: string; body?: string }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this._body = init?.body;
    }
    async json() { return JSON.parse(this._body || '{}'); }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        status: init?.status || 200,
        json: async () => body,
      }),
    },
  };
});

// Mock next-auth (must include default export for NextAuth())
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({ GET: jest.fn(), POST: jest.fn() })),
  getServerSession: jest.fn(),
}));

// Mock the auth route to prevent it from calling NextAuth
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3002';

// Import after mocks
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/payment-accounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET /api/payment-accounts', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when user has no access token', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should fetch payment accounts successfully', async () => {
      const mockPaymentAccounts = [
        {
          id: 1,
          displayName: 'PayPal Account',
          provider: 'paypal',
          isActive: true,
        },
        {
          id: 2,
          displayName: 'Klarna Account',
          provider: 'klarna',
          isActive: true,
        },
      ];

      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          accessToken: 'mock-token'
        },
        expires: '2024-12-31T23:59:59.999Z',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPaymentAccounts),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPaymentAccounts);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/payment-accounts',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-token',
          },
        })
      );
    });

    it('should handle backend API errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          accessToken: 'mock-token'
        },
        expires: '2024-12-31T23:59:59.999Z',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Internal Server Error'
      });
    });

    it('should handle network errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          accessToken: 'mock-token'
        },
        expires: '2024-12-31T23:59:59.999Z',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/payment-accounts', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/payment-accounts', {
        method: 'POST',
        body: JSON.stringify({
          displayName: 'Test PayPal',
          provider: 'paypal',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should create payment account successfully', async () => {
      const mockPaymentAccount = {
        id: 1,
        displayName: 'New PayPal Account',
        provider: 'paypal',
        isActive: true,
      };
      const accountData = {
        displayName: 'New PayPal Account',
        provider: 'paypal',
      };

      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          accessToken: 'mock-token'
        },
        expires: '2024-12-31T23:59:59.999Z',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPaymentAccount),
      });

      const request = new NextRequest('http://localhost:3000/api/payment-accounts', {
        method: 'POST',
        body: JSON.stringify(accountData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPaymentAccount);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/payment-accounts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: JSON.stringify(accountData),
        })
      );
    });

    it('should handle backend API errors on creation', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          email: 'test@example.com',
          accessToken: 'mock-token'
        },
        expires: '2024-12-31T23:59:59.999Z',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' }),
      });

      const request = new NextRequest('http://localhost:3000/api/payment-accounts', {
        method: 'POST',
        body: JSON.stringify({ displayName: 'Test', provider: 'paypal' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Bad Request'
      });
    });
  });
});
