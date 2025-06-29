import { mockLinkedTransactions, mockUnconfirmedPatterns } from "@/mocks/recurringPatternsMock";
import { CreditCard, RecurringTransaction, Transaction, DuplicateTransactionChoice } from "./types";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return null;
};

// =============================================================================
// CATEGORIES API
// =============================================================================

export async function fetchCategories(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createCategory(token: string, category: { name: string, keywords?: string[], excludeFromExpenseAnalytics?: boolean, analyticsExclusionReason?: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  return handleResponse(res);
}

export async function updateCategory(token: string, id: number, category: { name?: string, keywords?: string[], excludeFromExpenseAnalytics?: boolean, analyticsExclusionReason?: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  return handleResponse(res);
}

export const deleteCategory = async (token: string, id: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

export async function resetCategoriesToDefaults(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/reset-to-defaults`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to reset categories to defaults");
  }

  const data = await res.json();
  
  // Ensure we return an array
  return Array.isArray(data) ? data : [];
}

// =============================================================================
// TAGS API
// =============================================================================

export async function fetchTags(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res);
}

export async function createTag(token: string, tag: { name: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tag),
  });

  if (!res.ok) {
    throw new Error(`Failed to create tag: ${res.statusText}`);
  }

  return res.json();
}

export async function updateTag(token: string, id: number, tag: { name: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tag),
  });

  if (!res.ok) {
    throw new Error(`Failed to update tag: ${res.statusText}`);
  }

  return res.json();
}

export async function deleteTag(token: string, id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete tag: ${res.statusText}`);
  }
}

// =============================================================================
// TRANSACTIONS API
// =============================================================================

export const updateTransaction = async (token: string, id: number, transaction: Transaction) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });

  if (!res.ok) throw new Error('Failed to update transaction');
  return res.json();
}

export async function bulkAiCategorize(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-ai-categorize`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to run bulk keyword categorization');
  }

  return response.json();
}

// =============================================================================
// USER API
// =============================================================================

export async function fetchUserByAuth0Id(auth0Id: string, token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${auth0Id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null; // User not found
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

export async function createUser(auth0Id: string, email: string, token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth0Id,
      email,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// CATEGORIZATION API
// =============================================================================

export async function fetchUncategorizedTransactions(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/uncategorized`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch uncategorized transactions');
  }

  return response.json();
}

export async function fetchCommonKeywords(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/common-keywords`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch common keywords');
  }

  return response.json();
}

export async function getSuggestedKeywordsForCategory(token: string, categoryId: number) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/suggested-keywords`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch suggested keywords');
  }

  return response.json();
}

export async function addKeywordToCategory(token: string, categoryId: number, keyword: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/keywords`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    throw new Error('Failed to add keyword to category');
  }

  return response.json();
}

export async function removeKeywordFromCategory(token: string, categoryId: number, keyword: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/keywords/${encodeURIComponent(keyword)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove keyword from category');
  }

  return response.json();
}

export async function learnFromTransaction(token: string, categoryId: number, transactionId: number) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/learn-from-transaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionId }),
  });

  if (!response.ok) {
    throw new Error('Failed to learn from transaction');
  }

  return response.json();
}

export async function previewKeywordImpact(token: string, categoryId: number, keyword: string, onlyUncategorized: boolean = false) {
  const params = new URLSearchParams({ 
    keyword, 
    onlyUncategorized: onlyUncategorized.toString() 
  });
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/preview-keyword-impact?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to preview keyword impact');
  }

  return response.json();
}

export async function applyKeywordToCategory(token: string, categoryId: number, keyword: string, applyTo: "none" | "uncategorized" | "all" | number[]) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/apply-keyword`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword, applyTo }),
  });

  if (!response.ok) {
    throw new Error('Failed to apply keyword to category');
  }

  return response.json();
}

export async function bulkUncategorize(token: string, transactionIds: number[]) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-uncategorize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_ids: transactionIds,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to bulk uncategorize transactions');
  }

  return response.json();
}

