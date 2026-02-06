import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentAccountForm from '../PaymentAccountForm';
import { PAYMENT_PROVIDERS } from '@/types/payment-types';

// Mock the useBankAccounts hook
jest.mock('@/hooks/useBankAccounts', () => ({
  useBankAccounts: () => ({
    bankAccounts: [
      { id: 1, name: 'Test Bank Account', balance: 1000 },
      { id: 2, name: 'Savings Account', balance: 5000 },
    ],
    fetchBankAccounts: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('PaymentAccountForm', () => {
  it('should render form fields', () => {
    const onSubmit = jest.fn();
    render(<PaymentAccountForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Provider/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Linked Bank Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Active/i)).toBeInTheDocument();
  });

  it('should show correct title for add mode', () => {
    const onSubmit = jest.fn();
    render(<PaymentAccountForm onSubmit={onSubmit} isEditMode={false} />);

    expect(screen.getByText('Add New Payment Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('should show correct title for edit mode', () => {
    const onSubmit = jest.fn();
    const initialData = {
      id: 1,
      displayName: 'Test Account',
      provider: PAYMENT_PROVIDERS.PAYPAL,
      providerConfig: {},
      isActive: true,
      userId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    render(<PaymentAccountForm onSubmit={onSubmit} initialData={initialData} isEditMode={true} />);

    expect(screen.getByText('Edit Payment Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Account/i })).toBeInTheDocument();
  });

  it('should populate form with initial data in edit mode', () => {
    const onSubmit = jest.fn();
    const initialData = {
      id: 1,
      displayName: 'My PayPal',
      provider: PAYMENT_PROVIDERS.PAYPAL,
      providerConfig: {},
      isActive: true,
      userId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    render(<PaymentAccountForm onSubmit={onSubmit} initialData={initialData} isEditMode={true} />);

    const displayNameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
    expect(displayNameInput.value).toBe('My PayPal');

    const activeCheckbox = screen.getByLabelText(/Active/i);
    expect(activeCheckbox).toBeChecked();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const onSubmit = jest.fn();
    render(<PaymentAccountForm onSubmit={onSubmit} />);

    const displayNameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(displayNameInput, { target: { value: 'New PayPal Account' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'New PayPal Account',
          provider: PAYMENT_PROVIDERS.PAYPAL,
          isActive: true,
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(<PaymentAccountForm onSubmit={onSubmit} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should disable submit button while loading', async () => {
    const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<PaymentAccountForm onSubmit={onSubmit} />);

    const displayNameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(displayNameInput, { target: { value: 'Test Account' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
