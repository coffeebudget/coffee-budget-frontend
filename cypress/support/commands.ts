/// <reference types="cypress" />

// Custom Cypress commands for consistent testing

// Mock logged in user
Cypress.Commands.add('mockLoggedIn', (user: any = {}) => {
  const defaultUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  };
  
  const mockUser = { ...defaultUser, ...(user || {}) };
  
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
});

// Mock API responses
Cypress.Commands.add('mockApi', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response,
  }).as(`mock${method}${url.replace(/[^a-zA-Z0-9]/g, '')}`);
});

// Mock successful API responses
Cypress.Commands.add('mockApiSuccess', (method, url, data, message = 'Success') => {
  cy.mockApi(method, url, {
    success: true,
    data,
    message,
  });
});

// Mock error API responses
Cypress.Commands.add('mockApiError', (method, url, error = 'An error occurred', statusCode = 400) => {
  cy.mockApi(method, url, {
    success: false,
    error,
    message: error,
  }, statusCode);
});

// Mock paginated API responses
Cypress.Commands.add('mockApiPaginated', (method, url, data, page = 1, limit = 20) => {
  cy.mockApi(method, url, {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
    },
  });
});

// Wait for API call to complete
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(alias);
});

// Check if element is visible
Cypress.Commands.add('isVisible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

// Check if element is hidden
Cypress.Commands.add('isHidden', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('not.be.visible');
});

// Click element by test ID
Cypress.Commands.add('clickByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).click();
});

// Type text into input by test ID
Cypress.Commands.add('typeByTestId', (testId, text) => {
  cy.get(`[data-testid="${testId}"]`).clear().type(text);
});

// Select option from select by test ID
Cypress.Commands.add('selectByTestId', (testId, optionText) => {
  cy.get(`[data-testid="${testId}"]`).select(optionText);
});

// Check checkbox by test ID
Cypress.Commands.add('checkByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).check();
});

// Uncheck checkbox by test ID
Cypress.Commands.add('uncheckByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).uncheck();
});

// Get element by test ID
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Get all elements by test ID
Cypress.Commands.add('getAllByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Wait for element to appear by test ID
Cypress.Commands.add('waitForTestId', (testId, timeout = 5000) => {
  cy.get(`[data-testid="${testId}"]`, { timeout }).should('exist');
});

// Wait for element to disappear by test ID
Cypress.Commands.add('waitForTestIdToDisappear', (testId, timeout = 5000) => {
  cy.get(`[data-testid="${testId}"]`, { timeout }).should('not.exist');
});

// Fill form with data
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}"]`).clear().type(value);
  });
});

// Submit form by test ID
Cypress.Commands.add('submitForm', (formTestId) => {
  cy.get(`[data-testid="${formTestId}"]`).within(() => {
    cy.get('button[type="submit"]').click();
  });
});

// Check if element has class
Cypress.Commands.add('hasClass', { prevSubject: 'element' }, (subject, className) => {
  cy.wrap(subject).should('have.class', className);
});

// Check if element has attribute
Cypress.Commands.add('hasAttribute', { prevSubject: 'element' }, (subject, attribute, value) => {
  if (value) {
    cy.wrap(subject).should('have.attr', attribute, value);
  } else {
    cy.wrap(subject).should('have.attr', attribute);
  }
});

// Check if element has text content
Cypress.Commands.add('hasText', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('contain.text', text);
});

// Check if element is focused
Cypress.Commands.add('isFocused', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.focused');
});

// Focus element by test ID
Cypress.Commands.add('focusByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).focus();
});

// Hover over element by test ID
Cypress.Commands.add('hoverByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).trigger('mouseover');
});

// Right click element by test ID
Cypress.Commands.add('rightClickByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).rightclick();
});

// Double click element by test ID
Cypress.Commands.add('doubleClickByTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).dblclick();
});

// Scroll to element by test ID
Cypress.Commands.add('scrollToTestId', (testId) => {
  cy.get(`[data-testid="${testId}"]`).scrollIntoView();
});

// Take screenshot of element by test ID
Cypress.Commands.add('screenshotTestId', (testId, name) => {
  cy.get(`[data-testid="${testId}"]`).screenshot(name);
});

