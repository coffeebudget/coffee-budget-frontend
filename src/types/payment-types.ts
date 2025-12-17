/**
 * Payment Account & Activity Types for Coffee Budget Frontend
 * Mirrors backend PaymentAccount and PaymentActivity entities
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const PAYMENT_PROVIDERS = {
  PAYPAL: 'paypal',
  KLARNA: 'klarna',
  STRIPE: 'stripe',
  SQUARE: 'square',
  REVOLUT: 'revolut',
  WISE: 'wise',
  OTHER: 'other',
} as const;

export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];

export const RECONCILIATION_STATUSES = {
  PENDING: 'pending',
  RECONCILED: 'reconciled',
  FAILED: 'failed',
  MANUAL: 'manual',
} as const;

export type ReconciliationStatus = typeof RECONCILIATION_STATUSES[keyof typeof RECONCILIATION_STATUSES];

export const PAYMENT_ACTIVITY_TYPES = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  FEE: 'fee',
  TRANSFER: 'transfer',
  WITHDRAWAL: 'withdrawal',
  DEPOSIT: 'deposit',
  OTHER: 'other',
} as const;

export type PaymentActivityType = typeof PAYMENT_ACTIVITY_TYPES[keyof typeof PAYMENT_ACTIVITY_TYPES];

// ============================================================================
// PAYMENT ACCOUNT INTERFACES
// ============================================================================

export interface PaymentAccount {
  id: number;
  displayName: string;
  provider: PaymentProvider;
  providerConfig: Record<string, any>; // JSON field for provider-specific data
  linkedBankAccountId?: number;
  linkedBankAccount?: any; // BankAccount type
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentAccountDto {
  displayName: string;
  provider: PaymentProvider;
  providerConfig?: Record<string, any>;
  linkedBankAccountId?: number;
  isActive?: boolean;
}

export interface UpdatePaymentAccountDto {
  displayName?: string;
  provider?: PaymentProvider;
  providerConfig?: Record<string, any>;
  linkedBankAccountId?: number;
  isActive?: boolean;
}

// ============================================================================
// PAYMENT ACTIVITY INTERFACES
// ============================================================================

export interface PaymentActivity {
  id: number;
  paymentAccountId: number;
  paymentAccount?: PaymentAccount;
  externalId: string; // Unique ID from payment provider
  merchantName?: string; // Merchant name from payment provider
  merchantCategory?: string; // Merchant category
  merchantCategoryCode?: string; // ISO 18245 MCC code
  amount: number; // Transaction amount (negative for expenses)
  executionDate: string; // Date when payment was executed
  description?: string; // Original description from payment provider
  reconciledTransactionId?: number;
  reconciledTransaction?: any; // Transaction type
  reconciliationStatus: ReconciliationStatus;
  reconciliationConfidence?: number; // 0-100
  reconciledAt?: string; // Timestamp when reconciliation was completed
  rawData: Record<string, any>; // Provider-specific raw data
  createdAt: string;
  updatedAt: string;
}

export interface PaymentActivityFilters {
  paymentAccountId?: number;
  reconciliationStatus?: ReconciliationStatus;
  activityType?: PaymentActivityType;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// ============================================================================
// RECONCILIATION INTERFACES
// ============================================================================

export interface UpdateReconciliationDto {
  reconciliationStatus?: ReconciliationStatus;
  reconciledTransactionId?: number;
  reconciliationConfidence?: number;
  reconciliationFailureReason?: string;
}

export interface ReconciliationStats {
  total: number;
  pending: number;
  reconciled: number;
  failed: number;
  manual: number;
  reconciledPercentage: number;
  pendingPercentage: number;
  failedPercentage: number;
}

export interface ReconciliationMatch {
  activityId: number;
  activity: PaymentActivity;
  suggestedTransactionId?: number;
  suggestedTransaction?: any; // Transaction type
  confidence: number; // 0-100
  matchReasons: string[];
}

// ============================================================================
// IMPORT INTERFACES
// ============================================================================

export interface ImportPaymentActivitiesDto {
  paymentAccountId: number;
  startDate?: string;
  endDate?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// GOCARDLESS INTEGRATION INTERFACES
// ============================================================================

export interface GocardlessConnectionRequest {
  paymentAccountId: number;
  provider: PaymentProvider;
  redirectUrl: string;
}

export interface GocardlessConnectionResponse {
  authUrl: string;
  requisitionId: string;
}

export interface GocardlessCallbackParams {
  ref: string; // requisitionId
  error?: string;
  details?: string;
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export interface PaymentAccountCardProps {
  account: PaymentAccount;
  onEdit?: (account: PaymentAccount) => void;
  onDelete?: (id: number) => void;
  onImport?: (id: number) => void;
  onConnect?: (id: number) => void;
}

export interface PaymentActivityCardProps {
  activity: PaymentActivity;
  onReconcile?: (activity: PaymentActivity) => void;
  onViewDetails?: (activity: PaymentActivity) => void;
}

export interface ReconciliationComparisonProps {
  activity: PaymentActivity;
  suggestedTransaction?: any; // Transaction type
  confidence: number;
  onLink?: (activityId: number, transactionId: number) => void;
  onReject?: (activityId: number) => void;
  onSearch?: (activityId: number) => void;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface PaymentAccountFormData {
  displayName: string;
  provider: PaymentProvider;
  linkedBankAccountId?: number;
  isActive: boolean;
}

export interface PaymentAccountFormErrors {
  displayName?: string;
  provider?: string;
  linkedBankAccountId?: string;
}

export interface ReconciliationFormData {
  reconciliationStatus: ReconciliationStatus;
  reconciledTransactionId?: number;
  reconciliationFailureReason?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaymentAccountsResponse {
  data: PaymentAccount[];
  total: number;
}

export interface PaymentActivitiesResponse {
  data: PaymentActivity[];
  total: number;
  stats?: ReconciliationStats;
}

export interface SinglePaymentAccountResponse {
  data: PaymentAccount;
}

export interface SinglePaymentActivityResponse {
  data: PaymentActivity;
}

// ============================================================================
// HELPER FUNCTIONS & UTILITIES
// ============================================================================

/**
 * Get confidence badge color based on confidence score
 */
