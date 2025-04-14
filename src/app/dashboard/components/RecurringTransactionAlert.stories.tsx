import React, { ReactNode } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import RecurringTransactionAlert from './RecurringTransactionAlert';
import { mockUnconfirmedPatterns, mockLinkedTransactions } from '@/mocks/recurringPatternsMock';
import { SessionProvider } from 'next-auth/react';
import * as api from '@/utils/api';
import { handlers } from '@/mocks/handlers';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { HttpResponse, http } from 'msw';

// Initialize MSW
initialize();

// Create a mock API provider component with proper types
interface MockAPIProviderProps {
  children: ReactNode;
  patterns?: any[];
  transactions?: any[];
  withDelay?: boolean;
  withError?: boolean;
}

const MockAPIProvider = ({ 
  children, 
  patterns = mockUnconfirmedPatterns,
  transactions = mockLinkedTransactions,
  withDelay = false,
  withError = false
}: MockAPIProviderProps) => {
  // Use the MSW handlers instead of mocking fetch directly
  
  return children;
};

// Create a session provider decorator
const SessionWrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider 
    session={{
      user: { accessToken: 'mock-token', id: 'mock-id' },
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    }}
  >
    {children}
  </SessionProvider>
);

const meta = {
  title: 'Dashboard/RecurringTransactionAlert',
  component: RecurringTransactionAlert,
  decorators: [
    mswDecorator,
    (Story) => <SessionWrapper><Story /></SessionWrapper>
  ],
  parameters: {
    msw: {
      handlers: [
        ...handlers
      ]
    }
  }
} satisfies Meta<typeof RecurringTransactionAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create the default story
export const Default: Story = {};

// Create a story without patterns
export const WithoutPatterns: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/unconfirmed-patterns`, () => {
          return HttpResponse.json([]);
        })
      ]
    }
  }
};

// Create a story with loading state
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/unconfirmed-patterns`, async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return HttpResponse.json(mockUnconfirmedPatterns);
        })
      ]
    }
  }
};

// Create a story with error state
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${process.env.NEXT_PUBLIC_API_URL}/recurring-transactions/unconfirmed-patterns`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      ]
    }
  }
};