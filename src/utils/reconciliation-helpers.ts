/**
 * Reconciliation Helper Functions
 * Utilities for payment activity reconciliation confidence scoring and matching
 */

import type { PaymentActivity, ReconciliationStatus } from '@/types/payment-types';

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate reconciliation confidence score between payment activity and transaction
 * Score is 0-100 based on multiple factors:
 * - Amount similarity (40%)
 * - Date proximity (30%)
 * - Description similarity (30%)
 */
export function calculateReconciliationConfidence(
  paymentActivity: PaymentActivity,
  transaction: {
    amount: number;
    date: string;
    description: string;
  }
): number {
  const amountScore = calculateAmountSimilarity(
    paymentActivity.amount,
    transaction.amount
  );

  const dateScore = calculateDateProximity(
    paymentActivity.executionDate,
    transaction.date
  );

  const descriptionScore = calculateDescriptionSimilarity(
    paymentActivity.description || '',
    transaction.description
  );

  // Weighted average
  const totalScore = amountScore * 0.4 + dateScore * 0.3 + descriptionScore * 0.3;

  return Math.round(totalScore);
}

/**
 * Calculate amount similarity score (0-100)
 * Exact match = 100, close match = proportional, far off = 0
 */
function calculateAmountSimilarity(amount1: number, amount2: number): number {
  const diff = Math.abs(amount1 - amount2);
  const avg = (Math.abs(amount1) + Math.abs(amount2)) / 2;

  if (diff === 0) return 100;
  if (avg === 0) return 0;

  // Allow 5% tolerance for 100% score
  const tolerance = avg * 0.05;
  if (diff <= tolerance) return 100;

  // Gradual decrease: 90% at 10% difference, 50% at 50% difference
  const percentDiff = (diff / avg) * 100;
  const score = Math.max(0, 100 - percentDiff * 2);

  return score;
}

/**
 * Calculate date proximity score (0-100)
 * Same day = 100, decreases with days apart
 */
function calculateDateProximity(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 100;
  if (diffDays === 1) return 90;
  if (diffDays === 2) return 80;
  if (diffDays <= 5) return 60;
  if (diffDays <= 7) return 40;
  if (diffDays <= 14) return 20;

  return 0;
}

/**
 * Calculate description similarity using Levenshtein distance (0-100)
 */
