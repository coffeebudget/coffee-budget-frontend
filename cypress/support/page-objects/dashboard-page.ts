// Page Object Model for Dashboard Page

export class DashboardPage {
  // Page URL
  static url = '/dashboard';

  // Navigation
  static visit() {
    cy.visit(this.url);
  }

  // Page elements
  static getPageTitle() {
    return cy.get('[data-testid="dashboard-page-title"]');
  }

  static getWelcomeMessage() {
    return cy.get('[data-testid="welcome-message"]');
  }

  // Statistics cards
  static getStatsCards() {
    return cy.get('[data-testid="stats-cards"]');
  }

  static getTotalIncomeCard() {
    return cy.get('[data-testid="total-income-card"]');
  }

  static getTotalExpensesCard() {
    return cy.get('[data-testid="total-expenses-card"]');
  }

  static getNetAmountCard() {
    return cy.get('[data-testid="net-amount-card"]');
  }

  static getTransactionCountCard() {
    return cy.get('[data-testid="transaction-count-card"]');
  }

  // Recent transactions
  static getRecentTransactions() {
    return cy.get('[data-testid="recent-transactions"]');
  }

  static getRecentTransactionsList() {
    return cy.get('[data-testid="recent-transactions-list"]');
  }

  static getRecentTransactionRow(id: number) {
    return cy.get(`[data-testid="recent-transaction-${id}"]`);
  }

  static getViewAllTransactionsLink() {
    return cy.get('[data-testid="view-all-transactions-link"]');
  }

  // Charts
  static getCharts() {
    return cy.get('[data-testid="dashboard-charts"]');
  }

  static getIncomeChart() {
    return cy.get('[data-testid="income-chart"]');
  }

  static getExpensesChart() {
    return cy.get('[data-testid="expenses-chart"]');
  }

  static getCategoryBreakdownChart() {
    return cy.get('[data-testid="category-breakdown-chart"]');
  }

  static getMonthlyTrendChart() {
    return cy.get('[data-testid="monthly-trend-chart"]');
  }

  // Alerts
  static getAlerts() {
    return cy.get('[data-testid="dashboard-alerts"]');
  }

  static getAlert(type: string) {
    return cy.get(`[data-testid="alert-${type}"]`);
  }

  static getBudgetAlert() {
    return this.getAlert('budget');
  }

  static getSavingsAlert() {
    return this.getAlert('savings');
  }

  static getRecurringTransactionAlert() {
    return cy.get('[data-testid="recurring-transaction-alert"]');
  }

  static getSmartAlerts() {
    return cy.get('[data-testid="smart-alerts"]');
  }

  // Quick actions
  static getQuickActions() {
    return cy.get('[data-testid="quick-actions"]');
  }

  static getAddTransactionButton() {
    return cy.get('[data-testid="add-transaction-button"]');
  }

  static getAddBankAccountButton() {
    return cy.get('[data-testid="add-bank-account-button"]');
  }

  static getImportTransactionsButton() {
    return cy.get('[data-testid="import-transactions-button"]');
  }

  static getViewReportsButton() {
    return cy.get('[data-testid="view-reports-button"]');
  }

  // Navigation shortcuts
  static getNavigationShortcuts() {
    return cy.get('[data-testid="navigation-shortcuts"]');
  }

  static getTransactionsLink() {
    return cy.get('[data-testid="transactions-link"]');
  }

  static getBankAccountsLink() {
    return cy.get('[data-testid="bank-accounts-link"]');
  }

  static getCategoriesLink() {
    return cy.get('[data-testid="categories-link"]');
  }

  static getReportsLink() {
    return cy.get('[data-testid="reports-link"]');
  }

  // Time period selector
  static getTimePeriodSelector() {
    return cy.get('[data-testid="time-period-selector"]');
  }

  static getTimePeriodOption(period: string) {
    return cy.get(`[data-testid="time-period-${period}"]`);
  }

  static selectTimePeriod(period: string) {
    this.getTimePeriodSelector().select(period);
  }

  // Actions
  static clickAddTransaction() {
    this.getAddTransactionButton().click();
  }

  static clickAddBankAccount() {
    this.getAddBankAccountButton().click();
  }

  static clickImportTransactions() {
    this.getImportTransactionsButton().click();
  }

  static clickViewReports() {
    this.getViewReportsButton().click();
  }

  static clickViewAllTransactions() {
    this.getViewAllTransactionsLink().click();
  }

  static clickTransactionsLink() {
    this.getTransactionsLink().click();
  }

