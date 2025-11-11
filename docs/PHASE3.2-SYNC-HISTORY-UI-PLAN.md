# Phase 3.2: SyncHistory UI Implementation Plan

## Overview

Implement frontend UI for the SyncHistory feature to display sync reports, statistics, and detailed sync information. This phase builds on Phase 3.1 (Backend API) which provides three REST endpoints.

## Backend API Reference

Phase 3.1 provides the following endpoints:

1. **GET /sync-history** - Paginated sync history list
   - Query params: `page`, `limit`, `status` (optional)
   - Returns: `{ data: SyncReport[], total: number, page: number, limit: number, totalPages: number }`

2. **GET /sync-history/statistics** - Aggregated statistics
   - Query param: `days` (default: 30)
   - Returns: `{ totalSyncs, successfulSyncs, failedSyncs, successRate, totalNewTransactions, totalDuplicates, averageTransactionsPerSync }`

3. **GET /sync-history/:id** - Detailed sync report
   - Path param: `id`
   - Returns: Full sync report with `importLogs` and `accountResults`

## Architecture

### Directory Structure

```
src/
├── app/
│   └── sync-history/
│       ├── page.tsx                    # Main list page (Server Component)
│       ├── [id]/
│       │   └── page.tsx                # Detail page (Server Component)
│       └── loading.tsx                 # Loading state
├── components/
│   └── sync-history/
│       ├── SyncHistoryList.tsx         # Client component for list
│       ├── SyncHistoryList.test.tsx
│       ├── SyncStatisticsCard.tsx      # Statistics widget
│       ├── SyncStatisticsCard.test.tsx
│       ├── SyncDetailView.tsx          # Detail view component
│       ├── SyncDetailView.test.tsx
│       ├── SyncStatusBadge.tsx         # Status indicator
│       └── SyncStatusBadge.test.tsx
├── lib/
│   └── api/
│       └── sync-history.ts             # API client functions
├── hooks/
│   └── useSyncHistory.ts               # React Query hooks
│   └── useSyncHistory.test.ts
└── types/
    └── sync-history.ts                 # TypeScript interfaces
```

## Implementation Steps

### Step 1: TypeScript Type Definitions

**File:** `src/types/sync-history.ts`

```typescript
export enum SyncStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export interface SyncReport {
  id: number;
  status: SyncStatus;
  syncStartedAt: string;
  syncCompletedAt: string;
  totalAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
  totalNewTransactions: number;
  totalDuplicates: number;
  totalPendingDuplicates: number;
  syncType: string;
  errorMessage: string | null;
}

export interface AccountResult {
  accountId: string;
  accountName: string;
  accountType: string;
  success: boolean;
  newTransactions: number;
  duplicates: number;
  pendingDuplicates: number;
  importLogId: number;
  error?: string;
}

export interface ImportLog {
  id: number;
  status: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
}

export interface DetailedSyncReport extends SyncReport {
  accountResults: AccountResult[];
  importLogs: ImportLog[];
}

export interface PaginatedSyncReports {
  data: SyncReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SyncStatistics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  totalNewTransactions: number;
  totalDuplicates: number;
  averageTransactionsPerSync: number;
}
```

### Step 2: API Client Functions

**File:** `src/lib/api/sync-history.ts`

```typescript
import { PaginatedSyncReports, SyncStatistics, DetailedSyncReport, SyncStatus } from '@/types/sync-history';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchSyncHistory(
  token: string,
  page: number = 1,
  limit: number = 10,
  status?: SyncStatus
): Promise<PaginatedSyncReports> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${API_URL}/sync-history?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
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
  days: number = 30
): Promise<SyncStatistics> {
  const response = await fetch(`${API_URL}/sync-history/statistics?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

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
      'Authorization': `Bearer ${token}`,
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
```

### Step 3: React Query Hooks

**File:** `src/hooks/useSyncHistory.ts`

```typescript
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
    queryFn: () => fetchSyncHistory(session!.accessToken, page, limit, status),
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSyncStatistics(days: number = 30) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-statistics', days],
    queryFn: () => fetchSyncStatistics(session!.accessToken, days),
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSyncReportDetail(id: number) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['sync-report', id],
    queryFn: () => fetchSyncReportById(session!.accessToken, id),
    enabled: !!session && !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}
```

### Step 4: UI Components

#### SyncStatusBadge Component

**Purpose:** Display sync status with colored badge

```typescript
// src/components/sync-history/SyncStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { SyncStatus } from '@/types/sync-history';

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const variants = {
    [SyncStatus.SUCCESS]: 'bg-green-100 text-green-800',
    [SyncStatus.PARTIAL]: 'bg-yellow-100 text-yellow-800',
    [SyncStatus.FAILED]: 'bg-red-100 text-red-800',
  };

  const labels = {
    [SyncStatus.SUCCESS]: 'Success',
    [SyncStatus.PARTIAL]: 'Partial',
    [SyncStatus.FAILED]: 'Failed',
  };

  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
