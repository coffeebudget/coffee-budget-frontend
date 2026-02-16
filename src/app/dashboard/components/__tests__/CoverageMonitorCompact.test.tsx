import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { accessToken: 'mock-token' } },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseCoverageSummary = jest.fn();

jest.mock('@/hooks/useExpensePlans', () => ({
  useCoverageSummary: () => mockUseCoverageSummary(),
}));

import CoverageMonitorCompact from '../CoverageMonitorCompact';

const mockCoverageAllCovered = {
  period: { start: '2026-02-16', end: '2026-03-18', label: 'Next 30 days' },
  accounts: [
    {
      accountId: 1,
      accountName: 'BNL',
      institution: 'BNL',
      currentBalance: 4462,
      balanceSource: 'manual',
      balanceLastUpdated: null,
      upcomingPlansTotal: 3998,
      planCount: 5,
      projectedBalance: 464,
      hasShortfall: false,
      shortfallAmount: 0,
      plansAtRisk: [],
    },
  ],
  unassignedPlans: { count: 0, totalAmount: 0, plans: [] },
  overallStatus: 'all_covered',
  totalShortfall: 0,
  accountsWithShortfall: 0,
};

const mockCoverageWithShortfall = {
  ...mockCoverageAllCovered,
  accounts: [
    {
      ...mockCoverageAllCovered.accounts[0],
      projectedBalance: -500,
      hasShortfall: true,
      shortfallAmount: 500,
    },
  ],
  overallStatus: 'has_shortfall',
  totalShortfall: 500,
  accountsWithShortfall: 1,
};

describe('CoverageMonitorCompact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseCoverageSummary.mockReturnValue({ data: undefined, isLoading: true });

    render(<CoverageMonitorCompact />);
    expect(screen.getByText('🛡️ Copertura 30 Giorni')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    mockUseCoverageSummary.mockReturnValue({
      data: { accounts: [], unassignedPlans: { count: 0, totalAmount: 0, plans: [] }, overallStatus: 'no_data', totalShortfall: 0, accountsWithShortfall: 0 },
      isLoading: false,
    });

    render(<CoverageMonitorCompact />);
    expect(screen.getByText(/Nessun conto con piani da coprire/)).toBeInTheDocument();
  });

  it('should display "Tutto coperto" when all covered', () => {
    mockUseCoverageSummary.mockReturnValue({
      data: mockCoverageAllCovered,
      isLoading: false,
    });

    render(<CoverageMonitorCompact />);

    expect(screen.getByText('Tutto coperto')).toBeInTheDocument();
    expect(screen.getByText('BNL')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should display "Scoperto" when there is a shortfall', () => {
    mockUseCoverageSummary.mockReturnValue({
      data: mockCoverageWithShortfall,
      isLoading: false,
    });

    render(<CoverageMonitorCompact />);

    expect(screen.getByText('Scoperto')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should show unassigned plans warning', () => {
    const coverageWithUnassigned = {
      ...mockCoverageAllCovered,
      unassignedPlans: {
        count: 3,
        totalAmount: 1500,
        plans: [],
      },
    };

    mockUseCoverageSummary.mockReturnValue({
      data: coverageWithUnassigned,
      isLoading: false,
    });

    render(<CoverageMonitorCompact />);

    expect(screen.getByText(/3 piani senza conto assegnato/)).toBeInTheDocument();
  });
});
