import React from 'react';
import { renderWithProviders } from '../../../test-utils';
import { screen, fireEvent } from '@testing-library/react';
import TransactionFilters from '../TransactionFilters';
import { mockCategories, mockTags, mockBankAccounts, mockCreditCards } from '../../../test-utils/fixtures';

describe('TransactionFilters', () => {
  const mockOnFilterChange = jest.fn();
  const mockOnApplyFilters = jest.fn();

  const defaultProps = {
    filters: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      categoryIds: [],
      tagIds: [],
      minAmount: undefined,
      maxAmount: undefined,
      type: undefined,
      searchTerm: '',
      orderBy: 'executionDate',
      orderDirection: 'desc',
      uncategorizedOnly: false,
      bankAccountIds: [],
      creditCardIds: [],
    },
    categories: mockCategories,
    tags: mockTags,
    bankAccounts: mockBankAccounts,
    creditCards: mockCreditCards,
    onFilterChange: mockOnFilterChange,
    onApplyFilters: mockOnApplyFilters,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render filter form with all fields', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      expect(screen.getByText('Filter Transactions')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Transaction Type')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      renderWithProviders(
        <TransactionFilters {...defaultProps} title="Custom Filter Title" />
      );
      
      expect(screen.getByText('Custom Filter Title')).toBeInTheDocument();
    });

    it('should render apply filters button', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    });

    it('should render show more button', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
    });
  });

  describe('Filter Interactions', () => {
    it('should update start date when changed', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('Start Date');
      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        startDate: '2024-02-01',
      });
    });

    it('should update end date when changed', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      const endDateInput = screen.getByLabelText('End Date');
      fireEvent.change(endDateInput, { target: { value: '2024-02-28' } });
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        endDate: '2024-02-28',
      });
    });

    it('should call onApplyFilters when apply button is clicked', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyButton);
      
      expect(mockOnApplyFilters).toHaveBeenCalled();
    });
  });

  describe('Filter Expansion', () => {
    it('should expand filters when show more button is clicked', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      const showMoreButton = screen.getByRole('button', { name: /show more/i });
      fireEvent.click(showMoreButton);
      
      // Additional filter fields should be visible
      expect(screen.getByLabelText(/min amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max amount/i)).toBeInTheDocument();
    });

    it('should collapse filters when show less button is clicked', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      // First expand
      const showMoreButton = screen.getByRole('button', { name: /show more/i });
      fireEvent.click(showMoreButton);
      
      // Then collapse
      const showLessButton = screen.getByRole('button', { name: /show less/i });
      fireEvent.click(showLessButton);
      
      // Advanced fields should be hidden
      expect(screen.queryByLabelText(/min amount/i)).not.toBeInTheDocument();
    });
  });

  describe('Type Filter', () => {
    it('should update type filter when changed', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      const typeSelect = screen.getByLabelText('Transaction Type');
      fireEvent.change(typeSelect, { target: { value: 'expense' } });
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'expense',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Transaction Type')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithProviders(<TransactionFilters {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
    });
  });
});
