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
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';

// Import after mocks
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET /api/transactions', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when user has no access token', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z',
      });

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should fetch transactions successfully', async () => {
      const mockTransactions = [
        { id: 1, description: 'Test Transaction', amount: 100.50 },
        { id: 2, description: 'Another Transaction', amount: -50.25 },
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
        json: () => Promise.resolve(mockTransactions),
      });

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTransactions);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/transactions',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
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
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Backend error'),
      });

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ 
        error: 'Failed to fetch transactions: Internal Server Error' 
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

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /api/transactions', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ description: 'Test', amount: 100 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should create transaction successfully', async () => {
      const mockTransaction = { id: 1, description: 'New Transaction', amount: 100.50 };
      const transactionData = { description: 'New Transaction', amount: 100.50 };

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
        json: () => Promise.resolve(mockTransaction),
      });

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTransaction);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/transactions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
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
        statusText: 'Bad Request',
      });

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ description: 'Test', amount: 100 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ 
        error: 'Failed to create transaction: Bad Request' 
      });
    });
  });
});
