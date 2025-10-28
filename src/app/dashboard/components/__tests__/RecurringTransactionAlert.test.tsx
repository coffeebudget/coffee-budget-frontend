import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecurringTransactionAlert from '../RecurringTransactionAlert';
import * as api from '../../../../utils/api';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import assert from 'assert';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock imports need to be before using the mock data
import { mockUnconfirmedPatterns, mockLinkedTransactions } from '../../../../../mocks/recurringPatternsMock';

// Mock the API functions directly
jest.mock('../../../../utils/api', () => ({
  fetchUnconfirmedPatterns: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: "Monthly Rent",
      amount: 1200,
      frequencyType: "monthly",
      frequencyEveryN: 1,
      startDate: "2023-01-01T00:00:00.000Z",
      status: "SCHEDULED",
      type: "expense"
    }
  ]),
  getLinkedTransactions: jest.fn().mockResolvedValue([
    {
      id: 101,
      description: "Rent Payment January",
      executionDate: "2023-01-01T00:00:00.000Z",
      amount: 1200
    }
  ]),
  confirmPattern: jest.fn().mockResolvedValue({ success: true }),
  unlinkFromRecurringTransaction: jest.fn().mockResolvedValue({ success: true }),
  adjustPattern: jest.fn().mockResolvedValue({ success: true })
}));

// Mock the next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        accessToken: 'mock-token'
      }
    },
    status: 'authenticated'
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Create a wrapper component with SessionProvider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider session={{
    user: { accessToken: 'mock-token', id: 'mock-id' },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  }}>
    {children}
  </SessionProvider>
);

describe('RecurringTransactionAlert', () => {
  // Setup router mock
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  test('renders alert when unconfirmed patterns exist', async () => {
    render(<RecurringTransactionAlert />, { wrapper: Wrapper });
    
    await waitFor(() => {
      assert(screen.getByText('Recurring Transactions Detected'));
    });
    
    assert(screen.getByText('We\'ve detected 1 potential recurring transaction patterns. Would you like to review them?'));
    assert(screen.getByText('Review Patterns'));
  });

  test('has the correct link to review patterns page', async () => {
    render(<RecurringTransactionAlert />, { wrapper: Wrapper });
    
    await waitFor(() => {
      assert(screen.getByText('Review Patterns'));
    });
    
    const link = screen.getByText('Review Patterns');
    assert.strictEqual(link.getAttribute('href'), '/recurring-transactions/review-patterns');
  });

  test('api is called to fetch unconfirmed patterns on mount', async () => {
    render(<RecurringTransactionAlert />, { wrapper: Wrapper });
    
    await waitFor(() => {
      assert.strictEqual((api.fetchUnconfirmedPatterns as jest.Mock).mock.calls.length, 1);
      assert.strictEqual((api.fetchUnconfirmedPatterns as jest.Mock).mock.calls[0][0], 'mock-token');
    });
  });
}); 