/**
 * Expense Plans API Client
 *
 * Functions for interacting with the expense plans backend API.
 * All functions require a valid JWT token for authentication.
 */

import {
  ExpensePlan,
  ExpensePlanTransaction,
  CreateExpensePlanDto,
  UpdateExpensePlanDto,
  ContributeDto,
  WithdrawDto,
  AdjustBalanceDto,
  BulkFundDto,
  LinkTransactionDto,
  MonthlyDepositSummary,
  TimelineEntry,
  BulkFundResult,
  BulkQuickFundResult,
  ExpensePlanStatus,
  CoverageSummaryResponse,
} from '@/types/expense-plan-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Expense plan not found');
    }
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Invalid request');
    }
    throw new Error(`API Error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchExpensePlans(
  token: string,
  status?: ExpensePlanStatus | 'all'
): Promise<ExpensePlan[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') {
    params.append('status', status);
  }

  const url = `${API_URL}/expense-plans${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<ExpensePlan[]>(response);
}

export async function fetchActiveExpensePlans(
  token: string
): Promise<ExpensePlan[]> {
  return fetchExpensePlans(token, 'active');
}

export async function fetchExpensePlanById(
  token: string,
  id: number
): Promise<ExpensePlan> {
  const response = await fetch(`${API_URL}/expense-plans/${id}`, {
    headers: getHeaders(token),
  });

  return handleResponse<ExpensePlan>(response);
}

export async function createExpensePlan(
  token: string,
  data: CreateExpensePlanDto
): Promise<ExpensePlan> {
  const response = await fetch(`${API_URL}/expense-plans`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<ExpensePlan>(response);
}

export async function updateExpensePlan(
  token: string,
  id: number,
  data: UpdateExpensePlanDto
): Promise<ExpensePlan> {
  const response = await fetch(`${API_URL}/expense-plans/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<ExpensePlan>(response);
}

export async function deleteExpensePlan(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_URL}/expense-plans/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  return handleResponse<void>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchExpensePlanTransactions(
  token: string,
  planId: number
): Promise<ExpensePlanTransaction[]> {
  const response = await fetch(`${API_URL}/expense-plans/${planId}/transactions`, {
    headers: getHeaders(token),
  });

  return handleResponse<ExpensePlanTransaction[]>(response);
}

export async function contributeToExpensePlan(
  token: string,
  planId: number,
  data: ContributeDto
): Promise<ExpensePlanTransaction> {
  const response = await fetch(`${API_URL}/expense-plans/${planId}/contribute`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<ExpensePlanTransaction>(response);
}

export async function withdrawFromExpensePlan(
  token: string,
  planId: number,
  data: WithdrawDto
): Promise<ExpensePlanTransaction> {
  const response = await fetch(`${API_URL}/expense-plans/${planId}/withdraw`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<ExpensePlanTransaction>(response);
}

export async function adjustExpensePlanBalance(
  token: string,
  planId: number,
  data: AdjustBalanceDto
): Promise<ExpensePlanTransaction> {
  const response = await fetch(`${API_URL}/expense-plans/${planId}/adjust`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<ExpensePlanTransaction>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNDING OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function quickFundExpensePlan(
  token: string,
  planId: number
): Promise<ExpensePlanTransaction> {
  const response = await fetch(`${API_URL}/expense-plans/${planId}/quick-fund`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  return handleResponse<ExpensePlanTransaction>(response);
}

export async function fundExpensePlanToTarget(
  token: string,
  planId: number
): Promise<ExpensePlanTransaction | null> {
  const response = await fetch(`${API_URL}/expense-plans/${planId}/fund-to-target`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  // 200 OK with null means already fully funded
  if (response.ok) {
    const data = await response.json();
    return data;
  }

  return handleResponse<ExpensePlanTransaction | null>(response);
}

export async function bulkFundExpensePlans(
  token: string,
  data: BulkFundDto
): Promise<BulkFundResult> {
  const response = await fetch(`${API_URL}/expense-plans/bulk-fund`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<BulkFundResult>(response);
}

export async function bulkQuickFundExpensePlans(
  token: string
): Promise<BulkQuickFundResult> {
  const response = await fetch(`${API_URL}/expense-plans/bulk-quick-fund`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  return handleResponse<BulkQuickFundResult>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION LINKING
// ═══════════════════════════════════════════════════════════════════════════

export async function linkTransactionToExpensePlan(
  token: string,
  planTransactionId: number,
  data: LinkTransactionDto
): Promise<ExpensePlanTransaction> {
  const response = await fetch(
    `${API_URL}/expense-plans/transactions/${planTransactionId}/link`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<ExpensePlanTransaction>(response);
}

export async function unlinkTransactionFromExpensePlan(
  token: string,
  planTransactionId: number
): Promise<ExpensePlanTransaction> {
  const response = await fetch(
    `${API_URL}/expense-plans/transactions/${planTransactionId}/link`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  );

  return handleResponse<ExpensePlanTransaction>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchMonthlyDepositSummary(
  token: string
): Promise<MonthlyDepositSummary> {
  const response = await fetch(`${API_URL}/expense-plans/summary/monthly-deposit`, {
    headers: getHeaders(token),
  });

  return handleResponse<MonthlyDepositSummary>(response);
}

export async function fetchExpenseTimeline(
  token: string,
  months: number = 12
): Promise<TimelineEntry[]> {
  const params = new URLSearchParams({
    months: months.toString(),
  });

  const response = await fetch(
    `${API_URL}/expense-plans/summary/timeline?${params}`,
    {
      headers: getHeaders(token),
    }
  );

  return handleResponse<TimelineEntry[]>(response);
}

export async function fetchCoverageSummary(
  token: string
): Promise<CoverageSummaryResponse> {
  const response = await fetch(`${API_URL}/expense-plans/summary/coverage`, {
    headers: getHeaders(token),
  });

  return handleResponse<CoverageSummaryResponse>(response);
}
