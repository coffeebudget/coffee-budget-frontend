import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  fetchBankAccounts as apiFetchBankAccounts,
  fetchBankAccount as apiFetchBankAccount,
  createBankAccount as apiCreateBankAccount,
  updateBankAccount as apiUpdateBankAccount,
  deleteBankAccount as apiDeleteBankAccount
} from '@/utils/api-client';

export interface BankAccount {
  id: number;
  name: string;
  balance: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountInput {
  name: string;
  balance: number;
}

export function useBankAccounts() {
  const { data: session } = useSession();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiFetchBankAccounts();
      setBankAccounts(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching bank accounts');
      console.error('Error fetching bank accounts:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankAccount = async (id: number) => {
    if (!session) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await apiFetchBankAccount(id);
    } catch (err: any) {
      setError(err.message || `An error occurred while fetching bank account #${id}`);
      console.error(`Error fetching bank account #${id}:`, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createBankAccount = async (accountData: BankAccountInput) => {
    if (!session) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newAccount = await apiCreateBankAccount(accountData);
      
      // Update local state with the new account
      setBankAccounts(prevAccounts => [...prevAccounts, newAccount]);
      
      toast.success('Bank account created successfully');
      return newAccount;
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating bank account');
      console.error('Error creating bank account:', err);
      toast.error(err.message || 'Failed to create bank account');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBankAccount = async (id: number, accountData: Partial<BankAccountInput>) => {
    if (!session) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedAccount = await apiUpdateBankAccount(id, accountData);
      
      // Update local state with the updated account
      setBankAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === id ? { ...account, ...updatedAccount } : account
        )
      );
      
      toast.success('Bank account updated successfully');
      return updatedAccount;
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating bank account');
      console.error('Error updating bank account:', err);
      toast.error(err.message || 'Failed to update bank account');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBankAccount = async (id: number) => {
    if (!session) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await apiDeleteBankAccount(id);
      
      // Update local state by removing the deleted account
      setBankAccounts(prevAccounts => 
        prevAccounts.filter(account => account.id !== id)
      );
      
      toast.success('Bank account deleted successfully');
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting bank account');
      console.error('Error deleting bank account:', err);
      toast.error(err.message || 'Failed to delete bank account');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bankAccounts,
    isLoading,
    error,
    fetchBankAccounts,
    fetchBankAccount,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount
  };
} 