function calculateDescriptionSimilarity(desc1: string, desc2: string): number {
  const s1 = desc1.toLowerCase().trim();
  const s2 = desc2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  // Check if one contains the other (common for payment descriptions)
  if (s1.includes(s2) || s2.includes(s1)) {
    const containRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    return Math.min(100, Math.round(containRatio * 120)); // Boost slightly
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  if (maxLength === 0) return 100;

  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.max(0, Math.round(similarity));
}

/**
 * Levenshtein distance algorithm
 * Measures the minimum number of single-character edits required to change one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// MATCH FILTERING & RANKING
// ============================================================================

/**
 * Filter and rank transaction matches for a payment activity
 */
export function rankTransactionMatches(
  paymentActivity: PaymentActivity,
  transactions: any[]
): Array<{ transaction: any; confidence: number; reasons: string[] }> {
  const matches = transactions.map((transaction) => {
    const confidence = calculateReconciliationConfidence(paymentActivity, transaction);
    const reasons = getMatchReasons(paymentActivity, transaction, confidence);

    return {
      transaction,
      confidence,
      reasons,
    };
  });

  // Filter out very low confidence matches (< 20%)
  const filteredMatches = matches.filter((match) => match.confidence >= 20);

  // Sort by confidence (highest first)
  filteredMatches.sort((a, b) => b.confidence - a.confidence);

  return filteredMatches;
}

/**
 * Get human-readable reasons for a match
 */
function getMatchReasons(
  paymentActivity: PaymentActivity,
  transaction: any,
  confidence: number
): string[] {
  const reasons: string[] = [];

  // Amount match
  const amountDiff = Math.abs(paymentActivity.amount - transaction.amount);
  if (amountDiff === 0) {
    reasons.push('Exact amount match');
  } else if (amountDiff < paymentActivity.amount * 0.05) {
    reasons.push('Very close amount match');
  } else if (amountDiff < paymentActivity.amount * 0.15) {
    reasons.push('Close amount match');
  }

  // Date proximity
  const date1 = new Date(paymentActivity.executionDate);
  const date2 = new Date(transaction.date);
  const diffDays = Math.floor(
    Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    reasons.push('Same day transaction');
  } else if (diffDays === 1) {
    reasons.push('Next day transaction');
  } else if (diffDays <= 3) {
    reasons.push(`${diffDays} days apart`);
  }

  // Description similarity
  const desc1 = (paymentActivity.description || '').toLowerCase();
  const desc2 = transaction.description.toLowerCase();

  if (desc1 && desc2 && desc1 === desc2) {
    reasons.push('Identical description');
  } else if (desc1 && desc2 && (desc1.includes(desc2) || desc2.includes(desc1))) {
    reasons.push('Similar description');
  }

  // Provider metadata (if available in rawData)
  const payerEmail = paymentActivity.rawData?.payerEmail;
  if (
    payerEmail &&
    transaction.metadata?.email === payerEmail
  ) {
    reasons.push('Email match');
  }

  // Confidence level
  if (confidence >= 90) {
    reasons.push('Very high confidence match');
  } else if (confidence >= 75) {
    reasons.push('High confidence match');
  } else if (confidence >= 50) {
    reasons.push('Medium confidence match');
  }

  return reasons;
}

// ============================================================================
// RECONCILIATION STATUS HELPERS
// ============================================================================

/**
 * Check if a payment activity needs reconciliation
 */
export function needsReconciliation(activity: PaymentActivity): boolean {
  return (
    activity.reconciliationStatus === 'pending' ||
    activity.reconciliationStatus === 'failed'
  );
}

/**
 * Check if a payment activity is reconciled
 */
export function isReconciled(activity: PaymentActivity): boolean {
  return (
    activity.reconciliationStatus === 'reconciled' &&
    activity.reconciledTransactionId != null
  );
}

/**
 * Get confidence level category
 */
export function getConfidenceLevel(
  confidence: number
): 'high' | 'medium' | 'low' {
  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
}

/**
 * Get recommended action based on confidence
 */
export function getRecommendedAction(confidence: number): string {
  if (confidence >= 90) {
    return 'Auto-reconcile recommended';
  } else if (confidence >= 75) {
    return 'Review and confirm';
  } else if (confidence >= 50) {
    return 'Manual verification needed';
  } else {
    return 'Search for alternative match';
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Filter payment activities by reconciliation status
 */
export function filterByStatus(
  activities: PaymentActivity[],
  status: ReconciliationStatus
): PaymentActivity[] {
  return activities.filter((activity) => activity.reconciliationStatus === status);
}

/**
 * Group payment activities by confidence level
 */
export function groupByConfidence(
  activities: Array<{ activity: PaymentActivity; confidence: number }>
): {
  high: PaymentActivity[];
  medium: PaymentActivity[];
  low: PaymentActivity[];
} {
  return {
    high: activities.filter((a) => a.confidence >= 80).map((a) => a.activity),
    medium: activities
      .filter((a) => a.confidence >= 60 && a.confidence < 80)
      .map((a) => a.activity),
    low: activities.filter((a) => a.confidence < 60).map((a) => a.activity),
  };
}

/**
 * Calculate reconciliation statistics
 */
export function calculateStats(activities: PaymentActivity[]): {
  total: number;
  pending: number;
  reconciled: number;
  failed: number;
  manual: number;
  pendingPercentage: number;
  reconciledPercentage: number;
  failedPercentage: number;
} {
  const total = activities.length;
  const pending = filterByStatus(activities, 'pending').length;
  const reconciled = filterByStatus(activities, 'reconciled').length;
  const failed = filterByStatus(activities, 'failed').length;
  const manual = filterByStatus(activities, 'manual').length;

  return {
    total,
    pending,
    reconciled,
    failed,
    manual,
    pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
    reconciledPercentage: total > 0 ? Math.round((reconciled / total) * 100) : 0,
    failedPercentage: total > 0 ? Math.round((failed / total) * 100) : 0,
  };
}
