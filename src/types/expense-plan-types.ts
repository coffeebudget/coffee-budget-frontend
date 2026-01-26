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

export const INITIAL_BALANCE_SOURCES = ['zero', 'historical', 'custom'] as const;

export const EXPENSE_PLAN_TRANSACTION_TYPES = [
  'contribution',
  'withdrawal',
  'adjustment',
  'rollover',
] as const;

export const FUNDING_STATUSES = ['funded', 'almost_ready', 'on_track', 'behind'] as const;

export const DISTRIBUTION_STRATEGIES = ['priority', 'proportional', 'fixed'] as const;

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
export type InitialBalanceSource = (typeof INITIAL_BALANCE_SOURCES)[number];
export type ExpensePlanTransactionType = (typeof EXPENSE_PLAN_TRANSACTION_TYPES)[number];
export type FundingStatus = (typeof FUNDING_STATUSES)[number];
export type DistributionStrategy = (typeof DISTRIBUTION_STRATEGIES)[number];
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
  currentBalance: number;
  monthlyContribution: number;
  contributionSource: ContributionSource;

  // Timing
  frequency: ExpensePlanFrequency;
  frequencyYears: number | null;
  dueMonth: number | null;
  dueDay: number | null;
  targetDate: string | null;
  seasonalMonths: number[] | null;
  lastFundedDate: string | null;
  nextDueDate: string | null;

  // Tracking
  status: ExpensePlanStatus;
  autoCalculate: boolean;
  rolloverSurplus: boolean;

  // Initialization
  initialBalanceSource: InitialBalanceSource;
  initialBalanceCustom: number | null;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Adjustment Suggestions (populated by weekly cron job)
  suggestedMonthlyContribution: number | null;
  suggestedAdjustmentPercent: number | null;
  adjustmentReason: AdjustmentReason | null;
  adjustmentSuggestedAt: string | null;
  adjustmentDismissedAt: string | null;

  // Relations (optional, loaded on demand)
  transactions?: ExpensePlanTransaction[];

  // Fixed monthly status (only populated for fixed_monthly plans with status endpoint)
  fixedMonthlyStatus?: FixedMonthlyStatus | null;
}

export interface ExpensePlanTransaction {
  id: number;
  expensePlanId: number;
  type: ExpensePlanTransactionType;
  amount: number;
  date: string;
  balanceAfter: number;
  transactionId: number | null;
  transaction?: {
    id: number;
    description: string;
    amount: number;
    date: string;
  } | null;
  note: string | null;
  isAutomatic: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// INCOME DISTRIBUTION INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomeDistributionRule {
  id: number;
  userId: number;
  name: string;
  expectedAmount: number | null;
  amountTolerance: number;
  descriptionPattern: string | null;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
    icon?: string | null;
  } | null;
  bankAccountId: number | null;
  bankAccount?: {
    id: number;
    name: string;
  } | null;
  autoDistribute: boolean;
  distributionStrategy: DistributionStrategy;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PendingDistribution {
  transactionId: number;
  transaction: {
    id: number;
    description: string;
    amount: number;
    executionDate: string;
    bankAccount?: {
      id: number;
      name: string;
    } | null;
  };
  matchingRule: IncomeDistributionRule;
  suggestedDistribution: DistributionSuggestion[];
}

export interface DistributionSuggestion {
  planId: number;
  planName: string;
  amount: number;
  reason: string;
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
  initialBalanceSource?: InitialBalanceSource;
  initialBalanceCustom?: number;
  // Payment source (optional - for coverage tracking)
  paymentAccountType?: PaymentAccountType;
  paymentAccountId?: number;
}

export interface UpdateExpensePlanDto {
  name?: string;
  description?: string;
  icon?: string;
  planType?: ExpensePlanType;
  priority?: ExpensePlanPriority;
  categoryId?: number;
  autoTrackCategory?: boolean;
  purpose?: ExpensePlanPurpose;
  targetAmount?: number;
  monthlyContribution?: number;
  contributionSource?: ContributionSource;
  frequency?: ExpensePlanFrequency;
  frequencyYears?: number;
  dueMonth?: number;
  dueDay?: number;
  targetDate?: string;
  seasonalMonths?: number[];
  status?: ExpensePlanStatus;
  autoCalculate?: boolean;
  rolloverSurplus?: boolean;
  // Payment source (optional - for coverage tracking)
  paymentAccountType?: PaymentAccountType;
  paymentAccountId?: number;
}

