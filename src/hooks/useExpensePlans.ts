/**
 * Expense Plans React Query Hooks
 *
 * Custom hooks for fetching and mutating expense plan data.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  fetchExpensePlans,
  fetchActiveExpensePlans,
  fetchExpensePlanById,
  createExpensePlan,
  updateExpensePlan,
  deleteExpensePlan,
  fetchExpensePlanTransactions,
  contributeToExpensePlan,
  withdrawFromExpensePlan,
  adjustExpensePlanBalance,
  quickFundExpensePlan,
  fundExpensePlanToTarget,
  bulkFundExpensePlans,
  bulkQuickFundExpensePlans,
  linkTransactionToExpensePlan,
  unlinkTransactionFromExpensePlan,
  acceptAdjustment,
  dismissAdjustment,
  fetchMonthlyDepositSummary,
  fetchExpenseTimeline,
  fetchCoverageSummary,
} from '@/lib/api/expense-plans';
import {
  ExpensePlanStatus,
  CreateExpensePlanDto,
  UpdateExpensePlanDto,
  ContributeDto,
  WithdrawDto,
  AdjustBalanceDto,
  BulkFundDto,
  LinkTransactionDto,
} from '@/types/expense-plan-types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS (Read Operations)
// ═══════════════════════════════════════════════════════════════════════════

export function useExpensePlans(status?: ExpensePlanStatus | 'all') {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans', status],
    queryFn: () =>
      fetchExpensePlans(session!.user!.accessToken as string, status),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useActiveExpensePlans() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans', 'active'],
    queryFn: () =>
      fetchActiveExpensePlans(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 60 * 1000,
  });
}

export function useExpensePlan(id: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plan', id],
    queryFn: () =>
      fetchExpensePlanById(session!.user!.accessToken as string, id),
    enabled: !!session && !!id,
    staleTime: 60 * 1000,
  });
}

export function useExpensePlanTransactions(planId: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plan-transactions', planId],
    queryFn: () =>
      fetchExpensePlanTransactions(session!.user!.accessToken as string, planId),
    enabled: !!session && !!planId,
    staleTime: 30 * 1000, // 30 seconds - transactions change frequently
  });
}

export function useMonthlyDepositSummary() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans-summary'],
    queryFn: () =>
      fetchMonthlyDepositSummary(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExpenseTimeline(months: number = 12) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-timeline', months],
    queryFn: () =>
      fetchExpenseTimeline(session!.user!.accessToken as string, months),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCoverageSummary() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans-coverage'],
    queryFn: () =>
      fetchCoverageSummary(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateExpensePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpensePlanDto) =>
      createExpensePlan(session!.user!.accessToken as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Expense plan created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create expense plan');
    },
  });
}

export function useUpdateExpensePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateExpensePlanDto }) =>
      updateExpensePlan(session!.user!.accessToken as string, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', id] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Expense plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update expense plan');
    },
  });
}

export function useDeleteExpensePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      deleteExpensePlan(session!.user!.accessToken as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Expense plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete expense plan');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useContributeToExpensePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: ContributeDto }) =>
      contributeToExpensePlan(session!.user!.accessToken as string, planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Contribution added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add contribution');
    },
  });
}

export function useWithdrawFromExpensePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: WithdrawDto }) =>
      withdrawFromExpensePlan(session!.user!.accessToken as string, planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Withdrawal completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw');
    },
  });
}

export function useAdjustExpensePlanBalance() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: AdjustBalanceDto }) =>
      adjustExpensePlanBalance(session!.user!.accessToken as string, planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Balance adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust balance');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNDING MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useQuickFundExpensePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) =>
      quickFundExpensePlan(session!.user!.accessToken as string, planId),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Quick fund completed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to quick fund');
    },
  });
}

export function useFundExpensePlanToTarget() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) =>
      fundExpensePlanToTarget(session!.user!.accessToken as string, planId),
    onSuccess: (result, planId) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      if (result) {
        toast.success('Funded to target successfully');
      } else {
        toast.success('Plan is already fully funded');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fund to target');
    },
  });
}

export function useBulkFundExpensePlans() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkFundDto) =>
      bulkFundExpensePlans(session!.user!.accessToken as string, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      const successCount = result.successful.length;
      const failedCount = result.failed.length;
      if (failedCount === 0) {
        toast.success(`Successfully funded ${successCount} plans`);
      } else {
        toast.success(
          `Funded ${successCount} plans, ${failedCount} failed`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bulk fund');
    },
  });
}

export function useBulkQuickFundExpensePlans() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      bulkQuickFundExpensePlans(session!.user!.accessToken as string),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      const successCount = result.successful.length;
      const skippedCount = result.skipped.length;
      const failedCount = result.failed.length;
      toast.success(
        `Funded ${successCount} plans, ${skippedCount} skipped (fully funded), ${failedCount} failed`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bulk quick fund');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION LINKING HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useLinkTransaction() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planTransactionId,
      data,
    }: {
      planTransactionId: number;
      data: LinkTransactionDto;
    }) =>
      linkTransactionToExpensePlan(
        session!.user!.accessToken as string,
        planTransactionId,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions'] });
      toast.success('Transaction linked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link transaction');
    },
  });
}

export function useUnlinkTransaction() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planTransactionId: number) =>
      unlinkTransactionFromExpensePlan(
        session!.user!.accessToken as string,
        planTransactionId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions'] });
      toast.success('Transaction unlinked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink transaction');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ADJUSTMENT MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useAcceptAdjustment() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, customAmount }: { planId: number; customAmount?: number }) =>
      acceptAdjustment(session!.user!.accessToken as string, planId, customAmount),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Expense plan adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept adjustment');
    },
  });
}

export function useDismissAdjustment() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) =>
      dismissAdjustment(session!.user!.accessToken as string, planId),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      toast.success('Adjustment dismissed for 30 days');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to dismiss adjustment');
    },
  });
}