// Mock file upload
Cypress.Commands.add('mockFileUpload', (fileName, fileContent, mimeType = 'text/csv') => {
  cy.fixture(fileName).then((file) => {
    const blob = new Blob([fileContent || file], { type: mimeType });
    const fileInput = cy.get('input[type="file"]');
    fileInput.selectFile({
      contents: Cypress.Buffer.from(blob),
      fileName,
      mimeType,
    });
  });
});

// Mock clipboard
Cypress.Commands.add('mockClipboard', (text) => {
  cy.window().then((win) => {
    win.navigator.clipboard = {
      writeText: cy.stub().resolves(),
      readText: cy.stub().resolves(text),
    };
  });
});

// Mock geolocation
Cypress.Commands.add('mockGeolocation', (latitude = 40.7128, longitude = -74.0060) => {
  cy.window().then((win) => {
    win.navigator.geolocation = {
      getCurrentPosition: cy.stub().callsFake((callback) => {
        callback({
          coords: {
            latitude,
            longitude,
            accuracy: 20,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: cy.stub(),
      clearWatch: cy.stub(),
    };
  });
});

// Mock notification permission
Cypress.Commands.add('mockNotificationPermission', (permission = 'granted') => {
  cy.window().then((win) => {
    Object.defineProperty(win.Notification, 'permission', {
      value: permission,
      writable: true,
    });
  });
});

// Mock service worker
Cypress.Commands.add('mockServiceWorker', () => {
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
});

// Clear all mocks
Cypress.Commands.add('clearAllMocks', () => {
  cy.window().then((win) => {
    // Clear localStorage
    win.localStorage.clear();
    
    // Clear sessionStorage
    win.sessionStorage.clear();
    
    // Reset all stubs
    cy.stub().reset();
  });
});

// Wait for network to be idle
Cypress.Commands.add('waitForNetworkIdle', (timeout = 2000) => {
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
      
      // Mock fetch to track requests
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
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      mockLoggedIn(user?: any): Chainable<void>;
      mockApi(method: string, url: string, response: any, statusCode?: number): Chainable<void>;
      mockApiSuccess(method: string, url: string, data: any, message?: string): Chainable<void>;
      mockApiError(method: string, url: string, error?: string, statusCode?: number): Chainable<void>;
      mockApiPaginated(method: string, url: string, data: any[], page?: number, limit?: number): Chainable<void>;
      waitForApi(alias: string): Chainable<void>;
      isVisible(): Chainable<Element>;
      isHidden(): Chainable<Element>;
      clickByTestId(testId: string): Chainable<Element>;
      typeByTestId(testId: string, text: string): Chainable<Element>;
      selectByTestId(testId: string, optionText: string): Chainable<Element>;
      checkByTestId(testId: string): Chainable<Element>;
      uncheckByTestId(testId: string): Chainable<Element>;
      getByTestId(testId: string): Chainable<Element>;
      getAllByTestId(testId: string): Chainable<Element>;
      waitForTestId(testId: string, timeout?: number): Chainable<Element>;
      waitForTestIdToDisappear(testId: string, timeout?: number): Chainable<Element>;
      fillForm(formData: Record<string, string>): Chainable<void>;
      submitForm(formTestId: string): Chainable<void>;
      hasClass(className: string): Chainable<Element>;
      hasAttribute(attribute: string, value?: string): Chainable<Element>;
      hasText(text: string): Chainable<Element>;
      isFocused(): Chainable<Element>;
      focusByTestId(testId: string): Chainable<Element>;
      hoverByTestId(testId: string): Chainable<Element>;
      rightClickByTestId(testId: string): Chainable<Element>;
      doubleClickByTestId(testId: string): Chainable<Element>;
      scrollToTestId(testId: string): Chainable<Element>;
      screenshotTestId(testId: string, name: string): Chainable<Element>;
      mockFileUpload(fileName: string, fileContent?: string, mimeType?: string): Chainable<void>;
      mockClipboard(text: string): Chainable<void>;
      mockGeolocation(latitude?: number, longitude?: number): Chainable<void>;
      mockNotificationPermission(permission?: string): Chainable<void>;
      mockServiceWorker(): Chainable<void>;
      clearAllMocks(): Chainable<void>;
      waitForNetworkIdle(timeout?: number): Chainable<void>;
    }
  }
}