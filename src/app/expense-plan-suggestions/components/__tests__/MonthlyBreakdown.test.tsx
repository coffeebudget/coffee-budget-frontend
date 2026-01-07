import { render, screen } from '@testing-library/react';
import { MonthlyBreakdown, MonthlyBreakdownCompact } from '../MonthlyBreakdown';
import { FrequencyType } from '@/types/expense-plan-suggestion-types';

describe('MonthlyBreakdown', () => {
  const defaultProps = {
    averageAmount: 100,
    monthlyContribution: 100,
    yearlyTotal: 1200,
    frequencyType: FrequencyType.MONTHLY,
  };

  describe('monthly frequency', () => {
    it('should display monthly cost without savings explanation', () => {
      render(<MonthlyBreakdown {...defaultProps} />);

      expect(screen.getByText('Monthly Cost')).toBeInTheDocument();
      // Currency format varies by environment, use regex
      expect(screen.getByText(/100[,.]00/)).toBeInTheDocument();

      // Should NOT show monthly saving for monthly frequency
      expect(screen.queryByText('Monthly Saving')).not.toBeInTheDocument();
    });

    it('should display yearly total', () => {
      render(<MonthlyBreakdown {...defaultProps} />);

      expect(screen.getByText('Yearly Total')).toBeInTheDocument();
      expect(screen.getByText(/1[,.]?200[,.]00/)).toBeInTheDocument();
    });
  });

  describe('quarterly frequency', () => {
    it('should display quarterly cost with monthly saving', () => {
      render(
        <MonthlyBreakdown
          averageAmount={300}
          monthlyContribution={100}
          yearlyTotal={1200}
          frequencyType={FrequencyType.QUARTERLY}
        />
      );

      expect(screen.getByText('Every 3 Months Cost')).toBeInTheDocument();
      // Amount appears multiple times - use getAllByText
      expect(screen.getAllByText(/300[,.]00/).length).toBeGreaterThan(0);
      expect(screen.getByText('Monthly Saving')).toBeInTheDocument();
      expect(screen.getAllByText(/100[,.]00/).length).toBeGreaterThan(0);
    });

    it('should display savings explanation', () => {
      render(
        <MonthlyBreakdown
          averageAmount={300}
          monthlyContribution={100}
          yearlyTotal={1200}
          frequencyType={FrequencyType.QUARTERLY}
        />
      );

      expect(
        screen.getByText(/Save .* each month to cover your every 3 months expense/)
      ).toBeInTheDocument();
    });
  });

  describe('annual frequency', () => {
    it('should display yearly cost with monthly saving', () => {
      render(
        <MonthlyBreakdown
          averageAmount={1200}
          monthlyContribution={100}
          yearlyTotal={1200}
          frequencyType={FrequencyType.ANNUAL}
        />
      );

      expect(screen.getByText('Yearly Cost')).toBeInTheDocument();
      // Amounts appear multiple times - use getAllByText
      expect(screen.getAllByText(/1[,.]?200[,.]00/).length).toBeGreaterThan(0);
      expect(screen.getByText('Monthly Saving')).toBeInTheDocument();
      expect(screen.getAllByText(/100[,.]00/).length).toBeGreaterThan(0);
    });
  });

  describe('semiannual frequency', () => {
    it('should display semiannual cost with monthly saving', () => {
      render(
        <MonthlyBreakdown
          averageAmount={600}
          monthlyContribution={100}
          yearlyTotal={1200}
          frequencyType={FrequencyType.SEMIANNUAL}
        />
      );

      expect(screen.getByText('Every 6 Months Cost')).toBeInTheDocument();
      expect(screen.getByText('Monthly Saving')).toBeInTheDocument();
    });
  });

  describe('weekly frequency', () => {
    it('should display weekly cost with monthly saving', () => {
      render(
        <MonthlyBreakdown
          averageAmount={25}
          monthlyContribution={100}
          yearlyTotal={1300}
          frequencyType={FrequencyType.WEEKLY}
        />
      );

      expect(screen.getByText('Weekly Cost')).toBeInTheDocument();
      expect(screen.getByText('Monthly Saving')).toBeInTheDocument();
    });
  });

  describe('biweekly frequency', () => {
    it('should display biweekly cost with monthly saving', () => {
      render(
        <MonthlyBreakdown
          averageAmount={50}
          monthlyContribution={100}
          yearlyTotal={1300}
          frequencyType={FrequencyType.BIWEEKLY}
        />
      );

      expect(screen.getByText('Every 2 Weeks Cost')).toBeInTheDocument();
      expect(screen.getByText('Monthly Saving')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MonthlyBreakdown {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('MonthlyBreakdownCompact', () => {
  it('should display monthly contribution prominently', () => {
    render(
      <MonthlyBreakdownCompact
        averageAmount={100}
        monthlyContribution={100}
        frequencyType={FrequencyType.MONTHLY}
      />
    );

    // Italian locale: "100,00 €" format (€ at end)
    expect(screen.getByText(/100[,.]00/)).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
  });

  it('should show frequency info for non-monthly expenses', () => {
    render(
      <MonthlyBreakdownCompact
        averageAmount={1200}
        monthlyContribution={100}
        frequencyType={FrequencyType.ANNUAL}
      />
    );

    // Italian locale: "100,00 €" format (€ at end)
    expect(screen.getByText(/100[,.]00/)).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
    expect(screen.getByText(/1[,.]?200[,.]00.*every year/i)).toBeInTheDocument();
  });

  it('should not show frequency info for monthly expenses', () => {
    render(
      <MonthlyBreakdownCompact
        averageAmount={100}
        monthlyContribution={100}
        frequencyType={FrequencyType.MONTHLY}
      />
    );

    // Should only show monthly amount, not the "every month" explanation
    expect(screen.queryByText(/every month/i)).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MonthlyBreakdownCompact
        averageAmount={100}
        monthlyContribution={100}
        frequencyType={FrequencyType.MONTHLY}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
