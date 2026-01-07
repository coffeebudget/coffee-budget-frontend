import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionCard, SuggestionCardCompact } from '../SuggestionCard';
import {
  ExpensePlanSuggestion,
  ExpenseType,
  FrequencyType,
} from '@/types/expense-plan-suggestion-types';

const createMockSuggestion = (
  overrides: Partial<ExpensePlanSuggestion> = {}
): ExpensePlanSuggestion => ({
  id: 1,
  suggestedName: 'Netflix',
  description: 'Streaming subscription',
  merchantName: 'NETFLIX.COM',
  representativeDescription: 'NETFLIX.COM AMSTERDAM NL',
  categoryId: 5,
  categoryName: 'Entertainment',
  averageAmount: 15.99,
  monthlyContribution: 15.99,
  yearlyTotal: 191.88,
  expenseType: ExpenseType.SUBSCRIPTION,
  isEssential: false,
  frequencyType: FrequencyType.MONTHLY,
  intervalDays: 30,
  patternConfidence: 95,
  classificationConfidence: 88,
  overallConfidence: 91,
  classificationReasoning: 'Streaming service subscription pattern detected',
  occurrenceCount: 12,
  firstOccurrence: '2025-01-15',
  lastOccurrence: '2025-12-15',
  nextExpectedDate: '2026-01-15',
  status: 'pending',
  createdAt: '2026-01-05T10:00:00Z',
  ...overrides,
});

