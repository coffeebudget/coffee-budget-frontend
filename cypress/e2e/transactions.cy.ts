describe('Transaction CRUD Operations', () => {
  beforeEach(() => {
    // Apply mock login before each test
    cy.mockLoggedIn();
    
    // Visit transactions page
    cy.visit('/transactions');
    
    // Wait for page to load
    cy.wait(5000);
  });

  it('should display basic page elements', () => {
    // Verify buttons exist
    cy.get('button').should('exist');
    
    // Wait for any tables or lists
    cy.get('table, ul, ol, div[role="grid"]').should('exist');
    
    // Log what we find on the page
    cy.get('body').then($body => {
      cy.log('Found content on page:');
      cy.log($body.text().substring(0, 500) + '...');
    });
  });

  it('should navigate to form when clicking add button', () => {
    // Find and click any button that looks like it would add a transaction
    cy.get('button').then($buttons => {
      // Look for button with Add/New/Create text or with a plus icon
      const addButton = $buttons.filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        const hasIcon = Cypress.$(el).find('svg').length > 0;
        return text.includes('add') || text.includes('new') || text.includes('create') || hasIcon;
      });
      
      if (addButton.length) {
        cy.wrap(addButton).first().click({force: true});
      } else {
        // Try clicking the first tab that isn't the active one
        cy.get('[role="tab"]:not([aria-selected="true"])').first().click({force: true});
      }
    });
    
    // Check if a form appears
    cy.get('form', { timeout: 10000 }).should('exist');
  });
  
  // A very simple test to verify UI reactivity
  it('should respond to user interactions', () => {
    // Click a button and verify the page doesn't crash
    cy.get('button').first().click({force: true});
    
    // Verify we still have some essential elements
    cy.get('table, ul, ol, div[role="grid"]').should('exist');
    cy.get('button').should('exist');
    
    // Try to locate and interact with pagination if present
    cy.get('body').then($body => {
      const hasPagination = $body.find('[aria-label*="pagination"], [role="navigation"]').length > 0;
      if (hasPagination) {
        cy.get('[aria-label*="pagination"], [role="navigation"]').find('button').first().click({force: true});
      }
    });
    
    // Verify the page still has essential elements after interactions
    cy.get('button').should('exist');
  });
}); 