/**
 * Transaction Link Suggestions React Query Hooks
 *
 * Custom hooks for fetching and mutating transaction link suggestions.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  fetchPendingSuggestions,
  fetchSuggestionCounts,
  approveSuggestion,
  rejectSuggestion,
  bulkApproveSuggestions,
  bulkRejectSuggestions,
} from '@/lib/api/transaction-link-suggestions';
import {
  ApproveLinkSuggestionDto,
  RejectLinkSuggestionDto,
} from '@/types/transaction-link-suggestion-types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS (Read Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all pending transaction link suggestions
 */
export function usePendingLinkSuggestions() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['transaction-link-suggestions', 'pending'],
    queryFn: () =>
      fetchPendingSuggestions(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch suggestion counts for badge display
 */
export function useLinkSuggestionCounts() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['transaction-link-suggestions', 'counts'],
    queryFn: () =>
      fetchSuggestionCounts(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Approve a single link suggestion
 */
export function useApproveLinkSuggestion() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: ApproveLinkSuggestionDto }) =>
      approveSuggestion(session!.user!.accessToken as string, id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-link-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['linked-plans-by-transactions'] });
      toast.success(`Transaction linked successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link transaction');
    },
  });
}

/**
 * Reject a single link suggestion
 */
export function useRejectLinkSuggestion() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: RejectLinkSuggestionDto }) =>
      rejectSuggestion(session!.user!.accessToken as string, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-link-suggestions'] });
      toast.success('Suggestion dismissed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to dismiss suggestion');
    },
  });
}

/**
 * Bulk approve multiple suggestions
 */
export function useBulkApproveLinkSuggestions() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) =>
      bulkApproveSuggestions(session!.user!.accessToken as string, ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-link-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plan-transactions'] });
      if (result.failedCount > 0) {
        toast.success(
          `${result.approvedCount} collegati, ${result.failedCount} falliti`
        );
      } else {
        toast.success(`${result.approvedCount} transazioni collegate`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Impossibile collegare le transazioni');
    },
  });
}

/**
 * Bulk reject multiple suggestions
 */
export function useBulkRejectLinkSuggestions() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, reason }: { ids: number[]; reason?: string }) =>
      bulkRejectSuggestions(session!.user!.accessToken as string, ids, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-link-suggestions'] });
      toast.success(`${result.rejectedCount} suggerimenti ignorati`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Impossibile ignorare i suggerimenti');
    },
  });
}
