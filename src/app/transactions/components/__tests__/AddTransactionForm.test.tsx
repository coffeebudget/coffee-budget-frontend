import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../../test-utils';
import AddTransactionForm from '../AddTransactionForm';
import { mockTransaction, mockCategories, mockTags, mockBankAccounts, mockCreditCards } from '../../../../test-utils/fixtures';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        accessToken: 'mock-token',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock API functions
jest.mock('../../../../utils/api', () => ({
  createTag: jest.fn(),
  previewKeywordImpact: jest.fn(),
  applyKeywordToCategory: jest.fn(),
}));

// Mock toast functions
jest.mock('../../../../utils/toast-utils', () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
}));

describe('AddTransactionForm', () => {
  const mockOnAddTransaction = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onAddTransaction: mockOnAddTransaction,
    initialData: null,
    categories: mockCategories,
    tags: mockTags,
    bankAccounts: mockBankAccounts,
    creditCards: mockCreditCards,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Execution Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });

    it('should render with initial data when provided', () => {
      const initialData = {
        ...mockTransaction,
        description: 'Test Transaction',
        amount: 100.50,
        type: 'expense',
      };

      renderWithProviders(
        <AddTransactionForm {...defaultProps} initialData={initialData} />
      );
      
      expect(screen.getByDisplayValue('Test Transaction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();
    });

    it('should render save and cancel buttons', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show correct title for new transaction', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByText('Add New Transaction')).toBeInTheDocument();
    });

    it('should show correct title for editing transaction', () => {
      const initialData = { ...mockTransaction, id: 1 };
      
      renderWithProviders(
        <AddTransactionForm {...defaultProps} initialData={initialData} />
      );
      
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      // Check that required fields are present
      expect(screen.getByLabelText('Description')).toHaveAttribute('required');
      expect(screen.getByLabelText('Amount')).toHaveAttribute('required');
    });

    it('should not submit with empty required fields', async () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      // Form should not submit with empty fields
      expect(mockOnAddTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      // Submit form
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Test Transaction',
            amount: 100.50,
            type: 'expense',
          })
        );
      });
    });

    it('should handle submission errors', async () => {
      mockOnAddTransaction.mockRejectedValueOnce(new Error('Submission failed'));
      
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      // Submit form
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save transaction')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update form fields when user types', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
      
      expect(descriptionInput).toHaveValue('New Description');
    });

    it('should update amount field when user types', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByLabelText('Amount');
      fireEvent.change(amountInput, { target: { value: '250.75' } });
      
      expect(amountInput).toHaveValue('250.75');
    });

    it('should update execution date when user changes it', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Execution Date');
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      
      expect(dateInput).toHaveValue('2024-01-15');
    });
  });

  describe('Form Reset and Cancellation', () => {
    it('should call onCancel when cancel button is clicked', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form after successful submission', async () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      // Submit form
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalled();
      });
      
      // Form should be reset after successful submission
      await waitFor(() => {
        expect(screen.getByLabelText('Description')).toHaveValue('');
        expect(screen.getByLabelText('Amount')).toHaveValue('');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      mockOnAddTransaction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      // Submit form
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Execution Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      
      const requiredFields = screen.getAllByLabelText(/Description|Amount/);
      requiredFields.forEach(field => {
        expect(field).toHaveAttribute('required');
      });
    });
  });
});
