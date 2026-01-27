/**
 * Expense Plans API Client
 *
 * Functions for interacting with the expense plans backend API.
 * All functions require a valid JWT token for authentication.
 */

import {
  ExpensePlan,
  CreateExpensePlanDto,
  UpdateExpensePlanDto,
  MonthlyDepositSummary,
  TimelineEntry,
  ExpensePlanStatus,
  CoverageSummaryResponse,
  LongTermStatusSummary,
  ExpensePlanWithStatus,
  AccountAllocationSummaryResponse,
  CoveragePeriodType,
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
// ADJUSTMENT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function acceptAdjustment(
  token: string,
  planId: number,
  customAmount?: number
): Promise<ExpensePlan> {
  const response = await fetch(
    `${API_URL}/expense-plans/${planId}/accept-adjustment`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ customAmount }),
    }
  );

  return handleResponse<ExpensePlan>(response);
}

export async function dismissAdjustment(
  token: string,
  planId: number
): Promise<ExpensePlan> {
  const response = await fetch(
    `${API_URL}/expense-plans/${planId}/dismiss-adjustment`,
    {
      method: 'POST',
      headers: getHeaders(token),
    }
  );

  return handleResponse<ExpensePlan>(response);
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
  token: string,
  period?: CoveragePeriodType
): Promise<CoverageSummaryResponse> {
  const params = new URLSearchParams();
  if (period) {
    params.append('period', period);
  }

  const url = `${API_URL}/expense-plans/summary/coverage${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<CoverageSummaryResponse>(response);
}

/**
 * Fetch long-term sinking fund status summary
 */
export async function fetchLongTermStatus(
  token: string
): Promise<LongTermStatusSummary> {
  const response = await fetch(`${API_URL}/expense-plans/long-term-status`, {
    headers: getHeaders(token),
  });

  return handleResponse<LongTermStatusSummary>(response);
}

/**
 * Fetch expense plans with funding status fields
 */
export async function fetchExpensePlansWithStatus(
  token: string
): Promise<ExpensePlanWithStatus[]> {
  const response = await fetch(`${API_URL}/expense-plans/with-status`, {
    headers: getHeaders(token),
  });

  return handleResponse<ExpensePlanWithStatus[]>(response);
}

/**
 * Fetch account allocation summary showing what each account should hold.
 * For fixed_monthly plans: requiredToday = targetAmount
 * For sinking funds: requiredToday = expectedFundedByNow
 *
 * @param token - JWT token
 * @param period - Time period for allocation calculation (defaults to this_month)
 */
export async function fetchAccountAllocationSummary(
  token: string,
  period?: CoveragePeriodType
): Promise<AccountAllocationSummaryResponse> {
  const params = new URLSearchParams();
  if (period) {
    params.append('period', period);
  }

  const url = `${API_URL}/expense-plans/summary/account-allocation${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<AccountAllocationSummaryResponse>(response);
}
