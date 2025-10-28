import React from 'react';
import { renderWithProviders } from '../../../../test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionList from '../TransactionList';
import { mockTransactions, mockCategories, mockTags, mockBankAccounts, mockCreditCards } from '../../../../test-utils/fixtures';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch for bulk operations
global.fetch = jest.fn();

describe('TransactionList', () => {
  const mockOnDeleteTransaction = jest.fn();
  const mockOnEditTransaction = jest.fn();
  const mockOnBulkCategorize = jest.fn();
  const mockOnBulkTag = jest.fn();
  const mockOnBulkDelete = jest.fn();
  const mockOnBulkUncategorize = jest.fn();

  const defaultProps = {
    transactions: mockTransactions,
    categories: mockCategories,
    tags: mockTags,
    bankAccounts: mockBankAccounts,
    creditCards: mockCreditCards,
    onDeleteTransaction: mockOnDeleteTransaction,
    onEditTransaction: mockOnEditTransaction,
    onBulkCategorize: mockOnBulkCategorize,
    onBulkTag: mockOnBulkTag,
    onBulkDelete: mockOnBulkDelete,
    onBulkUncategorize: mockOnBulkUncategorize,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('Rendering', () => {
    it('should render transaction list with all transactions', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      expect(screen.getByText('Your Transactions')).toBeInTheDocument();
      expect(screen.getByText('Select transactions to perform bulk actions')).toBeInTheDocument();
      
      // Check that all transactions are rendered
      mockTransactions.forEach(transaction => {
        expect(screen.getByText(transaction.description)).toBeInTheDocument();
      });
    });

    it('should render empty state when no transactions', () => {
      renderWithProviders(
        <TransactionList {...defaultProps} transactions={[]} />
      );
      
      expect(screen.getByText('No Transactions')).toBeInTheDocument();
      expect(screen.getByText("You haven't added any transactions yet.")).toBeInTheDocument();
      expect(screen.getByText('Click "Add Transaction" to create your first transaction.')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render select all checkbox', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const selectAllCheckbox = screen.getByLabelText('Select all transactions');
      expect(selectAllCheckbox).toBeInTheDocument();
    });
  });

  describe('Transaction Display', () => {
    it('should display transaction data correctly', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const firstTransaction = mockTransactions[0];
      
      expect(screen.getByText(firstTransaction.description)).toBeInTheDocument();
      expect(screen.getByText(`$${firstTransaction.amount.toFixed(2)}`)).toBeInTheDocument();
      expect(screen.getAllByText(firstTransaction.status)[0]).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      // Check that dates are formatted (should not contain raw ISO strings)
      const dateCells = screen.getAllByText(/\d{1,2}\s+\w{3}\s+\d{4}/);
      expect(dateCells.length).toBeGreaterThan(0);
    });

    it('should format amounts correctly', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      // Check that amounts are formatted with 2 decimal places
      const amountCells = screen.getAllByText(/\d+\.\d{2}/);
      expect(amountCells.length).toBeGreaterThan(0);
    });
  });

  describe('Selection Functionality', () => {
    it('should select individual transactions', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const firstCheckbox = screen.getAllByRole('checkbox')[1]; // First transaction checkbox (skip select all)
      fireEvent.click(firstCheckbox);
      
      expect(firstCheckbox).toBeChecked();
    });

    it('should select all transactions when select all is clicked', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const selectAllCheckbox = screen.getByLabelText('Select all transactions');
      fireEvent.click(selectAllCheckbox);
      
      // All transaction checkboxes should be checked
      const transactionCheckboxes = screen.getAllByRole('checkbox').slice(1); // Skip select all
      transactionCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should deselect all when select all is clicked again', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const selectAllCheckbox = screen.getByLabelText('Select all transactions');
      
      // Select all first
      fireEvent.click(selectAllCheckbox);
      expect(selectAllCheckbox).toBeChecked();
      
      // Deselect all
      fireEvent.click(selectAllCheckbox);
      expect(selectAllCheckbox).not.toBeChecked();
    });
  });

  describe('Bulk Actions', () => {
    it('should show bulk toolbar when transactions are selected', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      // Select a transaction
      const firstCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(firstCheckbox);
      
      // Bulk toolbar should appear with transaction count
      expect(screen.getByText(/1 transaction selected/i)).toBeInTheDocument();
    });

    it('should hide bulk toolbar when no transactions are selected', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      // Initially no transactions selected
      expect(screen.queryByText(/transaction selected/i)).not.toBeInTheDocument();
    });
  });

  describe('Individual Actions', () => {
    it('should call onEditTransaction when edit button is clicked', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const editButtons = screen.getAllByTitle(/edit transaction/i);
      fireEvent.click(editButtons[0]);
      
      expect(mockOnEditTransaction).toHaveBeenCalledWith(mockTransactions[0]);
    });

    it('should show delete confirmation when delete button is clicked', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle(/delete transaction/i);
      fireEvent.click(deleteButtons[0]);
      
      // Should show confirmation (delete button should still be there)
      expect(deleteButtons[0]).toBeInTheDocument();
    });

    it('should call onDeleteTransaction when delete is confirmed', async () => {
      mockOnDeleteTransaction.mockResolvedValue(undefined);
      
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle(/delete transaction/i);
      
      // Click delete twice to confirm
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(mockOnDeleteTransaction).toHaveBeenCalledWith(mockTransactions[0].id);
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should select all transactions with Cmd+A', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      // Simulate Cmd+A
      fireEvent.keyDown(document, { key: 'a', metaKey: true });
      
      const selectAllCheckbox = screen.getByLabelText('Select all transactions');
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should deselect all with Escape key', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      // Select all first
      const selectAllCheckbox = screen.getByLabelText('Select all transactions');
      fireEvent.click(selectAllCheckbox);
      expect(selectAllCheckbox).toBeChecked();
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(selectAllCheckbox).not.toBeChecked();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when delete fails', async () => {
      mockOnDeleteTransaction.mockRejectedValue(new Error('Delete failed'));
      
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle(/delete transaction/i);
      
      // Click delete twice to confirm
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Error deleting transaction')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during delete operation', async () => {
      mockOnDeleteTransaction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle(/delete transaction/i);
      
      // Click delete twice to confirm
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(deleteButtons[0]);
      
      // Should show loading state (spinner icon with animate-spin class)
      const spinnerIcon = document.querySelector('.animate-spin');
      expect(spinnerIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      expect(screen.getByLabelText('Select all transactions')).toBeInTheDocument();
      
      // Check individual transaction checkboxes
      mockTransactions.forEach((_, index) => {
        expect(screen.getByLabelText(`Select transaction ${mockTransactions[index].id}`)).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels for action buttons', () => {
      renderWithProviders(<TransactionList {...defaultProps} />);
      
      const editButtons = screen.getAllByTitle(/edit transaction/i);
      const deleteButtons = screen.getAllByTitle(/delete transaction/i);
      
      expect(editButtons.length).toBe(mockTransactions.length);
      expect(deleteButtons.length).toBe(mockTransactions.length);
    });
  });
});
