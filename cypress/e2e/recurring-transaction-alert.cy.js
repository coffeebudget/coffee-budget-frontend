describe('Recurring Transaction Alert', () => {
  beforeEach(() => {
    // Stub API responses
    cy.intercept('GET', '**/recurring-transactions/unconfirmed-patterns', {
      statusCode: 200,
      body: [{ id: 1 }, { id: 2 }] // Mock 2 unconfirmed patterns
    }).as('getPatterns');
    
    cy.intercept('GET', '**/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          accessToken: 'mock-token'
        }
      }
    }).as('getSession');
    
    // Visit dashboard page
    cy.visit('/dashboard');
  });

  it('should display the alert when unconfirmed patterns exist', () => {
    // Wait for the component to be loaded
    cy.get('[data-testid="recurring-transaction-alert"]').should('exist');
    cy.contains('Recurring Transactions Detected').should('be.visible');
    cy.contains('We\'ve detected 2 potential recurring transaction patterns').should('be.visible');
  });

  it('should have a link to review patterns page', () => {
    cy.get('[data-testid="recurring-transaction-alert"]')
      .find('a')
      .should('have.attr', 'href', '/recurring-transactions/review-patterns')
      .and('contain', 'Review Patterns');
  });

  it('should navigate to the review patterns page when the link is clicked', () => {
    // Stub the navigation to prevent actual page change in test
    cy.window().then((win) => {
      cy.stub(win, 'location').as('windowLocation');
    });
    
    cy.get('[data-testid="recurring-transaction-alert"]')
      .find('a')
      .click();
      
    // Verify navigation would happen to the correct URL
    cy.location('pathname').should('include', '/recurring-transactions/review-patterns');
  });
}); 