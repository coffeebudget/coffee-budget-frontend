import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdjustmentSuggestionModal from '../AdjustmentSuggestionModal';
import { ExpensePlan } from '@/types/expense-plan-types';

// Mock the hooks
const mockAcceptMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

const mockDismissMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

jest.mock('@/hooks/useExpensePlans', () => ({
  useAcceptAdjustment: () => mockAcceptMutation,
  useDismissAdjustment: () => mockDismissMutation,
}));

// Mock plan factory
const createMockPlan = (overrides: Partial<ExpensePlan> = {}): ExpensePlan => ({
  id: 1,
  userId: 1,
  name: 'Groceries',
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
  monthlyContribution: 300,
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
  suggestedMonthlyContribution: 345,
  suggestedAdjustmentPercent: 15,
  adjustmentReason: 'spending_increased',
  adjustmentSuggestedAt: '2024-01-15T00:00:00Z',
  adjustmentDismissedAt: null,
  ...overrides,
});

describe('AdjustmentSuggestionModal', () => {
  const onOpenChange = jest.fn();
  const onComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAcceptMutation.mutateAsync.mockResolvedValue({});
    mockDismissMutation.mutateAsync.mockResolvedValue({});
  });

  describe('rendering', () => {
    it('should not render when plan is null', () => {
      const { container } = render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={null}
          onComplete={onComplete}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when adjustment fields are missing', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: null,
        suggestedAdjustmentPercent: null,
        adjustmentReason: null,
      });

      const { container } = render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal when open and plan has adjustment suggestion', () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText(/Adjust.*Groceries.*Plan\?/)).toBeInTheDocument();
    });

    it('should display current and suggested amounts', () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('Current Monthly')).toBeInTheDocument();
      expect(screen.getByText('Suggested Monthly')).toBeInTheDocument();
    });

    it('should show percentage change badge', () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('+15%')).toBeInTheDocument();
    });
  });

  describe('spending increased', () => {
    it('should show increase message', () => {
      const plan = createMockPlan({
        adjustmentReason: 'spending_increased',
      });

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(
        screen.getByText(/spending in this category has increased/i)
      ).toBeInTheDocument();
    });
  });

  describe('spending decreased', () => {
    it('should show decrease message', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 255,
        suggestedAdjustmentPercent: -15,
        adjustmentReason: 'spending_decreased',
      });

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(
        screen.getByText(/spending in this category has decreased/i)
      ).toBeInTheDocument();
    });

    it('should show negative percentage badge', () => {
      const plan = createMockPlan({
        suggestedMonthlyContribution: 255,
        suggestedAdjustmentPercent: -15,
        adjustmentReason: 'spending_decreased',
      });

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      expect(screen.getByText('-15%')).toBeInTheDocument();
    });
  });

  describe('accept suggested amount', () => {
    it('should call acceptMutation with planId when accepting suggested amount', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await userEvent.click(acceptButton);

      expect(mockAcceptMutation.mutateAsync).toHaveBeenCalledWith({
        planId: 1,
      });
    });

    it('should call onComplete after successful accept', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await userEvent.click(acceptButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('custom amount', () => {
    it('should show custom amount input when "Enter Custom Amount" is clicked', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const customButton = screen.getByRole('button', {
        name: /enter custom amount/i,
      });
      await userEvent.click(customButton);

      expect(screen.getByLabelText(/custom monthly amount/i)).toBeInTheDocument();
    });

    it('should call acceptMutation with custom amount', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      // Click to show custom input
      const customButton = screen.getByRole('button', {
        name: /enter custom amount/i,
      });
      await userEvent.click(customButton);

      // Enter custom amount
      const input = screen.getByLabelText(/custom monthly amount/i);
      await userEvent.type(input, '400');

      // Accept custom amount
      const acceptCustomButton = screen.getByRole('button', {
        name: /accept custom amount/i,
      });
      await userEvent.click(acceptCustomButton);

      expect(mockAcceptMutation.mutateAsync).toHaveBeenCalledWith({
        planId: 1,
        customAmount: 400,
      });
    });

    it('should show error for invalid custom amount', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      // Click to show custom input
      const customButton = screen.getByRole('button', {
        name: /enter custom amount/i,
      });
      await userEvent.click(customButton);

      // Accept without entering amount
      const acceptCustomButton = screen.getByRole('button', {
        name: /accept custom amount/i,
      });
      await userEvent.click(acceptCustomButton);

      expect(
        screen.getByText(/please enter a valid amount/i)
      ).toBeInTheDocument();
    });

    it('should go back to main view when Back is clicked', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      // Click to show custom input
      const customButton = screen.getByRole('button', {
        name: /enter custom amount/i,
      });
      await userEvent.click(customButton);

      // Click back
      const backButton = screen.getByRole('button', { name: /back/i });
      await userEvent.click(backButton);

      // Should be back to main view
      expect(
        screen.getByRole('button', { name: /enter custom amount/i })
      ).toBeInTheDocument();
    });
  });

  describe('dismiss', () => {
    it('should call dismissMutation when dismiss is clicked', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await userEvent.click(dismissButton);

      expect(mockDismissMutation.mutateAsync).toHaveBeenCalledWith(1);
    });

    it('should call onComplete after successful dismiss', async () => {
      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await userEvent.click(dismissButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('loading states', () => {
    it('should disable buttons while accepting', () => {
      mockAcceptMutation.isPending = true;

      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      const customButton = screen.getByRole('button', {
        name: /enter custom amount/i,
      });
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      expect(acceptButton).toBeDisabled();
      expect(customButton).toBeDisabled();
      expect(dismissButton).toBeDisabled();

      mockAcceptMutation.isPending = false;
    });

    it('should disable buttons while dismissing', () => {
      mockDismissMutation.isPending = true;

      const plan = createMockPlan();

      render(
        <AdjustmentSuggestionModal
          open={true}
          onOpenChange={onOpenChange}
          plan={plan}
          onComplete={onComplete}
        />
      );

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      expect(acceptButton).toBeDisabled();

      mockDismissMutation.isPending = false;
    });
  });
});
