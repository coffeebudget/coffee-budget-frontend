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

  // Relations (optional, loaded on demand)
  transactions?: ExpensePlanTransaction[];
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
}

export interface UpdateExpensePlanDto {
  name?: string;
  description?: string;
  icon?: string;
  planType?: ExpensePlanType;
  priority?: ExpensePlanPriority;
  categoryId?: number;
  autoTrackCategory?: boolean;
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

export interface BulkFundItemDto {
  planId: number;
  amount: number;
  note?: string;
}

export interface BulkFundDto {
  items: BulkFundItemDto[];
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
// SUMMARY & ANALYTICS INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MonthlyDepositSummary {
  totalMonthlyDeposit: number;
  planCount: number;
  fullyFundedCount: number;
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

// ═══════════════════════════════════════════════════════════════════════════
// BULK OPERATION RESULTS
// ═══════════════════════════════════════════════════════════════════════════

export interface BulkFundSuccessItem {
  planId: number;
  amount: number;
  transactionId: number;
}

export interface BulkFundFailedItem {
  planId: number;
  reason: string;
}

export interface BulkFundResult {
  successful: BulkFundSuccessItem[];
  failed: BulkFundFailedItem[];
  totalFunded: number;
}

export interface BulkQuickFundResult extends BulkFundResult {
  skipped: BulkFundFailedItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// UI HELPER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExpensePlanCardProps {
  plan: ExpensePlan;
  onEdit?: (plan: ExpensePlan) => void;
  onDelete?: (id: number) => void;
  onQuickFund?: (id: number) => void;
  onFundToTarget?: (id: number) => void;
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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
