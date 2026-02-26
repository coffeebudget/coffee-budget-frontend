/**
 * Expense Plans TypeScript Types
 *
 * Types for the virtual envelope/sinking fund budgeting system.
 * Mirrors backend entities from coffee-budget-backend/src/expense-plans/
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const EXPENSE_PLAN_TYPES = [
  'fixed_monthly',
  'yearly_fixed',
  'yearly_variable',
  'multi_year',
  'seasonal',
  'emergency_fund',
  'goal',
] as const;

export const EXPENSE_PLAN_PRIORITIES = [
  'essential',
  'important',
  'discretionary',
] as const;

export const EXPENSE_PLAN_FREQUENCIES = [
  'monthly',
  'quarterly',
  'yearly',
  'multi_year',
  'seasonal',
  'one_time',
] as const;

export const EXPENSE_PLAN_STATUSES = ['active', 'paused', 'completed'] as const;

export const CONTRIBUTION_SOURCES = [
  'calculated',
  'manual',
  'historical',
] as const;

export const FUNDING_STATUSES = ['funded', 'almost_ready', 'on_track', 'behind'] as const;

export const PAYMENT_ACCOUNT_TYPES = ['bank_account', 'credit_card'] as const;

export const EXPENSE_PLAN_PURPOSES = ['sinking_fund', 'spending_budget'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type ExpensePlanType = (typeof EXPENSE_PLAN_TYPES)[number];
export type ExpensePlanPriority = (typeof EXPENSE_PLAN_PRIORITIES)[number];
export type ExpensePlanFrequency = (typeof EXPENSE_PLAN_FREQUENCIES)[number];
export type ExpensePlanStatus = (typeof EXPENSE_PLAN_STATUSES)[number];
export type ContributionSource = (typeof CONTRIBUTION_SOURCES)[number];
export type FundingStatus = (typeof FUNDING_STATUSES)[number];
export type PaymentAccountType = (typeof PAYMENT_ACCOUNT_TYPES)[number];
export type ExpensePlanPurpose = (typeof EXPENSE_PLAN_PURPOSES)[number];
export type AdjustmentReason = 'spending_increased' | 'spending_decreased';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExpensePlan {
  id: number;
  userId: number;

  // Identity
  name: string;
  description: string | null;
  icon: string | null;

  // Classification
  planType: ExpensePlanType;
  priority: ExpensePlanPriority;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
    icon?: string | null;
  } | null;
  autoTrackCategory: boolean;
  purpose: ExpensePlanPurpose;

  // Payment Source (Optional - for coverage tracking)
  paymentAccountType: PaymentAccountType | null;
  paymentAccountId: number | null;
  paymentAccount?: {
    id: number;
    name: string;
    balance: number;
  } | null;

  // Financial
  targetAmount: number;
  monthlyContribution: number;
  contributionSource: ContributionSource;

  // Timing
  frequency: ExpensePlanFrequency;
  frequencyYears: number | null;
  dueMonth: number | null;
  dueDay: number | null;
  targetDate: string | null;
  seasonalMonths: number[] | null;
  nextDueDate: string | null;

  // Tracking
  status: ExpensePlanStatus;
  autoCalculate: boolean;
  rolloverSurplus: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Adjustment Suggestions (populated by weekly cron job)
  suggestedMonthlyContribution: number | null;
  suggestedAdjustmentPercent: number | null;
  adjustmentReason: AdjustmentReason | null;
  adjustmentSuggestedAt: string | null;
  adjustmentDismissedAt: string | null;

  // Fixed monthly status (only populated for fixed_monthly plans with status endpoint)
  fixedMonthlyStatus?: FixedMonthlyStatus | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE PLAN PAYMENT INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export const EXPENSE_PLAN_PAYMENT_TYPES = [
  'auto_linked',
  'manual',
  'unlinked',
] as const;

export type ExpensePlanPaymentType = (typeof EXPENSE_PLAN_PAYMENT_TYPES)[number];

export interface ExpensePlanPayment {
  id: number;
  expensePlanId: number;
  year: number;
  month: number;
  period: string;
  amount: number;
  paymentDate: string;
  paymentType: ExpensePlanPaymentType;
  transactionId: number | null;
  transaction: {
    id: number;
    description: string;
    amount: number;
    executionDate: string | null;
  } | null;
  notes: string | null;
  createdAt: string;
}

export interface LinkTransactionDto {
  transactionId: number;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DTO INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateExpensePlanDto {
  name: string;
  description?: string;
  icon?: string;
  planType: ExpensePlanType;
  priority?: ExpensePlanPriority;
  categoryId?: number;
  autoTrackCategory?: boolean;
  purpose?: ExpensePlanPurpose;
  targetAmount: number;
  monthlyContribution: number;
  contributionSource?: ContributionSource;
  frequency: ExpensePlanFrequency;
  frequencyYears?: number;
  dueMonth?: number;
  dueDay?: number;
  targetDate?: string;
  seasonalMonths?: number[];
  autoCalculate?: boolean;
  rolloverSurplus?: boolean;
  // Payment source (optional - for coverage tracking)
  paymentAccountType?: PaymentAccountType;
  paymentAccountId?: number;
}

export interface UpdateExpensePlanDto {
  name?: string;
  description?: string | null;
  icon?: string | null;
  planType?: ExpensePlanType;
  priority?: ExpensePlanPriority;
  categoryId?: number | null;
  autoTrackCategory?: boolean;
  purpose?: ExpensePlanPurpose;
  targetAmount?: number;
  monthlyContribution?: number | null;
  contributionSource?: ContributionSource;
  frequency?: ExpensePlanFrequency;
  frequencyYears?: number | null;
  dueMonth?: number | null;
  dueDay?: number | null;
  targetDate?: string | null;
  seasonalMonths?: number[] | null;
  status?: ExpensePlanStatus;
  autoCalculate?: boolean;
  rolloverSurplus?: boolean;
  // Payment source (optional - for coverage tracking)
  paymentAccountType?: PaymentAccountType;
  paymentAccountId?: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE SUMMARY INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export const COVERAGE_STATUSES = ['all_covered', 'has_shortfall', 'no_data'] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

/**
 * Available coverage period types for filtering expense plan obligations.
 */
