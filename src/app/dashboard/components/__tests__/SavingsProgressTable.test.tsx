import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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

// Mock FundingStatusBadge
jest.mock('@/app/expense-plans/components/FundingStatusBadge', () => {
  return function MockFundingStatusBadge({ status }: { status: string }) {
    return <span data-testid={`funding-status-${status}`}>{status}</span>;
  };
});

import SavingsProgressTable from '../SavingsProgressTable';

const mockPlans = [
  {
    id: 1,
    name: 'Vacanze',
    icon: '🏖️',
    planType: 'seasonal',
    status: 'active',
    targetAmount: 3000,
    progressPercent: 40,
    monthlyContribution: 300,
    fundingStatus: 'on_track',
    nextDueDate: '2026-06-01',
    targetDate: null,
  },
  {
    id: 2,
    name: 'Emergency Fund',
    icon: '🛡️',
    planType: 'emergency_fund',
    status: 'active',
    targetAmount: 10000,
    progressPercent: 60,
    monthlyContribution: 500,
    fundingStatus: 'on_track',
    nextDueDate: null,
    targetDate: '2027-01-01',
  },
  {
    id: 3,
    name: 'Rent',
    icon: '🏠',
    planType: 'fixed_monthly',
    status: 'active',
    targetAmount: 800,
    progressPercent: 100,
    monthlyContribution: 800,
    fundingStatus: 'funded',
    nextDueDate: '2026-03-01',
    targetDate: null,
  },
];

describe('SavingsProgressTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: undefined, isLoading: true });

    render(<SavingsProgressTable />);
    expect(screen.getByText('🎯 Risparmio Obiettivi')).toBeInTheDocument();
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should show empty state when no savings plans', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: [], isLoading: false });

    render(<SavingsProgressTable />);
    expect(screen.getByText(/Nessun piano di risparmio/)).toBeInTheDocument();
  });

  it('should filter out fixed_monthly plans', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SavingsProgressTable />);

    // Vacanze and Emergency Fund should show, Rent (fixed_monthly) should not
    expect(screen.getByText('Vacanze')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.queryByText('Rent')).not.toBeInTheDocument();
  });

  it('should display overall progress summary', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SavingsProgressTable />);

    // Total saved: (40% of 3000) + (60% of 10000) = 1200 + 6000 = 7200
    // Total target: 3000 + 10000 = 13000
    // Overall: 55%
    expect(screen.getByText(/€7,200.00/)).toBeInTheDocument();
    expect(screen.getByText(/€13,000.00/)).toBeInTheDocument();
    expect(screen.getByText(/55%/)).toBeInTheDocument();
  });

  it('should display individual plan rows with progress', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SavingsProgressTable />);

    // Vacanze: saved = 40% of 3000 = 1200
    expect(screen.getByText('€1,200.00')).toBeInTheDocument();
    // Emergency Fund: saved = 60% of 10000 = 6000
    expect(screen.getByText('€6,000.00')).toBeInTheDocument();
  });

  it('should show funding status badges', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SavingsProgressTable />);

    // Both Vacanze and Emergency Fund have on_track status
    const badges = screen.getAllByTestId('funding-status-on_track');
    expect(badges.length).toBe(2);
  });

  it('should support sorting by clicking column headers', () => {
    mockUseExpensePlansWithStatus.mockReturnValue({ data: mockPlans, isLoading: false });

    render(<SavingsProgressTable />);

    // Click "Piano" header to sort by name
    const nameHeader = screen.getByRole('button', { name: /Piano/i });
    fireEvent.click(nameHeader);

    // Get all row names in order
    const rows = screen.getAllByRole('row');
    // First row is header, then data rows
    expect(rows.length).toBe(3); // header + 2 data rows
  });
});
