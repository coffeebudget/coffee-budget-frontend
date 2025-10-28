import { http, HttpResponse } from 'msw';
import { mockTransactions, mockCategories, mockBankAccounts, mockUsers } from '../test-utils/fixtures';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Mock API handlers
export const handlers = [
  // Authentication endpoints
  http.get(`${API_BASE_URL}/auth/session`, () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      },
      expires: '2024-12-31T23:59:59.999Z',
      accessToken: 'mock-access-token',
    });
  }),

  http.post(`${API_BASE_URL}/auth/signin`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
      message: 'Login successful',
    });
  }),

  http.post(`${API_BASE_URL}/auth/signout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logout successful',
    });
  }),

  // Dashboard endpoints
  http.get(`${API_BASE_URL}/dashboard`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        stats: {
          totalIncome: 5000.00,
          totalExpenses: 3000.00,
          netAmount: 2000.00,
          transactionCount: 25,
        },
        recentTransactions: mockTransactions.slice(0, 5),
        alerts: [],
      },
    });
  }),

  // Transaction endpoints
  http.get(`${API_BASE_URL}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return HttpResponse.json({
      success: true,
      data: mockTransactions.slice(start, end),
      pagination: {
        page,
        limit,
        total: mockTransactions.length,
        totalPages: Math.ceil(mockTransactions.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/transactions/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const transaction = mockTransactions.find(t => t.id === id);
    
    if (!transaction) {
      return HttpResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: transaction,
    });
  }),

  http.post(`${API_BASE_URL}/transactions`, async ({ request }) => {
    const body = await request.json();
    const newTransaction = {
      id: mockTransactions.length + 1,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: newTransaction,
      message: 'Transaction created successfully',
    }, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/transactions/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json();
    const transaction = mockTransactions.find(t => t.id === id);
    
    if (!transaction) {
      return HttpResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    const updatedTransaction = {
      ...transaction,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully',
    });
  }),

  http.delete(`${API_BASE_URL}/transactions/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const transaction = mockTransactions.find(t => t.id === id);
    
    if (!transaction) {
      return HttpResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  }),

  // Category endpoints
  http.get(`${API_BASE_URL}/categories`, () => {
    return HttpResponse.json({
      success: true,
      data: mockCategories,
    });
  }),

  http.get(`${API_BASE_URL}/categories/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const category = mockCategories.find(c => c.id === id);
    
    if (!category) {
      return HttpResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: category,
    });
  }),

  http.post(`${API_BASE_URL}/categories`, async ({ request }) => {
    const body = await request.json();
    const newCategory = {
      id: mockCategories.length + 1,
      ...body,
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: newCategory,
      message: 'Category created successfully',
    }, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/categories/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json();
    const category = mockCategories.find(c => c.id === id);
    
    if (!category) {
      return HttpResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    const updatedCategory = {
      ...category,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
    });
  }),

  http.delete(`${API_BASE_URL}/categories/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const category = mockCategories.find(c => c.id === id);
    
    if (!category) {
      return HttpResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  }),

  // Bank account endpoints
  http.get(`${API_BASE_URL}/bank-accounts`, () => {
    return HttpResponse.json({
      success: true,
      data: mockBankAccounts,
    });
  }),

  http.get(`${API_BASE_URL}/bank-accounts/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const bankAccount = mockBankAccounts.find(b => b.id === id);
    
    if (!bankAccount) {
      return HttpResponse.json(
        { success: false, error: 'Bank account not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: bankAccount,
    });
  }),

  http.post(`${API_BASE_URL}/bank-accounts`, async ({ request }) => {
    const body = await request.json();
    const newBankAccount = {
      id: mockBankAccounts.length + 1,
      ...body,
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: newBankAccount,
      message: 'Bank account created successfully',
    }, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/bank-accounts/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json();
    const bankAccount = mockBankAccounts.find(b => b.id === id);
    
    if (!bankAccount) {
      return HttpResponse.json(
        { success: false, error: 'Bank account not found' },
        { status: 404 }
      );
    }
    
    const updatedBankAccount = {
      ...bankAccount,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: updatedBankAccount,
      message: 'Bank account updated successfully',
    });
  }),

  http.delete(`${API_BASE_URL}/bank-accounts/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const bankAccount = mockBankAccounts.find(b => b.id === id);
    
    if (!bankAccount) {
      return HttpResponse.json(
        { success: false, error: 'Bank account not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Bank account deleted successfully',
    });
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: mockUsers[0],
    });
  }),

  http.put(`${API_BASE_URL}/users/profile`, async ({ request }) => {
    const body = await request.json();
    const updatedUser = {
      ...mockUsers[0],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  }),

  // GoCardless endpoints
  http.get(`${API_BASE_URL}/gocardless/banks`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'bank_123456789',
          name: 'Test Bank',
          logo: 'https://example.com/test-bank-logo.png',
          bic: 'TESTBANK',
          country: 'US',
          supportedAccountTypes: ['checking', 'savings'],
        },
        {
          id: 'bank_987654321',
          name: 'Credit Bank',
          logo: 'https://example.com/credit-bank-logo.png',
          bic: 'CREDITBANK',
          country: 'US',
          supportedAccountTypes: ['credit'],
        },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/gocardless/connect`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        connectUrl: 'https://connect-sandbox.gocardless.com/connect/123456789',
        state: 'test-state-123',
      },
      message: 'GoCardless connection initiated',
    });
  }),

  http.post(`${API_BASE_URL}/gocardless/import`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalAccounts: 2,
        successfulImports: 2,
        totalNewTransactions: 15,
        totalDuplicates: 3,
        totalPendingDuplicates: 2,
        balancesSynchronized: 2,
      },
      message: 'GoCardless import completed successfully',
    });
  }),

  // Recurring transactions endpoints
  http.get(`${API_BASE_URL}/recurring-transactions/unconfirmed-patterns`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          description: 'Monthly Netflix Subscription',
          amount: 15.99,
          frequency: 'monthly',
          confidence: 0.95,
          lastSeen: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          description: 'Weekly Grocery Shopping',
          amount: 85.50,
          frequency: 'weekly',
          confidence: 0.87,
          lastSeen: '2024-01-14T09:15:00Z',
        },
      ],
    });
  }),

  // Pending duplicates endpoints
  http.get(`${API_BASE_URL}/pending-duplicates`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          transactions: [
            { id: 1, description: 'Test Transaction 1', amount: 100.50 },
            { id: 2, description: 'Test Transaction 2', amount: 100.50 },
          ],
          similarity: 0.95,
          status: 'pending',
        },
      ],
    });
  }),

  // Tags endpoints
  http.get(`${API_BASE_URL}/tags`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'groceries', color: '#4ECDC4' },
        { id: 2, name: 'weekly', color: '#45B7D1' },
        { id: 3, name: 'monthly', color: '#96CEB4' },
      ],
    });
  }),

  // Error handlers
  http.get(`${API_BASE_URL}/error`, () => {
    return HttpResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/not-found`, () => {
    return HttpResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }),

  http.get(`${API_BASE_URL}/unauthorized`, () => {
    return HttpResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }),
];