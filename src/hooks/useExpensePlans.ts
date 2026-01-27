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
  acceptAdjustment,
  dismissAdjustment,
  fetchMonthlyDepositSummary,
  fetchExpenseTimeline,
  fetchCoverageSummary,
  fetchLongTermStatus,
  fetchExpensePlansWithStatus,
  fetchAccountAllocationSummary,
} from '@/lib/api/expense-plans';
import {
  ExpensePlanStatus,
  CreateExpensePlanDto,
  UpdateExpensePlanDto,
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

/**
 * Fetch long-term sinking fund status summary.
 * Used by CoverageSection to show sinking fund health.
 */
export function useLongTermStatus() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans-long-term-status'],
    queryFn: () =>
      fetchLongTermStatus(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch expense plans with calculated funding status fields.
 * Used for UI display where progress indicators are needed.
 */
export function useExpensePlansWithStatus() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans-with-status'],
    queryFn: () =>
      fetchExpensePlansWithStatus(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch account allocation summary showing what each account should hold TODAY.
 * Answers the question: "How much should my account have right now?"
 * - For fixed_monthly: requiredToday = targetAmount (full payment ready)
 * - For sinking funds: requiredToday = expectedFundedByNow (savings progress)
 */
export function useAccountAllocationSummary() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plans-account-allocation'],
    queryFn: () =>
      fetchAccountAllocationSummary(session!.user!.accessToken as string),
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
      queryClient.invalidateQueries({ queryKey: ['expense-plans-with-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['expense-plans-with-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['expense-plans-with-status'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success('Expense plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete expense plan');
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
      queryClient.invalidateQueries({ queryKey: ['expense-plans-with-status'] });
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
      queryClient.invalidateQueries({ queryKey: ['expense-plans-with-status'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan', planId] });
      toast.success('Adjustment dismissed for 30 days');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to dismiss adjustment');
    },
  });
}
