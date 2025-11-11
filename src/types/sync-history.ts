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