export interface ContributeDto {
  amount: number;
  note?: string;
}

export interface WithdrawDto {
  amount: number;
  note?: string;
}

export interface AdjustBalanceDto {
  newBalance: number;
  note?: string;
}

export interface LinkTransactionDto {
  transactionId: number;
}

// Income Distribution DTOs
export interface CreateIncomeDistributionRuleDto {
  name: string;
  expectedAmount?: number;
  amountTolerance?: number;
  descriptionPattern?: string;
  categoryId?: number;
  bankAccountId?: number;
  autoDistribute?: boolean;
  distributionStrategy?: DistributionStrategy;
}

export interface UpdateIncomeDistributionRuleDto {
  name?: string;
  expectedAmount?: number | null;
  amountTolerance?: number;
  descriptionPattern?: string | null;
  categoryId?: number | null;
  bankAccountId?: number | null;
  autoDistribute?: boolean;
  distributionStrategy?: DistributionStrategy;
  isActive?: boolean;
}

export interface ManualDistributionDto {
  amount: number;
  strategy?: DistributionStrategy;
  note?: string;
}

export interface ManualDistributionResult {
  distributed: {
    planId: number;
    planName: string;
    amount: number;
  }[];
  totalDistributed: number;
  remainder: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COVERAGE SUMMARY INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export const COVERAGE_STATUSES = ['all_covered', 'has_shortfall', 'no_data'] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

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
}

/**
 * Coverage information for a single bank account
 */
export interface AccountCoverage {
  accountId: number;
  accountName: string;
  institution: string | null;
  currentBalance: number;
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
  /** Whether balance is sufficient for next payment */
  readyForNextMonth: boolean;
  /** Amount short of next payment (targetAmount - currentBalance) */
  amountShort: number | null;
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
  currentBalance: number;
  targetAmount: number;
  progress: number;
}

export interface TimelineEntry {
  date: string;
  planId: number;
  planName: string;
  icon: string | null;
  amount: number;
  currentBalance: number;
  status: FundingStatus;
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
  // Expected funding fields (override to ensure they're included)
  expectedFundedByNow: number | null;
  fundingGapFromExpected: number | null;
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
  // Expected funding fields
  expectedFundedByNow: number | null;
  currentBalance: number;
  fundingGapFromExpected: number | null;
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
export type FixedMonthlyAllocationStatus = 'paid' | 'pending' | 'short';

/**
 * Status for sinking fund plan allocation
 */
export type SinkingFundAllocationStatus = 'ahead' | 'on_track' | 'behind';

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
  /** Current balance in the plan */
  currentBalance: number;
  /** Whether current month payment has been made */
  paymentMade: boolean;
  /** Whether ready for next payment */
  readyForNextMonth: boolean;
  /** Payment status: paid, pending, or short */
  status: FixedMonthlyAllocationStatus;
  /** Amount short if not ready */
  amountShort: number | null;
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
  /** Current balance in the plan */
  currentBalance: number;
  /** Target total amount */
  targetAmount: number;
  /** Monthly contribution */
  monthlyContribution: number;
  /** Progress percentage */
  progressPercent: number;
  /** Funding status relative to schedule */
  status: SinkingFundAllocationStatus;
  /** Gap from expected (positive = behind schedule) */
  gapFromExpected: number | null;
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
  onContribute?: (plan: ExpensePlan) => void;
  onWithdraw?: (plan: ExpensePlan) => void;
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
  initialBalanceSource: InitialBalanceSource;
  initialBalanceCustom: string;
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

export function getTransactionTypeLabel(type: ExpensePlanTransactionType): string {
  const labels: Record<ExpensePlanTransactionType, string> = {
    contribution: 'Contribution',
    withdrawal: 'Withdrawal',
    adjustment: 'Adjustment',
    rollover: 'Rollover',
  };
  return labels[type] || type;
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
    short: 'Short',
  };
  return labels[status] || status;
}

