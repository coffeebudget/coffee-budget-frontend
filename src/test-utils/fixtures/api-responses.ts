// API response test data fixtures

// Common API response structure
export interface MockApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: Record<string, any>;
}

// Success responses
export const mockSuccessResponse = <T>(data: T, message = 'Success'): MockApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const mockPaginatedResponse = <T>(
  data: T[],
  page = 1,
  limit = 20,
  total?: number
): MockApiResponse<T[]> => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total: total || data.length,
    totalPages: Math.ceil((total || data.length) / limit),
  },
});

// Error responses
export const mockErrorResponse = (message = 'An error occurred', status = 400): MockApiResponse => ({
  success: false,
  error: message,
  message,
});

export const mockValidationErrorResponse = (errors: Record<string, string[]>): MockApiResponse => ({
  success: false,
  error: 'Validation failed',
  message: 'Please check your input and try again',
  errors,
});

// HTTP status codes
export const mockHttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Common error messages
export const mockErrorMessages = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  NETWORK_ERROR: 'Network error',
  TIMEOUT: 'Request timeout',
  RATE_LIMIT: 'Rate limit exceeded',
};

// Authentication responses
export const mockAuthResponses = {
  login: {
    success: mockSuccessResponse({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    }, 'Login successful'),
    
    error: mockErrorResponse('Invalid credentials', mockHttpStatus.UNAUTHORIZED),
  },
  
  logout: {
    success: mockSuccessResponse(null, 'Logout successful'),
    error: mockErrorResponse('Logout failed', mockHttpStatus.INTERNAL_SERVER_ERROR),
  },
  
  refreshToken: {
    success: mockSuccessResponse({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: 3600,
    }, 'Token refreshed successfully'),
    
    error: mockErrorResponse('Invalid refresh token', mockHttpStatus.UNAUTHORIZED),
  },
};

// Transaction API responses
export const mockTransactionApiResponses = {
  getTransactions: mockPaginatedResponse([
    { id: 1, description: 'Test Transaction 1', amount: 100.50 },
    { id: 2, description: 'Test Transaction 2', amount: 200.75 },
  ]),
  
  getTransaction: mockSuccessResponse({
    id: 1,
    description: 'Test Transaction',
    amount: 100.50,
    type: 'expense',
    status: 'executed',
  }),
  
  createTransaction: mockSuccessResponse({
    id: 3,
    description: 'New Transaction',
    amount: 150.00,
    type: 'expense',
    status: 'executed',
  }, 'Transaction created successfully'),
  
  updateTransaction: mockSuccessResponse({
    id: 1,
    description: 'Updated Transaction',
    amount: 100.50,
    type: 'expense',
    status: 'executed',
  }, 'Transaction updated successfully'),
  
  deleteTransaction: mockSuccessResponse(null, 'Transaction deleted successfully'),
  
  importTransactions: mockSuccessResponse({
    totalRows: 100,
    processedRows: 95,
    newTransactions: 90,
    duplicates: 5,
    errors: [],
  }, 'Transactions imported successfully'),
};

// Category API responses
export const mockCategoryApiResponses = {
  getCategories: mockSuccessResponse([
    { id: 1, name: 'Food & Dining', color: '#FF6B6B' },
    { id: 2, name: 'Transportation', color: '#4ECDC4' },
  ]),
  
  getCategory: mockSuccessResponse({
    id: 1,
    name: 'Food & Dining',
    color: '#FF6B6B',
    icon: '🍽️',
  }),
  
  createCategory: mockSuccessResponse({
    id: 3,
    name: 'New Category',
    color: '#45B7D1',
    icon: '🆕',
  }, 'Category created successfully'),
  
  updateCategory: mockSuccessResponse({
    id: 1,
    name: 'Updated Category',
    color: '#FF6B6B',
    icon: '🍽️',
  }, 'Category updated successfully'),
  
  deleteCategory: mockSuccessResponse(null, 'Category deleted successfully'),
};

// Bank account API responses
export const mockBankAccountApiResponses = {
  getBankAccounts: mockSuccessResponse([
    { id: 1, name: 'Checking Account', balance: 2500.75 },
    { id: 2, name: 'Savings Account', balance: 10000.00 },
  ]),
  
  getBankAccount: mockSuccessResponse({
    id: 1,
    name: 'Checking Account',
    balance: 2500.75,
    accountType: 'checking',
  }),
  
  createBankAccount: mockSuccessResponse({
    id: 3,
    name: 'New Bank Account',
    balance: 0.00,
    accountType: 'checking',
  }, 'Bank account created successfully'),
  
  updateBankAccount: mockSuccessResponse({
    id: 1,
    name: 'Updated Bank Account',
    balance: 2500.75,
    accountType: 'checking',
  }, 'Bank account updated successfully'),
  
  deleteBankAccount: mockSuccessResponse(null, 'Bank account deleted successfully'),
  
  syncBankAccounts: mockSuccessResponse({
    syncedAccounts: 4,
    newTransactions: 15,
    updatedTransactions: 3,
  }, 'Bank accounts synced successfully'),
};

// User API responses
export const mockUserApiResponses = {
  getProfile: mockSuccessResponse({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'America/New_York',
    },
  }),
  
  updateProfile: mockSuccessResponse({
    id: 1,
    email: 'test@example.com',
    name: 'Updated User',
    preferences: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'America/New_York',
    },
  }, 'Profile updated successfully'),
  
  getSettings: mockSuccessResponse({
    notifications: {
      email: true,
      push: false,
    },
    privacy: {
      dataSharing: false,
    },
  }),
  
  updateSettings: mockSuccessResponse({
    notifications: {
      email: true,
      push: true,
    },
    privacy: {
      dataSharing: false,
    },
  }, 'Settings updated successfully'),
};

// Dashboard API responses
export const mockDashboardApiResponses = {
  getDashboard: mockSuccessResponse({
    stats: {
      totalTransactions: 150,
      totalIncome: 15000.00,
      totalExpenses: 12000.00,
      netAmount: 3000.00,
    },
    recentTransactions: [
      { id: 1, description: 'Recent Transaction 1', amount: 100.50 },
      { id: 2, description: 'Recent Transaction 2', amount: 200.75 },
    ],
    alerts: [
      { type: 'budget_exceeded', message: 'You have exceeded your budget for this month' },
    ],
  }),
  
  getStats: mockSuccessResponse({
    totalIncome: 15000.00,
    totalExpenses: 12000.00,
    netAmount: 3000.00,
    transactionCount: 150,
    averageTransaction: 180.00,
  }),
};

// Error scenarios
export const mockErrorScenarios = {
  networkError: {
    type: 'NETWORK_ERROR',
    message: 'Network error',
    status: 0,
  },
  
  timeout: {
    type: 'TIMEOUT',
    message: 'Request timeout',
    status: 408,
  },
  
  rateLimit: {
    type: 'RATE_LIMIT',
    message: 'Rate limit exceeded',
    status: 429,
  },
  
  serverError: {
    type: 'SERVER_ERROR',
    message: 'Internal server error',
    status: 500,
  },
  
  maintenance: {
    type: 'MAINTENANCE',
    message: 'Service temporarily unavailable',
    status: 503,
  },
};

// Mock fetch responses
export const createMockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  });
};

export const createMockFetchError = (message = 'Network error') => {
  return Promise.reject(new Error(message));
};

// Mock API delay for testing loading states
export const mockApiDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock API with delay
export const createMockFetchWithDelay = (data: any, delay = 1000, status = 200) => {
  return mockApiDelay(delay).then(() => createMockFetchResponse(data, status));
};
