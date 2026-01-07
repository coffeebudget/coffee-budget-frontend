/**
 * E2E Tests for Expense Plan Suggestions
 *
 * Tests the full user workflow for the AI-powered expense plan suggestion system:
 * - Viewing suggestions dashboard
 * - Generating new suggestions
 * - Approving/rejecting suggestions
 * - Bulk actions
 * - Filtering and navigation
 */

describe('Expense Plan Suggestions', () => {
  // Mock data for suggestions
  const mockSuggestions = [
    {
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
      expenseType: 'subscription',
      isEssential: false,
      frequencyType: 'monthly',
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
      metadata: {
        transactionIds: [101, 102, 103],
        amountRange: { min: 15.99, max: 15.99 },
      },
    },
    {
      id: 2,
      suggestedName: 'Home Insurance',
      description: 'Annual home insurance premium',
      merchantName: 'ALLIANZ INSURANCE',
      representativeDescription: 'ALLIANZ INSURANCE PREMIUM',
      categoryId: 8,
      categoryName: 'Insurance',
      averageAmount: 1200.0,
      monthlyContribution: 100.0,
      yearlyTotal: 1200.0,
      expenseType: 'insurance',
      isEssential: true,
      frequencyType: 'annual',
      intervalDays: 365,
      patternConfidence: 92,
      classificationConfidence: 95,
      overallConfidence: 93,
      classificationReasoning: 'Annual insurance payment detected',
      occurrenceCount: 3,
      firstOccurrence: '2023-03-01',
      lastOccurrence: '2025-03-01',
      nextExpectedDate: '2026-03-01',
      status: 'pending',
      createdAt: '2026-01-05T10:00:00Z',
      metadata: {
        transactionIds: [201, 202, 203],
        amountRange: { min: 1150.0, max: 1250.0 },
      },
    },
    {
      id: 3,
      suggestedName: 'Gym Membership',
      description: 'Monthly gym subscription',
      merchantName: 'FITNESS FIRST',
      representativeDescription: 'FITNESS FIRST MONTHLY',
      categoryId: 10,
      categoryName: 'Health & Fitness',
      averageAmount: 49.99,
      monthlyContribution: 49.99,
      yearlyTotal: 599.88,
      expenseType: 'subscription',
      isEssential: false,
      frequencyType: 'monthly',
      intervalDays: 30,
      patternConfidence: 88,
      classificationConfidence: 82,
      overallConfidence: 85,
      classificationReasoning: 'Recurring gym membership detected',
      occurrenceCount: 8,
      firstOccurrence: '2025-05-01',
      lastOccurrence: '2025-12-01',
      nextExpectedDate: '2026-01-01',
      status: 'approved',
      createdAt: '2026-01-03T10:00:00Z',
    },
  ];

  const mockListResponse = {
    suggestions: mockSuggestions,
    total: 3,
    pending: 2,
    approved: 1,
    rejected: 0,
  };

  const mockPendingResponse = {
    suggestions: mockSuggestions.filter((s) => s.status === 'pending'),
    total: 3,
    pending: 2,
    approved: 1,
    rejected: 0,
  };

  const mockGenerateResponse = {
    suggestions: mockSuggestions.filter((s) => s.status === 'pending'),
    totalFound: 2,
    newSuggestions: 2,
    existingSuggestions: 0,
    processingTimeMs: 1500,
    summary: {
      byExpenseType: { subscription: 1, insurance: 1 },
      totalMonthlyContribution: 115.99,
      essentialCount: 1,
      discretionaryCount: 1,
    },
  };

  beforeEach(() => {
    // Mock authentication
    cy.mockLoggedIn();

    // Mock API endpoints
    cy.intercept('GET', '**/expense-plan-suggestions/pending', {
      statusCode: 200,
      body: mockPendingResponse,
    }).as('getPendingSuggestions');

    cy.intercept('GET', '**/expense-plan-suggestions*', {
      statusCode: 200,
      body: mockListResponse,
    }).as('getAllSuggestions');

    cy.intercept('POST', '**/expense-plan-suggestions/generate', {
      statusCode: 200,
      body: mockGenerateResponse,
    }).as('generateSuggestions');

    cy.intercept('POST', '**/expense-plan-suggestions/*/approve', {
      statusCode: 200,
      body: { success: true, suggestionId: 1, expensePlanId: 100 },
    }).as('approveSuggestion');

    cy.intercept('POST', '**/expense-plan-suggestions/*/reject', {
      statusCode: 200,
      body: { success: true, suggestionId: 1 },
    }).as('rejectSuggestion');

    cy.intercept('POST', '**/expense-plan-suggestions/bulk/approve', {
      statusCode: 200,
      body: { processed: 2, successful: 2, failed: 0, results: [] },
    }).as('bulkApprove');

    cy.intercept('POST', '**/expense-plan-suggestions/bulk/reject', {
      statusCode: 200,
      body: { processed: 2, successful: 2, failed: 0, results: [] },
    }).as('bulkReject');
  });

  describe('Page Load and Display', () => {
    it('should display the suggestions page with header and summary cards', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Verify page title
      cy.contains('Expense Plan Suggestions').should('be.visible');
      cy.contains('AI-detected recurring expenses').should('be.visible');

      // Verify action buttons
      cy.contains('button', 'Refresh').should('be.visible');
      cy.contains('button', 'Analyze Transactions').should('be.visible');

      // Verify summary cards
      cy.contains('Pending').should('be.visible');
      cy.contains('Approved').should('be.visible');
      cy.contains('Rejected').should('be.visible');
      cy.contains('Total').should('be.visible');
    });

    it('should display suggestion cards with correct information', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Verify Netflix suggestion card
      cy.contains('Netflix').should('be.visible');
      cy.contains('Subscription').should('be.visible');
      cy.contains('Entertainment').should('be.visible');

      // Verify Home Insurance suggestion card (with Essential badge)
      cy.contains('Home Insurance').should('be.visible');
      cy.contains('Insurance').should('be.visible');
      cy.contains('Essential').should('be.visible');

      // Verify confidence badges are displayed
      cy.contains('91%').should('be.visible'); // Netflix confidence
      cy.contains('93%').should('be.visible'); // Home Insurance confidence
    });

    it('should display monthly contribution totals', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Verify monthly contribution summary
      cy.contains('Total Monthly Contribution').should('be.visible');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Click on Approved tab
      cy.contains('[role="tab"]', 'Approved').click();
      cy.wait('@getAllSuggestions');

      // Click on Rejected tab
      cy.contains('[role="tab"]', 'Rejected').click();
      cy.wait('@getAllSuggestions');

      // Click on All tab
      cy.contains('[role="tab"]', 'All').click();
      cy.wait('@getAllSuggestions');

      // Click back to Pending
      cy.contains('[role="tab"]', 'Pending').click();
      cy.wait('@getPendingSuggestions');
    });
  });

  describe('Generate Suggestions', () => {
    it('should trigger analysis when clicking Analyze Transactions button', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Click the generate button
      cy.contains('button', 'Analyze Transactions').click();

      // Wait for the API call
      cy.wait('@generateSuggestions');

      // Should show success message (via toast)
      cy.contains('Found 2 new suggestion').should('be.visible');
    });

    it('should show loading state during analysis', () => {
      // Delay the response to see loading state
      cy.intercept('POST', '**/expense-plan-suggestions/generate', {
        statusCode: 200,
        body: mockGenerateResponse,
        delay: 1000,
      }).as('generateSuggestionsDelayed');

      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      cy.contains('button', 'Analyze Transactions').click();

      // Button should be disabled during loading
      cy.contains('button', 'Analyze Transactions').should('be.disabled');
    });
  });

  describe('Approve Suggestion', () => {
    it('should approve a suggestion via quick action', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Find and click the Create Plan button on the first card
      cy.contains('Netflix')
        .parents('[class*="Card"]')
        .within(() => {
          cy.contains('button', 'Create Plan').click();
        });

      // Confirm in the dialog
      cy.contains('Create Expense Plan?').should('be.visible');
      cy.contains('button', 'Create Plan').click();

      // Wait for API call
      cy.wait('@approveSuggestion');

      // Should show success toast
      cy.contains('Expense plan created').should('be.visible');
    });
  });

  describe('Reject Suggestion', () => {
    it('should reject a suggestion via quick action', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Find and click the Reject button on the first card
      cy.contains('Netflix')
        .parents('[class*="Card"]')
        .within(() => {
          cy.contains('button', 'Reject').click();
        });

      // Confirm in the dialog
      cy.contains('Reject Suggestion?').should('be.visible');
      cy.contains('button', 'Reject').last().click();

      // Wait for API call
      cy.wait('@rejectSuggestion');

      // Should show success toast
      cy.contains('Suggestion rejected').should('be.visible');
    });
  });

  describe('Bulk Actions', () => {
    it('should select all pending suggestions', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Click Select All button
      cy.contains('button', 'Select All').click();

      // Should show selection count
      cy.contains('2 selected').should('be.visible');

      // Bulk action buttons should appear
      cy.contains('button', 'Approve').should('be.visible');
      cy.get('button').contains('Reject').should('be.visible');
    });

    it('should deselect all when clicking Deselect All', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Select all first
      cy.contains('button', 'Select All').click();
      cy.contains('2 selected').should('be.visible');

      // Now deselect
      cy.contains('button', 'Deselect All').click();

      // Selection count should disappear
      cy.contains('2 selected').should('not.exist');
    });

    it('should bulk approve selected suggestions', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Select all
      cy.contains('button', 'Select All').click();

      // Click bulk approve
      cy.get('button').contains('Approve').click();

      // Wait for API call
      cy.wait('@bulkApprove');

      // Should show success message
      cy.contains('Approved 2 of 2').should('be.visible');
    });

    it('should bulk reject selected suggestions', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Select all
      cy.contains('button', 'Select All').click();

      // Click bulk reject (need to be specific since "Reject" appears multiple times)
      cy.get('.flex.items-center.gap-2').within(() => {
        cy.get('button').contains('Reject').click();
      });

      // Wait for API call
      cy.wait('@bulkReject');

      // Should show success message
      cy.contains('Rejected 2 of 2').should('be.visible');
    });
  });

  describe('Card Expand/Collapse', () => {
    it('should expand card to show more details', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Click "More details" on first card
      cy.contains('More details').first().click();

      // Should show expanded content
      cy.contains('Representative transaction').should('be.visible');
      cy.contains('Detection interval').should('be.visible');
      cy.contains('Yearly total').should('be.visible');

      // Click "Less details" to collapse
      cy.contains('Less details').first().click();

      // Expanded content should be hidden
      cy.contains('Representative transaction').should('not.exist');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no suggestions exist', () => {
      cy.intercept('GET', '**/expense-plan-suggestions/pending', {
        statusCode: 200,
        body: {
          suggestions: [],
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      }).as('getEmptySuggestions');

      cy.visit('/expense-plan-suggestions');
      cy.wait('@getEmptySuggestions');

      // Should show empty state message
      cy.contains('No pending suggestions').should('be.visible');
      cy.contains('Click "Analyze Transactions"').should('be.visible');

      // Should still have the analyze button
      cy.contains('button', 'Analyze Transactions').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', () => {
      cy.intercept('GET', '**/expense-plan-suggestions/pending', {
        statusCode: 500,
        body: { message: 'Internal server error' },
      }).as('getErrorSuggestions');

      cy.visit('/expense-plan-suggestions');
      cy.wait('@getErrorSuggestions');

      // Should show error message
      cy.contains('Error loading suggestions').should('be.visible');
    });

    it('should show error toast when generate fails', () => {
      cy.intercept('POST', '**/expense-plan-suggestions/generate', {
        statusCode: 500,
        body: { message: 'Failed to analyze transactions' },
      }).as('generateError');

      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      cy.contains('button', 'Analyze Transactions').click();
      cy.wait('@generateError');

      // Should show error toast
      cy.contains('Failed to generate suggestions').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Page should still be functional
      cy.contains('Expense Plan Suggestions').should('be.visible');
      cy.contains('Netflix').should('be.visible');

      // Summary cards should stack
      cy.get('.grid').should('have.class', 'grid-cols-2');
    });

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Page should display with tablet layout
      cy.contains('Expense Plan Suggestions').should('be.visible');
      cy.contains('Netflix').should('be.visible');
    });

    it('should display correctly on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Page should display with desktop layout
      cy.contains('Expense Plan Suggestions').should('be.visible');

      // Cards should be in grid layout
      cy.get('.md\\:grid-cols-2').should('exist');
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when clicking Refresh button', () => {
      cy.visit('/expense-plan-suggestions');
      cy.wait('@getPendingSuggestions');

      // Click refresh button
      cy.contains('button', 'Refresh').click();

      // Should trigger another API call
      cy.wait('@getPendingSuggestions');
    });
  });
});
