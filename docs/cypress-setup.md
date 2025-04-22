# Setting Up and Running Cypress Tests

This document explains how to set up and run the Cypress tests for transaction CRUD operations in the application.

## Prerequisites

Before running the tests, you need to ensure you have the following:

1. A running local development server (`npm run dev`)
2. Proper environment variables for authentication

## Setting Up Environment Variables

1. Create a `.env.test` file in the root of the project with the following content:

```shell
# Test environment variables for Cypress
# You should customize these values based on your test user

# Test user credentials - replace with your actual test user
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Ensure these match your Auth0 settings
# They can usually be copied from your .env.local file
NEXT_PUBLIC_AUTH0_ISSUER=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
NEXT_PUBLIC_AUTH0_AUDIENCE=https://your-api-identifier
```

2. Replace the values with your actual test user credentials and Auth0 configuration.

## Authentication Strategies

The tests are set up with two authentication strategies:

1. **Mock Authentication (Default)**: This approach mocks the NextAuth session and doesn't require real Auth0 credentials. It's used by default in the tests.

2. **Real Auth0 Authentication**: This approach uses the Resource Owner Password flow to authenticate with Auth0. To use this:
   - Ensure you have valid test user credentials in `.env.test`
   - Modify the test to use `cy.loginByAuth0Api(Cypress.env('auth_username'), Cypress.env('auth_password'))` instead of `cy.mockLoggedIn()`

## Running the Tests

1. Start your development server:
   ```
   npm run dev
   ```

2. Open Cypress:
   ```
   npx cypress open
   ```

3. In the Cypress UI, select "E2E Testing"

4. Choose a browser (Chrome is recommended)

5. Click "Start E2E Testing"

6. Click on "transactions.cy.ts" to run the transaction CRUD tests

## What the Tests Do

The transaction CRUD tests perform the following operations:

1. **Authentication**: Mock login (or real Auth0 login)
2. **Read**: Verify the transactions page loads correctly
3. **Create**: Add a new transaction with test data
4. **Update**: Edit the newly created transaction
5. **Delete**: Delete the transaction

## Troubleshooting

If you encounter issues with the tests:

1. **Login Problems**: 
   - If using real Auth0 login, ensure your credentials are correct
   - Check that your Auth0 application allows the Resource Owner Password flow

2. **Selector Issues**: 
   - If the UI has changed, you may need to update the selectors in the tests
   - Use Cypress' time-travel debugging to identify which step is failing

3. **API Issues**:
   - Check the browser console for API errors
   - Verify that your backend API is running and accessible 