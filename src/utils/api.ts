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

export async function fetchTransactions(token: string) {  

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorMessage = await res.text();
    console.error(`❌ Fetch Transactions Failed: ${res.status} - ${errorMessage}`);
    throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  }

  return res.json();
}


  
export async function deleteTransaction(id: number, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete transaction: ${res.statusText}`);
  }
}

export async function createTransaction(transactionData: any, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transactionData),
  });

  if (!res.ok) {
    throw new Error(`Failed to create transaction: ${res.statusText}`);
  }

  return res.json();
}

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

// Credit Cards
export async function fetchCreditCards(token: string) {
  console.log('Fetching credit cards', token);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/credit-cards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function createCreditCard(token: string, card: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/credit-cards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  });
  return handleResponse(res);
}

export async function updateCreditCard(token: string, id: number, card: Partial<CreditCard>) {
  if (!Number.isInteger(id)) {
    throw new Error('Invalid credit card ID');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/credit-cards/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: card.name,
      billingDay: card.billingDay,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      bankAccountId: card.bankAccountId ? Number(card.bankAccountId) : undefined
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Update credit card error:', errorData);
    throw new Error(`Failed to update credit card: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

export async function deleteCreditCard(token: string, id: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/credit-cards/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

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
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/auth/callback`, {
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
    const errorData = await response.json();
    console.error('Create user error:', errorData);
    throw new Error(`Failed to create user: ${JSON.stringify(errorData)}`);
  }

  return response.json();
};

export const getRecurringTransactionById = async (token: string, id: number) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recurring transaction');
  }

  return await response.json();
};

export async function fetchRecurringTransactions(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorMessage = await res.text();
    console.error(`❌ Fetch Recurring Transactions Failed: ${res.status} - ${errorMessage}`);
    throw new Error(`Failed to fetch recurring transactions: ${res.statusText}`);
  }

  return res.json();
}

export async function createRecurringTransaction(token: string, recuringTransaction: RecurringTransaction) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recuringTransaction),
  });

  if (!res.ok) throw new Error("Failed to create recurring transaction");
  return res.json();
}

export async function updateRecurringTransaction(token: string, id: number, recurringTransaction: RecurringTransaction, applyToPast: boolean = false) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...recurringTransaction, applyToPast }),
  });

  if (!res.ok) throw new Error("Failed to update recurring transaction");
  return res.json();
}

export async function deleteRecurringTransaction(token: string, id: number, deleteOption: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deleteOption }),
  });

  if (!res.ok) throw new Error("Failed to delete recurring transaction");
}

export async function fetchPendingDuplicates(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return handleResponse(res);
}

export async function resolveDuplicate(
  token: string, 
  duplicateId: number, 
  choice: DuplicateTransactionChoice
) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/transactions/resolve-duplicate/${Number(duplicateId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ choice }),
  });
  return handleResponse(res);
}

export async function resolvePendingDuplicate(
  token: string, 
  duplicateId: number, 
  choice: DuplicateTransactionChoice,
  recurringTransactionId?: number
) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/${duplicateId}/resolve`;
  
  const body: any = { choice };
  if (recurringTransactionId) {
    body.recurringTransactionId = recurringTransactionId;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Failed to resolve pending duplicate");
  }

  return res.json();
}

export async function triggerDuplicateDetection(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/detect-duplicates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to trigger duplicate detection: ${res.statusText}`);
  }

  return res.json();
}

export async function getDuplicateDetectionStatus(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/detect-duplicates/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get duplicate detection status: ${res.statusText}`);
  }

  return res.json();
}

export async function bulkResolvePendingDuplicates(
  token: string,
  duplicateIds: number[],
  choice: DuplicateTransactionChoice
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/bulk-resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ duplicateIds, choice }),
  });

  if (!res.ok) {
    throw new Error("Failed to bulk resolve pending duplicates");
  }

  return res.json();
}

export async function bulkDeletePendingDuplicates(
  token: string,
  duplicateIds: number[]
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/bulk-delete`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ duplicateIds }),
  });

  if (!res.ok) {
    throw new Error("Failed to bulk delete pending duplicates");
  }

  return res.json();
}

export async function cleanupActualDuplicates(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pending-duplicates/cleanup-actual-duplicates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to cleanup actual duplicates");
  }

  return res.json();
}

export async function importTransactions(
  token: string,
  data: {
    csvData: string;
    columnMappings?: { [key: string]: string };
    dateFormat?: string;
    bankFormat?: string;
    bankAccountId?: number | null;
    creditCardId?: number | null;
  }
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Failed to import transactions");
  }

  return res.json();
}


// Dashboard API functions
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

export async function fetchFilteredTransactions(
  token: string,
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
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.categoryIds?.length) params.append('categoryIds', filters.categoryIds.join(','));
  if (filters.tagIds?.length) params.append('tagIds', filters.tagIds.join(','));
  if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
  if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
  if (filters.orderBy) params.append('orderBy', filters.orderBy);
  if (filters.orderDirection) params.append('orderDirection', filters.orderDirection);
  if (filters.uncategorizedOnly) params.append('uncategorizedOnly', 'true');
  if (filters.bankAccountIds?.length) params.append('bankAccountIds', filters.bankAccountIds.join(','));
  if (filters.creditCardIds?.length) params.append('creditCardIds', filters.creditCardIds.join(','));

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/dashboard/transactions?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch filtered transactions');
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

// utils/api.ts
export async function fetchCashFlowForecast(
  token: string,
  months: number = 24,
  mode: 'historical' | 'recurring' = 'historical'
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/cash-flow-forecast?months=${months}&mode=${mode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch cash flow forecast");
  }

  return res.json();
}

// Savings Plan
export async function fetchSavingsPlan(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/savings-plan`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch savings plan");
  }

  return res.json();
}