export const VALID_COVERAGE_PERIODS = [
  'this_month',
  'next_month',
  'next_3_months',
  'next_30_days',
  'next_60_days',
  'next_90_days',
] as const;
export type CoveragePeriodType = (typeof VALID_COVERAGE_PERIODS)[number];

/**
 * Represents a date range with a human-readable label.
 */
export interface PeriodRange {
  start: string;
  end: string;
  label: string;
}

/**
 * Source of the balance information
 */
export type BalanceSource = 'gocardless' | 'manual' | 'unknown';

/**
 * Type of obligation calculation
 * - 'fixed': Known exact amount (fixed_monthly, yearly_fixed)
 * - 'estimated': Amount based on historical data or estimates (yearly_variable, seasonal)
 * - 'prorated': Amount calculated as progress toward a goal (sinking funds)
 */
export type ObligationType = 'fixed' | 'estimated' | 'prorated';

/**
 * Expense plan at risk of not being covered
 */
export interface PlanAtRisk {
  id: number;
  name: string;
  amount: number;
  nextDueDate: string | null;
  daysUntilDue: number;
  icon: string | null;
  obligationType: ObligationType;
}

/**
 * Coverage information for a single bank account
 */
export interface AccountCoverage {
  accountId: number;
  accountName: string;
  institution: string | null;
  currentBalance: number;
  /** Source of the balance information */
  balanceSource: BalanceSource;
  /** When the balance was last updated */
  balanceLastUpdated: string | null;
  upcomingPlansTotal: number;
  planCount: number;
  projectedBalance: number;
  hasShortfall: boolean;
  shortfallAmount: number;
  plansAtRisk: PlanAtRisk[];
}

/**
 * Summary for expense plans not linked to any account
 */
export interface UnassignedPlanSummary {
  count: number;
  totalAmount: number;
  plans: PlanAtRisk[];
}

/**
 * Complete coverage summary response
 */
