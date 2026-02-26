/**
 * Expense Plan Suggestion Types
 *
 * Types for the AI-powered expense plan suggestion system.
 * These match the backend DTOs from the smart-recurrence module.
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export enum ExpenseType {
  SUBSCRIPTION = 'subscription',
  UTILITY = 'utility',
  INSURANCE = 'insurance',
  MORTGAGE = 'mortgage',
  RENT = 'rent',
  LOAN = 'loan',
  TAX = 'tax',
  SALARY = 'salary',
  INVESTMENT = 'investment',
  OTHER_FIXED = 'other_fixed',
  VARIABLE = 'variable',
}

export enum FrequencyType {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ExpensePlanPurpose = 'sinking_fund' | 'spending_budget';

// v4: Template IDs (PRD-006)
export type TemplateId =
  | 'monthly-bill'
  | 'irregular-payments'
  | 'emergency-fund'
  | 'seasonal-goal'
  | 'monthly-budget'
  | 'envelope-budget'
  | 'yearly-budget';

export interface SuggestedConfig {
  dueDay?: number;
  dueMonth?: number;
  paymentSchedule?: { month: number; estimatedAmount: number }[];
  spendingWindows?: number[];
  autoTrackCategory?: boolean;
  paymentAccountId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExpensePlanSuggestion {
  id: number;
  suggestedName: string;
  description: string | null;
  merchantName: string | null;
  representativeDescription: string;
  categoryId: number | null;
  categoryName: string | null;
  averageAmount: number;
  monthlyContribution: number;
  yearlyTotal: number;
  expenseType: ExpenseType;
  isEssential: boolean;
  frequencyType: FrequencyType;
  intervalDays: number;
  patternConfidence: number;
  classificationConfidence: number;
  overallConfidence: number;
  classificationReasoning: string | null;
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
  nextExpectedDate: string;
  suggestedPurpose: ExpensePlanPurpose | null;
  status: SuggestionStatus;
  createdAt: string;
  metadata?: {
    transactionIds?: number[];
    patternId?: string;
    amountRange?: { min: number; max: number };
    sourceVersion?: string;
  };
  // v4: Template detection (PRD-006)
  suggestedTemplate?: TemplateId | null;
  templateConfidence?: number | null;
  templateReasons?: string[] | null;
  suggestedConfig?: SuggestedConfig | null;
}

export interface SuggestionListResponse {
  suggestions: ExpensePlanSuggestion[];
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface GenerateSuggestionsResponse {
  suggestions: ExpensePlanSuggestion[];
  totalFound: number;
  newSuggestions: number;
  existingSuggestions: number;
  processingTimeMs: number;
  summary: {
    byExpenseType: Record<string, number>;
    totalMonthlyContribution: number;
    essentialCount: number;
    discretionaryCount: number;
  };
}

export interface ApprovalResult {
  success: boolean;
  suggestionId: number;
  expensePlanId?: number;
  message?: string;
}

export interface BulkActionResult {
  processed: number;
  successful: number;
  failed: number;
  results: ApprovalResult[];
}

export interface ApiUsageStats {
  dailyApiCalls: number;
  maxDailyApiCalls: number;
  remainingCalls: number;
  cacheSize: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES (DTOs)
// ═══════════════════════════════════════════════════════════════════════════

export interface GenerateSuggestionsDto {
  monthsToAnalyze?: number;
  minOccurrences?: number;
  minConfidence?: number;
  similarityThreshold?: number;
  forceRegenerate?: boolean;
}

export interface ApproveSuggestionDto {
  customName?: string;
  customMonthlyContribution?: number;
  categoryId?: number;
}

export interface RejectSuggestionDto {
  reason?: string;
}

export interface BulkActionDto {
  suggestionIds: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getExpenseTypeLabel(type: ExpenseType): string {
  const labels: Record<ExpenseType, string> = {
    [ExpenseType.SUBSCRIPTION]: 'Subscription',
    [ExpenseType.UTILITY]: 'Utility',
    [ExpenseType.INSURANCE]: 'Insurance',
    [ExpenseType.MORTGAGE]: 'Mortgage',
    [ExpenseType.RENT]: 'Rent',
    [ExpenseType.LOAN]: 'Loan',
    [ExpenseType.TAX]: 'Tax',
    [ExpenseType.SALARY]: 'Salary',
    [ExpenseType.INVESTMENT]: 'Investment',
    [ExpenseType.OTHER_FIXED]: 'Other Fixed',
    [ExpenseType.VARIABLE]: 'Variable',
  };
  return labels[type] || type;
}

export function getExpenseTypeIcon(type: ExpenseType): string {
  const icons: Record<ExpenseType, string> = {
    [ExpenseType.SUBSCRIPTION]: '📱',
    [ExpenseType.UTILITY]: '💡',
    [ExpenseType.INSURANCE]: '🛡️',
    [ExpenseType.MORTGAGE]: '🏠',
    [ExpenseType.RENT]: '🏢',
    [ExpenseType.LOAN]: '💳',
    [ExpenseType.TAX]: '📋',
    [ExpenseType.SALARY]: '💰',
    [ExpenseType.INVESTMENT]: '📈',
    [ExpenseType.OTHER_FIXED]: '📌',
    [ExpenseType.VARIABLE]: '🔄',
  };
  return icons[type] || '📌';
}

export function getFrequencyLabel(type: FrequencyType): string {
  const labels: Record<FrequencyType, string> = {
    [FrequencyType.WEEKLY]: 'Weekly',
    [FrequencyType.BIWEEKLY]: 'Every 2 Weeks',
    [FrequencyType.MONTHLY]: 'Monthly',
    [FrequencyType.QUARTERLY]: 'Every 3 Months',
    [FrequencyType.SEMIANNUAL]: 'Every 6 Months',
    [FrequencyType.ANNUAL]: 'Yearly',
  };
  return labels[type] || type;
}

export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'medium';
  return 'low';
}

export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-red-600';
  }
}

export function getConfidenceBgColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high':
      return 'bg-green-100';
    case 'medium':
      return 'bg-yellow-100';
    case 'low':
      return 'bg-red-100';
  }
}

export function getStatusLabel(status: SuggestionStatus): string {
  const labels: Record<SuggestionStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return labels[status] || status;
}

export function getStatusColor(status: SuggestionStatus): string {
  const colors: Record<SuggestionStatus, string> = {
    pending: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export { formatCurrency } from '@/utils/format';

export function getSuggestedPurposeLabel(purpose: ExpensePlanPurpose | null): string {
  if (!purpose) return 'Unknown';
  const labels: Record<ExpensePlanPurpose, string> = {
    sinking_fund: 'Sinking Fund',
    spending_budget: 'Spending Budget',
  };
  return labels[purpose] || purpose;
}

export function getSuggestedPurposeIcon(purpose: ExpensePlanPurpose | null): string {
  if (!purpose) return '📋';
  const icons: Record<ExpensePlanPurpose, string> = {
    sinking_fund: '📦',
    spending_budget: '📊',
  };
  return icons[purpose] || '📋';
}

export function getSuggestedPurposeColor(purpose: ExpensePlanPurpose | null): string {
  if (!purpose) return 'bg-gray-100 text-gray-800';
  const colors: Record<ExpensePlanPurpose, string> = {
    sinking_fund: 'bg-blue-100 text-blue-800',
    spending_budget: 'bg-purple-100 text-purple-800',
  };
  return colors[purpose] || 'bg-gray-100 text-gray-800';
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE HELPERS (v4: PRD-006)
// ═══════════════════════════════════════════════════════════════════════════

export function getTemplateLabel(templateId: TemplateId | null | undefined): string {
  if (!templateId) return 'Unknown';
  const labels: Record<TemplateId, string> = {
    'monthly-bill': 'Monthly Bill',
    'irregular-payments': 'Irregular Payments',
    'emergency-fund': 'Emergency Fund',
    'seasonal-goal': 'Seasonal Goal',
    'monthly-budget': 'Monthly Budget',
    'envelope-budget': 'Envelope Budget',
    'yearly-budget': 'Yearly Budget',
  };
  return labels[templateId] || templateId;
}

export function getTemplateIcon(templateId: TemplateId | null | undefined): string {
  if (!templateId) return '📋';
  const icons: Record<TemplateId, string> = {
    'monthly-bill': '📅',
    'irregular-payments': '📆',
    'emergency-fund': '🛟',
    'seasonal-goal': '🎯',
    'monthly-budget': '📊',
    'envelope-budget': '✉️',
    'yearly-budget': '📈',
  };
  return icons[templateId] || '📋';
}

export function getTemplateColor(templateId: TemplateId | null | undefined): string {
  if (!templateId) return 'bg-gray-100 text-gray-800';
  const colors: Record<TemplateId, string> = {
    'monthly-bill': 'bg-green-100 text-green-800',
    'irregular-payments': 'bg-orange-100 text-orange-800',
    'emergency-fund': 'bg-red-100 text-red-800',
    'seasonal-goal': 'bg-teal-100 text-teal-800',
    'monthly-budget': 'bg-blue-100 text-blue-800',
    'envelope-budget': 'bg-purple-100 text-purple-800',
    'yearly-budget': 'bg-indigo-100 text-indigo-800',
  };
  return colors[templateId] || 'bg-gray-100 text-gray-800';
}

export function getTemplateDescription(templateId: TemplateId | null | undefined): string {
  if (!templateId) return '';
  const descriptions: Record<TemplateId, string> = {
    'monthly-bill': 'Fixed monthly payment like utilities or subscriptions',
    'irregular-payments': 'Quarterly, semi-annual, or annual payments',
    'emergency-fund': 'Savings buffer for unexpected expenses',
    'seasonal-goal': 'Expenses concentrated in specific periods',
    'monthly-budget': 'Variable spending tracked by category',
    'envelope-budget': 'Category-based spending limits',
    'yearly-budget': 'Occasional expenses tracked annually',
  };
  return descriptions[templateId] || '';
}