// Recurring Transactions
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

export const runRecurringPatternDetection = async (token: string) => { 
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/detect-all-patterns`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error("Failed to detect recurring patterns");
  }

  return response.json();
}

// Add these testing functions
export const testFetchUnconfirmedPatterns = async () => {
  return mockUnconfirmedPatterns;
};

export const testGetLinkedTransactions = async () => {
  return mockLinkedTransactions;
};

export const testConfirmPattern = async () => {
  return { success: true };
};

export const testUnlinkFromRecurringTransaction = async () => {
  return { success: true };
};

export const testAdjustPattern = async () => {
  return { success: true };
};

// Add these functions to your utils/api.ts file

export async function fetchUncategorizedTransactions(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/uncategorized-transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch uncategorized transactions");
  }

  return res.json();
}

export async function fetchCommonKeywords(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/common-keywords`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch common keywords");
  }

  return res.json();
}

export async function bulkCategorizeByKeyword(token: string, keyword: string, categoryId: number) {
  console.log("Bulk categorize request:", { keyword, categoryId }); // Debug log
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/bulk-categorize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keyword, categoryId }),
  });

  if (!res.ok) {
    // Get more detailed error information
    try {
      const errorData = await res.json();
      console.error("Bulk categorize error response:", errorData);
      throw new Error(errorData.message || `Failed to bulk categorize transactions: ${res.status} ${res.statusText}`);
    } catch (parseError) {
      console.error("Error parsing error response:", parseError);
      throw new Error(`Failed to bulk categorize transactions: ${res.status} ${res.statusText}`);
    }
  }

  return res.json();
}

export async function getSuggestedKeywordsForCategory(token: string, categoryId: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/suggested-keywords`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch suggested keywords");
  }

  return res.json();
}

export async function addKeywordToCategory(token: string, categoryId: number, keyword: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/keywords`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keyword }),
  });

  if (!res.ok) {
    throw new Error("Failed to add keyword to category");
  }

  return res.json();
}

export async function removeKeywordFromCategory(token: string, categoryId: number, keyword: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/keywords/${encodeURIComponent(keyword)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to remove keyword from category");
  }

  return res.json();
}

export async function learnFromTransaction(token: string, categoryId: number, transactionId: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/learn-from-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactionId }),
  });

  if (!res.ok) {
    throw new Error("Failed to learn from transaction");
  }

  return res.json();
}

export async function suggestCategoryForDescription(token: string, description: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/suggest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    throw new Error("Failed to suggest category");
  }

  return res.json();
}

export async function acceptSuggestedCategory(token: string, transactionId: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/accept-suggested-category`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to accept suggested category');
  }

  return response.json();
}

export async function rejectSuggestedCategory(token: string, transactionId: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/reject-suggested-category`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to reject suggested category');
  }

  return response.json();
}

// AI categorization removed - focusing on keyword-based categorization only
// export async function getAISuggestion(...) { ... }

/**
 * Analyze spending patterns using AI (replacement for categorization)
 */
export async function analyzeExpenses(
  token: string, 
  transactions: any[], 
  analysisType: 'monthly' | 'category' | 'trends' = 'monthly'
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/analyze-expenses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactions, analysisType }),
  });

  if (!res.ok) {
    throw new Error("Failed to analyze expenses");
  }

  return res.json();
}

/**
 * Generate spending summary for a period
 */
export async function generateSpendingSummary(
  token: string, 
  transactions: any[], 
  period: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/spending-summary`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactions, period }),
  });

  if (!res.ok) {
    throw new Error("Failed to generate spending summary");
  }

  return res.json();
}

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

// Add these new API functions

export async function previewKeywordImpact(token: string, categoryId: number, keyword: string, onlyUncategorized: boolean = false) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/preview-keyword-impact?keyword=${encodeURIComponent(keyword)}&onlyUncategorized=${onlyUncategorized}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
}

export async function applyKeywordToCategory(token: string, categoryId: number, keyword: string, applyTo: "none" | "uncategorized" | "all" | number[]) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/apply-keyword`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyword,
      applyTo
    }),
  });
  
  return handleResponse(response);
}

export async function bulkUncategorize(token: string, transactionIds: number[]) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-uncategorize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionIds
    }),
  });
  
  return handleResponse(response);
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

  