'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyncStatistics } from '@/hooks/useSyncHistory';
import { SyncSource } from '@/types/sync-history';
import { SyncSourceBadge } from './SyncSourceBadge';
import { Loader2 } from 'lucide-react';

interface SyncStatisticsCardProps {
  days?: number;
  source?: SyncSource;
}

export function SyncStatisticsCard({ days = 30, source }: SyncStatisticsCardProps) {
  const { data: stats, isLoading, error } = useSyncStatistics(days, source);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-red-500 p-6">
          Error loading statistics
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Sync Statistics (Last {days} Days)</CardTitle>
          {source && <SyncSourceBadge source={source} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Syncs</p>
            <p className="text-2xl font-bold">{stats?.totalSyncs}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold">{stats?.successRate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">New Transactions</p>
            <p className="text-2xl font-bold">{stats?.totalNewTransactions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg per Sync</p>
            <p className="text-2xl font-bold">
              {stats?.averageTransactionsPerSync}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
