import { render, screen } from '@testing-library/react';
import { SyncStatisticsCard } from './SyncStatisticsCard';
import { SyncStatistics, SyncSource } from '../../types/sync-history';

// Mock the useSyncStatistics hook
jest.mock('../../hooks/useSyncHistory');
import * as useSyncHistoryHook from '../../hooks/useSyncHistory';

describe('SyncStatisticsCard', () => {
  const mockStats: SyncStatistics = {
    totalSyncs: 30,
    successfulSyncs: 28,
    failedSyncs: 1,
    successRate: 93.33,
    totalNewTransactions: 450,
    totalDuplicates: 120,
    averageTransactionsPerSync: 15,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while fetching', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { container } = render(<SyncStatisticsCard />);

    // Check for the loader spinner SVG
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display statistics when loaded', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockImplementation((days?: number, source?: any) => {
      if (!source) {
        return { data: mockStats, isLoading: false, error: null } as any;
      }
      return { data: undefined, isLoading: false, error: null } as any;
    });

    render(<SyncStatisticsCard />);

    expect(screen.getByText('Sync Statistics (Last 30 Days)')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument(); // totalSyncs
    expect(screen.getByText('93.33%')).toBeInTheDocument(); // successRate
    expect(screen.getByText('450')).toBeInTheDocument(); // totalNewTransactions
    expect(screen.getByText('15')).toBeInTheDocument(); // averageTransactionsPerSync
  });

  it('should display custom days parameter', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncStatisticsCard days={7} />);

    expect(screen.getByText('Sync Statistics (Last 7 Days)')).toBeInTheDocument();
  });

  it('should display error message on API failure', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
    } as any);

    render(<SyncStatisticsCard />);

    expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
  });

  it('should display source badge when source prop is provided', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncStatisticsCard source={SyncSource.PAYPAL} />);

    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('should not display source badge when source prop is not provided', () => {
    jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockImplementation((days?: number, source?: any) => {
      if (!source) {
        return { data: mockStats, isLoading: false, error: null } as any;
      }
      return { data: undefined, isLoading: false, error: null } as any;
    });

    render(<SyncStatisticsCard />);

    expect(screen.queryByText('PayPal')).not.toBeInTheDocument();
    expect(screen.queryByText('GoCardless')).not.toBeInTheDocument();
  });

  it('should call useSyncStatistics with source parameter', () => {
    const mockUseSyncStatistics = jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncStatisticsCard days={7} source={SyncSource.GOCARDLESS} />);

    expect(mockUseSyncStatistics).toHaveBeenCalledWith(7, SyncSource.GOCARDLESS);
  });

  it('should call useSyncStatistics without source parameter when not provided', () => {
    const mockUseSyncStatistics = jest.spyOn(useSyncHistoryHook, 'useSyncStatistics').mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as any);

    render(<SyncStatisticsCard days={30} />);

    expect(mockUseSyncStatistics).toHaveBeenCalledWith(30, undefined);
  });
});
