/**
 * Transaction Link Suggestions TypeScript Types
 *
 * Types for suggesting links between bank transactions and expense plans.
 * Mirrors backend DTOs from coffee-budget-backend/src/expense-plans/dto/transaction-link-suggestion.dto.ts
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const SUGGESTION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'invalidated',
] as const;

export const SUGGESTED_TRANSACTION_TYPES = ['withdrawal', 'contribution'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];
export type SuggestedTransactionType = (typeof SUGGESTED_TRANSACTION_TYPES)[number];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface TransactionLinkSuggestion {
  id: number;
  transactionId: number;
  transactionDescription: string;
  transactionAmount: number;
  transactionDate: string;
  expensePlanId: number;
  expensePlanName: string;
  expensePlanIcon: string | null;
  suggestedType: SuggestedTransactionType;
  status: SuggestionStatus;
  createdAt: string;
}

export interface SuggestionCounts {
  pending: number;
  total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DTO INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ApproveLinkSuggestionDto {
  customAmount?: number;
}

export interface RejectLinkSuggestionDto {
  reason?: string;
  neverAskForPlan?: boolean;
}

export interface BulkApproveSuggestionsDto {
  ids: number[];
}

export interface BulkRejectSuggestionsDto {
  ids: number[];
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ApprovalResult {
  success: boolean;
  planTransactionId: number;
  newBalance: number;
}

export interface BulkApprovalResult {
  approvedCount: number;
  failedCount: number;
  failedIds: number[];
}

export interface BulkRejectionResult {
  rejectedCount: number;
  failedCount: number;
  failedIds: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getSuggestedTypeLabel(type: SuggestedTransactionType): string {
  const labels: Record<SuggestedTransactionType, string> = {
    withdrawal: 'Withdrawal',
    contribution: 'Contribution',
  };
  return labels[type] || type;
}

export function formatSuggestionAmount(amount: number): string {
  const absAmount = Math.abs(amount);
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
}

export function formatSuggestionDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
