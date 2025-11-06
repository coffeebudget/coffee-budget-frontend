/**
 * Mock data factories for creating test entities
 *
 * These factories provide convenient functions for creating mock data
 * with sensible defaults that can be overridden as needed.
 *
 * @example
 * ```tsx
 * // Use default mock data
 * const transaction = createMockTransaction();
 *
 * // Override specific fields
 * const expensiveTransaction = createMockTransaction({
 *   amount: 1000,
 *   description: 'Expensive item',
 * });
 *
 * // Create multiple items
 * const transactions = createMockTransactions(5);
 * ```
 */

// Re-export existing fixture data for direct use
export * from './fixtures';

/**
 * Transaction factory
 */
export function createMockTransaction(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    description: 'Test Transaction',
    amount: 50.00,
    type: 'expense' as const,
    date: new Date().toISOString(),
    categoryId: 1,
    category: {
      id: 1,
      name: 'Food & Dining',
      type: 'expense',
      color: '#4ECDC4',
    },
    bankAccountId: 1,
    bankAccount: {
      id: 1,
      name: 'Test Checking Account',
      balance: 1000.00,
    },
    tags: [],
    notes: null,
    receipt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple transactions
 */
export function createMockTransactions(count: number, overrides: Partial<any> = {}) {
  return Array.from({ length: count }, (_, index) =>
    createMockTransaction({ id: index + 1, ...overrides })
  );
}

/**
 * Category factory
 */
export function createMockCategory(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Test Category',
    type: 'expense' as const,
    color: '#4ECDC4',
    icon: '🏷️',
    parentId: null,
    userId: 1,
    keywords: [],
    budget: {
      monthly: 500,
      yearly: 6000,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple categories
 */
export function createMockCategories(count: number, overrides: Partial<any> = {}) {
  return Array.from({ length: count }, (_, index) =>
    createMockCategory({ id: index + 1, name: `Category ${index + 1}`, ...overrides })
  );
}

/**
 * Bank account factory
 */
export function createMockBankAccount(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Test Bank Account',
    type: 'checking' as const,
    balance: 1000.00,
    currency: 'USD',
    bankName: 'Test Bank',
    accountNumber: '****1234',
    gocardlessRequisitionId: null,
    gocardlessAccountId: null,
    lastSynced: new Date().toISOString(),
    isActive: true,
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple bank accounts
 */
export function createMockBankAccounts(count: number, overrides: Partial<any> = {}) {
  return Array.from({ length: count }, (_, index) =>
    createMockBankAccount({ id: index + 1, name: `Bank Account ${index + 1}`, ...overrides })
  );
}

/**
 * User factory
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 1,
    auth0Id: 'auth0|123456',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    isDemoUser: false,
    demoExpiryDate: null,
    demoActivatedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Session factory
 */
export function createMockSession(overrides: Partial<any> = {}) {
  return {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
      accessToken: 'mock-access-token',
    },
    expires: '2024-12-31T23:59:59.999Z',
    ...overrides,
  };
}

/**
 * Tag factory
 */
export function createMockTag(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'test-tag',
    color: '#4ECDC4',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple tags
 */
export function createMockTags(count: number, overrides: Partial<any> = {}) {
  return Array.from({ length: count }, (_, index) =>
    createMockTag({ id: index + 1, name: `tag-${index + 1}`, ...overrides })
  );
}

/**
 * API response factory
 */
export function createMockApiResponse(data: any, overrides: Partial<any> = {}) {
  return {
    success: true,
    data,
    message: 'Success',
    ...overrides,
  };
}

/**
 * API error response factory
 */
export function createMockApiError(message = 'An error occurred', status = 500) {
  return {
    success: false,
    error: message,
    statusCode: status,
  };
}

/**
 * Pagination metadata factory
 */
export function createMockPagination(overrides: Partial<any> = {}) {
  return {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
    ...overrides,
  };
}

/**
 * Paginated response factory
 */
export function createMockPaginatedResponse(data: any[], overrides: Partial<any> = {}) {
  return {
    success: true,
    data,
    pagination: createMockPagination({
      total: data.length,
      totalPages: Math.ceil(data.length / 20),
      ...overrides.pagination,
    }),
    ...overrides,
  };
}

/**
 * Credit card factory
 */
export function createMockCreditCard(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Test Credit Card',
    lastFourDigits: '1234',
    cardNetwork: 'Visa',
    creditLimit: 5000.00,
    currentBalance: 1000.00,
    availableCredit: 4000.00,
    statementDate: 15,
    dueDate: 1,
    userId: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Recurring transaction factory
 */
export function createMockRecurringTransaction(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    description: 'Monthly Subscription',
    amount: 9.99,
    frequency: 'monthly' as const,
    nextDate: new Date().toISOString(),
    categoryId: 1,
    isActive: true,
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Pending duplicate factory
 */
export function createMockPendingDuplicate(overrides: Partial<any> = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    transactions: [
      createMockTransaction({ id: 1, description: 'Transaction 1' }),
      createMockTransaction({ id: 2, description: 'Transaction 2' }),
    ],
    similarity: 0.95,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
