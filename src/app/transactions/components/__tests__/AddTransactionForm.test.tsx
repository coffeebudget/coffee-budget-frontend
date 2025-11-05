// Mock all complex UI components first (before any imports)
jest.mock('@/components/ui/searchable-select', () => ({
  SearchableSelect: ({ value, onValueChange, options, placeholder }: any) => (
    <select
      data-testid="searchable-select"
      value={value || ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      aria-label={placeholder}
    >
      <option value="">Select...</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  SearchableSelectOption: ({ children }: any) => <option>{children}</option>,
}));

jest.mock('@/components/TagSelector', () => {
  return function MockTagSelector({ selectedTags, availableTags, onTagsChange }: any) {
    return (
      <div data-testid="tag-selector">
        {availableTags?.map((tag: any) => (
          <button
            key={tag.id}
            onClick={() => {
              const isSelected = selectedTags?.includes(tag.id);
              const newTags = isSelected
                ? selectedTags.filter((id: number) => id !== tag.id)
                : [...(selectedTags || []), tag.id];
              onTagsChange?.(newTags);
            }}
            data-testid={`tag-${tag.id}`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    );
  };
});

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock RadioGroup
jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ value, onValueChange, children }: any) => (
    <div data-testid="radio-group" onChange={onValueChange}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input type="radio" value={value} id={id} />
  ),
}));

// Mock ScrollArea
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

// Mock Table components (simple passthrough)
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}));

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
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock API functions
jest.mock('@/utils/api', () => ({
  createTag: jest.fn().mockResolvedValue({ id: 999, name: 'New Tag' }),
  previewKeywordImpact: jest.fn().mockResolvedValue({ affectedTransactions: 0 }),
  applyKeywordToCategory: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock toast functions
jest.mock('@/utils/toast-utils', () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
}));

import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils';
import AddTransactionForm from '../AddTransactionForm';
import { mockTransaction, mockCategories, mockTags, mockBankAccounts, mockCreditCards } from '@/test-utils/fixtures';

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
        type: 'expense' as const,
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
    it('should have required attribute on required fields', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const descriptionInput = screen.getByLabelText('Description');
      const amountInput = screen.getByLabelText('Amount');

      expect(descriptionInput).toHaveAttribute('required');
      expect(amountInput).toHaveAttribute('required');
    });

    it('should not submit with empty required fields', async () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Form should not submit with empty fields
      await waitFor(() => {
        expect(mockOnAddTransaction).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      mockOnAddTransaction.mockResolvedValueOnce(undefined);

      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Transaction' }
      });
      fireEvent.change(screen.getByLabelText('Amount'), {
        target: { value: '100.50' }
      });

      // Submit form
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

    it('should handle submission errors gracefully', async () => {
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
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Should handle error (component may show error message)
      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update description field when user types', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const descriptionInput = screen.getByLabelText('Description') as HTMLInputElement;
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

      expect(descriptionInput.value).toBe('New Description');
    });

    it('should update amount field when user types', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
      fireEvent.change(amountInput, { target: { value: '250.75' } });

      expect(amountInput.value).toBe('250.75');
    });

    it('should update execution date when user changes it', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const dateInput = screen.getByLabelText('Execution Date') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      expect(dateInput.value).toBe('2024-01-15');
    });

    it('should allow category selection', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category');
      expect(categorySelect).toBeInTheDocument();
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
      mockOnAddTransaction.mockResolvedValueOnce(undefined);

      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      // Fill in required fields
      const descriptionInput = screen.getByLabelText('Description') as HTMLInputElement;
      const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;

      fireEvent.change(descriptionInput, { target: { value: 'Test Transaction' } });
      fireEvent.change(amountInput, { target: { value: '100.50' } });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnAddTransaction).toHaveBeenCalled();
      });

      // Form should be reset after successful submission
      await waitFor(() => {
        expect(descriptionInput.value).toBe('');
        expect(amountInput.value).toBe('');
      });
    });
  });

  describe('Loading States', () => {
    it('should disable save button during submission', async () => {
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
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Should show loading state
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
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

    it('should have required attributes on required fields', () => {
      renderWithProviders(<AddTransactionForm {...defaultProps} />);

      const requiredFields = [
        screen.getByLabelText('Description'),
        screen.getByLabelText('Amount'),
      ];

      requiredFields.forEach(field => {
        expect(field).toHaveAttribute('required');
      });
    });
  });
});
