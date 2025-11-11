import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  fetchSyncHistory,
  fetchSyncStatistics,
  fetchSyncReportById,
} from '@/lib/api/sync-history';
import { SyncStatus } from '@/types/sync-history';

export function useSyncHistory(
  page: number = 1,
  limit: number = 10,
  status?: SyncStatus
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-history', page, limit, status],
    queryFn: () =>
      fetchSyncHistory(
        session!.accessToken as string,
        page,
        limit,
        status
      ),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSyncStatistics(days: number = 30) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-statistics', days],
    queryFn: () => fetchSyncStatistics(session!.accessToken as string, days),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSyncReportDetail(id: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-report', id],
    queryFn: () => fetchSyncReportById(session!.accessToken as string, id),
    enabled: !!session && !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}
