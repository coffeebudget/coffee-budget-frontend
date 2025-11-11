import { render, screen, fireEvent } from '@testing-library/react';
import { SyncHistoryList } from './SyncHistoryList';
import { SyncStatus, PaginatedSyncReports } from '../../types/sync-history';

// Mock the useSyncHistory hook
jest.mock('../../hooks/useSyncHistory');
import * as useSyncHistoryHook from '../../hooks/useSyncHistory';

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('SyncHistoryList', () => {
  const mockPaginatedData: PaginatedSyncReports = {
    data: [
      {
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
      },
      {
        id: 2,
        status: SyncStatus.PARTIAL,
        syncStartedAt: '2025-11-10T09:00:00Z',
        syncCompletedAt: '2025-11-10T09:15:00Z',
        totalAccounts: 3,
        successfulAccounts: 2,
        failedAccounts: 1,
        totalNewTransactions: 30,
        totalDuplicates: 10,
        totalPendingDuplicates: 2,
        syncType: 'automatic',
        errorMessage: null,
      },
    ],
    total: 50,
    page: 1,
    limit: 10,
    totalPages: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while fetching', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { container } = render(<SyncHistoryList />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display sync reports when loaded', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: mockPaginatedData,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncHistoryList />);

    // Check for status badges (not filter buttons)
    const successBadges = screen.getAllByText('Success');
    expect(successBadges.length).toBeGreaterThan(0);

    const partialBadges = screen.getAllByText('Partial');
    expect(partialBadges.length).toBeGreaterThan(0);

    // Check for transaction counts
    expect(screen.getByText('45')).toBeInTheDocument(); // totalNewTransactions
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should display error message on API failure', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
    } as any);

    render(<SyncHistoryList />);

    expect(screen.getByText('Error loading sync history')).toBeInTheDocument();
  });

  it('should render filter buttons', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: mockPaginatedData,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncHistoryList />);

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Success' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Partial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
  });

  it('should render pagination controls', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: mockPaginatedData,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncHistoryList />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: mockPaginatedData,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncHistoryList />);

    const previousButton = screen.getByRole('button', { name: 'Previous' });
    expect(previousButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    const lastPageData = { ...mockPaginatedData, page: 5, totalPages: 5 };
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: lastPageData,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncHistoryList />);

    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeDisabled();
  });

  it('should render View Details links', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncHistory').mockReturnValue({
      data: mockPaginatedData,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncHistoryList />);

    const detailLinks = screen.getAllByText('View Details');
    expect(detailLinks).toHaveLength(2);
  });
});
