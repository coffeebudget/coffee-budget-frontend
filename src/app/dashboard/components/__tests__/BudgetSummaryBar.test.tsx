import React from 'react';
import { render, screen } from '@testing-library/react';
import { formatCurrency } from '@/utils/format';

// Normalize non-breaking spaces for testing-library matching
const fc = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, ' ');

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { accessToken: 'mock-token' } },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseMonthlySummary = jest.fn();
const mockUseMonthlyDepositSummary = jest.fn();

jest.mock('@/hooks/useIncomePlans', () => ({
  useMonthlySummary: () => mockUseMonthlySummary(),
}));

jest.mock('@/hooks/useExpensePlans', () => ({
  useMonthlyDepositSummary: () => mockUseMonthlyDepositSummary(),
}));

import BudgetSummaryBar from '../BudgetSummaryBar';

describe('BudgetSummaryBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseMonthlySummary.mockReturnValue({ data: undefined, isLoading: true });
    mockUseMonthlyDepositSummary.mockReturnValue({ data: undefined, isLoading: true });

    render(<BudgetSummaryBar />);
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBe(3);
  });

  it('should display income, obligations, and available amounts', () => {
    mockUseMonthlySummary.mockReturnValue({
      data: { budgetSafeIncome: 5000 },
      isLoading: false,
    });
    mockUseMonthlyDepositSummary.mockReturnValue({
      data: { totalMonthlyDeposit: 3000 },
      isLoading: false,
    });

    render(<BudgetSummaryBar />);

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Obligations')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    // Available should be 5000 - 3000 = 2000
    expect(screen.getByText(fc(2000))).toBeInTheDocument();
  });

  it('should show deficit alert when available is negative', () => {
    mockUseMonthlySummary.mockReturnValue({
      data: { budgetSafeIncome: 2000 },
      isLoading: false,
    });
    mockUseMonthlyDepositSummary.mockReturnValue({
      data: { totalMonthlyDeposit: 3000 },
      isLoading: false,
    });

    render(<BudgetSummaryBar />);

    expect(screen.getByText(/Budget deficit/)).toBeInTheDocument();
  });

  it('should show green color for positive available amount', () => {
    mockUseMonthlySummary.mockReturnValue({
      data: { budgetSafeIncome: 5000 },
      isLoading: false,
    });
    mockUseMonthlyDepositSummary.mockReturnValue({
      data: { totalMonthlyDeposit: 3000 },
      isLoading: false,
    });

    render(<BudgetSummaryBar />);

    const availableEl = screen.getByText(fc(2000));
    expect(availableEl.className).toContain('text-green-600');
  });

  it('should show red color for negative available amount', () => {
    mockUseMonthlySummary.mockReturnValue({
      data: { budgetSafeIncome: 2000 },
      isLoading: false,
    });
    mockUseMonthlyDepositSummary.mockReturnValue({
      data: { totalMonthlyDeposit: 3000 },
      isLoading: false,
    });

    render(<BudgetSummaryBar />);

    // Available: 2000 - 3000 = -1000
    const negativeEl = screen.getByText(fc(-1000));
    expect(negativeEl.className).toContain('text-red-600');
  });

  it('should show yellow color for low available amount', () => {
    mockUseMonthlySummary.mockReturnValue({
      data: { budgetSafeIncome: 3200 },
      isLoading: false,
    });
    mockUseMonthlyDepositSummary.mockReturnValue({
      data: { totalMonthlyDeposit: 3000 },
      isLoading: false,
    });

    render(<BudgetSummaryBar />);

    const lowEl = screen.getByText(fc(200));
    expect(lowEl.className).toContain('text-yellow-600');
  });
});
