/**
 * Budget Allocation API Client
 *
 * Functions for interacting with the budget allocation backend API.
 * Implements YNAB-style monthly income allocation workflow.
 */

import {
  AllocationState,
  SaveAllocationsRequest,
  SaveAllocationsResult,
  SetIncomeOverrideRequest,
  IncomeBreakdown,
  AutoAllocateResult,
} from '@/types/budget-allocation-types';

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
      throw new Error('Budget allocation not found');
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// ALLOCATION STATE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the allocation state for a specific month
 * @param token - JWT token
 * @param month - Month in YYYY-MM format
 */
export async function fetchAllocationState(
  token: string,
  month: string
): Promise<AllocationState> {
  const response = await fetch(`${API_URL}/budget-allocation/${month}`, {
    headers: getHeaders(token),
  });

  return handleResponse<AllocationState>(response);
}

/**
 * Save allocations for a month
 * @param token - JWT token
 * @param month - Month in YYYY-MM format
 * @param data - Allocations to save
 */
export async function saveAllocations(
  token: string,
  month: string,
  data: SaveAllocationsRequest
): Promise<SaveAllocationsResult> {
  const response = await fetch(`${API_URL}/budget-allocation/${month}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<SaveAllocationsResult>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// INCOME MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get income breakdown for a month
 * @param token - JWT token
 * @param month - Month in YYYY-MM format
 */
export async function fetchIncomeBreakdown(
  token: string,
  month: string
): Promise<IncomeBreakdown> {
  const response = await fetch(`${API_URL}/budget-allocation/${month}/income`, {
    headers: getHeaders(token),
  });

  return handleResponse<IncomeBreakdown>(response);
}

/**
 * Set income override for a month
 * @param token - JWT token
 * @param month - Month in YYYY-MM format
 * @param data - Income override data
 */
export async function setIncomeOverride(
  token: string,
  month: string,
  data: SetIncomeOverrideRequest
): Promise<AllocationState> {
  const response = await fetch(`${API_URL}/budget-allocation/${month}/income`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<AllocationState>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-ALLOCATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Auto-allocate to all plans using suggested amounts
 * @param token - JWT token
 * @param month - Month in YYYY-MM format
 */
export async function autoAllocate(
  token: string,
  month: string
): Promise<AutoAllocateResult> {
  const response = await fetch(`${API_URL}/budget-allocation/${month}/auto`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  return handleResponse<AutoAllocateResult>(response);
}
