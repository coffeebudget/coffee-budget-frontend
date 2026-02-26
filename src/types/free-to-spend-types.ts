/**
 * Free to Spend TypeScript Types
 *
 * Types for the Free to Spend dashboard feature.
 * Mirrors backend DTOs from coffee-budget-backend/src/free-to-spend/dto/
 */

// ═══════════════════════════════════════════════════════════════════════════
// STATUS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const FREE_TO_SPEND_STATUSES = [
  'comfortable',
  'moderate',
  'tight',
  'overspent',
] as const;

export type FreeToSpendStatus = (typeof FREE_TO_SPEND_STATUSES)[number];

export const OBLIGATION_TYPES = ['bills', 'savings', 'budgets'] as const;

export type ObligationType = (typeof OBLIGATION_TYPES)[number];

// ═══════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const STATUS_CONFIGS: Record<FreeToSpendStatus, StatusConfig> = {
  comfortable: {
    label: 'Comfortable',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'More than 25% of income remaining',
  },
  moderate: {
    label: 'Moderate',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '10-25% of income remaining',
  },
  tight: {
    label: 'Tight',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Less than 10% of income remaining',
  },
  overspent: {
    label: 'Overspent',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Spending exceeds income',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INCOME TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomeSource {
  source: string;
  amount: number;
  reliability?: 'guaranteed' | 'expected' | 'uncertain';
}

export interface IncomeBreakdown {
  total: number;
  guaranteed: number;
  expected: number;
  uncertain: number;
  breakdown: IncomeSource[];
}

// ═══════════════════════════════════════════════════════════════════════════
// OBLIGATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ObligationItem {
  id: number;
  name: string;
  amount: number;
  type: ObligationType;
  isPaid: boolean;
  icon?: string | null;
}

export interface ObligationsByType {
  bills: number;
  savings: number;
  budgets: number;
}

export interface ObligationsBreakdown {
  total: number;
  committed: number;
  alreadyPaid: number;
  byType: ObligationsByType;
  items: ObligationItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCRETIONARY SPENDING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CategorySpending {
  category: string;
  amount: number;
}

export interface DiscretionarySpending {
  total: number;
  transactionCount: number;
  topCategories: CategorySpending[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ENVELOPE BUFFER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const ENVELOPE_BALANCE_STATUSES = [
  'under_budget',
  'on_budget',
  'over_budget',
] as const;

export type EnvelopeBalanceStatus = (typeof ENVELOPE_BALANCE_STATUSES)[number];

export interface EnvelopeBufferItem {
  planId: number;
  planName: string;
  planIcon: string | null;
  currentBalance: number;
  utilizationPercent: number;
  status?: EnvelopeBalanceStatus;
}

export interface EnvelopeBuffer {
  total: number;
  breakdown: EnvelopeBufferItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN RESPONSE TYPE
// ═══════════════════════════════════════════════════════════════════════════

export interface FreeToSpendResponse {
  month: string;
  freeToSpend: number;
  status: FreeToSpendStatus;
  income: IncomeBreakdown;
  obligations: ObligationsBreakdown;
  discretionarySpending: DiscretionarySpending;
  /** Envelope buffer showing unspent allocations across expense plans */
  envelopeBuffer?: EnvelopeBuffer;
  /** Amount truly available to spend (envelope buffer minus any budget deficit) */
  trulyAvailable?: number;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export { formatCurrency } from '@/utils/format';

/**
 * Get percentage of income remaining
 */
export function getIncomePercentage(freeToSpend: number, income: number): number {
  if (income <= 0) return 0;
  return Math.round((freeToSpend / income) * 100);
}

/**
 * Get status config by status type
 */
export function getStatusConfig(status: FreeToSpendStatus): StatusConfig {
  return STATUS_CONFIGS[status];
}

/**
 * Format month string (YYYY-MM) to readable format
 */
export function formatMonth(month: string, locale = 'en-US'): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
