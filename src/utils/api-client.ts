/**
 * Client-side API helper for making requests to our Next.js API routes
 * This file replaces direct backend API calls in api.ts with calls to our local API routes
 */

import { Transaction } from "./types";

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return null;
};

// Transaction API functions

/**
 * Fetch all transactions
 */
export async function fetchTransactions() {
  const response = await fetch('/api/transactions');
  return handleResponse(response);
}

/**
 * Fetch filtered transactions
 */
export async function fetchFilteredTransactions(
  filters: {
    startDate?: string;
    endDate?: string;
    categoryIds?: number[];
    tagIds?: number[];
    minAmount?: number;
    maxAmount?: number;
    type?: 'expense' | 'income';
    searchTerm?: string;
    orderBy?: 'executionDate' | 'amount' | 'description';
    orderDirection?: 'asc' | 'desc';
    uncategorizedOnly?: boolean;
    bankAccountIds?: number[];
    creditCardIds?: number[];
  }
) {
  const response = await fetch('/api/transactions/filtered', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  });
  return handleResponse(response);
}

/**
 * Fetch a specific transaction
 */
export async function fetchTransaction(id: number) {
  const response = await fetch(`/api/transactions/${id}`);
  return handleResponse(response);
}

/**
 * Create a new transaction
 */
export async function createTransaction(transactionData: any) {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });
  return handleResponse(response);
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(id: number, transactionData: Transaction) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });
  return handleResponse(response);
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: number) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

/**
 * Import transactions
 */
export async function importTransactions(data: {
  csvData: string;
  columnMappings?: { [key: string]: string };
  dateFormat?: string;
  bankFormat?: string;
  bankAccountId?: number | null;
  creditCardId?: number | null;
}) {
  const response = await fetch('/api/transactions/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Find similar transactions
 */
export async function findSimilarTransactions(transactionId?: number, description?: string) {
  const response = await fetch('/api/transactions/similar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionId, description }),
  });
  return handleResponse(response);
}

/**
 * Bulk categorize transactions
 */
export async function bulkCategorizeTransactions(transactionIds: number[], categoryId: number) {
  const response = await fetch('/api/transactions/bulk-categorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionIds, categoryId }),
  });
  return handleResponse(response);
}

/**
 * Bulk tag transactions
 */
export async function bulkTagTransactions(transactionIds: number[], tagIds: number[]) {
  const response = await fetch('/api/transactions/bulk-tag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionIds, tagIds }),
  });
  return handleResponse(response);
}

/**
 * Bulk delete transactions
 */
export async function bulkDeleteTransactions(transactionIds: number[]) {
  // Using the filtered transactions endpoint with the DELETE method
  const response = await fetch('/api/transactions/filtered', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: transactionIds }),
  });
  return handleResponse(response);
}

/**
 * Enrich transactions with PayPal data
 */
export async function enrichTransactionsWithPayPal(csvData: string, dateRangeForMatching?: number) {
  const payload = {
    csvData,
    dateRangeForMatching
  };
  
  const response = await fetch('/api/transactions/paypal-enrich', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  return handleResponse(response);
}

// Bank Account API functions

/**
 * Fetch all bank accounts
 */
export async function fetchBankAccounts() {
  const response = await fetch('/api/bank-accounts');
  return handleResponse(response);
}

/**
 * Fetch a specific bank account
 */
export async function fetchBankAccount(id: number) {
  const response = await fetch(`/api/bank-accounts/${id}`);
  return handleResponse(response);
}

/**
 * Create a new bank account
 */
export async function createBankAccount(accountData: { name: string; balance: number }) {
  const response = await fetch('/api/bank-accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
  return handleResponse(response);
}

/**
 * Update an existing bank account
 */
export async function updateBankAccount(id: number, accountData: { name?: string; balance?: number }) {
  const response = await fetch(`/api/bank-accounts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
  return handleResponse(response);
}

/**
 * Delete a bank account
 */
export async function deleteBankAccount(id: number) {
  const response = await fetch(`/api/bank-accounts/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// Credit Card API functions

/**
 * Fetch all credit cards
 */
export async function fetchCreditCards() {
  const response = await fetch('/api/credit-cards');
  return handleResponse(response);
}

/**
 * Fetch a specific credit card
 */
export async function fetchCreditCard(id: number) {
  const response = await fetch(`/api/credit-cards/${id}`);
  return handleResponse(response);
}

/**
 * Create a new credit card
 */
export async function createCreditCard(cardData: { name: string; billingDay: number; creditLimit: number; availableCredit: number; bankAccountId?: number }) {
  const response = await fetch('/api/credit-cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cardData),
  });
  return handleResponse(response);
}

/**
 * Update an existing credit card
 */
export async function updateCreditCard(id: number, cardData: { name?: string; billingDay?: number; creditLimit?: number; availableCredit?: number; bankAccountId?: number }) {
  const response = await fetch(`/api/credit-cards/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cardData),
  });
  return handleResponse(response);
}

/**
 * Delete a credit card
 */
export async function deleteCreditCard(id: number) {
  const response = await fetch(`/api/credit-cards/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// Budget Management API functions

/**
 * Get intelligent budget summary
 */
export async function fetchBudgetSummary() {
  const response = await fetch('/api/categories/budget-summary');
  return handleResponse(response);
}

/**
 * Get all categories with spending data for budget management
 */
export async function fetchBudgetCategories() {
  const response = await fetch('/api/categories/budget-categories');
  return handleResponse(response);
}

/**
 * Fetch transactions for a specific category with summary statistics
 */
export async function fetchCategoryTransactions(categoryId: number, months: number = 12) {
  const response = await fetch(`/api/categories/${categoryId}/transactions?months=${months}`);
  return handleResponse(response);
}

// Category API functions (extend existing categories API)

/**
 * Fetch all categories
 */
export async function fetchCategories() {
  const response = await fetch('/api/categories');
  return handleResponse(response);
}

/**
 * Update category with budget settings
 */
export async function updateCategoryBudget(id: number, budgetData: {
  budgetLevel?: 'primary' | 'secondary' | 'optional';
  monthlyBudget?: number;
  yearlyBudget?: number;
  maxThreshold?: number;
  warningThreshold?: number;
}) {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(budgetData),
  });
  return handleResponse(response);
} 