```

#### SyncStatisticsCard Component

**Purpose:** Dashboard widget showing aggregated statistics

```typescript
// src/components/sync-history/SyncStatisticsCard.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyncStatistics } from '@/hooks/useSyncHistory';
import { Loader2 } from 'lucide-react';

export function SyncStatisticsCard({ days = 30 }: { days?: number }) {
  const { data: stats, isLoading, error } = useSyncStatistics(days);

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
        <CardTitle>Sync Statistics (Last {days} Days)</CardTitle>
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
            <p className="text-2xl font-bold">{stats?.averageTransactionsPerSync}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### SyncHistoryList Component

**Purpose:** Paginated list of sync reports

```typescript
// src/components/sync-history/SyncHistoryList.tsx
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
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <span>
          Page {data?.page} of {data?.totalPages}
        </span>
        <Button
          disabled={page === data?.totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

#### SyncDetailView Component

**Purpose:** Detailed sync report with account results and import logs

```typescript
// src/components/sync-history/SyncDetailView.tsx
'use client';
import { useSyncReportDetail } from '@/hooks/useSyncHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncStatusBadge } from './SyncStatusBadge';
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
            <SyncStatusBadge status={report.status} />
          </div>
        </CardHeader>
        <CardContent>
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
                )} min
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
```

### Step 5: Page Components

#### Sync History List Page

**File:** `src/app/sync-history/page.tsx`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { SyncHistoryList } from '@/components/sync-history/SyncHistoryList';
import { SyncStatisticsCard } from '@/components/sync-history/SyncStatisticsCard';

export default async function SyncHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Sync History</h1>

      <div className="space-y-6">
        <SyncStatisticsCard />
        <SyncHistoryList />
      </div>
    </div>
  );
}
```

#### Sync Detail Page

**File:** `src/app/sync-history/[id]/page.tsx`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { SyncDetailView } from '@/components/sync-history/SyncDetailView';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SyncDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const id = parseInt(params.id);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/sync-history">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sync History
          </Button>
        </Link>
      </div>

      <SyncDetailView id={id} />
    </div>
  );
}
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

1. **SyncStatusBadge.test.tsx**
   - Renders correct badge variant for each status
   - Displays correct label text

2. **SyncStatisticsCard.test.tsx**
   - Shows loading state while fetching
   - Displays statistics correctly when loaded
   - Shows error message on API failure

3. **SyncHistoryList.test.tsx**
   - Renders list of sync reports
   - Pagination works correctly
   - Status filtering updates query
   - Links to detail page work

4. **SyncDetailView.test.tsx**
   - Shows loading state
   - Displays sync report summary
   - Renders account results
   - Shows import logs when available
   - Displays error messages

5. **useSyncHistory.test.ts**
   - Hooks return correct data structure
   - Enabled only when session exists
   - Proper cache keys and stale times

### E2E Tests (Cypress)

**File:** `cypress/e2e/sync-history.cy.ts`

```typescript
describe('Sync History', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/sync-history');
  });

  it('should display sync statistics', () => {
    cy.contains('Sync Statistics').should('be.visible');
    cy.contains('Total Syncs').should('be.visible');
    cy.contains('Success Rate').should('be.visible');
  });

  it('should list sync reports', () => {
    cy.get('[data-testid="sync-report-item"]').should('have.length.greaterThan', 0);
  });

  it('should filter by status', () => {
    cy.contains('button', 'Success').click();
    cy.get('[data-testid="sync-report-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'Success');
    });
  });

  it('should navigate to detail page', () => {
    cy.contains('View Details').first().click();
    cy.url().should('include', '/sync-history/');
    cy.contains('Sync Report #').should('be.visible');
    cy.contains('Account Results').should('be.visible');
  });

  it('should paginate through results', () => {
    cy.contains('button', 'Next').click();
    cy.contains('Page 2').should('be.visible');
  });
});
```

## Security Considerations

- ✅ All API calls require JWT authentication
- ✅ Session middleware protects routes
- ✅ User isolation enforced at backend
- ✅ Error messages don't expose sensitive data

## Performance Optimizations

- React Query caching with stale times
- Server-side rendering for initial page load
- Pagination to limit data transfer
- Loading states for better UX

## Navigation Integration

Add to main navigation menu:

```typescript
// Update src/components/Navigation.tsx or similar
<Link href="/sync-history">
  <Button variant="ghost">
    Sync History
  </Button>
</Link>
```

## Next Steps After Implementation

1. Add filters for date range
2. Implement export functionality (CSV/PDF)
3. Add real-time sync status updates via WebSockets
4. Create dashboard widget for latest sync status
5. Add notifications for failed syncs

## Implementation Checklist

- [ ] TypeScript types defined
- [ ] API client functions created
- [ ] React Query hooks implemented
- [ ] SyncStatusBadge component + tests
- [ ] SyncStatisticsCard component + tests
- [ ] SyncHistoryList component + tests
- [ ] SyncDetailView component + tests
- [ ] List page created
- [ ] Detail page created
- [ ] E2E tests written
- [ ] Navigation link added
- [ ] All tests passing
- [ ] Documentation updated
