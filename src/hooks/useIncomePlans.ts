/**
 * Income Plans React Query Hooks
 *
 * Custom hooks for fetching and mutating income plan data.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  fetchIncomePlans,
  fetchActiveIncomePlans,
  fetchIncomePlanById,
  createIncomePlan,
  updateIncomePlan,
  deleteIncomePlan,
  fetchMonthlySummary,
  fetchAnnualSummary,
  createOrUpdateEntry,
  fetchEntries,
  fetchEntryForMonth,
  updateEntry,
  deleteEntry,
  linkTransaction,
  unlinkTransaction,
  fetchTrackingSummaryForPlan,
  fetchMonthlyTrackingSummary,
  fetchAnnualTrackingSummary,
  fetchCurrentMonthStatus,
  fetchTransactionSuggestions,
  fetchTransferSuggestions,
} from '@/lib/api/income-plans';
import {
  IncomePlanStatus,
  CreateIncomePlanDto,
  UpdateIncomePlanDto,
  CreateIncomePlanEntryDto,
  UpdateIncomePlanEntryDto,
  LinkTransactionDto,
} from '@/types/income-plan-types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS (Read Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all income plans with optional status filter.
 */
export function useIncomePlans(status?: IncomePlanStatus | 'all') {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plans', status],
    queryFn: () =>
      fetchIncomePlans(session!.user!.accessToken as string, status),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch only active income plans.
 */
export function useActiveIncomePlans() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plans', 'active'],
    queryFn: () =>
      fetchActiveIncomePlans(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch a single income plan by ID.
 */
export function useIncomePlan(id: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plan', id],
    queryFn: () =>
      fetchIncomePlanById(session!.user!.accessToken as string, id),
    enabled: !!session && !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch monthly income summary with reliability breakdowns.
 * Defaults to current month if no params provided.
 */
export function useMonthlySummary(year?: number, month?: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plans-monthly-summary', year, month],
    queryFn: () =>
      fetchMonthlySummary(session!.user!.accessToken as string, year, month),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch annual income summary with monthly breakdown.
 * Defaults to current year if no param provided.
 */
export function useAnnualSummary(year?: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plans-annual-summary', year],
    queryFn: () =>
      fetchAnnualSummary(session!.user!.accessToken as string, year),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new income plan.
 */
export function useCreateIncomePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncomePlanDto) =>
      createIncomePlan(session!.user!.accessToken as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-plans'] });
      queryClient.invalidateQueries({ queryKey: ['income-plans-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['income-plans-annual-summary'] });
      toast.success('Income plan created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create income plan');
    },
  });
}

/**
 * Update an existing income plan.
 */
export function useUpdateIncomePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIncomePlanDto }) =>
      updateIncomePlan(session!.user!.accessToken as string, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['income-plans'] });
      queryClient.invalidateQueries({ queryKey: ['income-plan', id] });
      queryClient.invalidateQueries({ queryKey: ['income-plans-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['income-plans-annual-summary'] });
      toast.success('Income plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update income plan');
    },
  });
}

/**
 * Delete an income plan.
 */
