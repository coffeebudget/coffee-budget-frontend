/**
 * usePaymentAccounts Hook
 * Custom hook for managing payment accounts
 * Mirrors useBankAccounts pattern
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import type {
  PaymentAccount,
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
} from '@/types/payment-types';
import {
  fetchPaymentAccounts as apiFetchPaymentAccounts,
  fetchPaymentAccount as apiFetchPaymentAccount,
  createPaymentAccount as apiCreatePaymentAccount,
  updatePaymentAccount as apiUpdatePaymentAccount,
  deletePaymentAccount as apiDeletePaymentAccount,
} from '@/utils/payment-api-client';

export function usePaymentAccounts() {
  const { data: session } = useSession();
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all payment accounts
   */
  const fetchPaymentAccounts = async () => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetchPaymentAccounts();
      setPaymentAccounts(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while fetching payment accounts';
      setError(errorMessage);
      console.error('Error fetching payment accounts:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch a specific payment account by ID
   */
  const fetchPaymentAccount = async (id: number) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const account = await apiFetchPaymentAccount(id);
      return account;
    } catch (err: any) {
      const errorMessage =
        err.message || `An error occurred while fetching payment account #${id}`;
      setError(errorMessage);
      console.error(`Error fetching payment account #${id}:`, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new payment account
   */
  const createPaymentAccount = async (accountData: CreatePaymentAccountDto) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const newAccount = await apiCreatePaymentAccount(accountData);

      // Update local state with the new account
      setPaymentAccounts((prevAccounts) => [...prevAccounts, newAccount]);

      toast.success('Payment account created successfully');
      return newAccount;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while creating payment account';
      setError(errorMessage);
      console.error('Error creating payment account:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing payment account
   */
  const updatePaymentAccount = async (id: number, accountData: UpdatePaymentAccountDto) => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);

    try {
      const updatedAccount = await apiUpdatePaymentAccount(id, accountData);

      // Update local state with the updated account
      setPaymentAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account.id === id ? { ...account, ...updatedAccount } : account
        )
      );

      toast.success('Payment account updated successfully');
      return updatedAccount;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while updating payment account';
      setError(errorMessage);
      console.error('Error updating payment account:', err);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a payment account
   */
  const deletePaymentAccount = async (id: number) => {
    if (!session) return false;

    setIsLoading(true);
    setError(null);

    try {
      await apiDeletePaymentAccount(id);

      // Update local state by removing the deleted account
      setPaymentAccounts((prevAccounts) => prevAccounts.filter((account) => account.id !== id));

      toast.success('Payment account deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while deleting payment account';
      setError(errorMessage);
      console.error('Error deleting payment account:', err);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    paymentAccounts,
    isLoading,
    error,
    fetchPaymentAccounts,
    fetchPaymentAccount,
    createPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount,
  };
}
