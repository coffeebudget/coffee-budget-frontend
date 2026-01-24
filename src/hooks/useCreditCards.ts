/**
 * Credit Cards React Query Hook
 *
 * Custom hook for fetching credit card data.
 * Uses TanStack Query for caching.
 */

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fetchCreditCards } from '@/utils/api-client';
import { CreditCard } from '@/utils/types';

export function useCreditCards() {
  const { data: session } = useSession();

  return useQuery<CreditCard[]>({
    queryKey: ['credit-cards'],
    queryFn: () => fetchCreditCards(),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
