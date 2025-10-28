// Bank account test data fixtures

export interface MockBankAccount {
  id: number;
  name: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  bankName: string;
  balance: number;
  currency: string;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  gocardlessAccountId?: string;
  gocardlessBankId?: string;
  gocardlessBankName?: string;
  gocardlessStatus?: 'active' | 'inactive' | 'error';
  transactionCount?: number;
  totalIncome?: number;
  totalExpenses?: number;
}

export const mockBankAccount: MockBankAccount = {
  id: 1,
  name: 'Checking Account',
  accountNumber: '****1234',
  accountType: 'checking',
  bankName: 'Test Bank',
  balance: 2500.75,
  currency: 'USD',
  isActive: true,
  userId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastSyncAt: '2024-01-15T10:30:00Z',
  gocardlessAccountId: 'acc_123456789',
  gocardlessBankId: 'bank_987654321',
  gocardlessBankName: 'Test Bank',
  gocardlessStatus: 'active',
  transactionCount: 45,
  totalIncome: 5000.00,
  totalExpenses: 2499.25,
};

export const mockBankAccounts: MockBankAccount[] = [
  mockBankAccount,
  {
    id: 2,
    name: 'Savings Account',
    accountNumber: '****5678',
    accountType: 'savings',
    bankName: 'Test Bank',
    balance: 10000.00,
    currency: 'USD',
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastSyncAt: '2024-01-15T09:15:00Z',
    gocardlessAccountId: 'acc_234567890',
    gocardlessBankId: 'bank_876543210',
    gocardlessBankName: 'Test Bank',
    gocardlessStatus: 'active',
    transactionCount: 12,
    totalIncome: 2000.00,
    totalExpenses: 0.00,
  },
  {
    id: 3,
    name: 'Credit Card',
    accountNumber: '****9012',
    accountType: 'credit',
    bankName: 'Credit Bank',
    balance: -1500.50,
    currency: 'USD',
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastSyncAt: '2024-01-15T08:45:00Z',
    gocardlessAccountId: 'acc_345678901',
    gocardlessBankId: 'bank_765432109',
    gocardlessBankName: 'Credit Bank',
    gocardlessStatus: 'active',
    transactionCount: 28,
    totalIncome: 0.00,
    totalExpenses: 1500.50,
  },
  {
    id: 4,
    name: 'Investment Account',
    accountNumber: '****3456',
    accountType: 'investment',
    bankName: 'Investment Bank',
    balance: 25000.00,
    currency: 'USD',
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastSyncAt: '2024-01-14T16:30:00Z',
    gocardlessAccountId: 'acc_456789012',
    gocardlessBankId: 'bank_654321098',
    gocardlessBankName: 'Investment Bank',
    gocardlessStatus: 'active',
    transactionCount: 5,
    totalIncome: 25000.00,
    totalExpenses: 0.00,
  },
  {
    id: 5,
    name: 'Inactive Account',
    accountNumber: '****7890',
    accountType: 'checking',
    bankName: 'Old Bank',
    balance: 0.00,
    currency: 'USD',
    isActive: false,
    userId: 1,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastSyncAt: '2023-12-31T23:59:59Z',
    gocardlessAccountId: 'acc_567890123',
    gocardlessBankId: 'bank_543210987',
    gocardlessBankName: 'Old Bank',
    gocardlessStatus: 'inactive',
    transactionCount: 0,
    totalIncome: 0.00,
    totalExpenses: 0.00,
  },
];

// Bank account form data
export const mockBankAccountFormData = {
  name: 'New Bank Account',
  accountNumber: '****9999',
  accountType: 'checking' as const,
  bankName: 'New Bank',
  currency: 'USD',
  gocardlessAccountId: 'acc_new123456',
};

// Bank account API responses
export const mockBankAccountResponse = {
  success: true,
  data: mockBankAccount,
  message: 'Bank account retrieved successfully',
};

export const mockBankAccountsResponse = {
  success: true,
  data: mockBankAccounts,
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    totalPages: 1,
  },
};

export const mockBankAccountCreateResponse = {
  success: true,
  data: { ...mockBankAccount, id: 6, name: 'New Bank Account' },
  message: 'Bank account created successfully',
};

export const mockBankAccountUpdateResponse = {
  success: true,
  data: { ...mockBankAccount, name: 'Updated Bank Account' },
  message: 'Bank account updated successfully',
};

export const mockBankAccountDeleteResponse = {
  success: true,
  message: 'Bank account deleted successfully',
};

// Bank account statistics
export const mockBankAccountStats = {
  totalAccounts: 5,
  activeAccounts: 4,
  totalBalance: 36000.25,
  totalIncome: 32000.00,
  totalExpenses: 3999.75,
  netAmount: 28000.25,
  accountTypes: {
    checking: 2,
    savings: 1,
    credit: 1,
    investment: 1,
  },
  currencyBreakdown: {
    USD: 5,
  },
  topAccounts: [
    { id: 4, name: 'Investment Account', balance: 25000.00, percentage: 69.4 },
    { id: 2, name: 'Savings Account', balance: 10000.00, percentage: 27.8 },
    { id: 1, name: 'Checking Account', balance: 2500.75, percentage: 6.9 },
  ],
};

// GoCardless integration data
export const mockGocardlessBanks = [
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
  {
    id: 'bank_456789123',
    name: 'Investment Bank',
    logo: 'https://example.com/investment-bank-logo.png',
    bic: 'INVESTBANK',
    country: 'US',
    supportedAccountTypes: ['investment'],
  },
];

export const mockGocardlessAccounts = [
  {
    id: 'acc_123456789',
    bankId: 'bank_123456789',
    name: 'Checking Account',
    accountNumber: '****1234',
    accountType: 'checking',
    currency: 'USD',
    status: 'active',
    balance: 2500.75,
    lastSyncAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'acc_234567890',
    bankId: 'bank_123456789',
    name: 'Savings Account',
    accountNumber: '****5678',
    accountType: 'savings',
    currency: 'USD',
    status: 'active',
    balance: 10000.00,
    lastSyncAt: '2024-01-15T09:15:00Z',
  },
];

// Bank account sync data
export const mockBankAccountSyncResponse = {
  success: true,
  data: {
    syncedAccounts: 4,
    newTransactions: 15,
    updatedTransactions: 3,
    errors: [],
    lastSyncAt: '2024-01-15T10:30:00Z',
  },
  message: 'Bank accounts synced successfully',
};

// Bank account validation errors
export const mockBankAccountValidationErrors = {
  name: ['Name is required', 'Name must be unique'],
  accountNumber: ['Account number is required'],
  accountType: ['Account type is required'],
  bankName: ['Bank name is required'],
  currency: ['Currency is required'],
};

// Bank account filters
export const mockBankAccountFilters = {
  search: 'checking',
  accountType: 'checking' as const,
  isActive: true,
  bankName: 'Test Bank',
  hasGocardless: true,
  sortBy: 'name',
  sortOrder: 'asc' as const,
};

// Bank account import data
export const mockBankAccountImportData = {
  file: 'bank-accounts.csv',
  totalRows: 10,
  processedRows: 8,
  skippedRows: 2,
  newAccounts: 5,
  updatedAccounts: 3,
  errors: [
    { row: 3, error: 'Invalid account type' },
    { row: 7, error: 'Missing required field: accountNumber' },
  ],
};
