// Mock fetch
global.fetch = jest.fn();

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
import { GET } from '../route';
import { getServerSession } from 'next-auth';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/payment-activities/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET /api/payment-activities/[id]', () => {
    it('should return 400 for invalid payment activity ID', async () => {
      const mockParams = Promise.resolve({ id: 'invalid' });
      const request = new NextRequest('http://localhost:3000/api/payment-activities/invalid');

      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid payment activity ID' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockParams = Promise.resolve({ id: '1' });
      const request = new NextRequest('http://localhost:3000/api/payment-activities/1');

      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when user has no access token', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31T23:59:59.999Z',
      });

      const mockParams = Promise.resolve({ id: '1' });
      const request = new NextRequest('http://localhost:3000/api/payment-activities/1');

      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should fetch payment activity successfully', async () => {
      const mockPaymentActivity = {
        id: 1,
        paymentAccountId: 1,
        externalId: 'paypal-123',
        activityType: 'payment',
        amount: 25.50,
        currency: 'USD',
        description: 'Coffee purchase',
        activityDate: '2024-12-01',
        reconciliationStatus: 'pending',
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
        json: () => Promise.resolve(mockPaymentActivity),
      });

      const mockParams = Promise.resolve({ id: '1' });
      const request = new NextRequest('http://localhost:3000/api/payment-activities/1');

      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPaymentActivity);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/payment-activities/1',
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
        status: 404,
        json: () => Promise.resolve({ message: 'Payment activity not found' }),
      });

      const mockParams = Promise.resolve({ id: '999' });
      const request = new NextRequest('http://localhost:3000/api/payment-activities/999');

      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Payment activity not found'
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

      const mockParams = Promise.resolve({ id: '1' });
      const request = new NextRequest('http://localhost:3000/api/payment-activities/1');

      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });
});
