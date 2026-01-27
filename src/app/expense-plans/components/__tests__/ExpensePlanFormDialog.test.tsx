import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExpensePlanFormDialog from '../ExpensePlanFormDialog';
import { ExpensePlan } from '@/types/expense-plan-types';

// Mock methods required for Radix UI components in JSDOM
beforeAll(() => {
  Element.prototype.hasPointerCapture = jest.fn(() => false);
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { accessToken: 'mock-token' },
    },
    status: 'authenticated',
  }),
}));

// Mock the API functions
jest.mock('@/utils/api-client', () => ({
  fetchBankAccounts: jest.fn(() =>
    Promise.resolve([
      { id: 1, name: 'Main Checking', balance: 5000 },
      { id: 2, name: 'Savings Account', balance: 10000 },
    ])
  ),
  fetchCreditCards: jest.fn(() =>
    Promise.resolve([
      { id: 1, name: 'Visa Card', creditLimit: 5000, availableCredit: 3000 },
    ])
  ),
}));

// Mock the expense plan hooks
const mockCreateMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

const mockUpdateMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

jest.mock('@/hooks/useExpensePlans', () => ({
  useCreateExpensePlan: () => mockCreateMutation,
  useUpdateExpensePlan: () => mockUpdateMutation,
}));

// Helper to create a test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return TestWrapper;
}

// Helper to create a mock expense plan
const createMockExpensePlan = (
  overrides: Partial<ExpensePlan> = {}
): ExpensePlan => ({
  id: 1,
  userId: 1,
  name: 'Test Plan',
  description: null,
  icon: null,
  planType: 'fixed_monthly',
  priority: 'essential',
  categoryId: null,
  autoTrackCategory: false,
  purpose: 'sinking_fund',
  paymentAccountType: null,
  paymentAccountId: null,
  targetAmount: 1000,
  monthlyContribution: 100,
  contributionSource: 'manual',
  frequency: 'monthly',
  frequencyYears: null,
  dueMonth: null,
  dueDay: null,
  targetDate: null,
  seasonalMonths: null,
  nextDueDate: null,
  autoCalculate: false,
  rolloverSurplus: true,
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  suggestedMonthlyContribution: null,
  suggestedAdjustmentPercent: null,
  adjustmentReason: null,
  adjustmentSuggestedAt: null,
  adjustmentDismissedAt: null,
  ...overrides,
});

describe('ExpensePlanFormDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the dialog when open', async () => {
      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={null}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Create Expense Plan')).toBeInTheDocument();
    });

    it('should show Edit title when editing existing plan', async () => {
      const plan = createMockExpensePlan();

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={plan}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Edit Expense Plan')).toBeInTheDocument();
    });
  });

  describe('Payment Account selection', () => {
    it('should display Payment Account dropdown', async () => {
      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={null}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // When no account selected, shows "Assign a Payment Account"
      expect(screen.getByText('Assign a Payment Account')).toBeInTheDocument();
    });

    it('should show bank accounts in the dropdown', async () => {
      const user = userEvent.setup();

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={null}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Wait for component to load - when no account selected shows "Assign a Payment Account"
      await waitFor(() => {
        expect(screen.getByText('Assign a Payment Account')).toBeInTheDocument();
      });

      // Find the payment account combobox - look for the one with "Select payment account..." placeholder
      // Get all comboboxes and find the one related to payment account
      const comboboxes = screen.getAllByRole('combobox');
      // The payment account select shows "Select payment account..." or "No account selected"
      const paymentAccountSelect = comboboxes.find(
        (cb) => cb.textContent?.includes('Select payment account') || cb.textContent?.includes('No account selected')
      );
      expect(paymentAccountSelect).toBeInTheDocument();
      await user.click(paymentAccountSelect!);

      // Check that bank accounts are displayed in the dropdown
      await waitFor(() => {
        expect(screen.getByText('Main Checking')).toBeInTheDocument();
        expect(screen.getByText('Savings Account')).toBeInTheDocument();
      });
    });

    it('should pre-select payment account when editing plan with existing account', async () => {
      const planWithPaymentAccount = createMockExpensePlan({
        paymentAccountType: 'bank_account',
        paymentAccountId: 1,
      });

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={planWithPaymentAccount}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Wait for bank accounts to load and pre-selection to happen
      await waitFor(() => {
        // The select should show the selected account name instead of placeholder
        expect(screen.getByText('Main Checking')).toBeInTheDocument();
      });
    });

    it('should include payment account in update data when submitting', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      mockUpdateMutation.mutateAsync.mockResolvedValueOnce({});

      const plan = createMockExpensePlan();

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={plan}
          onComplete={onComplete}
        />,
        { wrapper: createWrapper() }
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText('Name *')).toHaveValue('Test Plan');
      });

      // Find the payment account combobox
      const comboboxes = screen.getAllByRole('combobox');
      const paymentAccountSelect = comboboxes.find(
        (cb) => cb.textContent?.includes('Select payment account') || cb.textContent?.includes('No account selected')
      );
      expect(paymentAccountSelect).toBeInTheDocument();
      await user.click(paymentAccountSelect!);

      await waitFor(() => {
        expect(screen.getByText('Main Checking')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Main Checking'));

      // Submit the form
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      // Verify the mutation was called with payment account data
      await waitFor(() => {
        expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            data: expect.objectContaining({
              paymentAccountType: 'bank_account',
              paymentAccountId: 1,
            }),
          })
        );
      });
    });

    it('should preserve existing payment account when submitting without changes', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      mockUpdateMutation.mutateAsync.mockResolvedValueOnce({});

      const planWithPaymentAccount = createMockExpensePlan({
        paymentAccountType: 'bank_account',
        paymentAccountId: 1,
      });

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={planWithPaymentAccount}
          onComplete={onComplete}
        />,
        { wrapper: createWrapper() }
      );

      // Wait for form to load with pre-selected account
      await waitFor(() => {
        expect(screen.getByLabelText('Name *')).toHaveValue('Test Plan');
      });

      // Wait for the account to be pre-selected (showing account name in trigger)
      await waitFor(() => {
        expect(screen.getByText('Main Checking')).toBeInTheDocument();
      });

      // Submit the form without changing the payment account
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      // Verify the mutation was called with the existing payment account data preserved
      await waitFor(() => {
        expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            data: expect.objectContaining({
              paymentAccountType: 'bank_account',
              paymentAccountId: 1,
            }),
          })
        );
      });
    });
  });

  describe('form validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup();

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={null}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Clear the name field and submit
      const nameInput = screen.getByLabelText('Name *');
      await user.clear(nameInput);

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('should show error when target amount is empty', async () => {
      const user = userEvent.setup();

      render(
        <ExpensePlanFormDialog
          open={true}
          onOpenChange={jest.fn()}
          plan={null}
          onComplete={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Fill name but leave target amount empty
      const nameInput = screen.getByLabelText('Name *');
      await user.type(nameInput, 'Test Plan');

      // Target amount should be empty by default for new plans
      const targetAmountInput = screen.getByLabelText('Target Amount *');
      expect(targetAmountInput).toHaveValue(null);

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByText('Target amount must be greater than 0')
        ).toBeInTheDocument();
      });
    });
  });
});
