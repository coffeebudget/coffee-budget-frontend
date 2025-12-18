'use client';
import { useSyncReportDetail } from '@/hooks/useSyncHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncStatusBadge } from './SyncStatusBadge';
import { SyncSourceBadge } from './SyncSourceBadge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SyncDetailViewProps {
  id: number;
}

export function SyncDetailView({ id }: SyncDetailViewProps) {
  const { data: report, isLoading, error } = useSyncReportDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading sync report</div>;
  }

  if (!report) {
    return <div>Sync report not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sync Report #{report.id}</CardTitle>
            <div className="flex gap-2">
              <SyncStatusBadge status={report.status} />
              <SyncSourceBadge source={report.source} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {report.sourceName && (
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-500">Source</p>
              <p className="font-medium">{report.sourceName}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Started</p>
              <p className="font-medium">
                {new Date(report.syncStartedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="font-medium">
                {new Date(report.syncCompletedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">
                {Math.round(
                  (new Date(report.syncCompletedAt).getTime() -
                    new Date(report.syncStartedAt).getTime()) /
                    1000 /
                    60
                )}{' '}
                min
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium capitalize">{report.syncType}</p>
            </div>
          </div>

          {report.errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">{report.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Results */}
      <Card>
        <CardHeader>
          <CardTitle>Account Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.accountResults?.map((account, index) => (
              <div
                key={index}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {account.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className="font-medium">{account.accountName}</p>
                    <span className="text-sm text-gray-500">
                      ({account.accountType})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">New</p>
                      <p>{account.newTransactions}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duplicates</p>
                      <p>{account.duplicates}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pending</p>
                      <p>{account.pendingDuplicates}</p>
                    </div>
                  </div>
                  {account.error && (
                    <p className="text-red-500 text-sm mt-2">{account.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import Logs */}
      {report.importLogs && report.importLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.importLogs.map((log) => (
                <div key={log.id} className="border rounded p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Log #{log.id}</span>
                    <span className="capitalize">{log.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                    <div>Total: {log.totalRecords}</div>
                    <div>Success: {log.successfulRecords}</div>
                    <div>Failed: {log.failedRecords}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
