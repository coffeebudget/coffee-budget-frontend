/**
 * Budget Allocation React Query Hooks
 *
 * Custom hooks for YNAB-style monthly budget allocation.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  fetchAllocationState,
  saveAllocations,
  fetchIncomeBreakdown,
  setIncomeOverride,
  autoAllocate,
} from '@/lib/api/budget-allocation';
import {
  AllocationState,
  SaveAllocationsRequest,
  SetIncomeOverrideRequest,
  getCurrentMonth,
} from '@/types/budget-allocation-types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS (Read Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get allocation state for a specific month
 * @param month - Month in YYYY-MM format (defaults to current month)
 */
export function useAllocationState(month?: string) {
  const { data: session } = useSession();
  const targetMonth = month || getCurrentMonth();

  return useQuery({
    queryKey: ['budget-allocation', targetMonth],
    queryFn: () =>
      fetchAllocationState(session!.user!.accessToken as string, targetMonth),
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds - allocations change frequently
  });
}

/**
 * Get income breakdown for a specific month
 * @param month - Month in YYYY-MM format (defaults to current month)
 */
export function useIncomeBreakdown(month?: string) {
  const { data: session } = useSession();
  const targetMonth = month || getCurrentMonth();

  return useQuery({
    queryKey: ['budget-allocation-income', targetMonth],
    queryFn: () =>
      fetchIncomeBreakdown(session!.user!.accessToken as string, targetMonth),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save allocations for a month
 */
export function useSaveAllocations() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, data }: { month: string; data: SaveAllocationsRequest }) =>
      saveAllocations(session!.user!.accessToken as string, month, data),
    onSuccess: (result, { month }) => {
      // Update the allocation state in cache
      queryClient.setQueryData(['budget-allocation', month], result.state);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success(`${result.plansUpdated} piani aggiornati`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nel salvataggio delle allocazioni');
    },
  });
}

/**
 * Set income override for a month
 */
export function useSetIncomeOverride() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ month, data }: { month: string; data: SetIncomeOverrideRequest }) =>
      setIncomeOverride(session!.user!.accessToken as string, month, data),
    onSuccess: (result, { month }) => {
      // Update the allocation state in cache
      queryClient.setQueryData(['budget-allocation', month], result);
      // Also update income breakdown
      queryClient.invalidateQueries({ queryKey: ['budget-allocation-income', month] });
      toast.success('Entrate aggiornate');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nell\'aggiornamento delle entrate');
    },
  });
}

/**
 * Auto-allocate to all plans using suggested amounts
 */
export function useAutoAllocate() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (month: string) =>
      autoAllocate(session!.user!.accessToken as string, month),
    onSuccess: (result, month) => {
      // Invalidate allocation state to refetch
      queryClient.invalidateQueries({ queryKey: ['budget-allocation', month] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      toast.success(
        `Allocati ${result.plansAllocated} piani per ${new Intl.NumberFormat('it-IT', {
          style: 'currency',
          currency: 'EUR',
        }).format(result.totalAllocated)}`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Errore nell\'allocazione automatica');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the "Da Assegnare" amount (unallocated income)
 * @param month - Month in YYYY-MM format (defaults to current month)
 */
export function useUnallocatedAmount(month?: string) {
  const { data: allocationState, isLoading, error } = useAllocationState(month);

  return {
    unallocated: allocationState?.unallocated ?? 0,
    effectiveIncome: allocationState?.income.effectiveIncome ?? 0,
    totalAllocated: allocationState?.totalAllocated ?? 0,
    isComplete: allocationState?.isComplete ?? false,
    statusColor: allocationState?.statusColor ?? 'yellow',
    isLoading,
    error,
  };
}
