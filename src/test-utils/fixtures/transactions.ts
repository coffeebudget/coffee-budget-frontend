// Transaction test data fixtures

export interface MockTransaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'executed' | 'cancelled';
  executionDate: string;
  category?: {
    id: number;
    name: string;
    color?: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    color?: string;
  }>;
  bankAccount?: {
    id: number;
    name: string;
    accountNumber?: string;
  };
  user?: {
    id: number;
    email: string;
    name?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockTransaction: MockTransaction = {
  id: 1,
  description: 'Test Transaction',
  amount: 100.50,
  type: 'expense',
  status: 'executed',
  executionDate: '2024-01-15T10:30:00Z',
  category: {
    id: 1,
    name: 'Food & Dining',
    color: '#FF6B6B',
  },
  tags: [
    { id: 1, name: 'groceries', color: '#4ECDC4' },
    { id: 2, name: 'weekly', color: '#45B7D1' },
  ],
  bankAccount: {
    id: 1,
    name: 'Checking Account',
    accountNumber: '****1234',
  },
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  },
  notes: 'Weekly grocery shopping',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

export const mockTransactions: MockTransaction[] = Array.from({ length: 20 }, (_, i) => ({
  ...mockTransaction,
  id: i + 1,
  description: `Test Transaction ${i + 1}`,
  amount: 50 + (i * 25.50),
  type: i % 3 === 0 ? 'income' : 'expense',
  status: i % 10 === 0 ? 'pending' : 'executed',
  executionDate: new Date(2024, 0, 15 + i).toISOString(),
  category: {
    id: (i % 5) + 1,
    name: ['Food & Dining', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare'][i % 5],
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 5],
  },
  tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
    id: j + 1,
    name: `tag-${i}-${j}`,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  })),
  bankAccount: {
    id: (i % 3) + 1,
    name: ['Checking Account', 'Savings Account', 'Credit Card'][i % 3],
    accountNumber: `****${1000 + i}`,
  },
  notes: i % 4 === 0 ? `Transaction notes ${i + 1}` : undefined,
  createdAt: new Date(2024, 0, 15 + i).toISOString(),
  updatedAt: new Date(2024, 0, 15 + i).toISOString(),
}));

export const mockIncomeTransactions = mockTransactions.filter(t => t.type === 'income');
export const mockExpenseTransactions = mockTransactions.filter(t => t.type === 'expense');
export const mockPendingTransactions = mockTransactions.filter(t => t.status === 'pending');
export const mockExecutedTransactions = mockTransactions.filter(t => t.status === 'executed');

// Transaction form data
export const mockTransactionFormData = {
  description: 'New Test Transaction',
  amount: 75.25,
  type: 'expense' as const,
  categoryId: 1,
  bankAccountId: 1,
  tagIds: [1, 2],
  notes: 'Test transaction notes',
  executionDate: '2024-01-20T14:30:00Z',
};

// Transaction API responses
export const mockTransactionResponse = {
  success: true,
  data: mockTransaction,
  message: 'Transaction created successfully',
};

export const mockTransactionsResponse = {
  success: true,
  data: mockTransactions,
  pagination: {
    page: 1,
    limit: 20,
    total: 20,
    totalPages: 1,
  },
};

export const mockTransactionUpdateResponse = {
  success: true,
  data: { ...mockTransaction, description: 'Updated Transaction' },
  message: 'Transaction updated successfully',
};

export const mockTransactionDeleteResponse = {
  success: true,
  message: 'Transaction deleted successfully',
};

// Transaction statistics
export const mockTransactionStats = {
  totalIncome: 2500.00,
  totalExpenses: 1800.50,
  netAmount: 699.50,
  transactionCount: 20,
  averageTransaction: 215.025,
  monthlyBreakdown: [
    { month: '2024-01', income: 2500.00, expenses: 1800.50 },
    { month: '2023-12', income: 2200.00, expenses: 1950.25 },
  ],
  categoryBreakdown: [
    { category: 'Food & Dining', amount: 450.25, percentage: 25.0 },
    { category: 'Transportation', amount: 300.00, percentage: 16.7 },
    { category: 'Entertainment', amount: 200.00, percentage: 11.1 },
  ],
};

// Transaction filters
export const mockTransactionFilters = {
  dateRange: {
    start: '2024-01-01',
    end: '2024-01-31',
  },
  categoryIds: [1, 2, 3],
  tagIds: [1, 2],
  bankAccountIds: [1, 2],
  type: 'expense' as const,
  status: 'executed' as const,
  minAmount: 10,
  maxAmount: 1000,
  search: 'test',
};

// Transaction import data
export const mockTransactionImportData = {
  file: 'transactions.csv',
  totalRows: 100,
  processedRows: 95,
  skippedRows: 5,
  newTransactions: 90,
  duplicates: 5,
  errors: [
    { row: 10, error: 'Invalid amount format' },
    { row: 25, error: 'Missing required field: description' },
  ],
};
