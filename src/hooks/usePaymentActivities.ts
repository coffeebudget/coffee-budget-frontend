/**
 * usePaymentActivities Hook
 * Custom hook for managing payment activities and reconciliation
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import type {
  PaymentActivity,
  PaymentActivityFilters,
  ReconciliationStats,
  ImportPaymentActivitiesDto,
  ImportResult,
} from '@/types/payment-types';
import {
  fetchPaymentActivities as apiFetchPaymentActivities,
  fetchPendingPaymentActivities as apiFetchPendingPaymentActivities,
  fetchReconciliationStats as apiFetchReconciliationStats,
  importPaymentActivities as apiImportPaymentActivities,
  importAllPayPalActivities as apiImportAllPayPalActivities,
} from '@/utils/payment-api-client';

export function usePaymentActivities() {
  const { data: session } = useSession();
  const [paymentActivities, setPaymentActivities] = useState<PaymentActivity[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch payment activities for a payment account
   */
  const fetchPaymentActivities = async (
    paymentAccountId: number,
    filters?: PaymentActivityFilters
  ) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetchPaymentActivities(paymentAccountId, filters);
      setPaymentActivities(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error fetching payment activities';
      setError(errorMessage);
      console.error('Error fetching payment activities:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch pending payment activities
   */
  const fetchPendingActivities = async (paymentAccountId: number) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetchPendingPaymentActivities(paymentAccountId);
      setPaymentActivities(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error fetching pending activities';
      setError(errorMessage);
      console.error('Error fetching pending activities:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch reconciliation statistics
   */
  const fetchReconciliationStats = async (paymentAccountId: number) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetchReconciliationStats(paymentAccountId);
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error fetching stats';
      setError(errorMessage);
      console.error('Error fetching reconciliation stats:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Import payment activities
   */
  const importActivities = async (importData: ImportPaymentActivitiesDto) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result: ImportResult = await apiImportPaymentActivities(importData);

      toast.success(
        `Successfully imported ${result.imported} activities${
          result.skipped > 0 ? `, skipped ${result.skipped}` : ''
        }`
      );

      // Refresh activities after import
      if (result.imported > 0) {
        await fetchPaymentActivities(importData.paymentAccountId);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error importing activities';
      setError(errorMessage);
      console.error('Error importing activities:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Import all PayPal activities (migration utility)
   */
  const importAllPayPal = async () => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result: ImportResult = await apiImportAllPayPalActivities();

      toast.success(
        `PayPal migration complete: ${result.imported} activities imported`
      );

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error importing PayPal activities';
      setError(errorMessage);
      console.error('Error importing PayPal activities:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    paymentActivities,
    stats,
    isLoading,
    error,
    fetchPaymentActivities,
    fetchPendingActivities,
    fetchReconciliationStats,
    importActivities,
    importAllPayPal,
  };
}
