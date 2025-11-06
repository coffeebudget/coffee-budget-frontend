/**
 * API mocking utilities using MSW (Mock Service Worker)
 *
 * This file provides convenient access to MSW handlers and utilities
 * for mocking API calls in tests.
 *
 * @example
 * ```tsx
 * import { server, setupMockServer, mockApiSuccess, mockApiError } from '@/test-utils/api-mocks';
 *
 * // In your test setup
 * beforeAll(() => setupMockServer());
 *
 * // Mock a successful response
 * mockApiSuccess('/transactions', [transaction1, transaction2]);
 *
 * // Mock an error response
 * mockApiError('/transactions', 'Failed to fetch', 500);
 *
 * // Override specific handler for one test
 * server.use(
 *   http.get('/transactions', () => {
 *     return HttpResponse.json({ data: customData });
 *   })
 * );
 * ```
 */

import { http, HttpResponse, HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

// Re-export handlers for direct access
export { handlers } from '../mocks/handlers';
export { server } from '../mocks/server';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Setup MSW server for testing
 * Call this in your test setup (beforeAll)
 */
export function setupMockServer() {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}

/**
 * Create a success response mock
 */
export function createSuccessResponse(data: any, message = 'Success') {
  return HttpResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * Create an error response mock
 */
export function createErrorResponse(error: string, status = 500) {
  return HttpResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Create a paginated response mock
 */
export function createPaginatedResponse(
  data: any[],
  options: {
    page?: number;
    limit?: number;
    total?: number;
  } = {}
) {
  const { page = 1, limit = 20, total = data.length } = options;

  return HttpResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Mock a successful API call
 *
 * @example
 * ```tsx
 * mockApiSuccess('/transactions', transactions);
 * mockApiSuccess('/transactions/1', transaction);
 * ```
 */
export function mockApiSuccess(endpoint: string, data: any, message = 'Success') {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.get(url, () => createSuccessResponse(data, message));
}

/**
 * Mock an API error
 *
 * @example
 * ```tsx
 * mockApiError('/transactions', 'Failed to fetch transactions', 500);
 * mockApiError('/transactions/999', 'Transaction not found', 404);
 * ```
 */
export function mockApiError(endpoint: string, error: string, status = 500) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.get(url, () => createErrorResponse(error, status));
}

/**
 * Mock a POST request success
 */
export function mockApiPostSuccess(endpoint: string, responseData: any, status = 201) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.post(url, () =>
    HttpResponse.json(
      {
        success: true,
        data: responseData,
        message: 'Created successfully',
      },
      { status }
    )
  );
}

/**
 * Mock a POST request error
 */
export function mockApiPostError(endpoint: string, error: string, status = 400) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.post(url, () => createErrorResponse(error, status));
}

/**
 * Mock a PUT request success
 */
export function mockApiPutSuccess(endpoint: string, responseData: any) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.put(url, () =>
    HttpResponse.json({
      success: true,
      data: responseData,
      message: 'Updated successfully',
    })
  );
}

/**
 * Mock a PUT request error
 */
export function mockApiPutError(endpoint: string, error: string, status = 400) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.put(url, () => createErrorResponse(error, status));
}

/**
 * Mock a DELETE request success
 */
export function mockApiDeleteSuccess(endpoint: string) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.delete(url, () =>
    HttpResponse.json({
      success: true,
      message: 'Deleted successfully',
    })
  );
}

/**
 * Mock a DELETE request error
 */
export function mockApiDeleteError(endpoint: string, error: string, status = 400) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.delete(url, () => createErrorResponse(error, status));
}

/**
 * Mock authentication success
 */
export function mockAuthSuccess(accessToken = 'mock-access-token') {
  return http.post(`${API_BASE_URL}/auth/signin`, () =>
    HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken,
        refreshToken: 'mock-refresh-token',
      },
      message: 'Login successful',
    })
  );
}

/**
 * Mock authentication failure
 */
export function mockAuthFailure(error = 'Invalid credentials') {
  return http.post(`${API_BASE_URL}/auth/signin`, () =>
    createErrorResponse(error, 401)
  );
}

/**
 * Mock session endpoint
 */
export function mockSessionSuccess(session: any) {
  return http.get(`${API_BASE_URL}/auth/session`, () =>
    HttpResponse.json(session)
  );
}

/**
 * Mock unauthorized access
 */
export function mockUnauthorized(endpoint: string) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.get(url, () =>
    createErrorResponse('Unauthorized', 401)
  );
}

/**
 * Create a custom handler for complex scenarios
 *
 * @example
 * ```tsx
 * const handler = createCustomHandler('get', '/transactions', async ({ request }) => {
 *   const url = new URL(request.url);
 *   const type = url.searchParams.get('type');
 *
 *   if (type === 'expense') {
 *     return createSuccessResponse(expenseTransactions);
 *   }
 *   return createSuccessResponse(allTransactions);
 * });
 * ```
 */
export function createCustomHandler(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  endpoint: string,
  resolver: Parameters<typeof http.get>[1]
): HttpHandler {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http[method](url, resolver);
}

/**
 * Delay API response for testing loading states
 *
 * @example
 * ```tsx
 * server.use(
 *   mockApiSuccess('/transactions', transactions)
 *   // or with delay
 *   http.get('/transactions', async () => {
 *     await delay(1000);
 *     return createSuccessResponse(transactions);
 *   })
 * );
 * ```
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock network error
 */
export function mockNetworkError(endpoint: string) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return http.get(url, () => {
    return HttpResponse.error();
  });
}
