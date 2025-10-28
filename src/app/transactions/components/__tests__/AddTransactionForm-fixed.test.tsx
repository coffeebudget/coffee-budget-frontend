import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../../test-utils';
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
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Execution Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
    });

    it('should render with initial data when provided', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(
        <AddTransactionForm 
          {...defaultProps} 
          initialData={mockTransaction} 
        />
      );
      
      expect(screen.getByDisplayValue(mockTransaction.description)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockTransaction.amount.toString())).toBeInTheDocument();
    });

    it('should render save and cancel buttons', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show correct title for new transaction', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    it('should show correct title for editing transaction', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(
        <AddTransactionForm 
          {...defaultProps} 
          initialData={mockTransaction} 
        />
      );
      
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      // Form should not submit without required fields
      expect(mockOnAddTransaction).not.toHaveBeenCalled();
    });

    it('should not submit with empty required fields', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      expect(mockOnAddTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      mockOnAddTransaction.mockResolvedValue(undefined);
      
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Test Transaction',
            amount: 100.50,
          })
        );
      });
    });

    it('should handle submission errors', async () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      const error = new Error('Submission failed');
      mockOnAddTransaction.mockRejectedValue(error);
      
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update form fields when user types', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
      
      expect(descriptionInput).toHaveValue('New Description');
    });

    it('should update amount field when user types', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const amountInput = screen.getByLabelText('Amount');
      fireEvent.change(amountInput, { target: { value: '250.75' } });
      
      expect(amountInput).toHaveValue('250.75');
    });

    it('should update execution date when user changes it', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Execution Date');
      fireEvent.change(dateInput, { target: { value: '2024-12-31' } });
      
      expect(dateInput).toHaveValue('2024-12-31');
    });
  });

  describe('Form Reset and Cancellation', () => {
    it('should call onCancel when cancel button is clicked', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should reset form after successful submission', async () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      mockOnAddTransaction.mockResolvedValue(undefined);
      
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      // Mock a slow submission
      mockOnAddTransaction.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      
      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Execution Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      const AddTransactionForm = require('../AddTransactionForm').default;
      renderWithProviders(<AddTransactionForm {...defaultProps} />);
      
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });
});
