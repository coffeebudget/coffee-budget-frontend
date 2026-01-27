import { render, screen, fireEvent } from '@testing-library/react';
import AdjustmentBadge from '../AdjustmentBadge';
import { ExpensePlan } from '@/types/expense-plan-types';

// Mock plan factory
const createMockPlan = (overrides: Partial<ExpensePlan> = {}): ExpensePlan => ({
  id: 1,
  userId: 1,
  name: 'Test Plan',
  description: null,
  icon: null,
  planType: 'fixed_monthly',
  priority: 'essential',
  categoryId: null,
  category: null,
  autoTrackCategory: false,
  purpose: 'sinking_fund',
  paymentAccountType: null,
  paymentAccountId: null,
  paymentAccount: null,
  targetAmount: 1000,
  monthlyContribution: 100,
  contributionSource: 'calculated',
  frequency: 'monthly',
  frequencyYears: null,
  dueMonth: null,
  dueDay: null,
  targetDate: null,
  seasonalMonths: null,
  nextDueDate: null,
  status: 'active',
  autoCalculate: true,
  rolloverSurplus: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  suggestedMonthlyContribution: null,
  suggestedAdjustmentPercent: null,
  adjustmentReason: null,
  adjustmentSuggestedAt: null,
  adjustmentDismissedAt: null,
  ...overrides,
});

describe('AdjustmentBadge', () => {
  describe('rendering', () => {
    it('should not render when no adjustment suggestion exists', () => {
      const plan = createMockPlan();
      const { container } = render(<AdjustmentBadge plan={plan} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when suggestedMonthlyContribution is null', () => {
      const plan = createMockPlan({
        suggestedAdjustmentPercent: 15,
        adjustmentReason: 'spending_increased',
      });
      const { container } = render(<AdjustmentBadge plan={plan} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when suggestedAdjustmentPercent is null', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        adjustmentReason: 'spending_increased',
      });
      const { container } = render(<AdjustmentBadge plan={plan} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when adjustmentReason is null', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        suggestedAdjustmentPercent: 15,
      });
      const { container } = render(<AdjustmentBadge plan={plan} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render badge when all adjustment fields are present', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        suggestedAdjustmentPercent: 15,
        adjustmentReason: 'spending_increased',
      });
      render(<AdjustmentBadge plan={plan} />);

      expect(screen.getByText('+15%')).toBeInTheDocument();
    });
  });

  describe('spending increased', () => {
    it('should show positive percentage with + prefix', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        suggestedAdjustmentPercent: 15,
        adjustmentReason: 'spending_increased',
      });
      render(<AdjustmentBadge plan={plan} />);

      expect(screen.getByText('+15%')).toBeInTheDocument();
    });

    it('should apply amber styling for spending increase', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        suggestedAdjustmentPercent: 15,
        adjustmentReason: 'spending_increased',
      });
      const { container } = render(<AdjustmentBadge plan={plan} />);

      const badge = container.querySelector('[class*="bg-amber"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('spending decreased', () => {
    it('should show negative percentage with - prefix', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 85,
        suggestedAdjustmentPercent: -15,
        adjustmentReason: 'spending_decreased',
      });
      render(<AdjustmentBadge plan={plan} />);

      expect(screen.getByText('-15%')).toBeInTheDocument();
    });

    it('should apply blue styling for spending decrease', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 85,
        suggestedAdjustmentPercent: -15,
        adjustmentReason: 'spending_decreased',
      });
      const { container } = render(<AdjustmentBadge plan={plan} />);

      const badge = container.querySelector('[class*="bg-blue"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('click handler', () => {
    it('should call onClick when badge is clicked', () => {
      const onClick = jest.fn();
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        suggestedAdjustmentPercent: 15,
        adjustmentReason: 'spending_increased',
      });
      render(<AdjustmentBadge plan={plan} onClick={onClick} />);

      const badge = screen.getByText('+15%');
      fireEvent.click(badge);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115,
        suggestedAdjustmentPercent: 15,
        adjustmentReason: 'spending_increased',
      });
      render(<AdjustmentBadge plan={plan} />);

      const badge = screen.getByText('+15%');
      expect(() => fireEvent.click(badge)).not.toThrow();
    });
  });

  describe('percentage display', () => {
    it('should round percentage to whole number', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 115.75,
        suggestedAdjustmentPercent: 15.75,
        adjustmentReason: 'spending_increased',
      });
      render(<AdjustmentBadge plan={plan} />);

      expect(screen.getByText('+16%')).toBeInTheDocument();
    });

    it('should handle small percentage changes', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 110,
        suggestedAdjustmentPercent: 10,
        adjustmentReason: 'spending_increased',
      });
      render(<AdjustmentBadge plan={plan} />);

      expect(screen.getByText('+10%')).toBeInTheDocument();
    });
  });
});
