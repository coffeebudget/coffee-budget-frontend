// Category test data fixtures

export interface MockCategory {
  id: number;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  transactionCount?: number;
  totalAmount?: number;
  keywords?: string[];
}

export const mockCategory: MockCategory = {
  id: 1,
  name: 'Food & Dining',
  color: '#FF6B6B',
  icon: '🍽️',
  description: 'Restaurants, groceries, and food-related expenses',
  isDefault: true,
  isActive: true,
  userId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  transactionCount: 25,
  totalAmount: 1250.75,
  keywords: ['food', 'restaurant', 'grocery', 'dining', 'meal'],
};

export const mockCategories: MockCategory[] = [
  mockCategory,
  {
    id: 2,
    name: 'Transportation',
    color: '#4ECDC4',
    icon: '🚗',
    description: 'Gas, public transport, car maintenance',
    isDefault: true,
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    transactionCount: 15,
    totalAmount: 450.00,
    keywords: ['gas', 'fuel', 'transport', 'uber', 'lyft', 'bus', 'train'],
  },
  {
    id: 3,
    name: 'Entertainment',
    color: '#45B7D1',
    icon: '🎬',
    description: 'Movies, games, subscriptions, hobbies',
    isDefault: true,
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    transactionCount: 8,
    totalAmount: 200.00,
    keywords: ['movie', 'game', 'subscription', 'netflix', 'spotify', 'hobby'],
  },
  {
    id: 4,
    name: 'Utilities',
    color: '#96CEB4',
    icon: '⚡',
    description: 'Electricity, water, internet, phone bills',
    isDefault: true,
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    transactionCount: 12,
    totalAmount: 800.00,
    keywords: ['electricity', 'water', 'internet', 'phone', 'utility', 'bill'],
  },
  {
    id: 5,
    name: 'Healthcare',
    color: '#FFEAA7',
    icon: '🏥',
    description: 'Medical expenses, pharmacy, insurance',
    isDefault: true,
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    transactionCount: 5,
    totalAmount: 300.00,
    keywords: ['medical', 'doctor', 'pharmacy', 'health', 'insurance', 'medicine'],
  },
  {
    id: 6,
    name: 'Shopping',
    color: '#DDA0DD',
    icon: '🛍️',
    description: 'Clothing, electronics, general shopping',
    isDefault: false,
    isActive: true,
    userId: 1,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    transactionCount: 10,
    totalAmount: 750.00,
    keywords: ['shopping', 'clothing', 'electronics', 'store', 'retail'],
  },
  {
    id: 7,
    name: 'Income',
    color: '#98FB98',
    icon: '💰',
    description: 'Salary, freelance, investments, gifts',
    isDefault: true,
    isActive: true,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    transactionCount: 3,
    totalAmount: 5000.00,
    keywords: ['salary', 'income', 'paycheck', 'freelance', 'investment', 'gift'],
  },
  {
    id: 8,
    name: 'Inactive Category',
    color: '#FFB6C1',
    icon: '❌',
    description: 'This category is no longer active',
    isDefault: false,
    isActive: false,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    transactionCount: 0,
    totalAmount: 0,
    keywords: [],
  },
];

// Category form data
export const mockCategoryFormData = {
  name: 'New Category',
  color: '#FF6B6B',
  icon: '🆕',
  description: 'A new test category',
  isDefault: false,
  keywords: ['new', 'test', 'category'],
};

// Category API responses
export const mockCategoryResponse = {
  success: true,
  data: mockCategory,
  message: 'Category retrieved successfully',
};

export const mockCategoriesResponse = {
  success: true,
  data: mockCategories,
  pagination: {
    page: 1,
    limit: 20,
    total: 8,
    totalPages: 1,
  },
};

export const mockCategoryCreateResponse = {
  success: true,
  data: { ...mockCategory, id: 9, name: 'New Category' },
  message: 'Category created successfully',
};

export const mockCategoryUpdateResponse = {
  success: true,
  data: { ...mockCategory, name: 'Updated Category' },
  message: 'Category updated successfully',
};

export const mockCategoryDeleteResponse = {
  success: true,
  message: 'Category deleted successfully',
};

// Category statistics
export const mockCategoryStats = {
  totalCategories: 8,
  activeCategories: 7,
  defaultCategories: 6,
  customCategories: 2,
  totalTransactions: 78,
  totalAmount: 8750.75,
  averageAmount: 112.19,
  topCategories: [
    { id: 1, name: 'Food & Dining', amount: 1250.75, percentage: 14.3 },
    { id: 4, name: 'Utilities', amount: 800.00, percentage: 9.1 },
    { id: 6, name: 'Shopping', amount: 750.00, percentage: 8.6 },
  ],
  monthlyBreakdown: [
    { month: '2024-01', categories: 8, transactions: 78, amount: 8750.75 },
    { month: '2023-12', categories: 7, transactions: 65, amount: 7200.50 },
  ],
};

// Category validation errors
export const mockCategoryValidationErrors = {
  name: ['Name is required', 'Name must be unique'],
  color: ['Color is required', 'Color must be a valid hex code'],
  description: ['Description must be less than 255 characters'],
};

// Category search/filter data
export const mockCategoryFilters = {
  search: 'food',
  isActive: true,
  isDefault: false,
  color: '#FF6B6B',
  hasTransactions: true,
  sortBy: 'name',
  sortOrder: 'asc' as const,
};

// Category keyword matching
export const mockCategoryKeywords = {
  'Food & Dining': ['food', 'restaurant', 'grocery', 'dining', 'meal', 'lunch', 'dinner', 'breakfast'],
  'Transportation': ['gas', 'fuel', 'transport', 'uber', 'lyft', 'bus', 'train', 'taxi', 'parking'],
  'Entertainment': ['movie', 'game', 'subscription', 'netflix', 'spotify', 'hobby', 'concert', 'theater'],
  'Utilities': ['electricity', 'water', 'internet', 'phone', 'utility', 'bill', 'cable', 'wifi'],
  'Healthcare': ['medical', 'doctor', 'pharmacy', 'health', 'insurance', 'medicine', 'hospital', 'clinic'],
  'Shopping': ['shopping', 'clothing', 'electronics', 'store', 'retail', 'amazon', 'ebay', 'mall'],
  'Income': ['salary', 'income', 'paycheck', 'freelance', 'investment', 'gift', 'bonus', 'refund'],
};

// Category color palette
export const mockCategoryColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98FB98', '#FFB6C1', '#F0E68C', '#FFA07A',
  '#20B2AA', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFB6C1',
  '#98FB98', '#F5DEB3', '#FFE4E1', '#E0E0E0', '#B0C4DE',
];

// Category icons
export const mockCategoryIcons = [
  '🍽️', '🚗', '🎬', '⚡', '🏥', '🛍️', '💰', '🏠', '✈️', '🎓',
  '💻', '📱', '🎮', '📚', '🎨', '🏃', '🎵', '📺', '🍕', '☕',
];
