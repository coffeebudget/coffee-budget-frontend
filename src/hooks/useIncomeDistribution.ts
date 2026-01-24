/**
 * Income Distribution React Query Hooks
 *
 * Custom hooks for fetching and mutating income distribution rule data.
 * Uses TanStack Query for caching and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  fetchIncomeDistributionRules,
  createIncomeDistributionRule,
  updateIncomeDistributionRule,
  deleteIncomeDistributionRule,
  distributeManually,
} from '@/lib/api/income-distribution';
import {
  CreateIncomeDistributionRuleDto,
  UpdateIncomeDistributionRuleDto,
  ManualDistributionDto,
} from '@/types/expense-plan-types';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS (Read Operations)
// ═══════════════════════════════════════════════════════════════════════════

export function useIncomeDistributionRules() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['income-distribution-rules'],
    queryFn: () =>
      fetchIncomeDistributionRules(session!.user!.accessToken as string),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS (Write Operations)
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateIncomeDistributionRule() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncomeDistributionRuleDto) =>
      createIncomeDistributionRule(session!.user!.accessToken as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-distribution-rules'] });
      toast.success('Income distribution rule created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create income distribution rule');
    },
  });
}

export function useUpdateIncomeDistributionRule() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIncomeDistributionRuleDto }) =>
      updateIncomeDistributionRule(session!.user!.accessToken as string, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['income-distribution-rules'] });
      queryClient.invalidateQueries({ queryKey: ['income-distribution-rule', id] });
      toast.success('Income distribution rule updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update income distribution rule');
    },
  });
}

export function useDeleteIncomeDistributionRule() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      deleteIncomeDistributionRule(session!.user!.accessToken as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-distribution-rules'] });
      toast.success('Income distribution rule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete income distribution rule');
    },
  });
}

export function useDistributeManually() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManualDistributionDto) =>
      distributeManually(session!.user!.accessToken as string, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expense-plans'] });
      queryClient.invalidateQueries({ queryKey: ['expense-plans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pending-distributions'] });
      toast.success(
        `Distributed ${result.totalDistributed.toFixed(2)} to ${result.distributed.length} plans`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to distribute income');
    },
  });
}
