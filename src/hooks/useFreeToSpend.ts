/**
 * Free to Spend React Query Hooks
 *
 * Hooks for fetching and caching free to spend data.
 */

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fetchFreeToSpend } from '@/lib/api/free-to-spend';
import { FreeToSpendResponse, getCurrentMonth } from '@/types/free-to-spend-types';

/**
 * Hook to fetch free to spend calculation for a given month
 *
 * @param month - Month in YYYY-MM format (optional, defaults to current month)
 * @returns React Query result with FreeToSpendResponse
 */
export function useFreeToSpend(month?: string) {
  const { data: session } = useSession();
  const targetMonth = month ?? getCurrentMonth();

  return useQuery<FreeToSpendResponse, Error>({
    queryKey: ['freeToSpend', targetMonth],
    queryFn: () => fetchFreeToSpend(session!.user!.accessToken as string, targetMonth),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch free to spend for current month
 *
 * @returns React Query result with FreeToSpendResponse for current month
 */
export function useCurrentFreeToSpend() {
  return useFreeToSpend(getCurrentMonth());
}
