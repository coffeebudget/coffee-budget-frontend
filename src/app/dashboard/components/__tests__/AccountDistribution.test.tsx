import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { formatCurrency } from '@/utils/format';

// Normalize non-breaking spaces for testing-library matching
const fc = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, ' ');

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { accessToken: 'mock-token' } },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseAccountAllocationSummary = jest.fn();

jest.mock('@/hooks/useExpensePlans', () => ({
  useAccountAllocationSummary: () => mockUseAccountAllocationSummary(),
}));

import AccountDistribution from '../AccountDistribution';

const mockAllocationData = {
  accounts: [
    {
      accountId: 1,
      accountName: 'BNL',
      currentBalance: 4462,
      balanceSource: 'manual',
      balanceLastUpdated: null,
      totalRequiredToday: 3100,
      shortfall: 0,
      surplus: 1362,
      healthStatus: 'healthy',
      fixedMonthlyPlans: [
        { id: 10, name: 'Affitto', icon: '🏠', requiredToday: 800, paymentMade: true, status: 'paid' },
      ],
      sinkingFundPlans: [
        {
          id: 20, name: 'Vacanze', icon: '🏖️', requiredToday: 1200,
          targetAmount: 3000, monthlyContribution: 300, progressPercent: 40,
          status: 'on_track', nextDueDate: '2026-06-01', monthsUntilDue: 4,
        },
      ],
      fixedMonthlyTotal: 800,
      sinkingFundTotal: 2300,
      monthlyContributionTotal: 1100,
      suggestedCatchUp: null,
    },
    {
      accountId: 2,
      accountName: 'Fineco',
      currentBalance: 10000,
      balanceSource: 'gocardless',
      balanceLastUpdated: '2026-02-15',
      totalRequiredToday: 5000,
      shortfall: 0,
      surplus: 5000,
      healthStatus: 'healthy',
      fixedMonthlyPlans: [],
      sinkingFundPlans: [],
      fixedMonthlyTotal: 0,
      sinkingFundTotal: 5000,
      monthlyContributionTotal: 500,
      suggestedCatchUp: null,
    },
  ],
  overallStatus: 'healthy',
  totalShortfall: 0,
  accountsWithShortfall: 0,
  totalMonthlyContribution: 1600,
  period: { start: '2026-02-01', end: '2026-02-28', label: 'This Month' },
};

describe('AccountDistribution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseAccountAllocationSummary.mockReturnValue({ data: undefined, isLoading: true });

    render(<AccountDistribution />);
    expect(screen.getByText('🏦 Account Distribution')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should show empty state', () => {
    mockUseAccountAllocationSummary.mockReturnValue({
      data: { accounts: [] },
      isLoading: false,
    });

    render(<AccountDistribution />);
    expect(screen.getByText(/No accounts with assigned plans/)).toBeInTheDocument();
  });

  it('should display global totals', () => {
    mockUseAccountAllocationSummary.mockReturnValue({
      data: mockAllocationData,
      isLoading: false,
    });

    render(<AccountDistribution />);

    // Total balance: 4462 + 10000 = 14462
    expect(screen.getByText(fc(14462), { exact: false })).toBeInTheDocument();
  });

  it('should display account rows', () => {
    mockUseAccountAllocationSummary.mockReturnValue({
      data: mockAllocationData,
      isLoading: false,
    });

    render(<AccountDistribution />);

    expect(screen.getByText('BNL')).toBeInTheDocument();
    expect(screen.getByText('Fineco')).toBeInTheDocument();
  });

  it('should expand account to show plans', () => {
    mockUseAccountAllocationSummary.mockReturnValue({
      data: mockAllocationData,
      isLoading: false,
    });

    render(<AccountDistribution />);

    // Click BNL row to expand
    fireEvent.click(screen.getByText('BNL'));

    // Should show the plans inside BNL
    expect(screen.getByText('Affitto')).toBeInTheDocument();
    expect(screen.getByText('Vacanze')).toBeInTheDocument();
  });

  it('should show plan statuses in expanded view', () => {
    mockUseAccountAllocationSummary.mockReturnValue({
      data: mockAllocationData,
      isLoading: false,
    });

    render(<AccountDistribution />);

    fireEvent.click(screen.getByText('BNL'));

    expect(screen.getByText(/paid/)).toBeInTheDocument();
    expect(screen.getByText(/on track/)).toBeInTheDocument();
  });
});
