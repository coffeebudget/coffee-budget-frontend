/**
 * Income Plans API Client
 *
 * Functions for interacting with the income plans backend API.
 * All functions require a valid JWT token for authentication.
 */

import {
  IncomePlan,
  CreateIncomePlanDto,
  UpdateIncomePlanDto,
  IncomePlanStatus,
  MonthlySummary,
  AnnualSummary,
  IncomePlanEntry,
  CreateIncomePlanEntryDto,
  UpdateIncomePlanEntryDto,
  LinkTransactionDto,
  IncomePlanTrackingSummary,
  MonthlyTrackingSummary,
  AnnualTrackingSummary,
  IncomePlanEntryStatus,
} from '@/types/income-plan-types';

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
      throw new Error('Income plan not found');
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

export async function fetchIncomePlans(
  token: string,
  status?: IncomePlanStatus | 'all'
): Promise<IncomePlan[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') {
    params.append('status', status);
  }

  const url = `${API_URL}/income-plans${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<IncomePlan[]>(response);
}

export async function fetchActiveIncomePlans(
  token: string
): Promise<IncomePlan[]> {
  return fetchIncomePlans(token, 'active');
}

export async function fetchIncomePlanById(
  token: string,
  id: number
): Promise<IncomePlan> {
  const response = await fetch(`${API_URL}/income-plans/${id}`, {
    headers: getHeaders(token),
  });

  return handleResponse<IncomePlan>(response);
}

export async function createIncomePlan(
  token: string,
  data: CreateIncomePlanDto
): Promise<IncomePlan> {
  const response = await fetch(`${API_URL}/income-plans`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<IncomePlan>(response);
}

export async function updateIncomePlan(
  token: string,
  id: number,
  data: UpdateIncomePlanDto
): Promise<IncomePlan> {
  const response = await fetch(`${API_URL}/income-plans/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<IncomePlan>(response);
}

export async function deleteIncomePlan(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_URL}/income-plans/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  return handleResponse<void>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchMonthlySummary(
  token: string,
  year?: number,
  month?: number
): Promise<MonthlySummary> {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());

  const url = `${API_URL}/income-plans/summary/monthly${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<MonthlySummary>(response);
}

export async function fetchAnnualSummary(
  token: string,
  year?: number
): Promise<AnnualSummary> {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());

  const url = `${API_URL}/income-plans/summary/annual${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<AnnualSummary>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING: ENTRY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function createOrUpdateEntry(
  token: string,
  incomePlanId: number,
  data: CreateIncomePlanEntryDto
): Promise<IncomePlanEntry> {
  const response = await fetch(`${API_URL}/income-plans/${incomePlanId}/entries`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<IncomePlanEntry>(response);
}

export async function fetchEntries(
  token: string,
  incomePlanId: number,
  year?: number
): Promise<IncomePlanEntry[]> {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());

  const url = `${API_URL}/income-plans/${incomePlanId}/entries${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<IncomePlanEntry[]>(response);
}

export async function fetchEntryForMonth(
  token: string,
  incomePlanId: number,
  year: number,
  month: number
): Promise<IncomePlanEntry | null> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/entries/${year}/${month}`,
    {
      headers: getHeaders(token),
    }
  );

  return handleResponse<IncomePlanEntry | null>(response);
}

export async function updateEntry(
  token: string,
  incomePlanId: number,
  entryId: number,
  data: UpdateIncomePlanEntryDto
): Promise<IncomePlanEntry> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/entries/${entryId}`,
    {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<IncomePlanEntry>(response);
}

export async function deleteEntry(
  token: string,
  incomePlanId: number,
  entryId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/entries/${entryId}`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  );

  return handleResponse<void>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING: LINK TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function linkTransaction(
  token: string,
  incomePlanId: number,
  data: LinkTransactionDto
): Promise<IncomePlanEntry> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/link-transaction`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<IncomePlanEntry>(response);
}

export async function unlinkTransaction(
  token: string,
  incomePlanId: number,
  year: number,
  month: number
): Promise<IncomePlanEntry | null> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/unlink-transaction/${year}/${month}`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  );

  return handleResponse<IncomePlanEntry | null>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING: SUMMARIES
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchTrackingSummaryForPlan(
  token: string,
  incomePlanId: number,
  year: number,
  month: number
): Promise<IncomePlanTrackingSummary> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/tracking/${year}/${month}`,
    {
      headers: getHeaders(token),
    }
  );

  return handleResponse<IncomePlanTrackingSummary>(response);
}

export async function fetchMonthlyTrackingSummary(
  token: string,
  year: number,
  month: number
): Promise<MonthlyTrackingSummary> {
  const response = await fetch(
    `${API_URL}/income-plans/tracking/monthly/${year}/${month}`,
    {
      headers: getHeaders(token),
    }
  );

  return handleResponse<MonthlyTrackingSummary>(response);
}

export async function fetchAnnualTrackingSummary(
  token: string,
  year: number
): Promise<AnnualTrackingSummary> {
  const response = await fetch(
    `${API_URL}/income-plans/tracking/annual/${year}`,
    {
      headers: getHeaders(token),
    }
  );

  return handleResponse<AnnualTrackingSummary>(response);
}

export async function fetchCurrentMonthStatus(
  token: string,
  incomePlanId: number
): Promise<{ status: IncomePlanEntryStatus }> {
  const response = await fetch(
    `${API_URL}/income-plans/${incomePlanId}/status`,
    {
      headers: getHeaders(token),
    }
  );

  return handleResponse<{ status: IncomePlanEntryStatus }>(response);
}
