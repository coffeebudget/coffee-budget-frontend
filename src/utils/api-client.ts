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
 * Fetch transactions with filters
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