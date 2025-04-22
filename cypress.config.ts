import { defineConfig } from "cypress";
import dotenv from 'dotenv';

// Load environment variables from .env.local if it exists
dotenv.config({ path: '.env.local' });

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Specify your Next.js server URL
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Pass environment variables from process.env to Cypress
      config.env = config.env || {};
      
      // Auth0 config
      config.env.auth0_domain = process.env.NEXT_PUBLIC_AUTH0_ISSUER?.replace('https://', '') || '';
      config.env.auth0_client_id = process.env.AUTH0_CLIENT_ID || '';
      config.env.auth0_client_secret = process.env.AUTH0_CLIENT_SECRET || '';
      config.env.auth0_audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '';
      
      // Test user credentials - ideally these would be in a separate .env.test file
      config.env.auth_username = process.env.TEST_USER_EMAIL || '';
      config.env.auth_password = process.env.TEST_USER_PASSWORD || '';
      
      return config;
    },
  },
});
