import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  fetchSyncHistory,
  fetchSyncStatistics,
  fetchSyncReportById,
} from '@/lib/api/sync-history';
import { SyncStatus, SyncSource } from '@/types/sync-history';

export function useSyncHistory(
  page: number = 1,
  limit: number = 10,
  status?: SyncStatus,
  source?: SyncSource
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-history', page, limit, status, source],
    queryFn: () =>
      fetchSyncHistory(
        session!.user!.accessToken as string,
        page,
        limit,
        status,
        source
      ),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSyncStatistics(days: number = 30, source?: SyncSource) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-statistics', days, source],
    queryFn: () => fetchSyncStatistics(session!.user!.accessToken as string, days, source),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSyncReportDetail(id: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-report', id],
    queryFn: () => fetchSyncReportById(session!.user!.accessToken as string, id),
    enabled: !!session && !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}
