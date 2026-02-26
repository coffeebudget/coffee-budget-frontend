/**
 * Income Plans TypeScript Types
 *
 * Types for the income tracking and budget planning system.
 * Mirrors backend entities from coffee-budget-backend/src/income-plans/
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const INCOME_PLAN_RELIABILITIES = [
  'guaranteed',
  'expected',
  'uncertain',
] as const;

export const INCOME_PLAN_STATUSES = ['active', 'paused', 'archived'] as const;

export const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

export const MONTH_LABELS: Record<MonthName, string> = {
  january: 'Jan',
  february: 'Feb',
  march: 'Mar',
  april: 'Apr',
  may: 'May',
  june: 'Jun',
  july: 'Jul',
  august: 'Aug',
  september: 'Sep',
  october: 'Oct',
  november: 'Nov',
  december: 'Dec',
};

export const MONTH_FULL_LABELS: Record<MonthName, string> = {
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type IncomePlanReliability = (typeof INCOME_PLAN_RELIABILITIES)[number];
export type IncomePlanStatus = (typeof INCOME_PLAN_STATUSES)[number];
export type MonthName = (typeof MONTH_NAMES)[number];

export interface MonthlyAmounts {
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomePlan {
  id: number;
  userId: number;

  // Identity
  name: string;
  description: string | null;
  icon: string | null;

  // Classification
  reliability: IncomePlanReliability;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
    icon?: string | null;
  } | null;

  // Monthly Calendar (12 amounts)
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;

  // Payment Destination
  paymentAccountId: number | null;
  paymentAccount?: {
    id: number;
    name: string;
    balance: number;
  } | null;

  // Timing
  expectedDay: number | null;

  // Status
  status: IncomePlanStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DTO INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateIncomePlanDto {
  name: string;
  description?: string;
  icon?: string;
  reliability?: IncomePlanReliability;
  categoryId?: number;
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
  paymentAccountId?: number;
  expectedDay?: number;
  status?: IncomePlanStatus;
}

export interface UpdateIncomePlanDto {
  name?: string;
  description?: string;
  icon?: string;
  reliability?: IncomePlanReliability;
  categoryId?: number;
  january?: number;
  february?: number;
  march?: number;
  april?: number;
  may?: number;
  june?: number;
  july?: number;
  august?: number;
  september?: number;
  october?: number;
  november?: number;
  december?: number;
  paymentAccountId?: number;
  expectedDay?: number;
  status?: IncomePlanStatus;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomePlanSummary {
  id: number;
  name: string;
  icon: string | null;
  reliability: IncomePlanReliability;
  annualTotal: number;
  monthlyAverage: number;
  currentMonthExpected: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  guaranteedTotal: number;
  expectedTotal: number;
  uncertainTotal: number;
  totalIncome: number;
  budgetSafeIncome: number;
  planCount: number;
  plans: IncomePlanSummary[];
}

export interface AnnualSummary {
  year: number;
  totalAnnualIncome: number;
  monthlyAverage: number;
  monthlyBreakdown: MonthlyAmounts;
  minimumMonth: number;
  maximumMonth: number;
  planCount: number;
  plans: IncomePlanSummary[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export const INCOME_ENTRY_STATUSES = [
  'pending',
  'partial',
  'received',
  'exceeded',
] as const;

export type IncomePlanEntryStatus = (typeof INCOME_ENTRY_STATUSES)[number];

export interface IncomePlanEntry {
  id: number;
  incomePlanId: number;
  year: number;
  month: number;
  actualAmount: number;
  expectedAmount: number;
  transactionId: number | null;
  note: string | null;
  isAutomatic: boolean;
  createdAt: string;

  // Computed fields
  status: IncomePlanEntryStatus;
  difference: number;
  percentageReceived: number;
}

export interface CreateIncomePlanEntryDto {
  year: number;
  month: number;
  actualAmount: number;
  transactionId?: number;
  note?: string;
}

export interface UpdateIncomePlanEntryDto {
  actualAmount?: number;
  transactionId?: number | null;
  note?: string | null;
}

export interface LinkTransactionDto {
  transactionId: number;
  year: number;
  month: number;
  note?: string;
}

export interface IncomePlanTrackingSummary {
  incomePlanId: number;
  incomePlanName: string;
  incomePlanIcon: string | null;
  reliability: string;

  year: number;
  month: number;

  expectedAmount: number;
  actualAmount: number;
  status: IncomePlanEntryStatus;
  difference: number;
  percentageReceived: number;

  hasEntry: boolean;
  entryId: number | null;
  transactionId: number | null;
}

export interface MonthlyTrackingSummary {
  year: number;
  month: number;

  // Totals
  totalExpected: number;
  totalReceived: number;
  totalDifference: number;
  overallPercentage: number;

  // Counts by status
  pendingCount: number;
  partialCount: number;
  receivedCount: number;
  exceededCount: number;

  // Per-plan breakdown
  plans: IncomePlanTrackingSummary[];
}

export interface AnnualTrackingSummary {
  year: number;

  // Annual totals
  totalExpected: number;
  totalReceived: number;
  totalDifference: number;
  overallPercentage: number;

  // Monthly breakdown
  months: MonthlyTrackingSummary[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM DATA INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomePlanFormData {
  name: string;
  description: string;
  icon: string;
  reliability: IncomePlanReliability;
  categoryId: number | null;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  paymentAccountId: number | null;
  expectedDay: number | null;
  status: IncomePlanStatus;
}

export interface IncomePlanFormErrors {
  name?: string;
  january?: string;
  february?: string;
  march?: string;
  april?: string;
  may?: string;
  june?: string;
  july?: string;
  august?: string;
  september?: string;
  october?: string;
  november?: string;
  december?: string;
  expectedDay?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getReliabilityLabel(reliability: IncomePlanReliability): string {
  const labels: Record<IncomePlanReliability, string> = {
    guaranteed: 'Guaranteed',
    expected: 'Expected',
    uncertain: 'Uncertain',
  };
  return labels[reliability] || reliability;
}

export function getReliabilityDescription(reliability: IncomePlanReliability): string {
  const descriptions: Record<IncomePlanReliability, string> = {
    guaranteed: 'Always included in budget calculations',
    expected: 'Included with a warning indicator',
    uncertain: 'Excluded from budget (bonus if received)',
  };
  return descriptions[reliability] || '';
}

export function getReliabilityColor(reliability: IncomePlanReliability): string {
  const colors: Record<IncomePlanReliability, string> = {
    guaranteed: 'bg-green-100 text-green-800',
    expected: 'bg-yellow-100 text-yellow-800',
    uncertain: 'bg-gray-100 text-gray-800',
  };
  return colors[reliability] || 'bg-gray-100 text-gray-800';
}

export function getReliabilityIcon(reliability: IncomePlanReliability): string {
  const icons: Record<IncomePlanReliability, string> = {
    guaranteed: '✓',
    expected: '~',
    uncertain: '?',
  };
  return icons[reliability] || '?';
}

export function getStatusLabel(status: IncomePlanStatus): string {
  const labels: Record<IncomePlanStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    archived: 'Archived',
  };
  return labels[status] || status;
}

export function getStatusColor(status: IncomePlanStatus): string {
  const colors: Record<IncomePlanStatus, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export { formatCurrency } from '@/utils/format';

export function getMonthlyAmounts(plan: IncomePlan): MonthlyAmounts {
  return {
    january: Number(plan.january),
    february: Number(plan.february),
    march: Number(plan.march),
    april: Number(plan.april),
    may: Number(plan.may),
    june: Number(plan.june),
    july: Number(plan.july),
    august: Number(plan.august),
    september: Number(plan.september),
    october: Number(plan.october),
    november: Number(plan.november),
    december: Number(plan.december),
  };
}

export function getAmountForMonth(plan: IncomePlan, monthIndex: number): number {
  const months: MonthName[] = MONTH_NAMES as unknown as MonthName[];
  const monthName = months[monthIndex];
  return Number(plan[monthName] ?? 0);
}

export function getAnnualTotal(plan: IncomePlan): number {
  return (
    Number(plan.january) +
    Number(plan.february) +
    Number(plan.march) +
    Number(plan.april) +
    Number(plan.may) +
    Number(plan.june) +
    Number(plan.july) +
    Number(plan.august) +
    Number(plan.september) +
    Number(plan.october) +
    Number(plan.november) +
    Number(plan.december)
  );
}

export function getMonthlyAverage(plan: IncomePlan): number {
  return getAnnualTotal(plan) / 12;
}

export function getCurrentMonthAmount(plan: IncomePlan): number {
  const currentMonth = new Date().getMonth();
  return getAmountForMonth(plan, currentMonth);
}

export function getDefaultFormData(): IncomePlanFormData {
  return {
    name: '',
    description: '',
    icon: '',
    reliability: 'guaranteed',
    categoryId: null,
    january: 0,
    february: 0,
    march: 0,
    april: 0,
    may: 0,
    june: 0,
    july: 0,
    august: 0,
    september: 0,
    october: 0,
    november: 0,
    december: 0,
    paymentAccountId: null,
    expectedDay: null,
    status: 'active',
  };
}

export function incomePlanToFormData(plan: IncomePlan): IncomePlanFormData {
  return {
    name: plan.name,
    description: plan.description || '',
    icon: plan.icon || '',
    reliability: plan.reliability,
    categoryId: plan.categoryId,
    january: Number(plan.january),
    february: Number(plan.february),
    march: Number(plan.march),
    april: Number(plan.april),
    may: Number(plan.may),
    june: Number(plan.june),
    july: Number(plan.july),
    august: Number(plan.august),
    september: Number(plan.september),
    october: Number(plan.october),
    november: Number(plan.november),
    december: Number(plan.december),
    paymentAccountId: plan.paymentAccountId,
    expectedDay: plan.expectedDay,
    status: plan.status,
  };
}

export function formDataToCreateDto(data: IncomePlanFormData): CreateIncomePlanDto {
  return {
    name: data.name,
    description: data.description || undefined,
    icon: data.icon || undefined,
    reliability: data.reliability,
    categoryId: data.categoryId || undefined,
    january: data.january,
    february: data.february,
    march: data.march,
    april: data.april,
    may: data.may,
    june: data.june,
    july: data.july,
    august: data.august,
    september: data.september,
    october: data.october,
    november: data.november,
    december: data.december,
    paymentAccountId: data.paymentAccountId || undefined,
    expectedDay: data.expectedDay || undefined,
    status: data.status,
  };
}

export function formDataToUpdateDto(data: IncomePlanFormData): UpdateIncomePlanDto {
  return formDataToCreateDto(data);
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getEntryStatusLabel(status: IncomePlanEntryStatus): string {
  const labels: Record<IncomePlanEntryStatus, string> = {
    pending: 'Pending',
    partial: 'Partial',
    received: 'Received',
    exceeded: 'Exceeded',
  };
  return labels[status] || status;
}

export function getEntryStatusColor(status: IncomePlanEntryStatus): string {
  const colors: Record<IncomePlanEntryStatus, string> = {
    pending: 'bg-gray-100 text-gray-800',
    partial: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    exceeded: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getEntryStatusIcon(status: IncomePlanEntryStatus): string {
  const icons: Record<IncomePlanEntryStatus, string> = {
    pending: '⏳',
    partial: '⚠️',
    received: '✓',
    exceeded: '↑',
  };
  return icons[status] || '?';
}
