/**
 * Expense Plan Suggestions API Client
 *
 * Functions for interacting with the expense plan suggestions backend API.
 * All functions require a valid JWT token for authentication.
 */

import {
  ExpensePlanSuggestion,
  SuggestionListResponse,
  GenerateSuggestionsResponse,
  ApprovalResult,
  BulkActionResult,
  ApiUsageStats,
  GenerateSuggestionsDto,
  ApproveSuggestionDto,
  RejectSuggestionDto,
  BulkActionDto,
  SuggestionStatus,
} from '@/types/expense-plan-suggestion-types';

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
      throw new Error('Suggestion not found');
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
// READ OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all suggestions for the authenticated user
 */
export async function fetchSuggestions(
  token: string,
  status?: SuggestionStatus
): Promise<SuggestionListResponse> {
  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }

  const url = `${API_URL}/expense-plan-suggestions${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<SuggestionListResponse>(response);
}

/**
 * Fetch only pending suggestions
 */
export async function fetchPendingSuggestions(
  token: string
): Promise<SuggestionListResponse> {
  const response = await fetch(`${API_URL}/expense-plan-suggestions/pending`, {
    headers: getHeaders(token),
  });

  return handleResponse<SuggestionListResponse>(response);
}

/**
 * Fetch a single suggestion by ID
 */
export async function fetchSuggestionById(
  token: string,
  id: number
): Promise<ExpensePlanSuggestion> {
  const response = await fetch(`${API_URL}/expense-plan-suggestions/${id}`, {
    headers: getHeaders(token),
  });

  return handleResponse<ExpensePlanSuggestion>(response);
}

/**
 * Get API usage statistics
 */
export async function fetchApiUsageStats(token: string): Promise<ApiUsageStats> {
  const response = await fetch(`${API_URL}/expense-plan-suggestions/api-usage`, {
    headers: getHeaders(token),
  });

  return handleResponse<ApiUsageStats>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// WRITE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate new suggestions by analyzing transaction patterns
 */
export async function generateSuggestions(
  token: string,
  options?: GenerateSuggestionsDto
): Promise<GenerateSuggestionsResponse> {
  const response = await fetch(`${API_URL}/expense-plan-suggestions/generate`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(options || {}),
  });

  return handleResponse<GenerateSuggestionsResponse>(response);
}

/**
 * Approve a suggestion and create an expense plan
 */
export async function approveSuggestion(
  token: string,
  id: number,
  options?: ApproveSuggestionDto
): Promise<ApprovalResult> {
  const response = await fetch(
    `${API_URL}/expense-plan-suggestions/${id}/approve`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(options || {}),
    }
  );

  return handleResponse<ApprovalResult>(response);
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(
  token: string,
  id: number,
  options?: RejectSuggestionDto
): Promise<ApprovalResult> {
  const response = await fetch(
    `${API_URL}/expense-plan-suggestions/${id}/reject`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(options || {}),
    }
  );

  return handleResponse<ApprovalResult>(response);
}

/**
 * Bulk approve multiple suggestions
 */
export async function bulkApproveSuggestions(
  token: string,
  data: BulkActionDto
): Promise<BulkActionResult> {
  const response = await fetch(
    `${API_URL}/expense-plan-suggestions/bulk/approve`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<BulkActionResult>(response);
}

/**
 * Bulk reject multiple suggestions
 */
export async function bulkRejectSuggestions(
  token: string,
  data: BulkActionDto
): Promise<BulkActionResult> {
  const response = await fetch(
    `${API_URL}/expense-plan-suggestions/bulk/reject`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<BulkActionResult>(response);
}

/**
 * Delete a suggestion permanently
 */
export async function deleteSuggestion(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_URL}/expense-plan-suggestions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  return handleResponse<void>(response);
}
