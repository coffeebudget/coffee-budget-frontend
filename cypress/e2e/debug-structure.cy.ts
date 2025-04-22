describe('Debug Page Structure', () => {
  before(() => {
    cy.mockLoggedIn();
  });

  it('should log page content', () => {
    cy.visit('/transactions');
    // Wait a bit for the page to fully load
    cy.wait(5000);
    
    // Take a screenshot
    cy.screenshot('transactions-page-full');
    
    // Try a very generic selector
    cy.get('body').then(($body) => {
      // Log the text content to see what's actually on the page
      cy.log('Body text content:');
      cy.log($body.text());
      
      // Look for any h tags
      const headings = $body.find('h1, h2, h3, h4, h5, h6').length;
      cy.log(`Found ${headings} heading elements`);
      
      // Look for any divs with text "Transactions"
      const transactionText = $body.find(':contains("Transactions")').length;
      cy.log(`Found ${transactionText} elements containing "Transactions" text`);
      
      // Look for tab elements
      const tabElements = $body.find('[role="tab"]').length;
      cy.log(`Found ${tabElements} tab elements`);
    });
  });
}); 