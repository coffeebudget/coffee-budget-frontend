import {
  fetchTransactions,
  fetchFilteredTransactions,
  fetchTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
  findSimilarTransactions,
  bulkCategorizeTransactions,
  bulkTagTransactions,
  bulkDeleteTransactions,
  enrichTransactionsWithPayPal,
  fetchBankAccounts,
  fetchBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  fetchCreditCards,
  fetchCreditCard,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  fetchBudgetSummary,
  fetchBudgetCategories,
  fetchCategoryTransactions,
  fetchCategories,
  updateCategoryBudget
} from '../api-client';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('API Client Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Transaction API Functions', () => {
    describe('fetchTransactions', () => {
      it('should fetch all transactions successfully', async () => {
        const mockTransactions = [
          { id: 1, description: 'Test Transaction', amount: 100 },
          { id: 2, description: 'Another Transaction', amount: 200 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockTransactions)
        } as Response);

        const result = await fetchTransactions();

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions');
        expect(result).toEqual(mockTransactions);
      });

      it('should handle API errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' })
        } as Response);

        await expect(fetchTransactions()).rejects.toThrow('Internal server error');
      });

      it('should handle non-JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers({ 'content-type': 'text/plain' })
        } as Response);

        const result = await fetchTransactions();

        expect(result).toBeNull();
      });
    });

    describe('fetchFilteredTransactions', () => {
      it('should fetch filtered transactions with all filters', async () => {
        const filters = {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          categoryIds: [1, 2],
          tagIds: [3, 4],
          minAmount: 10,
          maxAmount: 1000,
          type: 'expense' as const,
          searchTerm: 'test',
          orderBy: 'executionDate' as const,
          orderDirection: 'desc' as const,
          uncategorizedOnly: true,
          bankAccountIds: [1],
          creditCardIds: [2]
        };

        const mockFilteredTransactions = [
          { id: 1, description: 'Filtered Transaction', amount: 50 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockFilteredTransactions)
        } as Response);

        const result = await fetchFilteredTransactions(filters);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/filtered', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });
        expect(result).toEqual(mockFilteredTransactions);
      });

      it('should handle empty filters', async () => {
        const filters = {};

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve([])
        } as Response);

        const result = await fetchFilteredTransactions(filters);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/filtered', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });
        expect(result).toEqual([]);
      });
    });

    describe('fetchTransaction', () => {
      it('should fetch a specific transaction', async () => {
        const mockTransaction = { id: 1, description: 'Test Transaction', amount: 100 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockTransaction)
        } as Response);

        const result = await fetchTransaction(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/1');
        expect(result).toEqual(mockTransaction);
      });
    });

    describe('createTransaction', () => {
      it('should create a new transaction', async () => {
        const transactionData = {
          description: 'New Transaction',
          amount: 150,
          categoryId: 1,
          bankAccountId: 1
        };

        const mockCreatedTransaction = { id: 3, ...transactionData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCreatedTransaction)
        } as Response);

        const result = await createTransaction(transactionData);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });
        expect(result).toEqual(mockCreatedTransaction);
      });
    });

    describe('updateTransaction', () => {
      it('should update an existing transaction', async () => {
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

        const result = await updateTransaction(1, transactionData);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });
        expect(result).toEqual(mockUpdatedTransaction);
      });
    });

    describe('deleteTransaction', () => {
      it('should delete a transaction', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers({ 'content-type': 'text/plain' })
        } as Response);

        const result = await deleteTransaction(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/1', {
          method: 'DELETE',
        });
        expect(result).toBeNull();
      });
    });

    describe('importTransactions', () => {
      it('should import transactions with all options', async () => {
        const importData = {
          csvData: 'date,description,amount\n2024-01-01,Test,100',
          columnMappings: { date: 'executionDate', description: 'description', amount: 'amount' },
          dateFormat: 'YYYY-MM-DD',
          bankFormat: 'chase',
          bankAccountId: 1,
          creditCardId: null
        };

        const mockImportResult = {
          imported: 1,
          skipped: 0,
          errors: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockImportResult)
        } as Response);

        const result = await importTransactions(importData);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(importData),
        });
        expect(result).toEqual(mockImportResult);
      });
    });

    describe('findSimilarTransactions', () => {
      it('should find similar transactions by transaction ID', async () => {
        const mockSimilarTransactions = [
          { id: 2, description: 'Similar Transaction', amount: 100 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockSimilarTransactions)
        } as Response);

        const result = await findSimilarTransactions(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/similar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transactionId: 1, description: undefined }),
        });
        expect(result).toEqual(mockSimilarTransactions);
      });

      it('should find similar transactions by description', async () => {
        const mockSimilarTransactions = [
          { id: 2, description: 'Similar Transaction', amount: 100 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockSimilarTransactions)
        } as Response);

        const result = await findSimilarTransactions(undefined, 'test description');

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/similar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transactionId: undefined, description: 'test description' }),
        });
        expect(result).toEqual(mockSimilarTransactions);
      });
    });

    describe('bulkCategorizeTransactions', () => {
      it('should bulk categorize transactions', async () => {
        const transactionIds = [1, 2, 3];
        const categoryId = 5;

        const mockResult = {
          updated: 3,
          errors: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult)
        } as Response);

        const result = await bulkCategorizeTransactions(transactionIds, categoryId);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/bulk-categorize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transactionIds, categoryId }),
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('bulkTagTransactions', () => {
      it('should bulk tag transactions', async () => {
        const transactionIds = [1, 2, 3];
        const tagIds = [10, 20];

        const mockResult = {
          updated: 3,
          errors: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult)
        } as Response);

        const result = await bulkTagTransactions(transactionIds, tagIds);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/bulk-tag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transactionIds, tagIds }),
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('bulkDeleteTransactions', () => {
      it('should bulk delete transactions', async () => {
        const transactionIds = [1, 2, 3];

        const mockResult = {
          deleted: 3,
          errors: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult)
        } as Response);

        const result = await bulkDeleteTransactions(transactionIds);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/filtered', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: transactionIds }),
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe('enrichTransactionsWithPayPal', () => {
      it('should enrich transactions with PayPal data', async () => {
        const csvData = 'date,description,amount\n2024-01-01,PayPal Transaction,100';
        const dateRangeForMatching = 30;

        const mockResult = {
          enriched: 1,
          errors: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult)
        } as Response);

        const result = await enrichTransactionsWithPayPal(csvData, dateRangeForMatching);

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/paypal-enrich', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvData, dateRangeForMatching }),
        });
        expect(result).toEqual(mockResult);
      });
    });
  });

  describe('Bank Account API Functions', () => {
    describe('fetchBankAccounts', () => {
      it('should fetch all bank accounts', async () => {
        const mockBankAccounts = [
          { id: 1, name: 'Checking Account', balance: 1000 },
          { id: 2, name: 'Savings Account', balance: 5000 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockBankAccounts)
        } as Response);

        const result = await fetchBankAccounts();

        expect(mockFetch).toHaveBeenCalledWith('/api/bank-accounts');
        expect(result).toEqual(mockBankAccounts);
      });
    });

    describe('fetchBankAccount', () => {
      it('should fetch a specific bank account', async () => {
        const mockBankAccount = { id: 1, name: 'Checking Account', balance: 1000 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockBankAccount)
        } as Response);

        const result = await fetchBankAccount(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/bank-accounts/1');
        expect(result).toEqual(mockBankAccount);
      });
    });

    describe('createBankAccount', () => {
      it('should create a new bank account', async () => {
        const accountData = { name: 'New Account', balance: 2000 };

        const mockCreatedAccount = { id: 3, ...accountData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCreatedAccount)
        } as Response);

        const result = await createBankAccount(accountData);

        expect(mockFetch).toHaveBeenCalledWith('/api/bank-accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(accountData),
        });
        expect(result).toEqual(mockCreatedAccount);
      });
    });

    describe('updateBankAccount', () => {
      it('should update an existing bank account', async () => {
        const accountData = { name: 'Updated Account', balance: 3000 };

        const mockUpdatedAccount = { id: 1, ...accountData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUpdatedAccount)
        } as Response);

        const result = await updateBankAccount(1, accountData);

        expect(mockFetch).toHaveBeenCalledWith('/api/bank-accounts/1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(accountData),
        });
        expect(result).toEqual(mockUpdatedAccount);
      });
    });

    describe('deleteBankAccount', () => {
      it('should delete a bank account', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers({ 'content-type': 'text/plain' })
        } as Response);

        const result = await deleteBankAccount(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/bank-accounts/1', {
          method: 'DELETE',
        });
        expect(result).toBeNull();
      });
    });
  });

  describe('Credit Card API Functions', () => {
    describe('fetchCreditCards', () => {
      it('should fetch all credit cards', async () => {
        const mockCreditCards = [
          { id: 1, name: 'Visa Card', billingDay: 15, creditLimit: 5000, availableCredit: 4500 },
          { id: 2, name: 'MasterCard', billingDay: 20, creditLimit: 3000, availableCredit: 2800 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCreditCards)
        } as Response);

        const result = await fetchCreditCards();

        expect(mockFetch).toHaveBeenCalledWith('/api/credit-cards');
        expect(result).toEqual(mockCreditCards);
      });
    });

    describe('createCreditCard', () => {
      it('should create a new credit card', async () => {
        const cardData = {
          name: 'New Card',
          billingDay: 25,
          creditLimit: 4000,
          availableCredit: 4000,
          bankAccountId: 1
        };

        const mockCreatedCard = { id: 3, ...cardData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCreatedCard)
        } as Response);

        const result = await createCreditCard(cardData);

        expect(mockFetch).toHaveBeenCalledWith('/api/credit-cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cardData),
        });
        expect(result).toEqual(mockCreatedCard);
      });
    });
  });

  describe('Budget Management API Functions', () => {
    describe('fetchBudgetSummary', () => {
      it('should fetch budget summary', async () => {
        const mockBudgetSummary = {
          totalIncome: 5000,
          totalExpenses: 3000,
          savings: 2000
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockBudgetSummary)
        } as Response);

        const result = await fetchBudgetSummary();

        expect(mockFetch).toHaveBeenCalledWith('/api/categories/budget-summary');
        expect(result).toEqual(mockBudgetSummary);
      });
    });

    describe('fetchBudgetCategories', () => {
      it('should fetch budget categories', async () => {
        const mockBudgetCategories = [
          { id: 1, name: 'Groceries', monthlyBudget: 500, spent: 300 },
          { id: 2, name: 'Utilities', monthlyBudget: 200, spent: 150 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockBudgetCategories)
        } as Response);

        const result = await fetchBudgetCategories();

        expect(mockFetch).toHaveBeenCalledWith('/api/categories/budget-categories');
        expect(result).toEqual(mockBudgetCategories);
      });
    });

    describe('fetchCategoryTransactions', () => {
      it('should fetch category transactions with default months', async () => {
        const mockCategoryTransactions = [
          { id: 1, description: 'Grocery Transaction', amount: 50, categoryId: 1 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCategoryTransactions)
        } as Response);

        const result = await fetchCategoryTransactions(1);

        expect(mockFetch).toHaveBeenCalledWith('/api/categories/1/transactions?months=12');
        expect(result).toEqual(mockCategoryTransactions);
      });

      it('should fetch category transactions with custom months', async () => {
        const mockCategoryTransactions = [
          { id: 1, description: 'Grocery Transaction', amount: 50, categoryId: 1 }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCategoryTransactions)
        } as Response);

        const result = await fetchCategoryTransactions(1, 6);

        expect(mockFetch).toHaveBeenCalledWith('/api/categories/1/transactions?months=6');
        expect(result).toEqual(mockCategoryTransactions);
      });
    });
  });

  describe('Category API Functions', () => {
    describe('fetchCategories', () => {
      it('should fetch all categories', async () => {
        const mockCategories = [
          { id: 1, name: 'Groceries', keywords: ['food', 'grocery'] },
          { id: 2, name: 'Utilities', keywords: ['electric', 'water'] }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCategories)
        } as Response);

        const result = await fetchCategories();

        expect(mockFetch).toHaveBeenCalledWith('/api/categories');
        expect(result).toEqual(mockCategories);
      });
    });

    describe('updateCategoryBudget', () => {
      it('should update category budget settings', async () => {
        const budgetData = {
          budgetLevel: 'primary' as const,
          monthlyBudget: 500,
          yearlyBudget: 6000,
          maxThreshold: 600,
          warningThreshold: 450
        };

        const mockUpdatedCategory = { id: 1, name: 'Groceries', ...budgetData };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUpdatedCategory)
        } as Response);

        const result = await updateCategoryBudget(1, budgetData);

        expect(mockFetch).toHaveBeenCalledWith('/api/categories/1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(budgetData),
        });
        expect(result).toEqual(mockUpdatedCategory);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchTransactions()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);

      await expect(fetchTransactions()).rejects.toThrow('API error: 500');
    });

    it('should handle different error response formats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Validation error' })
      } as Response);

      await expect(fetchTransactions()).rejects.toThrow('Validation error');
    });
  });
});
