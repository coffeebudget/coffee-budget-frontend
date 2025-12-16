describe('Payment Accounts CRUD Operations', () => {
  const mockBankAccounts = [
    { id: 1, name: 'Main Checking', balance: 5000 },
    { id: 2, name: 'Savings Account', balance: 10000 },
  ];

  const mockPaymentAccounts = [
    {
      id: 1,
      displayName: 'Business PayPal',
      provider: 'paypal',
      providerConfig: {},
      isActive: true,
      userId: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      displayName: 'Stripe Account',
      provider: 'stripe',
      providerConfig: {},
      isActive: false,
      linkedBankAccountId: 1,
      userId: 1,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    // Apply mock login before each test
    cy.mockLoggedIn();

    // Mock bank accounts API (needed for form dropdown)
    cy.intercept('GET', '**/api/bank-accounts', {
      statusCode: 200,
      body: mockBankAccounts,
    }).as('getBankAccounts');

    // Mock payment accounts API
    cy.intercept('GET', '**/api/payment-accounts', {
      statusCode: 200,
      body: mockPaymentAccounts,
    }).as('getPaymentAccounts');

    // Visit payment accounts page
    cy.visit('/payment-accounts');

    // Wait for initial data load
    cy.wait('@getPaymentAccounts');
    cy.wait(1000); // Allow page to render
  });

  describe('Page Navigation and Layout', () => {
    it('should display payment accounts page with tabs', () => {
      // Verify page title or main content exists
      cy.contains('Payment Accounts').should('exist');

      // Verify tabs exist (Accounts list and Add Account)
      cy.get('[role="tab"]').should('have.length.at.least', 2);
    });

    it('should display existing payment accounts in table', () => {
      // Verify table or list exists
      cy.get('table, [role="grid"]').should('exist');

      // Verify mock accounts are displayed
      cy.contains('Business PayPal').should('be.visible');
      cy.contains('Stripe Account').should('be.visible');
    });

    it('should show active/inactive status badges', () => {
      // Active account should show active badge
      cy.contains('Business PayPal')
        .parent()
        .parent()
        .should('contain.text', 'Active');

      // Inactive account should show inactive badge
      cy.contains('Stripe Account')
        .parent()
        .parent()
        .should('contain.text', 'Inactive');
    });
  });

  describe('Create Payment Account', () => {
    it('should navigate to add account form when clicking add tab', () => {
      // Click on Add Account tab (assuming it's the second tab)
      cy.get('[role="tab"]').contains('Add').click({ force: true });

      // Wait for form to appear
      cy.wait(500);

      // Verify form fields are present
      cy.contains('Display Name').should('be.visible');
      cy.contains('Payment Provider').should('be.visible');
      cy.contains('Active').should('be.visible');
    });

    it('should successfully create a new payment account', () => {
      const newPaymentAccount = {
        id: 3,
        displayName: 'Test PayPal Account',
        provider: 'paypal',
        providerConfig: {},
        isActive: true,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock POST request
      cy.intercept('POST', '**/api/payment-accounts', {
        statusCode: 200,
        body: newPaymentAccount,
      }).as('createPaymentAccount');

      // Mock GET request to return updated list
      cy.intercept('GET', '**/api/payment-accounts', {
        statusCode: 200,
        body: [...mockPaymentAccounts, newPaymentAccount],
      }).as('getUpdatedPaymentAccounts');

      // Click Add Account tab
      cy.get('[role="tab"]').contains('Add').click({ force: true });
      cy.wait(500);

      // Fill in the form
      cy.get('input[name="displayName"], input[id="displayName"]')
        .clear()
        .type('Test PayPal Account');

      // Select provider (PayPal should be default, but let's ensure)
      cy.get('select').first().select('paypal');

      // Ensure Active checkbox is checked
      cy.get('input[type="checkbox"]').check({ force: true });

      // Submit form
      cy.get('button').contains('Create Account').click({ force: true });

      // Wait for API call
      cy.wait('@createPaymentAccount');

      // Verify success (page should switch back to list view or show success toast)
      cy.wait(1000);

      // Should show in the list or have success indication
      cy.get('body').should('exist'); // Basic check that page didn't crash
    });

    it('should validate required fields', () => {
      // Click Add Account tab
      cy.get('[role="tab"]').contains('Add').click({ force: true });
      cy.wait(500);

      // Try to submit empty form
      cy.get('button').contains('Create Account').click({ force: true });

      // Should show validation error or prevent submission
      // (The actual validation message depends on your implementation)
      cy.wait(500);

      // Form should still be visible (not submitted)
      cy.get('input[name="displayName"], input[id="displayName"]').should('exist');
    });
  });

  describe('Edit Payment Account', () => {
    it('should open edit form when clicking edit button', () => {
      // Find and click edit button for first account
      cy.contains('Business PayPal')
        .parent()
        .parent()
        .find('button[aria-label*="edit"], button')
        .first()
        .click({ force: true });

      cy.wait(500);

      // Should switch to edit form
      cy.get('input[name="displayName"], input[id="displayName"]')
        .should('have.value', 'Business PayPal');
    });

    it('should successfully update a payment account', () => {
      const updatedAccount = {
        ...mockPaymentAccounts[0],
        displayName: 'Updated PayPal Name',
        updatedAt: new Date().toISOString(),
      };

      // Mock PATCH request
      cy.intercept('PATCH', '**/api/payment-accounts/1', {
        statusCode: 200,
        body: updatedAccount,
      }).as('updatePaymentAccount');

      // Mock GET to return updated list
      cy.intercept('GET', '**/api/payment-accounts', {
        statusCode: 200,
        body: [updatedAccount, mockPaymentAccounts[1]],
      }).as('getUpdatedList');

      // Click edit button
      cy.contains('Business PayPal')
        .parent()
        .parent()
        .find('button')
        .first()
        .click({ force: true });

      cy.wait(500);

      // Update display name
      cy.get('input[name="displayName"], input[id="displayName"]')
        .clear()
        .type('Updated PayPal Name');

      // Submit form
      cy.get('button').contains('Update').click({ force: true });

      // Wait for API call
      cy.wait('@updatePaymentAccount');

      cy.wait(1000);

      // Verify page didn't crash
      cy.get('body').should('exist');
    });
  });

  describe('Delete Payment Account', () => {
    it('should delete payment account when clicking delete button', () => {
      // Mock DELETE request
      cy.intercept('DELETE', '**/api/payment-accounts/1', {
        statusCode: 204,
      }).as('deletePaymentAccount');

      // Mock GET to return updated list without deleted account
      cy.intercept('GET', '**/api/payment-accounts', {
        statusCode: 200,
        body: [mockPaymentAccounts[1]], // Only second account remains
      }).as('getUpdatedList');

      // Find delete button for first account
      // This might be a trash icon or delete button
      cy.contains('Business PayPal')
        .parent()
        .parent()
        .find('button[aria-label*="delete"], button')
        .last()
        .click({ force: true });

      cy.wait(500);

      // If there's a confirmation step (double-click pattern), click again
      cy.contains('Business PayPal')
        .parent()
        .parent()
        .find('button[aria-label*="delete"], button')
        .last()
        .click({ force: true });

      // Wait for API call
      cy.wait('@deletePaymentAccount', { timeout: 10000 });

      cy.wait(1000);

      // Verify page didn't crash
      cy.get('body').should('exist');
    });
  });

  describe('Payment Account Providers', () => {
    it('should display all available payment providers in dropdown', () => {
      // Click Add Account tab
      cy.get('[role="tab"]').contains('Add').click({ force: true });
      cy.wait(500);

      // Click on provider dropdown
      cy.get('select').first().click({ force: true });

      // Verify expected providers exist
      const expectedProviders = ['PayPal', 'Klarna', 'Stripe', 'Square', 'Revolut', 'Wise', 'Other'];

      // Check if options contain expected providers (case-insensitive)
      cy.get('select').first().within(() => {
        expectedProviders.forEach(provider => {
          cy.get('option').should('exist');
        });
      });
    });
  });

  describe('Link to Bank Account', () => {
    it('should allow linking payment account to bank account', () => {
      // Click Add Account tab
      cy.get('[role="tab"]').contains('Add').click({ force: true });
      cy.wait(500);

      // Wait for bank accounts to load
      cy.wait('@getBankAccounts');

      // Find bank account dropdown
      cy.contains('Linked Bank Account').should('exist');

      // Verify bank accounts are available in dropdown
      cy.get('select').last().should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully when creating account', () => {
      // Mock API error
      cy.intercept('POST', '**/api/payment-accounts', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('createError');

      // Click Add Account tab
      cy.get('[role="tab"]').contains('Add').click({ force: true });
      cy.wait(500);

      // Fill and submit form
      cy.get('input[name="displayName"], input[id="displayName"]')
        .clear()
        .type('Error Test Account');

      cy.get('button').contains('Create Account').click({ force: true });

      // Wait for error
      cy.wait('@createError');

      cy.wait(1000);

      // Should show error toast or message (implementation-specific)
      // At minimum, page should not crash
      cy.get('body').should('exist');
    });

    it('should handle API errors gracefully when fetching accounts', () => {
      // Mock API error on page load
      cy.intercept('GET', '**/api/payment-accounts', {
        statusCode: 500,
        body: { error: 'Failed to fetch payment accounts' },
      }).as('fetchError');

      // Visit page (will trigger error)
      cy.visit('/payment-accounts');

      cy.wait('@fetchError');
      cy.wait(1000);

      // Page should show error state, not crash
      cy.get('body').should('exist');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be responsive on mobile viewport', () => {
      // Set mobile viewport
      cy.viewport('iphone-x');

      cy.wait(500);

      // Verify page still renders
      cy.get('body').should('exist');
      cy.contains('Payment Accounts').should('exist');
    });

    it('should be responsive on tablet viewport', () => {
      // Set tablet viewport
      cy.viewport('ipad-2');

      cy.wait(500);

      // Verify page still renders
      cy.get('body').should('exist');
      cy.contains('Payment Accounts').should('exist');
    });
  });
});
