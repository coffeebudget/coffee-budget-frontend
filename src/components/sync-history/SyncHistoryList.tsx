'use client';
import { useState } from 'react';
import { useSyncHistory } from '@/hooks/useSyncHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SyncStatusBadge } from './SyncStatusBadge';
import { SyncStatus } from '@/types/sync-history';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SyncHistoryList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SyncStatus | undefined>();
  const { data, isLoading, error } = useSyncHistory(page, 10, statusFilter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading sync history</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={!statusFilter ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === SyncStatus.SUCCESS ? 'default' : 'outline'}
          onClick={() => setStatusFilter(SyncStatus.SUCCESS)}
        >
          Success
        </Button>
        <Button
          variant={statusFilter === SyncStatus.PARTIAL ? 'default' : 'outline'}
          onClick={() => setStatusFilter(SyncStatus.PARTIAL)}
        >
          Partial
        </Button>
        <Button
          variant={statusFilter === SyncStatus.FAILED ? 'default' : 'outline'}
          onClick={() => setStatusFilter(SyncStatus.FAILED)}
        >
          Failed
        </Button>
      </div>

      {/* Sync reports */}
      {data?.data.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SyncStatusBadge status={report.status} />
                  <span className="text-sm text-gray-500">
                    {new Date(report.syncStartedAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Accounts</p>
                    <p className="font-medium">
                      {report.successfulAccounts}/{report.totalAccounts}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">New Transactions</p>
                    <p className="font-medium">{report.totalNewTransactions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duplicates</p>
                    <p className="font-medium">{report.totalDuplicates}</p>
                  </div>
                </div>
              </div>
              <Link href={`/sync-history/${report.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          disabled={data?.page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span>
          Page {data?.page} of {data?.totalPages}
        </span>
        <Button
          disabled={data?.page === data?.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