export interface CoverageSummaryResponse {
  /** The period for which coverage is calculated */
  period: PeriodRange;
  accounts: AccountCoverage[];
  unassignedPlans: UnassignedPlanSummary;
  overallStatus: CoverageStatus;
  totalShortfall: number;
  accountsWithShortfall: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIXED MONTHLY STATUS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Status information specific to fixed_monthly expense plans.
 * Shows payment status for the current month rather than funding progress.
 */
export interface FixedMonthlyStatus {
  /** Whether payment for current month has been made */
  currentMonthPaymentMade: boolean;
  /** Date of current month payment */
  paymentDate: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY & ANALYTICS INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MonthlyDepositSummary {
  totalMonthlyDeposit: number;
  planCount: number;
  fullyFundedCount: number;
  onTrackCount: number;
  behindScheduleCount: number;
  byType: {
    fixed_monthly: { total: number; plans: ExpensePlanSummaryItem[] };
    sinking_funds: { total: number; plans: ExpensePlanSummaryItem[] };
    seasonal: { total: number; plans: ExpensePlanSummaryItem[] };
    goals: { total: number; plans: ExpensePlanSummaryItem[] };
    emergency: { total: number; plans: ExpensePlanSummaryItem[] };
  };
}

export interface ExpensePlanSummaryItem {
  id: number;
  name: string;
  icon: string | null;
  monthlyContribution: number;
  targetAmount: number;
  nextDueDate: string | null;
}

export interface TimelineEntry {
  date: string;
  planId: number;
  planName: string;
  icon: string | null;
  amount: number;
  status: 'funded' | 'on_track' | 'behind';
  monthsAway: number;
}

/**
 * Expense plan with calculated funding status fields.
 * Returned by GET /expense-plans/with-status
 */
/**
 * Extended ExpensePlan with calculated funding status fields.
 * Returned by GET /expense-plans/with-status endpoint.
 */
export interface ExpensePlanWithStatus extends ExpensePlan {
  // Calculated funding status fields
  fundingStatus: FundingStatus | null;
  monthsUntilDue: number | null;
  amountNeeded: number | null;
  requiredMonthlyContribution: number | null;
  progressPercent: number;
}

/**
 * Plan needing attention in long-term status summary
 */
export interface PlanNeedingAttention {
  id: number;
  name: string;
  icon: string | null;
  status: 'behind' | 'almost_ready';
  amountNeeded: number;
  monthsUntilDue: number;
  nextDueDate: string | null;
  requiredMonthly: number;
  currentMonthly: number;
  shortfallPerMonth: number;
}

/**
 * Long-term sinking fund status summary.
 * Returned by GET /expense-plans/long-term-status
 */
export interface LongTermStatusSummary {
  totalSinkingFunds: number;
  onTrackCount: number;
  behindScheduleCount: number;
  fundedCount: number;
  almostReadyCount: number;
  totalAmountNeeded: number;
  plansNeedingAttention: PlanNeedingAttention[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT ALLOCATION SUMMARY INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Health status for account allocation
 */
export type AccountHealthStatus = 'healthy' | 'tight' | 'shortfall';

/**
 * Status for fixed monthly plan allocation
 */
export type FixedMonthlyAllocationStatus = 'paid' | 'pending';

/**
 * Status for sinking fund plan allocation
 */
export type SinkingFundAllocationStatus = 'on_track' | 'behind';

/**
 * Individual fixed monthly plan allocation within the account summary.
 * Shows whether the plan is ready for payment and current status.
 */
export interface FixedMonthlyPlanAllocation {
  id: number;
  name: string;
  icon: string | null;
  /** Required amount (full payment) */
  requiredToday: number;
  /** Whether current month payment has been made */
  paymentMade: boolean;
  /** Payment status: paid or pending */
  status: 'paid' | 'pending';
}

/**
 * Individual sinking fund plan allocation within the account summary.
 * Shows expected vs actual savings progress.
 */
export interface SinkingFundPlanAllocation {
  id: number;
  name: string;
  icon: string | null;
  /** Expected funded amount by today (required allocation) */
  requiredToday: number;
  /** Target total amount */
  targetAmount: number;
  /** Monthly contribution */
  monthlyContribution: number;
  /** Progress percentage (time-based) */
  progressPercent: number;
  /** Funding status relative to schedule */
  status: 'on_track' | 'behind';
  /** Next due date */
  nextDueDate: string | null;
  /** Months until due */
  monthsUntilDue: number | null;
}

/**
 * Complete account allocation summary showing total required today
 * vs current balance and detailed breakdown by plan type.
 */
export interface AccountAllocationSummary {
  accountId: number;
  accountName: string;
  /** Current bank account balance */
  currentBalance: number;
  /** Source of the balance information */
  balanceSource: BalanceSource;
  /** When the balance was last updated */
  balanceLastUpdated: string | null;
  /** Total amount that should be allocated today */
  totalRequiredToday: number;
  /** Amount short (positive) or surplus (negative) */
  shortfall: number;
  /** Amount surplus (if any) */
  surplus: number;
  /** Account health status */
  healthStatus: AccountHealthStatus;
  /** Fixed monthly plans (bills that need full amount ready) */
  fixedMonthlyPlans: FixedMonthlyPlanAllocation[];
  /** Total required for fixed monthly plans */
  fixedMonthlyTotal: number;
  /** Sinking fund plans (savings progress) */
  sinkingFundPlans: SinkingFundPlanAllocation[];
  /** Total expected for sinking funds by today */
  sinkingFundTotal: number;
  /** Total monthly contribution across all plans */
  monthlyContributionTotal: number;
  /** Suggested catch-up amount to add */
  suggestedCatchUp: number | null;
}

/**
 * Response containing allocation summaries for all accounts with linked plans.
 */
export interface AccountAllocationSummaryResponse {
  /** The period for which allocation is calculated */
  period: PeriodRange;
  accounts: AccountAllocationSummary[];
  /** Overall health status across all accounts */
  overallStatus: AccountHealthStatus;
  /** Total shortfall across all accounts */
  totalShortfall: number;
  /** Number of accounts with shortfall */
  accountsWithShortfall: number;
  /** Total monthly contribution needed across all accounts */
  totalMonthlyContribution: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI HELPER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExpensePlanCardProps {
  plan: ExpensePlan;
  onEdit?: (plan: ExpensePlan) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export interface ExpensePlanFormData {
  name: string;
  description: string;
  icon: string;
  planType: ExpensePlanType;
  priority: ExpensePlanPriority;
  categoryId: number | null;
  autoTrackCategory: boolean;
  purpose: ExpensePlanPurpose;
  targetAmount: string;
  monthlyContribution: string;
  contributionSource: ContributionSource;
  frequency: ExpensePlanFrequency;
  frequencyYears: string;
  dueMonth: string;
  dueDay: string;
  targetDate: string;
  seasonalMonths: number[];
  autoCalculate: boolean;
  rolloverSurplus: boolean;
  paymentAccountType: PaymentAccountType | null;
  paymentAccountId: number | null;
}

export interface ExpensePlanFormErrors {
  name?: string;
  targetAmount?: string;
  monthlyContribution?: string;
  frequency?: string;
  dueMonth?: string;
  dueDay?: string;
  targetDate?: string;
  general?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER & QUERY INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExpensePlanFilters {
  status?: ExpensePlanStatus | 'all';
  planType?: ExpensePlanType;
  priority?: ExpensePlanPriority;
  categoryId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getExpensePlanTypeLabel(type: ExpensePlanType): string {
  const labels: Record<ExpensePlanType, string> = {
    fixed_monthly: 'Fixed Monthly',
    yearly_fixed: 'Yearly Fixed',
    yearly_variable: 'Yearly Variable',
    multi_year: 'Multi-Year',
    seasonal: 'Seasonal',
    emergency_fund: 'Emergency Fund',
    goal: 'Savings Goal',
  };
  return labels[type] || type;
}

export function getExpensePlanPriorityLabel(priority: ExpensePlanPriority): string {
  const labels: Record<ExpensePlanPriority, string> = {
    essential: 'Essential',
    important: 'Important',
    discretionary: 'Discretionary',
  };
  return labels[priority] || priority;
}

export function getExpensePlanFrequencyLabel(frequency: ExpensePlanFrequency): string {
  const labels: Record<ExpensePlanFrequency, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    multi_year: 'Multi-Year',
    seasonal: 'Seasonal',
    one_time: 'One-Time',
  };
  return labels[frequency] || frequency;
}

export function getExpensePlanStatusLabel(status: ExpensePlanStatus): string {
  const labels: Record<ExpensePlanStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
  };
  return labels[status] || status;
}

export function getFundingStatusLabel(status: FundingStatus): string {
  const labels: Record<FundingStatus, string> = {
    funded: 'Fully Funded',
    almost_ready: 'Almost Ready',
    on_track: 'On Track',
    behind: 'Behind Schedule',
  };
  return labels[status] || status;
}


export function getCoverageStatusLabel(status: CoverageStatus): string {
  const labels: Record<CoverageStatus, string> = {
    all_covered: 'All Covered',
    has_shortfall: 'Shortfall Detected',
    no_data: 'No Data',
  };
  return labels[status] || status;
}

export function getCoverageStatusColor(status: CoverageStatus): string {
  const colors: Record<CoverageStatus, string> = {
    all_covered: 'bg-green-100 text-green-800',
    has_shortfall: 'bg-red-100 text-red-800',
    no_data: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getCoverageStatusIcon(status: CoverageStatus): string {
  const icons: Record<CoverageStatus, string> = {
    all_covered: '✓',
    has_shortfall: '⚠',
    no_data: '—',
  };
  return icons[status] || '—';
}

// Account Allocation Summary helpers

export function getAccountHealthStatusLabel(status: AccountHealthStatus): string {
  const labels: Record<AccountHealthStatus, string> = {
    healthy: 'Healthy',
    tight: 'Tight',
    shortfall: 'Shortfall',
  };
  return labels[status] || status;
}

export function getAccountHealthStatusColor(status: AccountHealthStatus): string {
  const colors: Record<AccountHealthStatus, string> = {
    healthy: 'bg-green-100 text-green-800',
    tight: 'bg-yellow-100 text-yellow-800',
    shortfall: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getAccountHealthStatusIcon(status: AccountHealthStatus): string {
  const icons: Record<AccountHealthStatus, string> = {
    healthy: '✓',
    tight: '⚠',
    shortfall: '✕',
  };
  return icons[status] || '—';
}

export function getFixedMonthlyAllocationStatusLabel(status: FixedMonthlyAllocationStatus): string {
  const labels: Record<FixedMonthlyAllocationStatus, string> = {
    paid: 'Paid',
    pending: 'Ready',
  };
  return labels[status] || status;
}

export function getFixedMonthlyAllocationStatusColor(status: FixedMonthlyAllocationStatus): string {
  const colors: Record<FixedMonthlyAllocationStatus, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSinkingFundAllocationStatusLabel(status: SinkingFundAllocationStatus): string {
  const labels: Record<SinkingFundAllocationStatus, string> = {
    on_track: 'On Track',
    behind: 'Behind',
  };
  return labels[status] || status;
}

export function getSinkingFundAllocationStatusColor(status: SinkingFundAllocationStatus): string {
  const colors: Record<SinkingFundAllocationStatus, string> = {
    on_track: 'bg-blue-100 text-blue-800',
    behind: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function calculateProgress(currentBalance: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  const progress = (currentBalance / targetAmount) * 100;
  return Math.min(Math.round(progress * 10) / 10, 100);
}

export function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-green-500';
  if (progress >= 80) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getFundingStatusColor(status: FundingStatus): string {
  const colors: Record<FundingStatus, string> = {
    funded: 'bg-green-100 text-green-800',
    almost_ready: 'bg-blue-100 text-blue-800',
    on_track: 'bg-yellow-100 text-yellow-800',
    behind: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: ExpensePlanPriority): string {
  const colors: Record<ExpensePlanPriority, string> = {
    essential: 'bg-red-100 text-red-800',
    important: 'bg-yellow-100 text-yellow-800',
    discretionary: 'bg-gray-100 text-gray-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: ExpensePlanStatus): string {
  const colors: Record<ExpensePlanStatus, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getExpensePlanPurposeLabel(purpose: ExpensePlanPurpose): string {
  const labels: Record<ExpensePlanPurpose, string> = {
    sinking_fund: 'Sinking Fund',
    spending_budget: 'Spending Budget',
  };
  return labels[purpose] || purpose;
}

export function getExpensePlanPurposeIcon(purpose: ExpensePlanPurpose): string {
  const icons: Record<ExpensePlanPurpose, string> = {
    sinking_fund: '📦',
    spending_budget: '📊',
  };
  return icons[purpose] || '📋';
}

export function getExpensePlanPurposeColor(purpose: ExpensePlanPurpose): string {
  const colors: Record<ExpensePlanPurpose, string> = {
    sinking_fund: 'bg-blue-100 text-blue-800',
    spending_budget: 'bg-purple-100 text-purple-800',
  };
  return colors[purpose] || 'bg-gray-100 text-gray-800';
}

export function getDefaultPurposeForPlanType(planType: ExpensePlanType): ExpensePlanPurpose {
  // goal and emergency_fund default to spending_budget
  // all others default to sinking_fund
  if (planType === 'goal' || planType === 'emergency_fund') {
    return 'spending_budget';
  }
  return 'sinking_fund';
}

export { formatCurrency } from '@/utils/format';

/**
 * Get the effective target amount for the next due date.
 * For seasonal plans, this is the per-occurrence amount (targetAmount / seasonalMonths.length).
 * For other plans, this is the full targetAmount.
 */
export function getEffectiveTargetForNextDue(plan: {
  frequency?: ExpensePlanFrequency;
  seasonalMonths?: number[] | null;
  targetAmount: number;
}): number {
  const targetAmount = plan.targetAmount;

  if (
    plan.frequency === 'seasonal' &&
    plan.seasonalMonths &&
    plan.seasonalMonths.length > 0
  ) {
    // For seasonal plans, targetAmount is the yearly total
    // Divide by number of occurrences to get per-occurrence amount
    return targetAmount / plan.seasonalMonths.length;
  }

  return targetAmount;
}

/**
 * Calculate the expected funded amount by now based on when savings
 * SHOULD have started to reach the target by the due date.
 *
 * For sinking funds, this calculates backwards from the due date:
 * 1. How many months are needed to save the target at the contribution rate?
 * 2. When should saving have started?
 * 3. How many months have elapsed since then?
 * 4. Expected = elapsed months × monthly contribution
 *
 * For seasonal plans, uses per-occurrence amount instead of yearly total.
 *
 * Example: Summer vacation €4,000, €400/month, due July 2026
 * - Months needed: 4000/400 = 10 months
 * - Should have started: July - 10 = September 2025
 * - Now is January 2026, so 4-5 months elapsed
 * - Expected by now: ~€1,600-2,000
 */
export function calculateExpectedFundedByNow(plan: {
  purpose?: ExpensePlanPurpose;
  frequency?: ExpensePlanFrequency;
  seasonalMonths?: number[] | null;
  monthlyContribution: number;
  targetAmount: number;
  createdAt: string;
  nextDueDate: string | null;
  targetDate?: string | null;
}): number | null {
  // Only calculate for sinking funds
  if (plan.purpose && plan.purpose !== 'sinking_fund') {
    return null;
  }

  const monthlyContribution = plan.monthlyContribution;
  const targetAmount = plan.targetAmount;

  if (monthlyContribution <= 0 || targetAmount <= 0) {
    return null;
  }

  // Use effective target (per-occurrence for seasonal plans)
  const effectiveTarget = getEffectiveTargetForNextDue(plan);

  const now = new Date();

  // Get the due date (prefer nextDueDate, fall back to targetDate)
  const dueDateStr = plan.nextDueDate || plan.targetDate;
  if (!dueDateStr) {
    // No due date - can't calculate expected progress
    return null;
  }

  const dueDate = new Date(dueDateStr);

  // Calculate how many months are needed to save the effective target
  const monthsNeededToSave = effectiveTarget / monthlyContribution;

  // Calculate when saving should have started
  const savingStartDate = new Date(dueDate);
  savingStartDate.setMonth(savingStartDate.getMonth() - Math.ceil(monthsNeededToSave));

  // If saving hasn't needed to start yet, expected is 0
  if (now < savingStartDate) {
    return 0;
  }

  // Calculate how many months have elapsed since saving should have started
  const yearsDiff = now.getFullYear() - savingStartDate.getFullYear();
  const monthsDiff = now.getMonth() - savingStartDate.getMonth();
  const daysDiff = now.getDate() - savingStartDate.getDate();
  const monthsElapsed = Math.max(0, yearsDiff * 12 + monthsDiff + daysDiff / 30);

  // Expected funded amount = months elapsed × monthly contribution
  // Capped at effective target (per-occurrence for seasonal)
  const expectedFundedByNow = Math.min(
    monthsElapsed * monthlyContribution,
    effectiveTarget
  );

  return Math.round(expectedFundedByNow * 100) / 100;
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1] || '';
}

export function getDefaultFormData(): ExpensePlanFormData {
  return {
    name: '',
    description: '',
    icon: '',
    planType: 'yearly_fixed',
    priority: 'important',
    categoryId: null,
    autoTrackCategory: false,
    purpose: 'sinking_fund',
    targetAmount: '',
    monthlyContribution: '',
    contributionSource: 'calculated',
    frequency: 'yearly',
    frequencyYears: '',
    dueMonth: '',
    dueDay: '',
    targetDate: '',
    seasonalMonths: [],
    autoCalculate: true,
    rolloverSurplus: true,
    paymentAccountType: null,
    paymentAccountId: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN TEMPLATES - Template-Based Creation (PRD-005)
// ═══════════════════════════════════════════════════════════════════════════

export const TEMPLATE_CATEGORIES = ['bills', 'savings', 'budgets'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_FIELD_TYPES = [
  'text',
  'number',
  'date',
  'select',
  'category',
  'account',
  'month-picker',
  'payment-schedule',
  'spending-windows',
] as const;
export type TemplateFieldType = (typeof TEMPLATE_FIELD_TYPES)[number];

/**
 * Configuration for a single field in a wizard step.
 */
export interface WizardField {
  name: keyof CreateExpensePlanDto | 'dueDay' | 'spendingWindows' | 'paymentSchedule';
  label: string;
  type: TemplateFieldType;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

/**
 * A step in the template wizard.
 */
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: WizardField[];
}

/**
 * Template definition for expense plan creation.
 * Each template provides pre-configured settings and a wizard flow.
 */
export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  examples: string[];

  /**
   * Default values for CreateExpensePlanDto fields.
   * These will be applied automatically when creating from this template.
   */
  defaults: Partial<CreateExpensePlanDto>;

  /**
   * Wizard configuration - steps and fields for this template.
   */
  wizard: {
    steps: WizardStep[];
  };

  /**
   * Optional validation rules specific to this template.
   */
  validation?: {
    required?: (keyof CreateExpensePlanDto)[];
  };
}

/**
 * Plan Template Catalog
 *
 * Contains all available templates organized by category:
 * - Bills: Monthly bills, irregular payments
 * - Savings: Emergency fund, seasonal savings
 * - Budgets: Monthly budget, envelope budget, yearly budget
 */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  // ─── BILLS ───────────────────────────────────────────────────────────────────
  {
    id: 'monthly-bill',
    name: 'Monthly Bill',
    description: 'Recurring monthly expenses like utilities, subscriptions, or rent',
    icon: '📄',
    category: 'bills',
    examples: ['Electricity', 'Internet', 'Netflix', 'Rent'],
    defaults: {
      planType: 'fixed_monthly',
      frequency: 'monthly',
      priority: 'essential',
      purpose: 'sinking_fund',
      autoCalculate: true,
    },
    wizard: {
      steps: [
        {
          id: 'basics',
          title: 'Bill Details',
          fields: [
            {
              name: 'name',
              label: 'Bill Name',
              type: 'text',
              required: true,
              placeholder: 'e.g., Electricity',
            },
            {
              name: 'targetAmount',
              label: 'Monthly Amount',
              type: 'number',
              required: true,
              helpText: 'Approximate monthly cost',
            },
            {
              name: 'categoryId',
              label: 'Category',
              type: 'category',
              required: false,
            },
          ],
        },
        {
          id: 'schedule',
          title: 'Payment Schedule',
          fields: [
            {
              name: 'dueDay',
              label: 'Due Day',
              type: 'number',
              required: false,
              helpText: 'Day of month bill is due (1-31)',
            },
            {
              name: 'paymentAccountId',
              label: 'Payment Account',
              type: 'account',
              required: false,
            },
          ],
        },
        {
          id: 'tracking',
          title: 'Tracking Options',
          fields: [
            {
              name: 'autoTrackCategory',
              label: 'Auto-link transactions',
              type: 'select',
              required: false,
              options: [
                { value: 'true', label: 'Yes, link matching transactions' },
                { value: 'false', label: 'No, I\'ll link manually' },
              ],
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'targetAmount'],
    },
  },

  {
    id: 'irregular-payments',
    name: 'Irregular Payments',
    description: 'Bills with non-monthly schedules like quarterly insurance or annual fees',
    icon: '📅',
    category: 'bills',
    examples: ['Car Insurance', 'Property Tax', 'Annual Subscriptions'],
    defaults: {
      planType: 'yearly_variable',
      frequency: 'yearly',
      priority: 'essential',
      purpose: 'sinking_fund',
      autoCalculate: true,
    },
    wizard: {
      steps: [
        {
          id: 'basics',
          title: 'Payment Details',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'e.g., Car Insurance',
            },
            {
              name: 'targetAmount',
              label: 'Annual Total',
              type: 'number',
              required: true,
              helpText: 'Total for all payments this year',
            },
            {
              name: 'categoryId',
              label: 'Category',
              type: 'category',
              required: false,
            },
          ],
        },
        {
          id: 'schedule',
          title: 'Payment Schedule',
          description: 'When is this payment due?',
          fields: [
            {
              name: 'dueMonth',
              label: 'Due Month',
              type: 'month-picker',
              required: false,
              helpText: 'Month when payment is due',
            },
            {
              name: 'paymentAccountId',
              label: 'Payment Account',
              type: 'account',
              required: false,
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'targetAmount'],
    },
  },

  // ─── SAVINGS ─────────────────────────────────────────────────────────────────
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    description: 'Build and maintain a safety net for unexpected expenses',
    icon: '🛡️',
    category: 'savings',
    examples: ['Emergency Fund', 'Rainy Day Fund', 'Safety Net'],
    defaults: {
      planType: 'emergency_fund',
      priority: 'essential',
      purpose: 'sinking_fund',
      frequency: 'one_time',
      autoCalculate: false,
    },
    wizard: {
      steps: [
        {
          id: 'target',
          title: 'Your Safety Net',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'Emergency Fund',
            },
            {
              name: 'targetAmount',
              label: 'Target Amount',
              type: 'number',
              required: true,
              helpText: 'Recommended: 3-6 months of expenses',
            },
            {
              name: 'monthlyContribution',
              label: 'Monthly Savings',
              type: 'number',
              required: true,
              helpText: 'How much to save each month',
            },
          ],
        },
        {
          id: 'account',
          title: 'Where to Keep It',
          fields: [
            {
              name: 'paymentAccountId',
              label: 'Account',
              type: 'account',
              required: false,
              helpText: 'Where is this money stored?',
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'targetAmount', 'monthlyContribution'],
    },
  },

  {
    id: 'seasonal-goal',
    name: 'Seasonal Savings',
    description: 'Save for expenses with specific spending windows like vacations',
    icon: '🏖️',
    category: 'savings',
    examples: ['Summer Vacation', 'Christmas Gifts', 'Back to School'],
    defaults: {
      planType: 'seasonal',
      frequency: 'seasonal',
      priority: 'important',
      purpose: 'sinking_fund',
      autoCalculate: true,
    },
    wizard: {
      steps: [
        {
          id: 'goal',
          title: 'Your Goal',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'Summer Vacation',
            },
            {
              name: 'targetAmount',
              label: 'Total Budget',
              type: 'number',
              required: true,
            },
          ],
        },
        {
          id: 'windows',
          title: 'Spending Windows',
          description: 'When will you spend this money?',
          fields: [
            {
              name: 'seasonalMonths',
              label: 'Active Months',
              type: 'spending-windows',
              required: true,
              helpText: 'Select months when spending occurs',
            },
          ],
        },
        {
          id: 'account',
          title: 'Tracking',
          fields: [
            {
              name: 'paymentAccountId',
              label: 'Account',
              type: 'account',
              required: false,
            },
            {
              name: 'categoryId',
              label: 'Category',
              type: 'category',
              required: false,
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'targetAmount', 'seasonalMonths'],
    },
  },

  // ─── BUDGETS ─────────────────────────────────────────────────────────────────
  {
    id: 'monthly-budget',
    name: 'Monthly Budget',
    description: 'Track spending in a category with a monthly limit',
    icon: '📊',
    category: 'budgets',
    examples: ['Groceries', 'Dining Out', 'Entertainment'],
    defaults: {
      planType: 'goal',
      frequency: 'monthly',
      priority: 'important',
      purpose: 'spending_budget',
      autoTrackCategory: true,
      autoCalculate: false,
    },
    wizard: {
      steps: [
        {
          id: 'budget',
          title: 'Budget Details',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'Groceries',
            },
            {
              name: 'targetAmount',
              label: 'Monthly Budget',
              type: 'number',
              required: true,
              helpText: 'Maximum monthly spending',
            },
            {
              name: 'categoryId',
              label: 'Category to Track',
              type: 'category',
              required: true,
              helpText: 'Transactions in this category will be tracked',
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'targetAmount', 'categoryId'],
    },
  },

  {
    id: 'envelope-budget',
    name: 'Envelope Budget',
    description: 'Transfer money monthly to a dedicated account for specific spending',
    icon: '✉️',
    category: 'budgets',
    examples: ['Personal Care', 'Clothing', 'Hobbies'],
    defaults: {
      planType: 'goal',
      frequency: 'monthly',
      priority: 'discretionary',
      purpose: 'spending_budget',
      autoCalculate: false,
    },
    wizard: {
      steps: [
        {
          id: 'envelope',
          title: 'Envelope Details',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'Personal Care',
            },
            {
              name: 'monthlyContribution',
              label: 'Monthly Transfer',
              type: 'number',
              required: true,
              helpText: 'Amount to add each month',
            },
          ],
        },
        {
          id: 'account',
          title: 'Envelope Account',
          fields: [
            {
              name: 'paymentAccountId',
              label: 'Account',
              type: 'account',
              required: false,
              helpText: 'Where this money is kept',
            },
            {
              name: 'categoryId',
              label: 'Category',
              type: 'category',
              required: false,
            },
            {
              name: 'autoTrackCategory',
              label: 'Auto-track spending',
              type: 'select',
              required: false,
              options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ],
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'monthlyContribution'],
    },
  },

  {
    id: 'yearly-budget',
    name: 'Annual Budget',
    description: 'Track spending over a full year for occasional expenses',
    icon: '📆',
    category: 'budgets',
    examples: ['Gifts', 'Home Maintenance', 'Medical'],
    defaults: {
      planType: 'yearly_fixed',
      frequency: 'yearly',
      priority: 'important',
      purpose: 'spending_budget',
      autoTrackCategory: true,
      autoCalculate: true,
    },
    wizard: {
      steps: [
        {
          id: 'budget',
          title: 'Annual Budget',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              placeholder: 'Gifts',
            },
            {
              name: 'targetAmount',
              label: 'Annual Budget',
              type: 'number',
              required: true,
            },
            {
              name: 'categoryId',
              label: 'Category to Track',
              type: 'category',
              required: true,
            },
          ],
        },
        {
          id: 'account',
          title: 'Payment Account',
          fields: [
            {
              name: 'paymentAccountId',
              label: 'Account',
              type: 'account',
              required: false,
            },
          ],
        },
      ],
    },
    validation: {
      required: ['name', 'targetAmount', 'categoryId'],
    },
  },
];

/**
 * Get a template by its ID.
 */
export function getTemplateById(templateId: string): PlanTemplate | undefined {
  return PLAN_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get all templates in a specific category.
 */
export function getTemplatesByCategory(category: TemplateCategory): PlanTemplate[] {
  return PLAN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template category display name.
 */
export function getTemplateCategoryLabel(category: TemplateCategory): string {
  const labels: Record<TemplateCategory, string> = {
    bills: 'Bills',
    savings: 'Savings',
    budgets: 'Budgets',
  };
  return labels[category];
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD TYPES (Legacy - Category-Based)
// ═══════════════════════════════════════════════════════════════════════════

export const WIZARD_EXPENSE_CATEGORIES = [
  'housing',
  'utilities',
  'insurance',
  'loans',
  'subscriptions',
  'transportation',
  'phone_internet',
  'other',
] as const;

export type WizardExpenseCategory = (typeof WIZARD_EXPENSE_CATEGORIES)[number];

export const WIZARD_CATEGORY_GROUPS = ['essential', 'lifestyle'] as const;
export type WizardCategoryGroup = (typeof WIZARD_CATEGORY_GROUPS)[number];

export const WIZARD_FREQUENCIES = [
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
] as const;

export type WizardFrequency = (typeof WIZARD_FREQUENCIES)[number];

export interface WizardCategoryDefinition {
  id: WizardExpenseCategory;
  label: string;
  icon: string;
  description: string;
  group: WizardCategoryGroup;
  expenseTypes: WizardExpenseType[];
}

export interface WizardExpenseType {
  id: string;
  label: string;
  icon: string;
}

export interface WizardExpensePlan {
  tempId: string;
  categoryType: WizardExpenseCategory;
  expenseType: string;
  name: string;
  amount: number;
  frequency: WizardFrequency;
  nextDueDate: string;
  priority: 'essential' | 'discretionary';
  linkedTransactionIds: number[];
  notes: string;
  categoryId: number | null;
  // Payment source (optional - for coverage tracking)
  paymentAccountType: PaymentAccountType | null;
  paymentAccountId: number | null;
}

export interface WizardState {
  currentStep: number;
  totalSteps: number;
  selectedCategories: WizardExpenseCategory[];
  plans: WizardExpensePlan[];
  isSubmitting: boolean;
  currentCategoryIndex: number;
}

// Category definitions with expense types
export const WIZARD_CATEGORY_DEFINITIONS: WizardCategoryDefinition[] = [
  {
    id: 'housing',
    label: 'Housing',
    icon: '🏠',
    description: 'Mortgage or Rent payments',
    group: 'essential',
    expenseTypes: [
      { id: 'mortgage', label: 'Mortgage', icon: '🏠' },
      { id: 'rent', label: 'Rent', icon: '🏢' },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: '⚡',
    description: 'Electric, Gas, Water, Heating',
    group: 'essential',
    expenseTypes: [
      { id: 'electricity', label: 'Electricity', icon: '⚡' },
      { id: 'gas', label: 'Gas/Heating', icon: '🔥' },
      { id: 'water', label: 'Water', icon: '💧' },
      { id: 'waste', label: 'Waste Collection', icon: '🗑️' },
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: '🛡️',
    description: 'Home, Car, Health, Life insurance',
    group: 'essential',
    expenseTypes: [
      { id: 'home', label: 'Home/Property', icon: '🏠' },
      { id: 'car', label: 'Car/Vehicle', icon: '🚗' },
      { id: 'health', label: 'Health', icon: '🏥' },
      { id: 'life', label: 'Life', icon: '❤️' },
    ],
  },
  {
    id: 'loans',
    label: 'Loans & Financing',
    icon: '💳',
    description: 'Personal loans, Car financing',
    group: 'essential',
    expenseTypes: [
      { id: 'personal', label: 'Personal Loan', icon: '💳' },
      { id: 'car', label: 'Car Financing', icon: '🚗' },
      { id: 'student', label: 'Student Loan', icon: '🎓' },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: '📺',
    description: 'Streaming, Software, Memberships',
    group: 'lifestyle',
    expenseTypes: [
      { id: 'streaming', label: 'Streaming Services', icon: '📺' },
      { id: 'software', label: 'Software/Apps', icon: '💻' },
      { id: 'gym', label: 'Gym/Fitness', icon: '🏋️' },
      { id: 'membership', label: 'Memberships', icon: '🎫' },
    ],
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icon: '🚗',
    description: 'Car payment, Public transit pass',
    group: 'lifestyle',
    expenseTypes: [
      { id: 'car_payment', label: 'Car Payment', icon: '🚗' },
      { id: 'transit', label: 'Public Transit Pass', icon: '🚇' },
      { id: 'parking', label: 'Parking Permit', icon: '🅿️' },
    ],
  },
  {
    id: 'phone_internet',
    label: 'Phone & Internet',
    icon: '📱',
    description: 'Mobile, Broadband, Cable',
    group: 'lifestyle',
    expenseTypes: [
      { id: 'mobile', label: 'Mobile Phone', icon: '📱' },
      { id: 'internet', label: 'Internet/Broadband', icon: '🌐' },
      { id: 'cable', label: 'Cable/TV', icon: '📺' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    icon: '➕',
    description: 'Custom recurring expenses',
    group: 'lifestyle',
    expenseTypes: [
      { id: 'custom', label: 'Custom Expense', icon: '➕' },
    ],
  },
];

export function getWizardCategoryDefinition(
  categoryId: WizardExpenseCategory
): WizardCategoryDefinition | undefined {
  return WIZARD_CATEGORY_DEFINITIONS.find((c) => c.id === categoryId);
}

export function getWizardFrequencyLabel(frequency: WizardFrequency): string {
  const labels: Record<WizardFrequency, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semiannual: 'Semi-annual',
    annual: 'Annual',
  };
  return labels[frequency] || frequency;
}

export function getWizardFrequencyMonthlyMultiplier(frequency: WizardFrequency): number {
  const multipliers: Record<WizardFrequency, number> = {
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
    quarterly: 1 / 3,
    semiannual: 1 / 6,
    annual: 1 / 12,
  };
  return multipliers[frequency] || 1;
}

export function calculateMonthlyContribution(
  amount: number,
  frequency: WizardFrequency
): number {
  return amount * getWizardFrequencyMonthlyMultiplier(frequency);
}

export function getDefaultWizardState(): WizardState {
  return {
    currentStep: 0,
    totalSteps: 1,
    selectedCategories: [],
    plans: [],
    isSubmitting: false,
    currentCategoryIndex: 0,
  };
}

export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function mapWizardFrequencyToExpensePlanFrequency(
  frequency: WizardFrequency
): ExpensePlanFrequency {
  const mapping: Record<WizardFrequency, ExpensePlanFrequency> = {
    weekly: 'monthly',
    biweekly: 'monthly',
    monthly: 'monthly',
    quarterly: 'quarterly',
    semiannual: 'yearly',
    annual: 'yearly',
  };
  return mapping[frequency] || 'yearly';
}

export function mapWizardPlanToCreateDto(
  plan: WizardExpensePlan
): CreateExpensePlanDto {
  const frequency = mapWizardFrequencyToExpensePlanFrequency(plan.frequency);
  const monthlyContribution = calculateMonthlyContribution(plan.amount, plan.frequency);

  // Determine plan type based on frequency
  let planType: ExpensePlanType = 'yearly_fixed';
  if (plan.frequency === 'monthly' || plan.frequency === 'weekly' || plan.frequency === 'biweekly') {
    planType = 'fixed_monthly';
  }

  // Extract due month and day from next due date
  const dueDate = new Date(plan.nextDueDate);
  const dueMonth = dueDate.getMonth() + 1;
  const dueDay = dueDate.getDate();

  return {
    name: plan.name,
    description: plan.notes || undefined,
    planType,
    priority: plan.priority === 'essential' ? 'essential' : 'discretionary',
    categoryId: plan.categoryId || undefined,
    targetAmount: plan.amount,
    monthlyContribution: Math.round(monthlyContribution * 100) / 100,
    contributionSource: 'calculated',
    frequency,
    dueMonth,
    dueDay,
    autoCalculate: true,
    rolloverSurplus: true,
    // Payment source (optional)
    paymentAccountType: plan.paymentAccountType || undefined,
    paymentAccountId: plan.paymentAccountId || undefined,
  };
}
