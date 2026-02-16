import React from 'react';
import { render, screen } from '@testing-library/react';

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

    expect(screen.getByText('Entrate')).toBeInTheDocument();
    expect(screen.getByText('Obblighi')).toBeInTheDocument();
    expect(screen.getByText('Disponibile')).toBeInTheDocument();
    // Available should be €2,000.00
    expect(screen.getByText('€2,000.00')).toBeInTheDocument();
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

    expect(screen.getByText(/Deficit di budget/)).toBeInTheDocument();
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

    const availableEl = screen.getByText('€2,000.00');
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

    // -€1,000.00
    const negativeEl = screen.getByText('-€1,000.00');
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

    const lowEl = screen.getByText('€200.00');
    expect(lowEl.className).toContain('text-yellow-600');
  });
});
