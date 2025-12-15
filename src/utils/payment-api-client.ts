/**
 * Payment Account & Activity API Client
 * Client-side API helper for making requests to Next.js API routes
 * Mirrors backend payment account and activity endpoints
 */

import type {
  PaymentAccount,
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
  PaymentActivity,
  PaymentActivityFilters,
  UpdateReconciliationDto,
  ReconciliationStats,
  ImportPaymentActivitiesDto,
  ImportResult,
  GocardlessConnectionRequest,
  GocardlessConnectionResponse,
} from '@/types/payment-types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API responses uniformly
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }

  return null;
};

// ============================================================================
// PAYMENT ACCOUNT API FUNCTIONS
// ============================================================================

/**
 * Fetch all payment accounts for the authenticated user
 */
export async function fetchPaymentAccounts(): Promise<PaymentAccount[]> {
  const response = await fetch('/api/payment-accounts');
  return handleResponse(response);
}

/**
 * Fetch a specific payment account by ID
 */
export async function fetchPaymentAccount(id: number): Promise<PaymentAccount> {
  const response = await fetch(`/api/payment-accounts/${id}`);
  return handleResponse(response);
}

/**
 * Create a new payment account
 */
export async function createPaymentAccount(
  accountData: CreatePaymentAccountDto
): Promise<PaymentAccount> {
  const response = await fetch('/api/payment-accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
  return handleResponse(response);
}

/**
 * Update an existing payment account
 */
export async function updatePaymentAccount(
  id: number,
  accountData: UpdatePaymentAccountDto
): Promise<PaymentAccount> {
  const response = await fetch(`/api/payment-accounts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
  return handleResponse(response);
}

/**
 * Delete a payment account
 */
export async function deletePaymentAccount(id: number): Promise<void> {
  const response = await fetch(`/api/payment-accounts/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// ============================================================================
// PAYMENT ACTIVITY API FUNCTIONS
// ============================================================================

/**
 * Fetch payment activities for a specific payment account
 */
export async function fetchPaymentActivities(
  paymentAccountId: number,
  filters?: PaymentActivityFilters
): Promise<PaymentActivity[]> {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.reconciliationStatus) {
      queryParams.append('reconciliationStatus', filters.reconciliationStatus);
    }
    if (filters.activityType) {
      queryParams.append('activityType', filters.activityType);
    }
    if (filters.startDate) {
      queryParams.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      queryParams.append('endDate', filters.endDate);
    }
    if (filters.searchTerm) {
      queryParams.append('searchTerm', filters.searchTerm);
    }
  }

  const url = `/api/payment-activities/payment-account/${paymentAccountId}${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Fetch pending (unreconciled) payment activities for a payment account
 */
export async function fetchPendingPaymentActivities(
  paymentAccountId: number
): Promise<PaymentActivity[]> {
  const response = await fetch(`/api/payment-activities/pending/${paymentAccountId}`);
  return handleResponse(response);
}

/**
 * Fetch reconciliation statistics for a payment account
 */
export async function fetchReconciliationStats(
  paymentAccountId: number
): Promise<ReconciliationStats> {
  const response = await fetch(`/api/payment-activities/stats/${paymentAccountId}`);
  return handleResponse(response);
}

/**
 * Fetch a specific payment activity by ID
 */
export async function fetchPaymentActivity(id: number): Promise<PaymentActivity> {
  const response = await fetch(`/api/payment-activities/${id}`);
  return handleResponse(response);
}

/**
 * Update reconciliation status for a payment activity
 */
export async function updatePaymentActivityReconciliation(
  id: number,
  reconciliationData: UpdateReconciliationDto
): Promise<PaymentActivity> {
  const response = await fetch(`/api/payment-activities/${id}/reconciliation`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reconciliationData),
  });
  return handleResponse(response);
}

/**
 * Bulk update reconciliation for multiple payment activities
 */
export async function bulkUpdateReconciliation(
  updates: Array<{ id: number; data: UpdateReconciliationDto }>
): Promise<PaymentActivity[]> {
  const response = await fetch('/api/payment-activities/bulk-reconciliation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ updates }),
  });
  return handleResponse(response);
}

// ============================================================================
// IMPORT API FUNCTIONS
// ============================================================================

/**
 * Import payment activities for a specific payment account
 */
export async function importPaymentActivities(
  data: ImportPaymentActivitiesDto
): Promise<ImportResult> {
  const response = await fetch(`/api/payment-activities/import/${data.paymentAccountId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: data.startDate,
      endDate: data.endDate,
    }),
  });
  return handleResponse(response);
}

/**
 * Import all PayPal payment activities (for migration)
 */
export async function importAllPayPalActivities(): Promise<ImportResult> {
  const response = await fetch('/api/payment-activities/import-all-paypal', {
    method: 'POST',
  });
  return handleResponse(response);
}

// ============================================================================
// GOCARDLESS INTEGRATION API FUNCTIONS
// ============================================================================

/**
 * Initiate GoCardless connection for a payment account
 */
export async function initiateGocardlessConnection(
  request: GocardlessConnectionRequest
): Promise<GocardlessConnectionResponse> {
  const response = await fetch('/api/payment-accounts/gocardless/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse(response);
}

/**
 * Handle GoCardless callback after OAuth
 */
export async function handleGocardlessCallback(
  requisitionId: string,
  paymentAccountId: number
): Promise<PaymentAccount> {
  const response = await fetch('/api/payment-accounts/gocardless/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requisitionId, paymentAccountId }),
  });
  return handleResponse(response);
}

/**
 * Disconnect GoCardless from a payment account
 */
export async function disconnectGocardless(paymentAccountId: number): Promise<PaymentAccount> {
  const response = await fetch(`/api/payment-accounts/${paymentAccountId}/gocardless/disconnect`, {
    method: 'POST',
  });
  return handleResponse(response);
}

// ============================================================================
// SEARCH & SUGGESTION API FUNCTIONS
// ============================================================================

/**
 * Search for transactions to reconcile with a payment activity
 */
export async function searchTransactionsForReconciliation(
  paymentActivityId: number,
  searchTerm?: string
): Promise<any[]> { // TODO: Replace `any` with Transaction type when available
  const queryParams = new URLSearchParams();
  if (searchTerm) {
    queryParams.append('searchTerm', searchTerm);
  }

  const url = `/api/payment-activities/${paymentActivityId}/search-transactions${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Get suggested transaction matches for a payment activity
 */
export async function getSuggestedMatches(paymentActivityId: number): Promise<any[]> {
  const response = await fetch(`/api/payment-activities/${paymentActivityId}/suggestions`);
  return handleResponse(response);
}
