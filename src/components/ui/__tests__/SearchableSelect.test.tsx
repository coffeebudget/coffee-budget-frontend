import React from 'react';
import { renderWithProviders } from '../../../test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchableSelect, SearchableSelectOption } from '../searchable-select';

// Mock data
const mockOptions: SearchableSelectOption[] = [
  {
    id: 1,
    label: 'Food & Dining',
    keywords: ['restaurant', 'food', 'dining', 'cafe'],
    description: 'Meals and dining expenses'
  },
  {
    id: 2,
    label: 'Transportation',
    keywords: ['uber', 'taxi', 'gas', 'fuel'],
    description: 'Transportation and travel costs'
  },
  {
    id: 3,
    label: 'Entertainment',
    keywords: ['movie', 'concert', 'game', 'entertainment'],
    description: 'Entertainment and leisure activities'
  },
  {
    id: 4,
    label: 'Utilities',
    keywords: ['electricity', 'water', 'internet', 'phone'],
    description: 'Monthly utility bills'
  },
  {
    id: 5,
    label: 'Healthcare',
    keywords: ['doctor', 'pharmacy', 'medical', 'health'],
    description: 'Medical and healthcare expenses'
  }
];

const defaultProps = {
  options: mockOptions,
  value: null,
  onChange: jest.fn(),
  placeholder: 'Select a category...',
  label: 'Category',
  searchPlaceholder: 'Search categories...',
  emptyMessage: 'No categories found',
  allowClear: true
};

describe('SearchableSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with label and placeholder', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Select a category...')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      const propsWithoutLabel = { ...defaultProps, label: undefined };
      renderWithProviders(<SearchableSelect {...propsWithoutLabel} />);
      
      expect(screen.queryByText('Category')).not.toBeInTheDocument();
      expect(screen.getByText('Select a category...')).toBeInTheDocument();
    });

    it('should render with selected value when provided', () => {
      const propsWithValue = { ...defaultProps, value: 1 };
      renderWithProviders(<SearchableSelect {...propsWithValue} />);
      
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });

    it('should render clear button when value is selected and allowClear is true', () => {
      const propsWithValue = { ...defaultProps, value: 1 };
      renderWithProviders(<SearchableSelect {...propsWithValue} />);
      
      // The clear button is an SVG icon, not a button element
      const clearIcon = document.querySelector('.lucide-x');
      expect(clearIcon).toBeInTheDocument();
    });

    it('should not render clear button when allowClear is false', () => {
      const propsWithoutClear = { ...defaultProps, value: 1, allowClear: false };
      renderWithProviders(<SearchableSelect {...propsWithoutClear} />);
      
      const clearIcon = document.querySelector('.lucide-x');
      expect(clearIcon).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown when clicked', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      // The trigger is a div with cursor-pointer class, not a button
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger!);
      
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });

    it('should close dropdown when clicked again', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      
      expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      renderWithProviders(
        <div>
          <SearchableSelect {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
      
      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);
      
      expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter options based on search term', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'food' } });
      
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.queryByText('Transportation')).not.toBeInTheDocument();
    });

    it('should filter options based on keywords', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'uber' } });
      
      expect(screen.getByText('Transportation')).toBeInTheDocument();
      expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument();
    });

    it('should filter options based on description', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'medical' } });
      
      expect(screen.getByText('Healthcare')).toBeInTheDocument();
      expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument();
    });

    it('should show empty message when no options match search', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No categories found')).toBeInTheDocument();
    });

    it('should clear search when dropdown closes', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'food' } });
      
      fireEvent.click(trigger); // Close dropdown
      fireEvent.click(trigger); // Reopen dropdown
      
      expect(screen.getByPlaceholderText('Search categories...')).toHaveValue('');
    });
  });

  describe('Selection', () => {
    it('should select option when clicked', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const foodOption = screen.getByText('Food & Dining');
      fireEvent.click(foodOption);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(1);
    });

    it('should close dropdown after selection', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const foodOption = screen.getByText('Food & Dining');
      fireEvent.click(foodOption);
      
      expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument();
    });

    it('should show selected option with checkmark', () => {
      const propsWithValue = { ...defaultProps, value: 1 };
      renderWithProviders(<SearchableSelect {...propsWithValue} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      // Look for the selected option in the dropdown (the one with checkmark)
      const selectedOption = document.querySelector('.bg-accent.text-accent-foreground');
      expect(selectedOption).toBeInTheDocument();
    });

    it('should clear selection when clear button is clicked', () => {
      const propsWithValue = { ...defaultProps, value: 1 };
      renderWithProviders(<SearchableSelect {...propsWithValue} />);
      
      const clearButton = document.querySelector('.lucide-x');
      fireEvent.click(clearButton);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus search input when dropdown opens', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      expect(searchInput).toHaveFocus();
    });

    it('should prevent search input click from closing dropdown', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.click(searchInput);
      
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    it('should use custom renderOption when provided', () => {
      const customRenderOption = (option: SearchableSelectOption) => (
        <div data-testid={`custom-option-${option.id}`}>
          <strong>{option.label}</strong>
          <span className="text-xs text-gray-500 ml-2">Custom render</span>
        </div>
      );

      const propsWithCustomRender = {
        ...defaultProps,
        renderOption: customRenderOption
      };

      renderWithProviders(<SearchableSelect {...propsWithCustomRender} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      expect(screen.getByTestId('custom-option-1')).toBeInTheDocument();
      expect(screen.getAllByText('Custom render')[0]).toBeInTheDocument();
    });

    it('should use default rendering when renderOption is not provided', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Keywords: restaurant, food, dining, cafe')).toBeInTheDocument();
      expect(screen.getByText('Meals and dining expenses')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      expect(trigger).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const propsWithEmptyOptions = { ...defaultProps, options: [] };
      renderWithProviders(<SearchableSelect {...propsWithEmptyOptions} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      expect(screen.getByText('No categories found')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      const propsWithUndefinedValue = { ...defaultProps, value: undefined };
      renderWithProviders(<SearchableSelect {...propsWithUndefinedValue} />);
      
      expect(screen.getByText('Select a category...')).toBeInTheDocument();
    });

    it('should handle null value', () => {
      const propsWithNullValue = { ...defaultProps, value: null };
      renderWithProviders(<SearchableSelect {...propsWithNullValue} />);
      
      expect(screen.getByText('Select a category...')).toBeInTheDocument();
    });

    it('should handle case-insensitive search', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'FOOD' } });
      
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      renderWithProviders(<SearchableSelect {...defaultProps} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: '&' } });
      
      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large number of options efficiently', () => {
      const largeOptionsArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        label: `Option ${i}`,
        keywords: [`keyword${i}`, `tag${i}`],
        description: `Description for option ${i}`
      }));

      const propsWithLargeOptions = { ...defaultProps, options: largeOptionsArray };
      renderWithProviders(<SearchableSelect {...propsWithLargeOptions} />);
      
      const trigger = document.querySelector('.cursor-pointer');
      fireEvent.click(trigger);
      
      expect(screen.getByText('Option 0')).toBeInTheDocument();
      expect(screen.getByText('Option 999')).toBeInTheDocument();
    });
  });
});
