import {
  PaginatedSyncReports,
  SyncStatistics,
  DetailedSyncReport,
  SyncStatus,
  SyncSource,
} from '@/types/sync-history';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchSyncHistory(
  token: string,
  page: number = 1,
  limit: number = 10,
  status?: SyncStatus,
  source?: SyncSource
): Promise<PaginatedSyncReports> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) {
    params.append('status', status);
  }

  if (source) {
    params.append('source', source);
  }

  const response = await fetch(`${API_URL}/sync-history?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function fetchSyncStatistics(
  token: string,
  days: number = 30,
  source?: SyncSource
): Promise<SyncStatistics> {
  const params = new URLSearchParams({
    days: days.toString(),
  });

  if (source) {
    params.append('source', source);
  }

  const response = await fetch(
    `${API_URL}/sync-history/statistics?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function fetchSyncReportById(
  token: string,
  id: number
): Promise<DetailedSyncReport> {
  const response = await fetch(`${API_URL}/sync-history/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Sync report not found');
    }
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
