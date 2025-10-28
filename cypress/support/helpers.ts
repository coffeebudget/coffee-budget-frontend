// E2E testing helpers for Cypress

// Common E2E operations and utilities

/**
 * Login helper - logs in a user for E2E tests
 */
export const loginUser = (user = {}) => {
  const defaultUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  };
  
  const mockUser = { ...defaultUser, ...user };
  
  cy.window().then((win) => {
    // Mock localStorage for session
    win.localStorage.setItem('next-auth.session-token', 'mock-session-token');
    win.localStorage.setItem('user', JSON.stringify(mockUser));
  });
  
  // Mock NextAuth session
  cy.intercept('GET', '**/api/auth/session', {
    statusCode: 200,
    body: {
      user: mockUser,
      expires: '2024-12-31T23:59:59.999Z',
      accessToken: 'mock-access-token',
    },
  }).as('getSession');
  
  return cy.wrap(mockUser);
};

/**
 * Logout helper - logs out the current user
 */
export const logoutUser = () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('next-auth.session-token');
    win.localStorage.removeItem('user');
  });
  
  cy.intercept('POST', '**/api/auth/signout', {
    statusCode: 200,
    body: { success: true },
  }).as('signout');
};

/**
 * Mock API responses for common endpoints
 */
export const mockCommonApis = () => {
  // Mock dashboard API
  cy.intercept('GET', '**/api/dashboard', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        stats: {
          totalIncome: 5000,
          totalExpenses: 3000,
          netAmount: 2000,
          transactionCount: 25,
        },
        recentTransactions: [
          { id: 1, description: 'Test Transaction 1', amount: 100.50 },
          { id: 2, description: 'Test Transaction 2', amount: 200.75 },
        ],
        alerts: [],
      },
    },
  }).as('getDashboard');
  
  // Mock transactions API
  cy.intercept('GET', '**/api/transactions', {
    statusCode: 200,
    body: {
      success: true,
      data: [
        { id: 1, description: 'Test Transaction 1', amount: 100.50, type: 'expense' },
        { id: 2, description: 'Test Transaction 2', amount: 200.75, type: 'income' },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    },
  }).as('getTransactions');
  
  // Mock categories API
  cy.intercept('GET', '**/api/categories', {
    statusCode: 200,
    body: {
      success: true,
      data: [
        { id: 1, name: 'Food & Dining', color: '#FF6B6B' },
        { id: 2, name: 'Transportation', color: '#4ECDC4' },
      ],
    },
  }).as('getCategories');
  
  // Mock bank accounts API
  cy.intercept('GET', '**/api/bank-accounts', {
    statusCode: 200,
    body: {
      success: true,
      data: [
        { id: 1, name: 'Checking Account', balance: 2500.75 },
        { id: 2, name: 'Savings Account', balance: 10000.00 },
      ],
    },
  }).as('getBankAccounts');
};

/**
 * Mock API error responses
 */
export const mockApiErrors = () => {
  cy.intercept('GET', '**/api/**', {
    statusCode: 500,
    body: {
      success: false,
      error: 'Internal server error',
    },
  }).as('apiError');
};

/**
 * Mock network failure
 */
export const mockNetworkFailure = () => {
  cy.intercept('GET', '**/api/**', {
    forceNetworkError: true,
  }).as('networkError');
};

/**
 * Wait for page to load completely
 */
export const waitForPageLoad = () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
};

/**
 * Wait for API calls to complete
 */
export const waitForApiCalls = (...aliases: string[]) => {
  aliases.forEach(alias => {
    cy.wait(`@${alias}`);
  });
};

/**
 * Clear all form data
 */
export const clearAllForms = () => {
  cy.get('form').each(($form) => {
    cy.wrap($form).within(() => {
      cy.get('input[type="text"], input[type="email"], input[type="password"], textarea').clear();
      cy.get('select').select('');
    });
  });
};

/**
 * Fill form with data
 */
export const fillForm = (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}"]`).clear().type(value);
  });
};

/**
 * Submit form and wait for response
 */
export const submitForm = (formTestId: string, apiAlias?: string) => {
  cy.get(`[data-testid="${formTestId}"]`).within(() => {
    cy.get('button[type="submit"]').click();
  });
  
  if (apiAlias) {
    cy.wait(`@${apiAlias}`);
  }
};

/**
 * Upload file
 */
export const uploadFile = (inputTestId: string, fileName: string, fileContent: string) => {
  cy.fixture(fileName).then((file) => {
    const blob = new Blob([fileContent || file], { type: 'text/csv' });
    cy.get(`[data-testid="${inputTestId}"]`).selectFile({
      contents: Cypress.Buffer.from(blob),
      fileName,
      mimeType: 'text/csv',
    });
  });
};

/**
 * Take screenshot with timestamp
 */
export const takeScreenshot = (name: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
};

/**
 * Check if element exists
 */
export const elementExists = (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`).should('exist');
};

/**
 * Check if element does not exist
 */
export const elementNotExists = (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`).should('not.exist');
};

/**
 * Check if element is visible
 */
export const elementVisible = (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`).should('be.visible');
};

/**
 * Check if element is hidden
 */
export const elementHidden = (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`).should('not.be.visible');
};

/**
 * Wait for element to appear
 */
