/**
 * Transfer Suggestion Types
 *
 * Types for the income transfer suggestions feature.
 * Advisory-only: tells users how much to transfer from income accounts.
 */

export type TransferSuggestionStatus = 'deficit' | 'tight' | 'transferable';

export type IncomePlanReliability = 'guaranteed' | 'expected' | 'uncertain';

export type ExpensePlanPriority = 'essential' | 'important' | 'discretionary';

export interface IncomeSourceDetail {
  planId: number;
  name: string;
  amountForMonth: number;
  reliability: IncomePlanReliability;
}

export interface ObligationDetail {
  planId: number;
  name: string;
  monthlyContribution: number;
  priority: ExpensePlanPriority;
  isDirectlyAssigned: boolean;
}

export interface AccountTransferSuggestion {
  accountId: number;
  accountName: string;
  totalIncome: number;
  incomeSources: IncomeSourceDetail[];
  directObligations: number;
  directObligationDetails: ObligationDetail[];
  sharedObligations: number;
  sharedObligationDetails: ObligationDetail[];
  totalObligations: number;
  surplus: number;
  safetyMargin: number;
  suggestedTransfer: number;
  status: TransferSuggestionStatus;
}

export interface TransferSuggestionsResponse {
  year: number;
  month: number;
  accounts: AccountTransferSuggestion[];
  unassignedTotal: number;
  distinctIncomeAccountCount: number;
  sharePerAccount: number;
}

export function getTransferStatusColor(status: TransferSuggestionStatus): string {
  const colors: Record<TransferSuggestionStatus, string> = {
    transferable: 'bg-green-100 text-green-800',
    tight: 'bg-yellow-100 text-yellow-800',
    deficit: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getTransferStatusLabel(status: TransferSuggestionStatus): string {
  const labels: Record<TransferSuggestionStatus, string> = {
    transferable: 'Transferable',
    tight: 'Tight',
    deficit: 'Deficit',
  };
  return labels[status] || status;
}

export function getReliabilityColor(reliability: IncomePlanReliability): string {
  const colors: Record<IncomePlanReliability, string> = {
    guaranteed: 'bg-green-100 text-green-700',
    expected: 'bg-yellow-100 text-yellow-700',
    uncertain: 'bg-gray-100 text-gray-500',
  };
  return colors[reliability] || 'bg-gray-100 text-gray-500';
}

export function getPriorityLabel(priority: ExpensePlanPriority): string {
  const labels: Record<ExpensePlanPriority, string> = {
    essential: 'Essential',
    important: 'Important',
    discretionary: 'Discretionary',
  };
  return labels[priority] || priority;
}