describe('SuggestionCard', () => {
  describe('rendering', () => {
    it('should display suggestion name', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    it('should display expense type badge', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      expect(screen.getByText('Subscription')).toBeInTheDocument();
    });

    it('should display category name', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      expect(screen.getByText('Entertainment')).toBeInTheDocument();
    });

    it('should display confidence badge', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      expect(screen.getByText('91% confidence')).toBeInTheDocument();
    });

    it('should display occurrence count', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      expect(screen.getByText(/12 occurrences/)).toBeInTheDocument();
    });
  });

  describe('essential badge', () => {
    it('should show Essential badge when isEssential is true', () => {
      render(
        <SuggestionCard suggestion={createMockSuggestion({ isEssential: true })} />
      );

      expect(screen.getByText('Essential')).toBeInTheDocument();
    });

    it('should not show Essential badge when isEssential is false', () => {
      render(
        <SuggestionCard suggestion={createMockSuggestion({ isEssential: false })} />
      );

      expect(screen.queryByText('Essential')).not.toBeInTheDocument();
    });
  });

  describe('name fallback', () => {
    it('should use merchantName when suggestedName is empty', () => {
      render(
        <SuggestionCard
          suggestion={createMockSuggestion({
            suggestedName: '',
            merchantName: 'MERCHANT NAME',
          })}
        />
      );

      expect(screen.getByText('MERCHANT NAME')).toBeInTheDocument();
    });

    it('should use representativeDescription when suggestedName and merchantName are empty', () => {
      render(
        <SuggestionCard
          suggestion={createMockSuggestion({
            suggestedName: '',
            merchantName: null,
            representativeDescription: 'Representative Description',
          })}
        />
      );

      expect(screen.getByText('Representative Description')).toBeInTheDocument();
    });
  });

  describe('status handling', () => {
    it('should show action buttons for pending suggestions', () => {
      const onApprove = jest.fn();
      const onReject = jest.fn();

      render(
        <SuggestionCard
          suggestion={createMockSuggestion({ status: 'pending' })}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      expect(screen.getByText('Create Plan')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    it('should not show action buttons for approved suggestions', () => {
      render(
        <SuggestionCard
          suggestion={createMockSuggestion({ status: 'approved' })}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      expect(screen.queryByText('Create Plan')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    });

    it('should show status badge for non-pending suggestions', () => {
      render(
        <SuggestionCard suggestion={createMockSuggestion({ status: 'approved' })} />
      );

      expect(screen.getByText('Approved')).toBeInTheDocument();
    });
  });

  describe('action callbacks', () => {
    it('should call onApprove when Create Plan is clicked', () => {
      const onApprove = jest.fn();

      render(
        <SuggestionCard
          suggestion={createMockSuggestion()}
          onApprove={onApprove}
        />
      );

      fireEvent.click(screen.getByText('Create Plan'));

      expect(onApprove).toHaveBeenCalledWith(1);
    });

    it('should call onReject when Reject is clicked', () => {
      const onReject = jest.fn();

      render(
        <SuggestionCard
          suggestion={createMockSuggestion()}
          onReject={onReject}
        />
      );

      fireEvent.click(screen.getByText('Reject'));

      expect(onReject).toHaveBeenCalledWith(1);
    });
  });

  describe('selection', () => {
    it('should show checkbox when onSelect is provided', () => {
      render(
        <SuggestionCard
          suggestion={createMockSuggestion()}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should call onSelect when checkbox is clicked', () => {
      const onSelect = jest.fn();

      render(
        <SuggestionCard
          suggestion={createMockSuggestion()}
          onSelect={onSelect}
        />
      );

      fireEvent.click(screen.getByRole('checkbox'));

      expect(onSelect).toHaveBeenCalledWith(1, true);
    });

    it('should show selected styling when isSelected is true', () => {
      const { container } = render(
        <SuggestionCard
          suggestion={createMockSuggestion()}
          onSelect={jest.fn()}
          isSelected={true}
        />
      );

      expect(container.firstChild).toHaveClass('ring-2');
      expect(container.firstChild).toHaveClass('ring-blue-500');
    });
  });

  describe('expand/collapse', () => {
    it('should show More details button', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      expect(screen.getByText('More details')).toBeInTheDocument();
    });

    it('should expand to show details when More details is clicked', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      fireEvent.click(screen.getByText('More details'));

      expect(screen.getByText(/Representative transaction/)).toBeInTheDocument();
      expect(screen.getByText(/Detection interval/)).toBeInTheDocument();
      expect(screen.getByText(/Yearly total/)).toBeInTheDocument();
    });

    it('should collapse when Less details is clicked', () => {
      render(<SuggestionCard suggestion={createMockSuggestion()} />);

      // Expand
      fireEvent.click(screen.getByText('More details'));
      expect(screen.getByText(/Representative transaction/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Less details'));
      expect(screen.queryByText(/Representative transaction/)).not.toBeInTheDocument();
    });

    it('should show AI reasoning when expanded and available', () => {
      render(
        <SuggestionCard
          suggestion={createMockSuggestion({
            classificationReasoning: 'AI detected this pattern',
          })}
        />
      );

      fireEvent.click(screen.getByText('More details'));

      expect(screen.getByText(/AI reasoning/)).toBeInTheDocument();
      expect(screen.getByText('AI detected this pattern')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should disable buttons when isLoading is true', () => {
      render(
        <SuggestionCard
          suggestion={createMockSuggestion()}
          onApprove={jest.fn()}
          onReject={jest.fn()}
          isLoading={true}
        />
      );

      expect(screen.getByText('Create Plan').closest('button')).toBeDisabled();
      expect(screen.getByText('Reject').closest('button')).toBeDisabled();
    });
  });
});

describe('SuggestionCardCompact', () => {
  describe('rendering', () => {
    it('should display suggestion name', () => {
      render(<SuggestionCardCompact suggestion={createMockSuggestion()} />);

      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    it('should display expense type icon', () => {
      render(<SuggestionCardCompact suggestion={createMockSuggestion()} />);

      // Subscription emoji
      expect(screen.getByText('📱')).toBeInTheDocument();
    });

    it('should display monthly contribution', () => {
      render(<SuggestionCardCompact suggestion={createMockSuggestion()} />);

      // Currency format varies by environment, use regex
      expect(screen.getByText(/15[,.]99/)).toBeInTheDocument();
      expect(screen.getByText('/month')).toBeInTheDocument();
    });

    it('should display occurrence count', () => {
      render(<SuggestionCardCompact suggestion={createMockSuggestion()} />);

      expect(screen.getByText('12 occurrences')).toBeInTheDocument();
    });
  });

  describe('essential indicator', () => {
    it('should show star icon when essential', () => {
      const { container } = render(
        <SuggestionCardCompact
          suggestion={createMockSuggestion({ isEssential: true })}
        />
      );

      // Check for star icon (lucide-react Star component)
      const starIcon = container.querySelector('.text-amber-500');
      expect(starIcon).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should show action buttons for pending suggestions', () => {
      render(
        <SuggestionCardCompact
          suggestion={createMockSuggestion()}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      // Icon buttons with title attributes
      expect(screen.getByTitle('Create Plan')).toBeInTheDocument();
      expect(screen.getByTitle('Reject')).toBeInTheDocument();
    });

    it('should call onApprove when approve button is clicked', () => {
      const onApprove = jest.fn();

      render(
        <SuggestionCardCompact
          suggestion={createMockSuggestion()}
          onApprove={onApprove}
        />
      );

      fireEvent.click(screen.getByTitle('Create Plan'));

      expect(onApprove).toHaveBeenCalledWith(1);
    });

    it('should call onReject when reject button is clicked', () => {
      const onReject = jest.fn();

      render(
        <SuggestionCardCompact
          suggestion={createMockSuggestion()}
          onReject={onReject}
        />
      );

      fireEvent.click(screen.getByTitle('Reject'));

      expect(onReject).toHaveBeenCalledWith(1);
    });
  });
});