// =============================================================================
// PENDING DUPLICATES API
// =============================================================================

export async function fetchPendingDuplicates(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function resolvePendingDuplicate(
  token: string, 
  duplicateId: number, 
  choice: DuplicateTransactionChoice,
  recurringTransactionId?: number
) {
  const body: any = { choice };
  if (recurringTransactionId) {
    body.recurringTransactionId = recurringTransactionId;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/${duplicateId}/resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to resolve pending duplicate');
  }

  return response.json();
}

export async function triggerDuplicateDetection(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/detect`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to trigger duplicate detection');
  }

  return response.json();
}

export async function bulkResolvePendingDuplicates(
  token: string,
  duplicateIds: number[],
  choice: DuplicateTransactionChoice
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/bulk-resolve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ duplicateIds, choice }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to bulk resolve pending duplicates');
  }

  return response.json();
}

export async function bulkDeletePendingDuplicates(
  token: string,
  duplicateIds: number[]
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/bulk-delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ duplicateIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to bulk delete pending duplicates');
  }

  return response.json();
}

export async function cleanupActualDuplicates(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/cleanup-actual-duplicates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to cleanup actual duplicates');
  }

  return response.json();
}

// =============================================================================
// RECURRING TRANSACTIONS API
// =============================================================================

export async function fetchRecurringTransactions(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recurring transactions');
  }

  return await response.json();
}

export async function createRecurringTransaction(token: string, recuringTransaction: RecurringTransaction) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recuringTransaction),
  });

  if (!response.ok) {
    throw new Error('Failed to create recurring transaction');
  }

  return await response.json();
}

export async function updateRecurringTransaction(token: string, id: number, recurringTransaction: RecurringTransaction, applyToPast: boolean = false) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${id}?applyToPast=${applyToPast}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recurringTransaction),
  });

  if (!response.ok) {
    throw new Error('Failed to update recurring transaction');
  }

  return await response.json();
}

export async function deleteRecurringTransaction(token: string, id: number, deleteOption: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${id}?deleteOption=${deleteOption}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete recurring transaction');
  }

  return await response.json();
}

export const getRecurringTransactionById = async (token: string, id: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recurring transaction');
  }

  return await response.json();
};

export const fetchUnconfirmedPatterns = async (token: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/unconfirmed-patterns`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch unconfirmed patterns');
  }

  return await response.json();
};

export const getLinkedTransactions = async (token: string, patternId: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${patternId}/linked-transactions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch linked transactions');
  }

  return await response.json();
};

export const confirmPattern = async (token: string, patternId: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${patternId}/confirm-pattern`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to confirm pattern');
  }

  return await response.json();
};

export const unlinkFromRecurringTransaction = async (token: string, transactionId: number, patternId: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${patternId}/remove-transaction/${transactionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to unlink transaction from pattern');
  }

  return await response.json();
};

export const adjustPattern = async (token: string, patternId: number, patternData: any) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${patternId}/adjust-pattern`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patternData),
  });

  if (!response.ok) {
    throw new Error('Failed to adjust pattern');
  }

  return await response.json();
};

// =============================================================================
// DASHBOARD FUNCTIONS
// =============================================================================

export async function fetchExpenseDistribution(token: string, startDate: string, endDate: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/dashboard/expense-distribution?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch expense distribution');
  }

  return response.json();
}

export async function fetchMonthlySummary(token: string, months: number = 12) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/dashboard/monthly-summary?months=${months}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch monthly summary');
  }

  return response.json();
}

export async function fetchMonthlyStatistics(token: string, date: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/dashboard/statistics?date=${date}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch monthly statistics');
  }

  return response.json();
}

export const fetchCurrentBalance = async (token: string) => {
  console.log('Fetching current balance', token);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/current-balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('Response', response);

  if (!response.ok) {
    throw new Error('Failed to fetch current balance');
  }

  return await response.json();
}

  