// src/types.ts
export type Category = {
    id: number; // Ensure this is defined as required
    name: string;
    keywords: string[];
    excludeFromExpenseAnalytics?: boolean; // Add this field to exclude categories from expense analytics
    analyticsExclusionReason?: string; // Add reason for exclusion
};

export type BankAccount = {
  id?: number; // Make id optional
  name: string;
  balance: number;
};

export type Transaction = {
  id?: number;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: number | null;
  bankAccountId?: number | null;
  creditCardId?: number | null;
  tagIds?: number[];
  isRecurring?: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextOccurrence?: string;
  executionDate: string;
  source?: string;
    // These are for display purposes only  
  category?: Category;
  tags?: Tag[];
  bankAccount?: BankAccount;
  creditCard?: CreditCard;
  status?: 'pending' | 'executed';
  // For smart categorization
  suggestedCategory?: number;
  suggestedCategoryName?: string;
  suggestedKeywords?: string[];
};

export type CreditCard = {
  id: number;
  name: string;
  billingDay: number;
  creditLimit: number;
  availableCredit: number;
  bankAccountId?: number; // Optional field for bank account
};

export type Tag = {
  id: number;
  name: string;
};

export type RecurringTransaction = {
  id?: number;
  name: string;
  description?: string;
  amount: number;
  status: 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  type: 'expense' | 'income' | 'credit';
  frequencyEveryN: number;
  frequencyType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  occurrences?: number;
  startDate: string;
  endDate?: string | null;
  categoryId?: number | null;
  tagIds?: number[];
  bankAccountId?: number;
  creditCardId?: number;
  applyToPast?: boolean;
  userConfirmed?: boolean;
  source?: string;
  // These are for display purposes only
  category?: Category;
  tags?: Tag[];
  bankAccount?: BankAccount;
  creditCard?: CreditCard;
};

export type PendingDuplicate = {
  id: number;
  existingTransaction: Transaction;  // The original transaction that was found
  newTransactionData: {             // The new transaction data that caused the duplicate
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId: number;
    bankAccountId?: number;
    creditCardId?: number;
    tagIds?: number[];
    executionDate?: Date;
    status: 'pending' | 'executed';
    source: string;
    recurringTransactionId?: number;
  };
  source: 'recurring' | 'csv_import' | 'api';
  sourceReference?: string;         // Additional reference info (e.g., "recurring_id:123")
  resolved: boolean;
  createdAt: Date;
  user: { id: number };            // The user who owns this pending duplicate
};

// Define the enum for duplicate transaction choices
export enum DuplicateTransactionChoice {
  MERGE = 'merge',
  IGNORE = 'ignore',
  REPLACE = 'replace',
  MAINTAIN_BOTH = 'maintain both'
}

export type UnconfirmedPattern = {
  id: number;
  name: string;
  amount: number;
  frequencyType: string;
  frequencyEveryN: number;
  startDate: string;
};

