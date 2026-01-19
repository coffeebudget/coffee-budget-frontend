/**
 * Budget Allocation Types
 *
 * Types for the YNAB-style budget allocation system.
 * Matches backend DTOs in budget-allocation.dto.ts
 */

import { ExpensePlanPurpose } from './expense-plan-types';

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Individual allocation item for a plan
 */
export interface AllocationItem {
  planId: number;
  amount: number;
}

/**
 * Request to save multiple allocations at once
 */
export interface SaveAllocationsRequest {
  allocations: AllocationItem[];
}

/**
 * Request to override income for a month
 */
export interface SetIncomeOverrideRequest {
  amount?: number | null;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Plan allocation details for display
 */
export interface PlanAllocation {
  planId: number;
  planName: string;
  icon: string | null;
  purpose: ExpensePlanPurpose;
  suggestedAmount: number;
  allocatedAmount: number;
  spentThisMonth: number;
  paymentAccountId: number | null;
  paymentAccountName: string | null;
}

/**
 * Income breakdown for a month
 */
export interface IncomeBreakdown {
  autoDetectedIncome: number;
  manualIncomeOverride: number | null;
  effectiveIncome: number;
  incomeTransactions: {
    id: number;
    description: string;
    amount: number;
    date: string;
  }[];
}

/**
 * Status color for allocation state
 */
export type AllocationStatusColor = 'green' | 'yellow' | 'red';

/**
 * Full allocation state for a month
 */
export interface AllocationState {
  month: string;
  income: IncomeBreakdown;
  totalAllocated: number;
  unallocated: number;
  isComplete: boolean;
  statusColor: AllocationStatusColor;
  plans: PlanAllocation[];
  notes: string | null;
}

/**
 * Result of saving allocations
 */
export interface SaveAllocationsResult {
  success: boolean;
  state: AllocationState;
  plansUpdated: number;
}

/**
 * Result of auto-allocation
 */
export interface AutoAllocateResult {
  plansAllocated: number;
  totalAllocated: number;
  remaining: number;
  allocations: AllocationItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format month for display (e.g., "Gennaio 2026")
 */
export function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-');
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];
  return `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColorClass(color: AllocationStatusColor): string {
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200';
  }
}

/**
 * Get status color for the banner background
 */
export function getStatusBannerClass(color: AllocationStatusColor): string {
  switch (color) {
    case 'green':
      return 'bg-green-50 border-green-300';
    case 'yellow':
      return 'bg-yellow-50 border-yellow-300';
    case 'red':
      return 'bg-red-50 border-red-300';
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(color: AllocationStatusColor): string {
  switch (color) {
    case 'green':
      return '✓';
    case 'yellow':
      return '•';
    case 'red':
      return '!';
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
