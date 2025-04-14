describe('Recurring Transaction Alert', () => {
  beforeEach(() => {
    // Mock the API responses
    cy.intercept('GET', '**/recurring-transactions/unconfirmed-patterns', {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: "Monthly Rent",
          amount: 1200,
          frequencyType: "monthly",
          frequencyEveryN: 1,
          startDate: "2023-01-01T00:00:00.000Z"
        }
      ]
    }).as('getPatterns');
    
    cy.intercept('GET', '**/recurring-transactions/*/linked-transactions', {
      statusCode: 200,
      body: [
        {
          id: 101,
          description: "Rent Payment January",
          executionDate: "2023-01-01T00:00:00.000Z",
          amount: 1200
        }
      ]
    }).as('getTransactions');
    
    // Mock the session
    cy.session('authenticated', () => {
      // Set up authentication
    });
    
    // Visit the dashboard page
    cy.visit('/dashboard');
  });
  
  it('should display the alert when unconfirmed patterns exist', () => {
    cy.wait('@getPatterns');
    cy.contains('Recurring Transactions Detected').should('be.visible');
  });
  
  it('should open the modal when review button is clicked', () => {
    cy.wait('@getPatterns');
    cy.contains('Review Patterns').click();
    cy.wait('@getTransactions');
    cy.contains('Recurring Transaction Pattern').should('be.visible');
    cy.contains('Monthly Rent').should('be.visible');
  });
  
  it('should confirm a pattern when confirm button is clicked', () => {
    cy.intercept('POST', '**/recurring-transactions/*/confirm-pattern', {
      statusCode: 200,
      body: { success: true }
    }).as('confirmPattern');
    
    cy.wait('@getPatterns');
    cy.contains('Review Patterns').click();
    cy.wait('@getTransactions');
    cy.contains('Confirm Pattern').click();
    cy.wait('@confirmPattern');
    
    // Test what happens after confirmation, such as a success message or UI update
    cy.contains('Pattern confirmed successfully').should('be.visible');
  });
  
  // Add more tests for other functionality
}); 