/**
 * Income Distribution API Client
 *
 * Functions for interacting with the income distribution backend API.
 * Handles automatic distribution of income to expense plans.
 * All functions require a valid JWT token for authentication.
 */

import {
  IncomeDistributionRule,
  CreateIncomeDistributionRuleDto,
  UpdateIncomeDistributionRuleDto,
  ManualDistributionDto,
  ManualDistributionResult,
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
      throw new Error('Income distribution rule not found');
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

export async function fetchIncomeDistributionRules(
  token: string
): Promise<IncomeDistributionRule[]> {
  const response = await fetch(`${API_URL}/income-distribution/rules`, {
    headers: getHeaders(token),
  });

  return handleResponse<IncomeDistributionRule[]>(response);
}

export async function createIncomeDistributionRule(
  token: string,
  data: CreateIncomeDistributionRuleDto
): Promise<IncomeDistributionRule> {
  const response = await fetch(`${API_URL}/income-distribution/rules`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<IncomeDistributionRule>(response);
}

export async function updateIncomeDistributionRule(
  token: string,
  id: number,
  data: UpdateIncomeDistributionRuleDto
): Promise<IncomeDistributionRule> {
  const response = await fetch(`${API_URL}/income-distribution/rules/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<IncomeDistributionRule>(response);
}

export async function deleteIncomeDistributionRule(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_URL}/income-distribution/rules/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  return handleResponse<void>(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTION OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function distributeManually(
  token: string,
  data: ManualDistributionDto
): Promise<ManualDistributionResult> {
  const response = await fetch(`${API_URL}/income-distribution/distribute-manually`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return handleResponse<ManualDistributionResult>(response);
}
