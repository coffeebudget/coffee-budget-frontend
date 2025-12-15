/**
 * useReconciliation Hook
 * Custom hook for managing payment activity reconciliation
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import type {
  PaymentActivity,
  UpdateReconciliationDto,
} from '@/types/payment-types';
import {
  updatePaymentActivityReconciliation as apiUpdateReconciliation,
  bulkUpdateReconciliation as apiBulkUpdateReconciliation,
  searchTransactionsForReconciliation as apiSearchTransactions,
  getSuggestedMatches as apiGetSuggestedMatches,
} from '@/utils/payment-api-client';

export function useReconciliation() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update reconciliation for a single payment activity
   */
  const updateReconciliation = async (
    activityId: number,
    reconciliationData: UpdateReconciliationDto
  ) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const updated = await apiUpdateReconciliation(activityId, reconciliationData);

      if (reconciliationData.reconciliationStatus === 'reconciled') {
        toast.success('Activity successfully reconciled');
      } else if (reconciliationData.reconciliationStatus === 'failed') {
        toast.error('Reconciliation failed - marked for review');
      }

      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Error updating reconciliation';
      setError(errorMessage);
      console.error('Error updating reconciliation:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Link payment activity to transaction
   */
  const linkToTransaction = async (
    activityId: number,
    transactionId: number,
    confidence?: number
  ) => {
    return updateReconciliation(activityId, {
      reconciliationStatus: 'reconciled',
      reconciledTransactionId: transactionId,
      reconciliationConfidence: confidence,
    });
  };

  /**
   * Mark activity as failed reconciliation
   */
  const markAsFailed = async (activityId: number, reason: string) => {
    return updateReconciliation(activityId, {
      reconciliationStatus: 'failed',
      reconciliationFailureReason: reason,
    });
  };

  /**
   * Mark activity as reviewed (no match found)
   */
  const markAsReviewed = async (activityId: number) => {
    return updateReconciliation(activityId, {
      reconciliationStatus: 'reviewed',
    });
  };

  /**
   * Bulk update reconciliation for multiple activities
   */
  const bulkUpdateReconciliation = async (
    updates: Array<{ id: number; data: UpdateReconciliationDto }>
  ) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const updated = await apiBulkUpdateReconciliation(updates);

      toast.success(`Successfully updated ${updated.length} activities`);
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Error bulk updating reconciliation';
      setError(errorMessage);
      console.error('Error bulk updating:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search for matching transactions
   */
  const searchTransactions = async (
    activityId: number,
    searchTerm?: string
  ) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const transactions = await apiSearchTransactions(activityId, searchTerm);
      return transactions;
    } catch (err: any) {
      const errorMessage = err.message || 'Error searching transactions';
      setError(errorMessage);
      console.error('Error searching transactions:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get suggested transaction matches
   */
  const getSuggestedMatches = async (activityId: number) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const matches = await apiGetSuggestedMatches(activityId);
      return matches;
    } catch (err: any) {
      const errorMessage = err.message || 'Error getting suggested matches';
      setError(errorMessage);
      console.error('Error getting suggestions:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    updateReconciliation,
    linkToTransaction,
    markAsFailed,
    markAsReviewed,
    bulkUpdateReconciliation,
    searchTransactions,
    getSuggestedMatches,
  };
}
