// Page Object Model for Transactions Page

export class TransactionsPage {
  // Page URL
  static url = '/transactions';

  // Navigation
  static visit() {
    cy.visit(this.url);
  }

  // Page elements
  static getPageTitle() {
    return cy.get('[data-testid="transactions-page-title"]');
  }

  static getAddButton() {
    return cy.get('[data-testid="add-transaction-button"]');
  }

  static getTransactionList() {
    return cy.get('[data-testid="transaction-list"]');
  }

  static getTransactionRow(id: number) {
    return cy.get(`[data-testid="transaction-row-${id}"]`);
  }

  static getTransactionRows() {
    return cy.get('[data-testid^="transaction-row-"]');
  }

  // Filters
  static getFilterForm() {
    return cy.get('[data-testid="transaction-filters"]');
  }

  static getDateRangeFilter() {
    return cy.get('[data-testid="date-range-filter"]');
  }

  static getCategoryFilter() {
    return cy.get('[data-testid="category-filter"]');
  }

  static getBankAccountFilter() {
    return cy.get('[data-testid="bank-account-filter"]');
  }

  static getTypeFilter() {
    return cy.get('[data-testid="type-filter"]');
  }

  static getSearchInput() {
    return cy.get('[data-testid="transaction-search"]');
  }

  static getClearFiltersButton() {
    return cy.get('[data-testid="clear-filters-button"]');
  }

  static getApplyFiltersButton() {
    return cy.get('[data-testid="apply-filters-button"]');
  }

  // Actions
  static clickAddButton() {
    this.getAddButton().click();
  }

  static searchTransactions(searchTerm: string) {
    this.getSearchInput().clear().type(searchTerm);
  }

  static selectCategory(categoryName: string) {
    this.getCategoryFilter().select(categoryName);
  }

  static selectBankAccount(accountName: string) {
    this.getBankAccountFilter().select(accountName);
  }

  static selectType(type: 'income' | 'expense') {
    this.getTypeFilter().select(type);
  }

  static applyFilters() {
    this.getApplyFiltersButton().click();
  }

  static clearFilters() {
    this.getClearFiltersButton().click();
  }

  // Transaction row actions
  static clickTransactionRow(id: number) {
    this.getTransactionRow(id).click();
  }

  static clickEditButton(id: number) {
    this.getTransactionRow(id).within(() => {
      cy.get('[data-testid="edit-transaction-button"]').click();
    });
  }

  static clickDeleteButton(id: number) {
    this.getTransactionRow(id).within(() => {
      cy.get('[data-testid="delete-transaction-button"]').click();
    });
  }

  static clickDuplicateButton(id: number) {
    this.getTransactionRow(id).within(() => {
      cy.get('[data-testid="duplicate-transaction-button"]').click();
    });
  }

  // Transaction row content
  static getTransactionDescription(id: number) {
    return this.getTransactionRow(id).find('[data-testid="transaction-description"]');
  }

  static getTransactionAmount(id: number) {
    return this.getTransactionRow(id).find('[data-testid="transaction-amount"]');
  }

  static getTransactionCategory(id: number) {
    return this.getTransactionRow(id).find('[data-testid="transaction-category"]');
  }

  static getTransactionDate(id: number) {
    return this.getTransactionRow(id).find('[data-testid="transaction-date"]');
  }

  static getTransactionStatus(id: number) {
    return this.getTransactionRow(id).find('[data-testid="transaction-status"]');
  }

  // Pagination
  static getPagination() {
    return cy.get('[data-testid="transaction-pagination"]');
  }

  static getNextPageButton() {
    return cy.get('[data-testid="next-page-button"]');
  }

  static getPreviousPageButton() {
    return cy.get('[data-testid="previous-page-button"]');
  }

  static getPageNumber(page: number) {
    return cy.get(`[data-testid="page-number-${page}"]`);
  }

  static clickNextPage() {
    this.getNextPageButton().click();
  }

  static clickPreviousPage() {
    this.getPreviousPageButton().click();
  }

  static clickPageNumber(page: number) {
    this.getPageNumber(page).click();
  }

  // Bulk actions
  static getBulkActions() {
    return cy.get('[data-testid="bulk-actions"]');
  }

  static getSelectAllCheckbox() {
    return cy.get('[data-testid="select-all-checkbox"]');
  }

  static getTransactionCheckbox(id: number) {
    return this.getTransactionRow(id).find('[data-testid="transaction-checkbox"]');
  }

  static selectTransaction(id: number) {
    this.getTransactionCheckbox(id).check();
  }

  static selectAllTransactions() {
    this.getSelectAllCheckbox().check();
  }

  static getBulkDeleteButton() {
    return cy.get('[data-testid="bulk-delete-button"]');
  }

  static getBulkCategorizeButton() {
    return cy.get('[data-testid="bulk-categorize-button"]');
  }

  static getBulkExportButton() {
    return cy.get('[data-testid="bulk-export-button"]');
  }

  static clickBulkDelete() {
    this.getBulkDeleteButton().click();
  }

  static clickBulkCategorize() {
    this.getBulkCategorizeButton().click();
  }

  static clickBulkExport() {
    this.getBulkExportButton().click();
  }

  // Import/Export
  static getImportButton() {
    return cy.get('[data-testid="import-transactions-button"]');
  }

  static getExportButton() {
    return cy.get('[data-testid="export-transactions-button"]');
  }

  static clickImport() {
    this.getImportButton().click();
  }

  static clickExport() {
    this.getExportButton().click();
  }

  // Statistics
  static getStats() {
    return cy.get('[data-testid="transaction-stats"]');
  }

  static getTotalIncome() {
    return cy.get('[data-testid="total-income"]');
  }

  static getTotalExpenses() {
    return cy.get('[data-testid="total-expenses"]');
  }

  static getNetAmount() {
    return cy.get('[data-testid="net-amount"]');
  }

  static getTransactionCount() {
    return cy.get('[data-testid="transaction-count"]');
  }

  // Loading states
  static getLoadingSpinner() {
    return cy.get('[data-testid="transaction-loading"]');
  }

  static getEmptyState() {
    return cy.get('[data-testid="empty-transactions"]');
  }

  static getErrorState() {
    return cy.get('[data-testid="transaction-error"]');
  }

  // Assertions
  static shouldHaveTitle(title: string) {
    this.getPageTitle().should('contain.text', title);
  }

  static shouldHaveTransactionCount(count: number) {
    this.getTransactionRows().should('have.length', count);
  }

  static shouldHaveTransaction(id: number, description: string) {
    this.getTransactionDescription(id).should('contain.text', description);
  }

  static shouldHaveTransactionAmount(id: number, amount: string) {
    this.getTransactionAmount(id).should('contain.text', amount);
  }

  static shouldHaveTransactionCategory(id: number, category: string) {
    this.getTransactionCategory(id).should('contain.text', category);
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
  static waitForTransactionsToLoad() {
    this.getLoadingSpinner().should('not.exist');
    this.getTransactionList().should('be.visible');
  }

  static waitForTransactionToAppear(id: number) {
    this.getTransactionRow(id).should('be.visible');
  }

  static waitForTransactionToDisappear(id: number) {
    this.getTransactionRow(id).should('not.exist');
  }
}