  static clickBankAccountsLink() {
    this.getBankAccountsLink().click();
  }

  static clickCategoriesLink() {
    this.getCategoriesLink().click();
  }

  static clickReportsLink() {
    this.getReportsLink().click();
  }

  // Alert actions
  static clickAlertAction(alertType: string, action: string) {
    this.getAlert(alertType).within(() => {
      cy.get(`[data-testid="alert-action-${action}"]`).click();
    });
  }

  static dismissAlert(alertType: string) {
    this.getAlert(alertType).within(() => {
      cy.get('[data-testid="dismiss-alert-button"]').click();
    });
  }

  // Chart interactions
  static hoverChartPoint(chartTestId: string, pointIndex: number) {
    this.getChart(chartTestId).find(`[data-testid="chart-point-${pointIndex}"]`).trigger('mouseover');
  }

  static clickChartPoint(chartTestId: string, pointIndex: number) {
    this.getChart(chartTestId).find(`[data-testid="chart-point-${pointIndex}"]`).click();
  }

  static getChartTooltip() {
    return cy.get('[data-testid="chart-tooltip"]');
  }

  // Helper method for charts
  private static getChart(chartTestId: string) {
    return cy.get(`[data-testid="${chartTestId}"]`);
  }

  // Loading states
  static getLoadingSpinner() {
    return cy.get('[data-testid="dashboard-loading"]');
  }

  static getErrorState() {
    return cy.get('[data-testid="dashboard-error"]');
  }

  static getEmptyState() {
    return cy.get('[data-testid="empty-dashboard"]');
  }

  // Assertions
  static shouldHaveTitle(title: string) {
    this.getPageTitle().should('contain.text', title);
  }

  static shouldHaveWelcomeMessage(message: string) {
    this.getWelcomeMessage().should('contain.text', message);
  }

  static shouldShowStatsCards() {
    this.getStatsCards().should('be.visible');
  }

  static shouldHaveTotalIncome(amount: string) {
    this.getTotalIncomeCard().should('contain.text', amount);
  }

  static shouldHaveTotalExpenses(amount: string) {
    this.getTotalExpensesCard().should('contain.text', amount);
  }

  static shouldHaveNetAmount(amount: string) {
    this.getNetAmountCard().should('contain.text', amount);
  }

  static shouldHaveTransactionCount(count: string) {
    this.getTransactionCountCard().should('contain.text', count);
  }

  static shouldShowRecentTransactions() {
    this.getRecentTransactions().should('be.visible');
  }

  static shouldHaveRecentTransaction(id: number, description: string) {
    this.getRecentTransactionRow(id).should('contain.text', description);
  }

  static shouldShowCharts() {
    this.getCharts().should('be.visible');
  }

  static shouldShowAlert(type: string) {
    this.getAlert(type).should('be.visible');
  }

  static shouldNotShowAlert(type: string) {
    this.getAlert(type).should('not.exist');
  }

  static shouldShowQuickActions() {
    this.getQuickActions().should('be.visible');
  }

  static shouldBeLoading() {
    this.getLoadingSpinner().should('be.visible');
  }

  static shouldNotBeLoading() {
    this.getLoadingSpinner().should('not.exist');
  }

  static shouldShowEmptyState() {
    this.getEmptyState().should('be.visible');
  }

  static shouldShowErrorState() {
    this.getErrorState().should('be.visible');
  }

  // Utility methods
  static waitForDashboardToLoad() {
    this.getLoadingSpinner().should('not.exist');
    this.getStatsCards().should('be.visible');
  }

  static waitForChartsToLoad() {
    this.getCharts().should('be.visible');
    // Wait for charts to be rendered
    cy.wait(1000);
  }

  static waitForAlertsToLoad() {
    this.getAlerts().should('be.visible');
  }

  static refreshDashboard() {
    cy.reload();
    this.waitForDashboardToLoad();
  }

  // Data verification
  static verifyStatsData() {
    this.getTotalIncomeCard().should('be.visible');
    this.getTotalExpensesCard().should('be.visible');
    this.getNetAmountCard().should('be.visible');
    this.getTransactionCountCard().should('be.visible');
  }

  static verifyRecentTransactions() {
    this.getRecentTransactions().should('be.visible');
    this.getRecentTransactionsList().should('be.visible');
  }

  static verifyCharts() {
    this.getCharts().should('be.visible');
    this.getIncomeChart().should('be.visible');
    this.getExpensesChart().should('be.visible');
  }
}
