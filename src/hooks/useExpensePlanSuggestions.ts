/**
 * Expense Plan Suggestions React Query Hooks
 *
 * Custom hooks for fetching and mutating expense plan suggestion data.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  fetchSuggestions,
  fetchPendingSuggestions,
  fetchSuggestionById,
  fetchApiUsageStats,
  generateSuggestions,
  approveSuggestion,
  rejectSuggestion,
  bulkApproveSuggestions,
  bulkRejectSuggestions,
  deleteSuggestion,
} from '@/lib/api/expense-plan-suggestions';
import {
  SuggestionStatus,
  GenerateSuggestionsDto,
  ApproveSuggestionDto,
  RejectSuggestionDto,
  BulkActionDto,
} from '@/types/expense-plan-suggestion-types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS (Read Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all suggestions with optional status filter
 */
export function useSuggestions(status?: SuggestionStatus) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plan-suggestions', status],
    queryFn: () =>
      fetchSuggestions(session!.user!.accessToken as string, status),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch only pending suggestions
 */
export function usePendingSuggestions() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plan-suggestions', 'pending'],
    queryFn: () => fetchPendingSuggestions(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch a single suggestion by ID
 */
export function useSuggestion(id: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plan-suggestion', id],
    queryFn: () =>
      fetchSuggestionById(session!.user!.accessToken as string, id),
    enabled: !!session && !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch API usage statistics
 */
export function useApiUsageStats() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['expense-plan-suggestions-api-usage'],
    queryFn: () => fetchApiUsageStats(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate new suggestions by analyzing transaction patterns
 */
export function useGenerateSuggestions() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: GenerateSuggestionsDto) =>
      generateSuggestions(session!.user!.accessToken as string, options),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-suggestions'] });
      if (result.newSuggestions > 0) {
        toast.success(
          `Found ${result.newSuggestions} new suggestion${result.newSuggestions > 1 ? 's' : ''}!`
        );
      } else if (result.existingSuggestions > 0) {
        toast.success(
          `${result.existingSuggestions} existing suggestion${result.existingSuggestions > 1 ? 's' : ''} available`
        );
      } else {
        toast.success('No recurring patterns found');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate suggestions');
    },
  });
}

/**
 * Approve a suggestion and create an expense plan
 */
export function useApproveSuggestion() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: number;
      options?: ApproveSuggestionDto;
    }) => approveSuggestion(session!.user!.accessToken as string, id, options),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      if (result.expensePlanId) {
        toast.success('Expense plan created successfully');
      } else {
        toast.success('Suggestion approved');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve suggestion');
    },
  });
}

/**
 * Reject a suggestion
 */
export function useRejectSuggestion() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: number;
      options?: RejectSuggestionDto;
    }) => rejectSuggestion(session!.user!.accessToken as string, id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-suggestions'] });
      toast.success('Suggestion rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject suggestion');
    },
  });
}

/**
 * Bulk approve multiple suggestions
 */
export function useBulkApproveSuggestions() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkActionDto) =>
      bulkApproveSuggestions(session!.user!.accessToken as string, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      toast.success(
        `Approved ${result.successful} of ${result.processed} suggestions`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bulk approve');
    },
  });
}

/**
 * Bulk reject multiple suggestions
 */
export function useBulkRejectSuggestions() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkActionDto) =>
      bulkRejectSuggestions(session!.user!.accessToken as string, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-suggestions'] });
      toast.success(
        `Rejected ${result.successful} of ${result.processed} suggestions`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bulk reject');
    },
  });
}

/**
 * Delete a suggestion permanently
 */
export function useDeleteSuggestion() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      deleteSuggestion(session!.user!.accessToken as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-plan-suggestions'] });
      toast.success('Suggestion deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete suggestion');
    },
  });
}
