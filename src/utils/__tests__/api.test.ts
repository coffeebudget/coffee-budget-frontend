import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  resetCategoriesToDefaults,
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  updateTransaction,
  bulkKeywordCategorize,
  fetchUserByAuth0Id,
  createUser,
  fetchUncategorizedTransactions,
  fetchCommonKeywords,
  getSuggestedKeywordsForCategory,
  addKeywordToCategory,
  removeKeywordFromCategory,
  learnFromTransaction,
  previewKeywordImpact,
  applyKeywordToCategory,
  bulkUncategorize,
  fetchPendingDuplicates,
  resolvePendingDuplicate,
  triggerDuplicateDetection,
  bulkResolvePendingDuplicates,
  bulkDeletePendingDuplicates,
  cleanupActualDuplicates,
  fetchRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactionById,
  fetchUnconfirmedPatterns,
  getLinkedTransactions,
  confirmPattern,
  unlinkFromRecurringTransaction,
  adjustPattern,
  fetchExpenseDistribution,
  fetchMonthlySummary,
  fetchMonthlyStatistics,
  fetchCurrentBalance
} from '../api';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock environment variables
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_API_URL: 'http://localhost:3001'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('API Functions', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Categories API', () => {
    describe('fetchCategories', () => {
      it('should fetch categories successfully', async () => {
        const mockCategories = [
          { id: 1, name: 'Groceries', keywords: ['food', 'grocery'] },
          { id: 2, name: 'Utilities', keywords: ['electric', 'water'] }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCategories)
        } as Response);

        const result = await fetchCategories(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockCategories);
      });

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' })
        } as Response);

        await expect(fetchCategories(mockToken)).rejects.toThrow('Internal server error');
      });
    });

    describe('createCategory', () => {
      it('should create category successfully', async () => {
        const categoryData = {
          name: 'Entertainment',
          keywords: ['movie', 'cinema'],
          excludeFromExpenseAnalytics: false,
          analyticsExclusionReason: undefined
        };

        const mockCreatedCategory = { id: 3, ...categoryData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCreatedCategory)
        } as Response);

        const result = await createCategory(mockToken, categoryData);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        });
        expect(result).toEqual(mockCreatedCategory);
      });
    });

    describe('updateCategory', () => {
      it('should update category successfully', async () => {
        const updateData = {
          name: 'Updated Groceries',
          keywords: ['food', 'grocery', 'supermarket']
        };

        const mockUpdatedCategory = { id: 1, ...updateData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUpdatedCategory)
        } as Response);

        const result = await updateCategory(mockToken, 1, updateData);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/1', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        expect(result).toEqual(mockUpdatedCategory);
      });
    });

    describe('deleteCategory', () => {
      it('should delete category successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers({ 'content-type': 'text/plain' })
        } as Response);

        const result = await deleteCategory(mockToken, 1);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/1', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        });
        expect(result).toBeNull();
      });
    });

    describe('resetCategoriesToDefaults', () => {
      it('should reset categories to defaults successfully', async () => {
        const mockDefaultCategories = [
          { id: 1, name: 'Default Category 1' },
          { id: 2, name: 'Default Category 2' }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockDefaultCategories)
        } as Response);

        const result = await resetCategoriesToDefaults(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/reset-to-defaults', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockDefaultCategories);
      });

      it('should handle non-array response', async () => {
        const mockResponse = { message: 'Reset successful' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResponse)
        } as Response);

        const result = await resetCategoriesToDefaults(mockToken);

        expect(result).toEqual([]);
      });

      it('should handle reset errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response);

        await expect(resetCategoriesToDefaults(mockToken)).rejects.toThrow('Failed to reset categories to defaults');
      });
    });
  });

  describe('Tags API', () => {
    describe('fetchTags', () => {
      it('should fetch tags successfully', async () => {
        const mockTags = [
          { id: 1, name: 'Important' },
          { id: 2, name: 'Work' }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockTags)
        } as Response);

        const result = await fetchTags(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/tags', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockTags);
      });
    });

    describe('createTag', () => {
      it('should create tag successfully', async () => {
        const tagData = { name: 'New Tag' };
        const mockCreatedTag = { id: 3, ...tagData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCreatedTag)
        } as Response);

        const result = await createTag(mockToken, tagData);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/tags', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tagData),
        });
        expect(result).toEqual(mockCreatedTag);
      });

      it('should handle creation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        } as Response);

        await expect(createTag(mockToken, { name: 'Invalid Tag' })).rejects.toThrow('Failed to create tag: Bad Request');
      });
    });

    describe('updateTag', () => {
      it('should update tag successfully', async () => {
        const updateData = { name: 'Updated Tag' };
        const mockUpdatedTag = { id: 1, ...updateData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUpdatedTag)
        } as Response);

        const result = await updateTag(mockToken, 1, updateData);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/tags/1', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        expect(result).toEqual(mockUpdatedTag);
      });

      it('should handle update errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response);

        await expect(updateTag(mockToken, 999, { name: 'Updated Tag' })).rejects.toThrow('Failed to update tag: Not Found');
      });
    });

    describe('deleteTag', () => {
      it('should delete tag successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204
        } as Response);

        await deleteTag(mockToken, 1);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/tags/1', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${mockToken}` },
        });
      });

      it('should handle deletion errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response);

        await expect(deleteTag(mockToken, 999)).rejects.toThrow('Failed to delete tag: Not Found');
      });
    });
  });

  describe('Transactions API', () => {
    describe('updateTransaction', () => {
      it('should update transaction successfully', async () => {
        const transactionData = {
          id: 1,
          description: 'Updated Transaction',
          amount: 200,
          categoryId: 2
        };

        const mockUpdatedTransaction = { ...transactionData, updatedAt: '2024-01-01T00:00:00Z' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUpdatedTransaction)
        } as Response);

        const result = await updateTransaction(mockToken, 1, transactionData);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/transactions/1', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });
        expect(result).toEqual(mockUpdatedTransaction);
      });

      it('should handle update errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404
        } as Response);

        await expect(updateTransaction(mockToken, 999, { id: 999, description: 'Test' })).rejects.toThrow('Failed to update transaction');
      });
    });

    describe('bulkKeywordCategorize', () => {
      it('should run bulk keyword categorization successfully', async () => {
        const mockResult = {
          categorized: 15,
          errors: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult)
        } as Response);

        const result = await bulkKeywordCategorize(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/transactions/bulk-categorize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockResult);
      });

      it('should handle bulk categorization errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response);

        await expect(bulkKeywordCategorize(mockToken)).rejects.toThrow('Failed to run bulk keyword categorization');
      });
    });
  });

  describe('User API', () => {
    describe('fetchUserByAuth0Id', () => {
      it('should fetch user successfully', async () => {
        const mockUser = {
          id: 1,
          auth0Id: 'auth0|123456',
          email: 'test@example.com'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUser)
        } as Response);

        const result = await fetchUserByAuth0Id('auth0|123456', mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/users/auth0|123456', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        });
        expect(result).toEqual(mockUser);
      });

      it('should return null for 404 status', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404
        } as Response);

        const result = await fetchUserByAuth0Id('auth0|nonexistent', mockToken);

        expect(result).toBeNull();
      });

      it('should handle other errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response);

        await expect(fetchUserByAuth0Id('auth0|123456', mockToken)).rejects.toThrow('Failed to fetch user: Internal Server Error');
      });
    });

    describe('createUser', () => {
      it('should create user successfully', async () => {
        const mockUser = {
          id: 1,
          auth0Id: 'auth0|123456',
          email: 'test@example.com'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUser)
        } as Response);

        const result = await createUser('auth0|123456', 'test@example.com', mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            auth0Id: 'auth0|123456',
            email: 'test@example.com',
          }),
        });
        expect(result).toEqual(mockUser);
      });

      it('should handle creation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        } as Response);

        await expect(createUser('auth0|123456', 'test@example.com', mockToken)).rejects.toThrow('Failed to create user: Bad Request');
      });
    });
  });

  describe('Categorization API', () => {
    describe('fetchUncategorizedTransactions', () => {
      it('should fetch uncategorized transactions successfully', async () => {
        const mockTransactions = [
          { id: 1, description: 'Uncategorized Transaction 1', amount: 100 },
          { id: 2, description: 'Uncategorized Transaction 2', amount: 200 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockTransactions)
        } as Response);

        const result = await fetchUncategorizedTransactions(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/transactions/uncategorized', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockTransactions);
      });

      it('should handle fetch errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response);

        await expect(fetchUncategorizedTransactions(mockToken)).rejects.toThrow('Failed to fetch uncategorized transactions');
      });
    });

    describe('fetchCommonKeywords', () => {
      it('should fetch common keywords successfully', async () => {
        const mockKeywords = [
          { keyword: 'grocery', count: 25 },
          { keyword: 'restaurant', count: 15 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockKeywords)
        } as Response);

        const result = await fetchCommonKeywords(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/common-keywords', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockKeywords);
      });
    });

    describe('addKeywordToCategory', () => {
      it('should add keyword to category successfully', async () => {
        const mockResult = {
          success: true,
          keyword: 'grocery',
          categoryId: 1
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult)
        } as Response);

        const result = await addKeywordToCategory(mockToken, 1, 'grocery');

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/1/keywords', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword: 'grocery' }),
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('previewKeywordImpact', () => {
      it('should preview keyword impact successfully', async () => {
        const mockImpact = {
          affectedTransactions: 10,
          totalAmount: 500.00,
          preview: [
            { id: 1, description: 'Grocery Store', amount: 50.00 }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockImpact)
        } as Response);

        const result = await previewKeywordImpact(mockToken, 1, 'grocery', false);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/1/preview-keyword-impact?keyword=grocery&onlyUncategorized=false', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockImpact);
      });

      it('should preview keyword impact with only uncategorized', async () => {
        const mockImpact = {
          affectedTransactions: 5,
          totalAmount: 250.00
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockImpact)
        } as Response);

        const result = await previewKeywordImpact(mockToken, 1, 'grocery', true);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/categories/1/preview-keyword-impact?keyword=grocery&onlyUncategorized=true', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockImpact);
      });
    });
  });

  describe('Dashboard API', () => {
    describe('fetchExpenseDistribution', () => {
      it('should fetch expense distribution successfully', async () => {
        const mockDistribution = {
          categories: [
            { name: 'Groceries', amount: 500, percentage: 50 },
            { name: 'Utilities', amount: 300, percentage: 30 }
          ],
          total: 1000
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockDistribution)
        } as Response);

        const result = await fetchExpenseDistribution(mockToken, '2024-01-01', '2024-12-31');

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/dashboard/expense-distribution?startDate=2024-01-01&endDate=2024-12-31', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockDistribution);
      });
    });

    describe('fetchMonthlySummary', () => {
      it('should fetch monthly summary with default months', async () => {
        const mockSummary = {
          months: [
            { month: '2024-01', income: 5000, expenses: 3000, savings: 2000 }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockSummary)
        } as Response);

        const result = await fetchMonthlySummary(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/dashboard/monthly-summary?months=12', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockSummary);
      });

      it('should fetch monthly summary with custom months', async () => {
        const mockSummary = {
          months: [
            { month: '2024-01', income: 5000, expenses: 3000, savings: 2000 }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockSummary)
        } as Response);

        const result = await fetchMonthlySummary(mockToken, 6);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/dashboard/monthly-summary?months=6', {
          headers: { Authorization: `Bearer ${mockToken}` },
        });
        expect(result).toEqual(mockSummary);
      });
    });

    describe('fetchCurrentBalance', () => {
      it('should fetch current balance successfully', async () => {
        const mockBalance = {
          totalBalance: 5000.00,
          accounts: [
            { id: 1, name: 'Checking', balance: 3000.00 },
            { id: 2, name: 'Savings', balance: 2000.00 }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockBalance)
        } as Response);

        const result = await fetchCurrentBalance(mockToken);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/dashboard/current-balance', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockBalance);
      });

      it('should handle balance fetch errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response);

        await expect(fetchCurrentBalance(mockToken)).rejects.toThrow('Failed to fetch current balance');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchCategories(mockToken)).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors in error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);

      await expect(fetchCategories(mockToken)).rejects.toThrow('API error: 500');
    });

    it('should handle different error response formats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Validation error' })
      } as Response);

      await expect(fetchCategories(mockToken)).rejects.toThrow('Validation error');
    });

    it('should handle responses without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({})
      } as Response);

      await expect(fetchCategories(mockToken)).rejects.toThrow('API error: 500');
    });
  });

  describe('Response Handling', () => {
    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'content-type': 'text/plain' })
      } as Response);

      const result = await fetchCategories(mockToken);

      expect(result).toBeNull();
    });

    it('should handle responses without content-type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({})
      } as Response);

      const result = await fetchCategories(mockToken);

      expect(result).toBeNull();
    });

    it('should handle JSON responses with 204 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await fetchCategories(mockToken);

      expect(result).toBeNull();
    });
  });
});
