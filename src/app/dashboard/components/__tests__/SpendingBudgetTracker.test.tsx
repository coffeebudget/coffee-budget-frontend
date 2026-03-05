import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { formatCurrency } from '@/utils/format';

const fc = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, ' ');

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { accessToken: 'mock-token' } },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseExpensePlansWithStatus = jest.fn();

jest.mock('@/hooks/useExpensePlans', () => ({
  useExpensePlansWithStatus: () => mockUseExpensePlansWithStatus(),
}));

jest.mock('@/app/expense-plans/components/FundingStatusBadge', () => {
  return function MockFundingStatusBadge({ status }: { status: string }) {
    return <span data-testid={`funding-status-${status}`}>{status}</span>;
  };
});

import SpendingBudgetTracker from '../SpendingBudgetTracker';

const mockPlans = [
  {
    id: 1,
    name: 'Groceries',
    icon: '🛒',
    planType: 'spending_budget',
    purpose: 'spending_budget',
    status: 'active',
    targetAmount: 500,
    progressPercent: 40, // 40% remaining in envelope = 60% spent
    monthlyContribution: 500,
    fundingStatus: 'on_track',
    nextDueDate: null,
    targetDate: null,
  },
  {
    id: 2,
    name: 'Dining Out',
    icon: '🍽️',
    planType: 'spending_budget',
    purpose: 'spending_budget',
    status: 'active',
    targetAmount: 300,
    progressPercent: 10, // 10% remaining = 90% spent
    monthlyContribution: 300,
    fundingStatus: 'behind',
    nextDueDate: null,
    targetDate: null,
  },
  {
    id: 3,
    name: 'Vacanze',
    icon: '🏖️',
    planType: 'seasonal',
    purpose: 'sinking_fund',
    status: 'active',
    targetAmount: 3000,
    progressPercent: 40,
    monthlyContribution: 300,
    fundingStatus: 'on_track',
    nextDueDate: '2026-06-01',
    targetDate: null,
  },
  {
    id: 4,
    name: 'Old Budget',
    icon: '📋',
    planType: 'spending_budget',
    purpose: 'spending_budget',
    status: 'completed',
    targetAmount: 200,
    progressPercent: 0,
    monthlyContribution: 200,
    fundingStatus: 'funded',
    nextDueDate: null,
    targetDate: null,
  },
];

describe('SpendingBudgetTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: undefined, isLoading: true });

    render(<SpendingBudgetTracker />);
    expect(screen.getByText('Spending Budgets')).toBeInTheDocument();
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should show empty state when no spending budgets exist', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: [], isLoading: false });

    render(<SpendingBudgetTracker />);
    expect(screen.getByText(/No active spending budgets/)).toBeInTheDocument();
  });

  it('should only show spending_budget plans, excluding sinking_fund and completed', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SpendingBudgetTracker />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dining Out')).toBeInTheDocument();
    expect(screen.queryByText('Vacanze')).not.toBeInTheDocument();
    expect(screen.queryByText('Old Budget')).not.toBeInTheDocument();
  });

  it('should display correct spent/budget amounts', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SpendingBudgetTracker />);

    // Groceries: budget=500, remaining=40%*500=200, spent=500-200=300
    // Dining Out: budget=300, remaining=10%*300=30, spent=300-30=270
    // "300" appears twice (Groceries spent + Dining Out budget), so use getAllByText
    const matches300 = screen.getAllByText(fc(300), { exact: false });
    expect(matches300.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(fc(270), { exact: false })).toBeInTheDocument();
  });

  it('should display overall totals', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SpendingBudgetTracker />);

    // Total spent: 300 + 270 = 570
    // Total budget: 500 + 300 = 800
    expect(screen.getByText(fc(570), { exact: false })).toBeInTheDocument();
    expect(screen.getByText(fc(800), { exact: false })).toBeInTheDocument();
  });

  it('should show funding status badges', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SpendingBudgetTracker />);

    expect(screen.getByTestId('funding-status-on_track')).toBeInTheDocument();
    expect(screen.getByTestId('funding-status-behind')).toBeInTheDocument();
  });

  it('should sort by utilization (highest spending first) by default', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SpendingBudgetTracker />);

    const rows = screen.getAllByRole('row');
    // header + 2 data rows
    expect(rows.length).toBe(3);
    // Dining Out (90% used) should appear before Groceries (60% used)
    const cells = rows[1].querySelectorAll('td');
    expect(cells[0].textContent).toContain('Dining Out');
  });

  it('should support sorting by clicking column headers', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SpendingBudgetTracker />);

    // There are two "Budget" buttons (column name header + budget amount header)
    const budgetButtons = screen.getAllByRole('button', { name: /Budget/i });
    fireEvent.click(budgetButtons[0]);

    // After clicking, sort should change
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(3);
  });
});
