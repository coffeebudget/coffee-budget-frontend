/**
 * Free to Spend API Client
 *
 * Functions for interacting with the free-to-spend backend API.
 * All functions require a valid JWT token for authentication.
 */

import { FreeToSpendResponse } from '@/types/free-to-spend-types';

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
    if (response.status === 401) {
      throw new Error('Authentication required');
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

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch free to spend calculation for a given month
 *
 * @param token - JWT access token
 * @param month - Month in YYYY-MM format (optional, defaults to current month)
 * @returns Free to spend response with breakdown
 */
export async function fetchFreeToSpend(
  token: string,
  month?: string
): Promise<FreeToSpendResponse> {
  const params = new URLSearchParams();
  if (month) {
    params.append('month', month);
  }

  const url = `${API_URL}/free-to-spend${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(token),
  });

  return handleResponse<FreeToSpendResponse>(response);
}

/**
 * Fetch free to spend for current month
 *
 * @param token - JWT access token
 * @returns Free to spend response for current month
 */
export async function fetchCurrentFreeToSpend(
  token: string
): Promise<FreeToSpendResponse> {
  return fetchFreeToSpend(token);
}