export function getFixedMonthlyAllocationStatusColor(status: FixedMonthlyAllocationStatus): string {
  const colors: Record<FixedMonthlyAllocationStatus, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-blue-100 text-blue-800',
    short: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getSinkingFundAllocationStatusLabel(status: SinkingFundAllocationStatus): string {
  const labels: Record<SinkingFundAllocationStatus, string> = {
    ahead: 'Ahead',
    on_track: 'On Track',
    behind: 'Behind',
  };
  return labels[status] || status;
}

export function getSinkingFundAllocationStatusColor(status: SinkingFundAllocationStatus): string {
  const colors: Record<SinkingFundAllocationStatus, string> = {
    ahead: 'bg-green-100 text-green-800',
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

/**
 * Calculate funding status for a sinking fund plan.
 * Mirrors backend calculateStatus logic.
 * Returns null if no due date set.
 */
export function calculateFundingStatus(plan: {
  currentBalance: number;
  targetAmount: number;
  monthlyContribution: number;
  nextDueDate: string | null;
  purpose?: ExpensePlanPurpose;
}): FundingStatus | null {
  // Only calculate for sinking funds with a due date
  if (!plan.nextDueDate) {
    return null;
  }

  // If already funded
  if (plan.currentBalance >= plan.targetAmount) {
    return 'funded';
  }

  // Calculate months until due
  const now = new Date();
  const dueDate = new Date(plan.nextDueDate);
  const monthsUntilDue = Math.max(
    0,
    (dueDate.getFullYear() - now.getFullYear()) * 12 +
      (dueDate.getMonth() - now.getMonth())
  );

  // If due date is in the past or this month
  if (monthsUntilDue <= 0) {
    return plan.currentBalance >= plan.targetAmount ? 'funded' : 'behind';
  }

  // Calculate required monthly contribution
  const amountNeeded = plan.targetAmount - plan.currentBalance;
  const requiredMonthly = amountNeeded / monthsUntilDue;

  // On track if current contribution is within 10% of required
  const isOnTrack = requiredMonthly <= plan.monthlyContribution * 1.1;

  if (isOnTrack) {
    // Almost ready if 90%+ funded
    const progress = (plan.currentBalance / plan.targetAmount) * 100;
    if (progress >= 90) {
      return 'almost_ready';
    }
    return 'on_track';
  }

  return 'behind';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
 * Example: Summer vacation €4,000, €400/month, due July 2026
 * - Months needed: 4000/400 = 10 months
 * - Should have started: July - 10 = September 2025
 * - Now is January 2026, so 4-5 months elapsed
 * - Expected by now: ~€1,600-2,000
 */
export function calculateExpectedFundedByNow(plan: {
  purpose?: ExpensePlanPurpose;
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

  const now = new Date();

  // Get the due date (prefer nextDueDate, fall back to targetDate)
  const dueDateStr = plan.nextDueDate || plan.targetDate;
  if (!dueDateStr) {
    // No due date - can't calculate expected progress
    return null;
  }

  const dueDate = new Date(dueDateStr);

  // Calculate how many months are needed to save the full target
  const monthsNeededToSave = targetAmount / monthlyContribution;

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
  // Capped at target amount
  const expectedFundedByNow = Math.min(
    monthsElapsed * monthlyContribution,
    targetAmount
  );

  return Math.round(expectedFundedByNow * 100) / 100;
}

/**
 * Calculate the funding gap from expected.
 * Positive value means behind schedule.
 */
export function calculateFundingGapFromExpected(plan: {
  purpose?: ExpensePlanPurpose;
  monthlyContribution: number;
  targetAmount: number;
  currentBalance: number;
  createdAt: string;
  nextDueDate: string | null;
  targetDate?: string | null;
}): number | null {
  const expectedFundedByNow = calculateExpectedFundedByNow(plan);
  if (expectedFundedByNow === null) {
    return null;
  }
  return Math.max(0, expectedFundedByNow - plan.currentBalance);
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
    initialBalanceSource: 'zero',
    initialBalanceCustom: '',
    paymentAccountType: null,
    paymentAccountId: null,
  };
}

export function getDistributionStrategyLabel(strategy: DistributionStrategy): string {
  const labels: Record<DistributionStrategy, string> = {
    priority: 'Priority Order',
    proportional: 'Proportional',
    fixed: 'Fixed Amounts',
  };
  return labels[strategy] || strategy;
}

export function getDistributionStrategyDescription(strategy: DistributionStrategy): string {
  const descriptions: Record<DistributionStrategy, string> = {
    priority: 'Funds essential plans first, then important, then discretionary',
    proportional: 'Distributes income proportionally based on each plan\'s target amount',
    fixed: 'Distributes exactly the monthly contribution amount to each plan',
  };
  return descriptions[strategy] || '';
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD TYPES
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
    initialBalanceSource: 'zero',
    // Payment source (optional)
    paymentAccountType: plan.paymentAccountType || undefined,
    paymentAccountId: plan.paymentAccountId || undefined,
  };
}
