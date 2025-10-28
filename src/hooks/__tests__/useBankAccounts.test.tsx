import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useBankAccounts } from '../useBankAccounts';
import * as apiClient from '../../utils/api-client';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('react-hot-toast');
jest.mock('../../utils/api-client');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock API client functions
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useBankAccounts', () => {
  const mockSession = {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    },
    expires: '2024-12-31T23:59:59.999Z',
  };

  const mockBankAccount = {
    id: 1,
    name: 'Test Account',
    balance: 1000,
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    } as any);
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useBankAccounts());

      expect(result.current.bankAccounts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetchBankAccounts', () => {
    it('should fetch bank accounts successfully', async () => {
      const mockBankAccounts = [mockBankAccount];
      mockApiClient.fetchBankAccounts.mockResolvedValueOnce(mockBankAccounts);

      const { result } = renderHook(() => useBankAccounts());

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchBankAccounts();
      });

      expect(mockApiClient.fetchBankAccounts).toHaveBeenCalledTimes(1);
      expect(result.current.bankAccounts).toEqual(mockBankAccounts);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(fetchResult).toEqual(mockBankAccounts);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch bank accounts';
      mockApiClient.fetchBankAccounts.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useBankAccounts());

      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      expect(result.current.bankAccounts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should not fetch when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { result } = renderHook(() => useBankAccounts());

      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      expect(mockApiClient.fetchBankAccounts).not.toHaveBeenCalled();
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.fetchBankAccounts.mockReturnValueOnce(promise as any);

      const { result } = renderHook(() => useBankAccounts());

      act(() => {
        result.current.fetchBankAccounts();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!([mockBankAccount]);
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchBankAccount', () => {
    it('should fetch a specific bank account successfully', async () => {
      mockApiClient.fetchBankAccount.mockResolvedValueOnce(mockBankAccount);

      const { result } = renderHook(() => useBankAccounts());

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchBankAccount(1);
      });

      expect(mockApiClient.fetchBankAccount).toHaveBeenCalledWith(1);
      expect(fetchResult).toEqual(mockBankAccount);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors for specific account', async () => {
      const errorMessage = 'Failed to fetch bank account';
      mockApiClient.fetchBankAccount.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useBankAccounts());

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchBankAccount(1);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(fetchResult).toBeNull();
    });

    it('should not fetch when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { result } = renderHook(() => useBankAccounts());

      let fetchResult;
      await act(async () => {
        fetchResult = await result.current.fetchBankAccount(1);
      });

      expect(mockApiClient.fetchBankAccount).not.toHaveBeenCalled();
      expect(fetchResult).toBeNull();
    });
  });

  describe('createBankAccount', () => {
    const accountData = {
      name: 'New Account',
      balance: 2000,
    };

    it('should create bank account successfully', async () => {
      const newAccount = { ...mockBankAccount, ...accountData, id: 2 };
      mockApiClient.createBankAccount.mockResolvedValueOnce(newAccount);

      const { result } = renderHook(() => useBankAccounts());

      let createResult;
      await act(async () => {
        createResult = await result.current.createBankAccount(accountData);
      });

      expect(mockApiClient.createBankAccount).toHaveBeenCalledWith(accountData);
      expect(result.current.bankAccounts).toContain(newAccount);
      expect(mockToast.success).toHaveBeenCalledWith('Bank account created successfully');
      expect(createResult).toEqual(newAccount);
    });

    it('should handle creation errors', async () => {
      const errorMessage = 'Failed to create bank account';
      mockApiClient.createBankAccount.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useBankAccounts());

      let createResult;
      await act(async () => {
        createResult = await result.current.createBankAccount(accountData);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(createResult).toBeNull();
    });

    it('should not create when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { result } = renderHook(() => useBankAccounts());

      let createResult;
      await act(async () => {
        createResult = await result.current.createBankAccount(accountData);
      });

      expect(mockApiClient.createBankAccount).not.toHaveBeenCalled();
      expect(createResult).toBeNull();
    });
  });

  describe('updateBankAccount', () => {
    const updateData = {
      name: 'Updated Account',
      balance: 3000,
    };

    it('should update bank account successfully', async () => {
      const updatedAccount = { ...mockBankAccount, ...updateData };
      mockApiClient.updateBankAccount.mockResolvedValueOnce(updatedAccount);

      const { result } = renderHook(() => useBankAccounts());

      // Set initial state by calling fetchBankAccounts first
      mockApiClient.fetchBankAccounts.mockResolvedValueOnce([mockBankAccount]);
      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateBankAccount(1, updateData);
      });

      expect(mockApiClient.updateBankAccount).toHaveBeenCalledWith(1, updateData);
      expect(result.current.bankAccounts).toContainEqual(updatedAccount);
      expect(mockToast.success).toHaveBeenCalledWith('Bank account updated successfully');
      expect(updateResult).toEqual(updatedAccount);
    });

    it('should handle update errors', async () => {
      const errorMessage = 'Failed to update bank account';
      mockApiClient.updateBankAccount.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useBankAccounts());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateBankAccount(1, updateData);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(updateResult).toBeNull();
    });

    it('should not update when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { result } = renderHook(() => useBankAccounts());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateBankAccount(1, updateData);
      });

      expect(mockApiClient.updateBankAccount).not.toHaveBeenCalled();
      expect(updateResult).toBeNull();
    });
  });

  describe('deleteBankAccount', () => {
    it('should delete bank account successfully', async () => {
      mockApiClient.deleteBankAccount.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankAccounts());

      // Set initial state by calling fetchBankAccounts first
      mockApiClient.fetchBankAccounts.mockResolvedValueOnce([mockBankAccount]);
      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteBankAccount(1);
      });

      expect(mockApiClient.deleteBankAccount).toHaveBeenCalledWith(1);
      expect(result.current.bankAccounts).not.toContain(mockBankAccount);
      expect(mockToast.success).toHaveBeenCalledWith('Bank account deleted successfully');
      expect(deleteResult).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const errorMessage = 'Failed to delete bank account';
      mockApiClient.deleteBankAccount.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useBankAccounts());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteBankAccount(1);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      expect(deleteResult).toBe(false);
    });

    it('should not delete when no session', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      const { result } = renderHook(() => useBankAccounts());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteBankAccount(1);
      });

      expect(mockApiClient.deleteBankAccount).not.toHaveBeenCalled();
      expect(deleteResult).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle generic errors', async () => {
      mockApiClient.fetchBankAccounts.mockRejectedValueOnce(new Error('Generic error'));

      const { result } = renderHook(() => useBankAccounts());

      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      expect(result.current.error).toBe('Generic error');
    });

    it('should handle errors without message', async () => {
      mockApiClient.fetchBankAccounts.mockRejectedValueOnce({});

      const { result } = renderHook(() => useBankAccounts());

      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      expect(result.current.error).toBe('An error occurred while fetching bank accounts');
    });
  });

  describe('State Management', () => {
    it('should clear error when starting new operation', async () => {
      // First, set an error
      mockApiClient.fetchBankAccounts.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useBankAccounts());

      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      expect(result.current.error).toBe('First error');

      // Then, start a new operation
      mockApiClient.fetchBankAccounts.mockResolvedValueOnce([mockBankAccount]);

      await act(async () => {
        await result.current.fetchBankAccounts();
      });

      expect(result.current.error).toBeNull();
    });

    it('should maintain loading state correctly across operations', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;
      
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockApiClient.fetchBankAccounts
        .mockReturnValueOnce(firstPromise as any)
        .mockReturnValueOnce(secondPromise as any);

      const { result } = renderHook(() => useBankAccounts());

      // Start first operation
      act(() => {
        result.current.fetchBankAccounts();
      });
      expect(result.current.isLoading).toBe(true);

      // Complete first operation
      await act(async () => {
        resolveFirst!([mockBankAccount]);
        await firstPromise;
      });
      expect(result.current.isLoading).toBe(false);

      // Start second operation
      act(() => {
        result.current.fetchBankAccounts();
      });
      expect(result.current.isLoading).toBe(true);

      // Complete second operation
      await act(async () => {
        resolveSecond!([mockBankAccount]);
        await secondPromise;
      });
      expect(result.current.isLoading).toBe(false);
    });
  });
});