export const waitForElement = (testId: string, timeout = 5000) => {
  return cy.get(`[data-testid="${testId}"]`, { timeout }).should('exist');
};

/**
 * Wait for element to disappear
 */
export const waitForElementToDisappear = (testId: string, timeout = 5000) => {
  return cy.get(`[data-testid="${testId}"]`, { timeout }).should('not.exist');
};

/**
 * Wait for text to appear
 */
export const waitForText = (text: string, timeout = 5000) => {
  return cy.contains(text, { timeout }).should('be.visible');
};

/**
 * Wait for text to disappear
 */
export const waitForTextToDisappear = (text: string, timeout = 5000) => {
  return cy.contains(text, { timeout }).should('not.exist');
};

/**
 * Check URL
 */
export const checkUrl = (url: string) => {
  cy.url().should('include', url);
};

/**
 * Navigate to page
 */
export const navigateTo = (path: string) => {
  cy.visit(path);
  waitForPageLoad();
};

/**
 * Go back
 */
export const goBack = () => {
  cy.go('back');
  waitForPageLoad();
};

/**
 * Go forward
 */
export const goForward = () => {
  cy.go('forward');
  waitForPageLoad();
};

/**
 * Refresh page
 */
export const refreshPage = () => {
  cy.reload();
  waitForPageLoad();
};

/**
 * Check localStorage
 */
export const checkLocalStorage = (key: string, value: string) => {
  cy.window().its('localStorage').invoke('getItem', key).should('eq', value);
};

/**
 * Set localStorage
 */
export const setLocalStorage = (key: string, value: string) => {
  cy.window().its('localStorage').invoke('setItem', key, value);
};

/**
 * Clear localStorage
 */
export const clearLocalStorage = () => {
  cy.window().its('localStorage').invoke('clear');
};

/**
 * Check sessionStorage
 */
export const checkSessionStorage = (key: string, value: string) => {
  cy.window().its('sessionStorage').invoke('getItem', key).should('eq', value);
};

/**
 * Set sessionStorage
 */
export const setSessionStorage = (key: string, value: string) => {
  cy.window().its('sessionStorage').invoke('setItem', key, value);
};

/**
 * Clear sessionStorage
 */
export const clearSessionStorage = () => {
  cy.window().its('sessionStorage').invoke('clear');
};

/**
 * Mock console methods
 */
export const mockConsole = () => {
  cy.window().then((win) => {
    win.console.log = cy.stub();
    win.console.error = cy.stub();
    win.console.warn = cy.stub();
  });
};

/**
 * Check console errors
 */
export const checkConsoleErrors = () => {
  cy.window().then((win) => {
    expect(win.console.error).to.not.have.been.called;
  });
};

/**
 * Mock geolocation
 */
export const mockGeolocation = (latitude = 40.7128, longitude = -74.0060) => {
  cy.window().then((win) => {
    win.navigator.geolocation = {
      getCurrentPosition: cy.stub().callsFake((callback) => {
        callback({
          coords: { latitude, longitude, accuracy: 20 },
          timestamp: Date.now(),
        });
      }),
      watchPosition: cy.stub(),
      clearWatch: cy.stub(),
    };
  });
};

/**
 * Mock notification permission
 */
export const mockNotificationPermission = (permission = 'granted') => {
  cy.window().then((win) => {
    Object.defineProperty(win.Notification, 'permission', {
      value: permission,
      writable: true,
    });
  });
};

/**
 * Mock clipboard
 */
export const mockClipboard = (text = '') => {
  cy.window().then((win) => {
    win.navigator.clipboard = {
      writeText: cy.stub().resolves(),
      readText: cy.stub().resolves(text),
    };
  });
};

/**
 * Mock service worker
 */
export const mockServiceWorker = () => {
  cy.window().then((win) => {
    win.navigator.serviceWorker = {
      register: cy.stub().resolves(),
      unregister: cy.stub().resolves(),
      getRegistration: cy.stub().resolves(),
      getRegistrations: cy.stub().resolves([]),
      addEventListener: cy.stub(),
      removeEventListener: cy.stub(),
      ready: Promise.resolve(),
    };
  });
};

/**
 * Wait for network to be idle
 */
export const waitForNetworkIdle = (timeout = 2000) => {
  cy.window().then((win) => {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      let requestCount = 0;
      
      const checkIdle = () => {
        if (requestCount === 0) {
          clearTimeout(timeoutId);
          resolve(undefined);
        } else {
          timeoutId = setTimeout(checkIdle, 100);
        }
      };
      
      const originalFetch = win.fetch;
      win.fetch = (...args) => {
        requestCount++;
        return originalFetch.apply(win, args).finally(() => {
          requestCount--;
          checkIdle();
        });
      };
      
      checkIdle();
    });
  });
};

/**
 * Clean up after test
 */
export const cleanup = () => {
  clearLocalStorage();
  clearSessionStorage();
  cy.clearAllMocks();
};

/**
 * Setup test environment
 */
export const setupTestEnvironment = () => {
  mockCommonApis();
  mockConsole();
  mockGeolocation();
  mockNotificationPermission();
  mockClipboard();
  mockServiceWorker();
};

/**
 * Teardown test environment
 */
export const teardownTestEnvironment = () => {
  cleanup();
};