export function getConfidenceBadgeColor(confidence: number): 'green' | 'yellow' | 'red' {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'yellow';
  return 'red';
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: PaymentProvider): string {
  const providerNames: Record<PaymentProvider, string> = {
    [PAYMENT_PROVIDERS.PAYPAL]: 'PayPal',
    [PAYMENT_PROVIDERS.KLARNA]: 'Klarna',
    [PAYMENT_PROVIDERS.STRIPE]: 'Stripe',
    [PAYMENT_PROVIDERS.SQUARE]: 'Square',
    [PAYMENT_PROVIDERS.REVOLUT]: 'Revolut',
    [PAYMENT_PROVIDERS.WISE]: 'Wise',
    [PAYMENT_PROVIDERS.OTHER]: 'Other',
  };
  return providerNames[provider] || provider;
}

/**
 * Get status badge color based on reconciliation status
 */
export function getStatusBadgeColor(status: ReconciliationStatus): string {
  const statusColors: Record<ReconciliationStatus, string> = {
    [RECONCILIATION_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
    [RECONCILIATION_STATUSES.RECONCILED]: 'bg-green-100 text-green-800',
    [RECONCILIATION_STATUSES.FAILED]: 'bg-red-100 text-red-800',
    [RECONCILIATION_STATUSES.MANUAL]: 'bg-blue-100 text-blue-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Format activity type for display
 */
export function formatActivityType(type: PaymentActivityType): string {
  const typeLabels: Record<PaymentActivityType, string> = {
    [PAYMENT_ACTIVITY_TYPES.PAYMENT]: 'Payment',
    [PAYMENT_ACTIVITY_TYPES.REFUND]: 'Refund',
    [PAYMENT_ACTIVITY_TYPES.FEE]: 'Fee',
    [PAYMENT_ACTIVITY_TYPES.TRANSFER]: 'Transfer',
    [PAYMENT_ACTIVITY_TYPES.WITHDRAWAL]: 'Withdrawal',
    [PAYMENT_ACTIVITY_TYPES.DEPOSIT]: 'Deposit',
    [PAYMENT_ACTIVITY_TYPES.OTHER]: 'Other',
  };
  return typeLabels[type] || type;
}
