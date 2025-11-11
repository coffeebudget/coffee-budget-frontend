import { render, screen } from '@testing-library/react';
import { SyncDetailView } from './SyncDetailView';
import { DetailedSyncReport, SyncStatus } from '../../types/sync-history';

// Mock the useSyncReportDetail hook
jest.mock('../../hooks/useSyncHistory');
import * as useSyncHistoryHook from '../../hooks/useSyncHistory';

describe('SyncDetailView', () => {
  const mockDetailedReport: DetailedSyncReport = {
    id: 1,
    status: SyncStatus.SUCCESS,
    syncStartedAt: '2025-11-11T09:00:00Z',
    syncCompletedAt: '2025-11-11T09:15:00Z',
    totalAccounts: 3,
    successfulAccounts: 3,
    failedAccounts: 0,
    totalNewTransactions: 45,
    totalDuplicates: 15,
    totalPendingDuplicates: 3,
    syncType: 'automatic',
    errorMessage: null,
    accountResults: [
      {
        accountId: 'acc123',
        accountName: 'Fineco',
        accountType: 'bank_account',
        success: true,
        newTransactions: 15,
        duplicates: 5,
        pendingDuplicates: 1,
        importLogId: 1,
      },
      {
        accountId: 'acc456',
        accountName: 'Credit Card',
        accountType: 'credit_card',
        success: false,
        newTransactions: 0,
        duplicates: 0,
        pendingDuplicates: 0,
        importLogId: 2,
        error: 'Connection timeout',
      },
    ],
    importLogs: [
      {
        id: 1,
        status: 'completed',
        totalRecords: 15,
        successfulRecords: 15,
        failedRecords: 0,
      },
      {
        id: 2,
        status: 'failed',
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while fetching', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { container } = render(<SyncDetailView id={1} />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display error message on API failure', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
    } as any);

    render(<SyncDetailView id={1} />);

    expect(screen.getByText('Error loading sync report')).toBeInTheDocument();
  });

  it('should display not found message when report is null', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncDetailView id={1} />);

    expect(screen.getByText('Sync report not found')).toBeInTheDocument();
  });

  it('should display sync report summary', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: mockDetailedReport,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncDetailView id={1} />);

    expect(screen.getByText('Sync Report #1')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText(/automatic/i)).toBeInTheDocument();
  });

  it('should display account results', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: mockDetailedReport,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncDetailView id={1} />);

    expect(screen.getByText('Account Results')).toBeInTheDocument();
    expect(screen.getByText('Fineco')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.getByText('Connection timeout')).toBeInTheDocument();
  });

  it('should display import logs', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: mockDetailedReport,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncDetailView id={1} />);

    expect(screen.getByText('Import Logs')).toBeInTheDocument();
    expect(screen.getByText('Log #1')).toBeInTheDocument();
    expect(screen.getByText('Log #2')).toBeInTheDocument();
  });

  it('should display error message in summary when present', () => {
    const reportWithError = {
      ...mockDetailedReport,
      errorMessage: 'All accounts failed to sync',
    };

    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: reportWithError,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncDetailView id={1} />);

    expect(
      screen.getByText('All accounts failed to sync')
    ).toBeInTheDocument();
  });

  it('should not display import logs section when empty', () => {
    const reportWithoutLogs = {
      ...mockDetailedReport,
      importLogs: [],
    };

    jest.spyOn(useSyncHistoryHook, 'useSyncReportDetail').mockReturnValue({
      data: reportWithoutLogs,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncDetailView id={1} />);

    expect(screen.queryByText('Import Logs')).not.toBeInTheDocument();
  });
});