export function useDeleteIncomePlan() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      deleteIncomePlan(session!.user!.accessToken as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-plans'] });
      queryClient.invalidateQueries({ queryKey: ['income-plans-monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['income-plans-annual-summary'] });
      toast.success('Income plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete income plan');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch tracking entries for an income plan.
 */
export function useIncomePlanEntries(incomePlanId: number, year?: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plan-entries', incomePlanId, year],
    queryFn: () =>
      fetchEntries(session!.user!.accessToken as string, incomePlanId, year),
    enabled: !!session && !!incomePlanId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch tracking entry for a specific month.
 */
export function useIncomePlanEntryForMonth(
  incomePlanId: number,
  year: number,
  month: number
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plan-entry', incomePlanId, year, month],
    queryFn: () =>
      fetchEntryForMonth(
        session!.user!.accessToken as string,
        incomePlanId,
        year,
        month
      ),
    enabled: !!session && !!incomePlanId && !!year && !!month,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch tracking summary for a single plan.
 */
export function useIncomePlanTrackingSummary(
  incomePlanId: number,
  year: number,
  month: number
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plan-tracking', incomePlanId, year, month],
    queryFn: () =>
      fetchTrackingSummaryForPlan(
        session!.user!.accessToken as string,
        incomePlanId,
        year,
        month
      ),
    enabled: !!session && !!incomePlanId && !!year && !!month,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch monthly tracking summary for all plans.
 */
export function useMonthlyTrackingSummary(year: number, month: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plans-monthly-tracking', year, month],
    queryFn: () =>
      fetchMonthlyTrackingSummary(
        session!.user!.accessToken as string,
        year,
        month
      ),
    enabled: !!session && !!year && !!month,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch annual tracking summary.
 */
export function useAnnualTrackingSummary(year: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plans-annual-tracking', year],
    queryFn: () =>
      fetchAnnualTrackingSummary(session!.user!.accessToken as string, year),
    enabled: !!session && !!year,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch current month status for an income plan.
 */
export function useIncomePlanCurrentStatus(incomePlanId: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plan-status', incomePlanId],
    queryFn: () =>
      fetchCurrentMonthStatus(session!.user!.accessToken as string, incomePlanId),
    enabled: !!session && !!incomePlanId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch transaction suggestions for linking to an income plan.
 */
export function useTransactionSuggestions(
  incomePlanId: number,
  year: number,
  month: number
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-plan-suggestions', incomePlanId, year, month],
    queryFn: () =>
      fetchTransactionSuggestions(
        session!.user!.accessToken as string,
        incomePlanId,
        year,
        month
      ),
    enabled: !!session && !!incomePlanId && !!year && !!month,
    staleTime: 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create or update an income plan entry.
 */
export function useCreateOrUpdateEntry() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomePlanId,
      data,
    }: {
      incomePlanId: number;
      data: CreateIncomePlanEntryDto;
    }) =>
      createOrUpdateEntry(
        session!.user!.accessToken as string,
        incomePlanId,
        data
      ),
    onSuccess: (_, { incomePlanId }) => {
      queryClient.invalidateQueries({
        queryKey: ['income-plan-entries', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-tracking', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-status', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plans-monthly-tracking'],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plans-annual-tracking'],
      });
      toast.success('Income recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record income');
    },
  });
}

/**
 * Update an income plan entry.
 */
export function useUpdateEntry() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomePlanId,
      entryId,
      data,
    }: {
      incomePlanId: number;
      entryId: number;
      data: UpdateIncomePlanEntryDto;
    }) =>
      updateEntry(
        session!.user!.accessToken as string,
        incomePlanId,
        entryId,
        data
      ),
    onSuccess: (_, { incomePlanId }) => {
      queryClient.invalidateQueries({
        queryKey: ['income-plan-entries', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-tracking', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-status', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plans-monthly-tracking'],
      });
      toast.success('Entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update entry');
    },
  });
}

/**
 * Delete an income plan entry.
 */
export function useDeleteEntry() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomePlanId,
      entryId,
    }: {
      incomePlanId: number;
      entryId: number;
    }) =>
      deleteEntry(session!.user!.accessToken as string, incomePlanId, entryId),
    onSuccess: (_, { incomePlanId }) => {
      queryClient.invalidateQueries({
        queryKey: ['income-plan-entries', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-tracking', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-status', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plans-monthly-tracking'],
      });
      toast.success('Entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete entry');
    },
  });
}

/**
 * Link a transaction to an income plan.
 */
export function useLinkTransaction() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomePlanId,
      data,
    }: {
      incomePlanId: number;
      data: LinkTransactionDto;
    }) =>
      linkTransaction(session!.user!.accessToken as string, incomePlanId, data),
    onSuccess: (_, { incomePlanId }) => {
      queryClient.invalidateQueries({
        queryKey: ['income-plan-entries', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-tracking', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-status', incomePlanId],
      });
      toast.success('Transaction linked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link transaction');
    },
  });
}

/**
 * Unlink a transaction from an income plan.
 */
export function useUnlinkTransaction() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomePlanId,
      year,
      month,
    }: {
      incomePlanId: number;
      year: number;
      month: number;
    }) =>
      unlinkTransaction(
        session!.user!.accessToken as string,
        incomePlanId,
        year,
        month
      ),
    onSuccess: (_, { incomePlanId }) => {
      queryClient.invalidateQueries({
        queryKey: ['income-plan-entries', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-tracking', incomePlanId],
      });
      queryClient.invalidateQueries({
        queryKey: ['income-plan-status', incomePlanId],
      });
      toast.success('Transaction unlinked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink transaction');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFER SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch transfer suggestions for income accounts.
 * Advisory-only: calculates how much to transfer based on obligations.
 */
export function useTransferSuggestions(year?: number, month?: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['transfer-suggestions', year, month],
    queryFn: () =>
      fetchTransferSuggestions(session!.user!.accessToken as string, year, month),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
