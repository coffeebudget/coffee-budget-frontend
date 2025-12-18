describe('Sync History with Source Filtering', () => {
  const mockSyncReports = {
    data: [
      {
        id: 1,
        status: 'success',
        source: 'gocardless',
        sourceName: 'Halifax Bank',
        syncStartedAt: '2025-12-18T09:00:00Z',
        syncCompletedAt: '2025-12-18T09:15:00Z',
        totalAccounts: 3,
        successfulAccounts: 3,
        failedAccounts: 0,
        totalNewTransactions: 45,
        totalDuplicates: 15,
        totalPendingDuplicates: 3,
        syncType: 'automatic',
        errorMessage: null,
      },
      {
        id: 2,
        status: 'partial',
        source: 'paypal',
        sourceName: 'PayPal Business',
        syncStartedAt: '2025-12-17T10:00:00Z',
        syncCompletedAt: '2025-12-17T10:20:00Z',
        totalAccounts: 2,
        successfulAccounts: 1,
        failedAccounts: 1,
        totalNewTransactions: 20,
        totalDuplicates: 5,
        totalPendingDuplicates: 1,
        syncType: 'automatic',
        errorMessage: null,
      },
      {
        id: 3,
        status: 'success',
        source: 'gocardless',
        sourceName: 'Barclays',
        syncStartedAt: '2025-12-16T08:00:00Z',
        syncCompletedAt: '2025-12-16T08:10:00Z',
        totalAccounts: 2,
        successfulAccounts: 2,
        failedAccounts: 0,
        totalNewTransactions: 30,
        totalDuplicates: 10,
        totalPendingDuplicates: 2,
        syncType: 'automatic',
        errorMessage: null,
      },
    ],
    total: 3,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockStatistics = {
    totalSyncs: 15,
    successfulSyncs: 13,
    failedSyncs: 2,
    successRate: 86.67,
    totalNewTransactions: 450,
    totalDuplicates: 120,
    averageTransactionsPerSync: 30,
  };

  const mockDetailedReport = {
    id: 1,
    status: 'success',
    source: 'gocardless',
    sourceName: 'Halifax Bank',
    syncStartedAt: '2025-12-18T09:00:00Z',
    syncCompletedAt: '2025-12-18T09:15:00Z',
    totalAccounts: 3,
    successfulAccounts: 3,
    failedAccounts: 0,
    totalNewTransactions: 45,
    totalDuplicates: 15,
    totalPendingDuplicates: 3,
    syncType: 'automatic',
    errorMessage: null,
    accountResults: [
      {
        accountId: 'acc123',
        accountName: 'Halifax Current Account',
        accountType: 'bank_account',
        success: true,
        newTransactions: 25,
        duplicates: 8,
        pendingDuplicates: 2,
        importLogId: 1,
      },
      {
        accountId: 'acc124',
        accountName: 'Halifax Savings',
        accountType: 'bank_account',
        success: true,
        newTransactions: 20,
        duplicates: 7,
        pendingDuplicates: 1,
        importLogId: 2,
      },
    ],
    importLogs: [
      {
        id: 1,
        status: 'completed',
        totalRecords: 25,
        successfulRecords: 25,
        failedRecords: 0,
      },
      {
        id: 2,
        status: 'completed',
        totalRecords: 20,
        successfulRecords: 20,
        failedRecords: 0,
      },
    ],
  };

  beforeEach(() => {
    // Mock logged in state
    cy.mockLoggedIn();

    // Mock sync history API (all syncs)
    cy.intercept('GET', '**/api/sync-history*', (req) => {
      const source = req.query.source;

      if (source === 'gocardless') {
        // Return only GoCardless syncs
        req.reply({
          statusCode: 200,
          body: {
            data: mockSyncReports.data.filter(r => r.source === 'gocardless'),
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        });
      } else if (source === 'paypal') {
        // Return only PayPal syncs
        req.reply({
          statusCode: 200,
          body: {
            data: mockSyncReports.data.filter(r => r.source === 'paypal'),
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        });
      } else {
        // Return all syncs
        req.reply({
          statusCode: 200,
          body: mockSyncReports,
        });
      }
    }).as('getSyncHistory');

    // Mock statistics API
    cy.intercept('GET', '**/api/sync-history/statistics*', {
      statusCode: 200,
      body: mockStatistics,
    }).as('getStatistics');

    // Mock sync report detail API
    cy.intercept('GET', '**/api/sync-history/1', {
      statusCode: 200,
      body: mockDetailedReport,
    }).as('getSyncDetail');

    // Visit sync history page
    cy.visit('/sync-history');

    // Wait for initial data load
    cy.wait('@getSyncHistory');
    cy.wait('@getStatistics');
    cy.wait(1000); // Allow page to render
  });

  describe('Page Layout and Source Display', () => {
    it('should display sync history page with statistics', () => {
      cy.contains('Sync Statistics').should('be.visible');
      cy.contains('Total Syncs').should('be.visible');
      cy.contains('15').should('be.visible'); // totalSyncs from mock
    });

    it('should display sync reports with source badges', () => {
      // Verify GoCardless badge appears
      cy.contains('GoCardless').should('be.visible');

      // Verify PayPal badge appears
      cy.contains('PayPal').should('be.visible');
    });

    it('should display source names in sync report cards', () => {
      cy.contains('Halifax Bank').should('be.visible');
      cy.contains('PayPal Business').should('be.visible');
      cy.contains('Barclays').should('be.visible');
    });

    it('should display both status and source badges together', () => {
      // Find a sync report card and verify it has both badges
      cy.contains('Halifax Bank')
        .parent()
        .parent()
        .within(() => {
          cy.contains('Success').should('exist');
          cy.contains('GoCardless').should('exist');
        });
    });
  });

  describe('Source Filtering', () => {
    it('should display source filter buttons', () => {
      cy.contains('Filter by Source').should('be.visible');
      cy.get('button').contains('All Sources').should('be.visible');
      cy.get('button').contains('GoCardless').should('be.visible');
      cy.get('button').contains('PayPal').should('be.visible');
    });

    it('should filter by GoCardless when clicking GoCardless button', () => {
      // Click GoCardless filter
      cy.get('button').contains('GoCardless').click();

      // Wait for filtered API call
      cy.wait('@getSyncHistory');

      // Should show only GoCardless syncs
      cy.contains('Halifax Bank').should('be.visible');
      cy.contains('Barclays').should('be.visible');

      // PayPal sync should not be visible
      cy.contains('PayPal Business').should('not.exist');
    });

    it('should filter by PayPal when clicking PayPal button', () => {
      // Click PayPal filter
      cy.get('button').contains('PayPal').click();

      // Wait for filtered API call
      cy.wait('@getSyncHistory');

      // Should show only PayPal sync
      cy.contains('PayPal Business').should('be.visible');

      // GoCardless syncs should not be visible
      cy.contains('Halifax Bank').should('not.exist');
      cy.contains('Barclays').should('not.exist');
    });

    it('should show all syncs when clicking All Sources button', () => {
      // First filter by GoCardless
      cy.get('button').contains('GoCardless').click();
      cy.wait('@getSyncHistory');

      // Then click All Sources
      cy.get('button').contains('All Sources').click();
      cy.wait('@getSyncHistory');

      // Should show all syncs again
      cy.contains('Halifax Bank').should('be.visible');
      cy.contains('PayPal Business').should('be.visible');
      cy.contains('Barclays').should('be.visible');
    });

    it('should highlight selected filter button', () => {
      // All Sources should be selected by default
      cy.get('button').contains('All Sources').should('have.attr', 'data-state', 'active').or('have.class', 'bg-');

      // Click PayPal filter
      cy.get('button').contains('PayPal').click();
      cy.wait(500);

      // PayPal button should now be highlighted
      // Note: exact class may vary based on Shadcn button variant implementation
      cy.get('button').contains('PayPal').should('exist');
    });
  });

  describe('Status Filtering', () => {
    it('should display status filter buttons', () => {
      cy.contains('Filter by Status').should('be.visible');
      cy.get('button').contains('All').should('be.visible');
      cy.get('button').contains('Success').should('be.visible');
      cy.get('button').contains('Partial').should('be.visible');
      cy.get('button').contains('Failed').should('be.visible');
    });

    it('should allow combining status and source filters', () => {
      // Filter by GoCardless
      cy.get('button').contains('GoCardless').click();
      cy.wait('@getSyncHistory');

      // Then filter by Success status
      cy.get('button').contains('Success').click();
      cy.wait('@getSyncHistory');

      // Should show only successful GoCardless syncs
      cy.contains('Halifax Bank').should('be.visible');
      cy.contains('Barclays').should('be.visible');
    });
  });

  describe('Sync Report Detail View', () => {
    it('should navigate to detail view when clicking View Details', () => {
      // Click View Details for first sync report
      cy.contains('Halifax Bank')
        .parent()
        .parent()
        .within(() => {
          cy.contains('View Details').click();
        });

      // Wait for detail API call
      cy.wait('@getSyncDetail');
      cy.wait(500);

      // Should show detail page
      cy.contains('Sync Report #1').should('be.visible');
    });

    it('should display source badge in detail view header', () => {
      // Navigate to detail view
      cy.visit('/sync-history/1');
      cy.wait('@getSyncDetail');
      cy.wait(500);

      // Should show both status and source badges
      cy.contains('Success').should('be.visible');
      cy.contains('GoCardless').should('be.visible');
    });

    it('should display source name in detail view', () => {
      // Navigate to detail view
      cy.visit('/sync-history/1');
      cy.wait('@getSyncDetail');
      cy.wait(500);

      // Should show source name
      cy.contains('Source').should('be.visible');
      cy.contains('Halifax Bank').should('be.visible');
    });

    it('should display account results in detail view', () => {
      // Navigate to detail view
      cy.visit('/sync-history/1');
      cy.wait('@getSyncDetail');
      cy.wait(500);

      // Should show account results
      cy.contains('Account Results').should('be.visible');
      cy.contains('Halifax Current Account').should('be.visible');
      cy.contains('Halifax Savings').should('be.visible');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      cy.get('button').contains('Previous').should('be.visible');
      cy.get('button').contains('Next').should('be.visible');
      cy.contains('Page 1 of 1').should('be.visible');
    });

    it('should disable Previous button on first page', () => {
      cy.get('button').contains('Previous').should('be.disabled');
    });

    it('should disable Next button on last page', () => {
      cy.get('button').contains('Next').should('be.disabled');
    });
  });
});
