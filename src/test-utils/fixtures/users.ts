// User test data fixtures

export interface MockUser {
  id: number;
  email: string;
  name: string;
  image?: string;
  auth0Id: string;
  isDemoUser: boolean;
  demoExpiryDate?: string;
  demoActivatedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences?: {
    currency: string;
    dateFormat: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
}

export const mockUser: MockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  auth0Id: 'auth0|123456789',
  isDemoUser: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastLoginAt: '2024-01-15T10:30:00Z',
  preferences: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    theme: 'light',
  },
};

export const mockDemoUser: MockUser = {
  ...mockUser,
  id: 2,
  email: 'demo@example.com',
  name: 'Demo User',
  auth0Id: 'auth0|demo123456',
  isDemoUser: true,
  demoExpiryDate: '2024-12-31T23:59:59Z',
  demoActivatedAt: '2024-01-01T00:00:00Z',
};

export const mockUsers: MockUser[] = [
  mockUser,
  mockDemoUser,
  {
    id: 3,
    email: 'admin@example.com',
    name: 'Admin User',
    image: 'https://example.com/admin-avatar.jpg',
    auth0Id: 'auth0|admin123456',
    isDemoUser: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T09:15:00Z',
    preferences: {
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/London',
      theme: 'dark',
    },
  },
  {
    id: 4,
    email: 'premium@example.com',
    name: 'Premium User',
    image: 'https://example.com/premium-avatar.jpg',
    auth0Id: 'auth0|premium123456',
    isDemoUser: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-14T16:45:00Z',
    preferences: {
      currency: 'GBP',
      dateFormat: 'YYYY-MM-DD',
      timezone: 'Europe/London',
      theme: 'system',
    },
  },
];

// User session data
export const mockSession = {
  user: {
    id: mockUser.id.toString(),
    email: mockUser.email,
    name: mockUser.name,
    image: mockUser.image,
  },
  expires: '2024-12-31T23:59:59.999Z',
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
};

export const mockDemoSession = {
  user: {
    id: mockDemoUser.id.toString(),
    email: mockDemoUser.email,
    name: mockDemoUser.name,
    image: mockDemoUser.image,
  },
  expires: mockDemoUser.demoExpiryDate,
  accessToken: 'mock-demo-access-token-12345',
  refreshToken: 'mock-demo-refresh-token-67890',
};

// User API responses
export const mockUserResponse = {
  success: true,
  data: mockUser,
  message: 'User retrieved successfully',
};

export const mockUsersResponse = {
  success: true,
  data: mockUsers,
  pagination: {
    page: 1,
    limit: 20,
    total: 4,
    totalPages: 1,
  },
};

export const mockUserUpdateResponse = {
  success: true,
  data: { ...mockUser, name: 'Updated User' },
  message: 'User updated successfully',
};

export const mockUserPreferencesResponse = {
  success: true,
  data: mockUser.preferences,
  message: 'User preferences updated successfully',
};

// User authentication responses
export const mockLoginResponse = {
  success: true,
  data: {
    user: mockUser,
    session: mockSession,
  },
  message: 'Login successful',
};

export const mockLogoutResponse = {
  success: true,
  message: 'Logout successful',
};

export const mockRefreshTokenResponse = {
  success: true,
  data: {
    accessToken: 'new-mock-access-token-12345',
    refreshToken: 'new-mock-refresh-token-67890',
    expires: '2024-12-31T23:59:59.999Z',
  },
  message: 'Token refreshed successfully',
};

// User profile data
export const mockUserProfile = {
  ...mockUser,
  stats: {
    totalTransactions: 150,
    totalIncome: 15000.00,
    totalExpenses: 12000.00,
    netAmount: 3000.00,
    accountCount: 3,
    categoryCount: 8,
    tagCount: 15,
  },
  recentActivity: [
    {
      id: 1,
      type: 'transaction_created',
      description: 'Created new transaction',
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      type: 'category_created',
      description: 'Created new category',
      timestamp: '2024-01-15T09:15:00Z',
    },
  ],
};

// User settings
export const mockUserSettings = {
  notifications: {
    email: true,
    push: false,
    sms: false,
    transactionAlerts: true,
    budgetAlerts: true,
    weeklyReports: true,
  },
  privacy: {
    dataSharing: false,
    analytics: true,
    marketing: false,
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
  },
};

// User form data
export const mockUserFormData = {
  name: 'New Test User',
  email: 'newuser@example.com',
  preferences: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    theme: 'light' as const,
  },
};

// User validation errors
export const mockUserValidationErrors = {
  email: ['Email is required', 'Email format is invalid'],
  name: ['Name is required', 'Name must be at least 2 characters'],
  preferences: {
    currency: ['Currency is required'],
    dateFormat: ['Date format is required'],
    timezone: ['Timezone is required'],
  },
};
