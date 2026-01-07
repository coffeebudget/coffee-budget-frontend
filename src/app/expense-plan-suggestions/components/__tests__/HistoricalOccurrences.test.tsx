import { render, screen } from '@testing-library/react';
import { HistoricalOccurrences, HistoricalOccurrencesCompact } from '../HistoricalOccurrences';

describe('HistoricalOccurrences', () => {
  const defaultProps = {
    occurrenceCount: 12,
    firstOccurrence: '2025-01-15',
    lastOccurrence: '2025-12-15',
    nextExpectedDate: '2026-01-15',
    averageAmount: 15.99,
  };

  describe('rendering', () => {
    it('should display occurrence count', () => {
      render(<HistoricalOccurrences {...defaultProps} />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText(/occurrences from/)).toBeInTheDocument();
    });

    it('should display date range', () => {
      render(<HistoricalOccurrences {...defaultProps} />);

      // Should show formatted dates (Italian locale)
      expect(screen.getByText(/gen 2025/i)).toBeInTheDocument(); // Jan 2025
      expect(screen.getByText(/dic 2025/i)).toBeInTheDocument(); // Dec 2025
    });

    it('should display next expected date', () => {
      render(<HistoricalOccurrences {...defaultProps} />);

      expect(screen.getByText(/Next expected/)).toBeInTheDocument();
      expect(screen.getByText(/15 gen 2026/i)).toBeInTheDocument(); // 15 Jan 2026
    });
  });

  describe('days until next', () => {
    it('should show days away for future dates', () => {
      // Mock date to be before next expected
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      render(
        <HistoricalOccurrences
          {...defaultProps}
          nextExpectedDate={futureDate.toISOString()}
        />
      );

      expect(screen.getByText(/days? away/)).toBeInTheDocument();
    });

    it('should show overdue for past dates within 7 days', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      render(
        <HistoricalOccurrences
          {...defaultProps}
          nextExpectedDate={pastDate.toISOString()}
        />
      );

      expect(screen.getByText('(overdue)')).toBeInTheDocument();
    });
  });

  describe('amount range', () => {
    it('should display amount range when min and max differ', () => {
      render(
        <HistoricalOccurrences
          {...defaultProps}
          amountRange={{ min: 10, max: 20 }}
        />
      );

      expect(screen.getByText(/Amount range/)).toBeInTheDocument();
      // Italian locale: "10,00 €" format
      expect(screen.getByText(/10[,.]00/)).toBeInTheDocument();
      expect(screen.getByText(/20[,.]00/)).toBeInTheDocument();
    });

    it('should not display amount range when min equals max', () => {
      render(
        <HistoricalOccurrences
          {...defaultProps}
          amountRange={{ min: 15.99, max: 15.99 }}
        />
      );

      expect(screen.queryByText(/Amount range/)).not.toBeInTheDocument();
    });

    it('should not display amount range when not provided', () => {
      render(<HistoricalOccurrences {...defaultProps} />);

      expect(screen.queryByText(/Amount range/)).not.toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <HistoricalOccurrences {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('HistoricalOccurrencesCompact', () => {
  const defaultProps = {
    occurrenceCount: 12,
    firstOccurrence: '2025-01-15',
    lastOccurrence: '2025-12-15',
  };

  it('should display occurrence count', () => {
    render(<HistoricalOccurrencesCompact {...defaultProps} />);

    expect(screen.getByText(/12 occurrences/)).toBeInTheDocument();
  });

  it('should display date range in compact format', () => {
    render(<HistoricalOccurrencesCompact {...defaultProps} />);

    // Should show 2-digit year format
    expect(screen.getByText(/gen 25/i)).toBeInTheDocument(); // Jan 25
    expect(screen.getByText(/dic 25/i)).toBeInTheDocument(); // Dec 25
  });

  it('should apply custom className', () => {
    const { container } = render(
      <HistoricalOccurrencesCompact {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
