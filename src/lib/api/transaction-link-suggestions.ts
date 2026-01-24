/**
 * Transaction Link Suggestions API Client
 *
 * Functions for interacting with the transaction link suggestions backend API.
 * All functions require a valid JWT token for authentication.
 */

import {
  TransactionLinkSuggestion,
  SuggestionCounts,
  ApproveLinkSuggestionDto,
  RejectLinkSuggestionDto,
  ApprovalResult,
  BulkApprovalResult,
  BulkRejectionResult,
} from '@/types/transaction-link-suggestion-types';

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
 * Fetch all pending transaction link suggestions
 */
export async function fetchPendingSuggestions(
  token: string
): Promise<TransactionLinkSuggestion[]> {
  const response = await fetch(`${API_URL}/transaction-link-suggestions`, {
    headers: getHeaders(token),
  });

  return handleResponse<TransactionLinkSuggestion[]>(response);
}

/**
 * Fetch suggestion counts for badge display
 */
export async function fetchSuggestionCounts(
  token: string
): Promise<SuggestionCounts> {
  const response = await fetch(`${API_URL}/transaction-link-suggestions/counts`, {
    headers: getHeaders(token),
  });

  return handleResponse<SuggestionCounts>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROVE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Approve a link suggestion
 */
export async function approveSuggestion(
  token: string,
  id: number,
  data?: ApproveLinkSuggestionDto
): Promise<ApprovalResult> {
  const response = await fetch(
    `${API_URL}/transaction-link-suggestions/${id}/approve`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data || {}),
    }
  );

  return handleResponse<ApprovalResult>(response);
}

/**
 * Bulk approve multiple suggestions
 */
export async function bulkApproveSuggestions(
  token: string,
  ids: number[]
): Promise<BulkApprovalResult> {
  const response = await fetch(
    `${API_URL}/transaction-link-suggestions/bulk-approve`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ ids }),
    }
  );

  return handleResponse<BulkApprovalResult>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// REJECT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reject a link suggestion
 */
export async function rejectSuggestion(
  token: string,
  id: number,
  data?: RejectLinkSuggestionDto
): Promise<void> {
  const response = await fetch(
    `${API_URL}/transaction-link-suggestions/${id}/reject`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data || {}),
    }
  );

  return handleResponse<void>(response);
}

/**
 * Bulk reject multiple suggestions
 */
export async function bulkRejectSuggestions(
  token: string,
  ids: number[],
  reason?: string
): Promise<BulkRejectionResult> {
  const response = await fetch(
    `${API_URL}/transaction-link-suggestions/bulk-reject`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ ids, reason }),
    }
  );

  return handleResponse<BulkRejectionResult>(response);
}
