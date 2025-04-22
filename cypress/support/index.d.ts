/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login using Auth0 API
     * @example cy.loginByAuth0Api('email@example.com', 'password123')
     */
    loginByAuth0Api(username: string, password: string): Chainable<void>

    /**
     * Custom command to mock a logged-in session for tests
     * @example cy.mockLoggedIn()
     */
    mockLoggedIn(): Chainable<void>

    /**
     * Custom command to wait for page load and API readiness
     * @example cy.waitForPage()
     */
    waitForPage(): Chainable<Element>

    /**
     * Custom command to wait for transaction data to load
     * @example cy.waitForTransactionData()
     */
    waitForTransactionData(): Chainable<void>
  }
} 