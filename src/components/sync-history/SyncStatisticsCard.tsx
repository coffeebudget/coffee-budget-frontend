'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyncStatistics } from '@/hooks/useSyncHistory';
import { SyncSource } from '@/types/sync-history';
import { SyncSourceBadge } from './SyncSourceBadge';
import { Loader2, Landmark, Wallet } from 'lucide-react';

interface SyncStatisticsCardProps {
  days?: number;
  source?: SyncSource;
}

export function SyncStatisticsCard({ days = 30, source }: SyncStatisticsCardProps) {
  const { data: stats, isLoading, error } = useSyncStatistics(days, source);

  // Fetch per-source stats when no source filter is applied
  const { data: gocardlessStats } = useSyncStatistics(days, SyncSource.GOCARDLESS);
  const { data: paypalStats } = useSyncStatistics(days, SyncSource.PAYPAL);

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
            <p className="text-2xl font-bold">{stats?.totalSyncs ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold">{stats?.successRate ?? 0}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">New Transactions</p>
            <p className="text-2xl font-bold">{stats?.totalNewTransactions ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg per Sync</p>
            <p className="text-2xl font-bold">
              {stats?.averageTransactionsPerSync ?? 0}
            </p>
          </div>
        </div>

        {/* Source Breakdown - only show when no filter is applied */}
        {!source && (gocardlessStats?.totalSyncs || paypalStats?.totalSyncs) && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm font-medium text-gray-500 mb-3">Breakdown by Source</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gocardlessStats && gocardlessStats.totalSyncs > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Landmark className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">GoCardless</p>
                    <p className="text-xs text-blue-700">
                      {gocardlessStats.totalSyncs} syncs · {gocardlessStats.totalNewTransactions} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-900">{gocardlessStats.successRate}%</p>
                    <p className="text-xs text-blue-700">success</p>
                  </div>
                </div>
              )}
              {paypalStats && paypalStats.totalSyncs > 0 && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Wallet className="h-5 w-5 text-indigo-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-900">PayPal</p>
                    <p className="text-xs text-indigo-700">
                      {paypalStats.totalSyncs} syncs · {paypalStats.totalNewTransactions} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-900">{paypalStats.successRate}%</p>
                    <p className="text-xs text-indigo-700">success</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
