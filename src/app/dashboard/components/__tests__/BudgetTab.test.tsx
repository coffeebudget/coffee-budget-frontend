import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock all child components
jest.mock('../BudgetSummaryBar', () => {
  return function MockBudgetSummaryBar() {
    return <div data-testid="budget-summary-bar">BudgetSummaryBar</div>;
  };
});

jest.mock('../SavingsProgressTable', () => {
  return function MockSavingsProgressTable() {
    return <div data-testid="savings-progress-table">SavingsProgressTable</div>;
  };
});

jest.mock('../AccountDistribution', () => {
  return function MockAccountDistribution() {
    return <div data-testid="account-distribution">AccountDistribution</div>;
  };
});

jest.mock('../CoverageMonitorCompact', () => {
  return function MockCoverageMonitorCompact() {
    return <div data-testid="coverage-monitor-compact">CoverageMonitorCompact</div>;
  };
});

jest.mock('../CreditCardsSummary', () => {
  return function MockCreditCardsSummary() {
    return <div data-testid="credit-cards-summary">CreditCardsSummary</div>;
  };
});

import BudgetTab from '../BudgetTab';

describe('BudgetTab', () => {
  it('should render all 5 sections', () => {
    render(<BudgetTab selectedMonth="2026-02" />);

    expect(screen.getByTestId('budget-summary-bar')).toBeInTheDocument();
    expect(screen.getByTestId('savings-progress-table')).toBeInTheDocument();
    expect(screen.getByTestId('account-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('coverage-monitor-compact')).toBeInTheDocument();
    expect(screen.getByTestId('credit-cards-summary')).toBeInTheDocument();
  });

  it('should render sections in correct order', () => {
    render(<BudgetTab selectedMonth="2026-02" />);

    const container = screen.getByTestId('budget-summary-bar').parentElement!;
    const children = Array.from(container.children);

    expect(children[0]).toHaveAttribute('data-testid', 'budget-summary-bar');
    expect(children[1]).toHaveAttribute('data-testid', 'savings-progress-table');
    expect(children[2]).toHaveAttribute('data-testid', 'account-distribution');
    expect(children[3]).toHaveAttribute('data-testid', 'coverage-monitor-compact');
    expect(children[4]).toHaveAttribute('data-testid', 'credit-cards-summary');
  });
});
