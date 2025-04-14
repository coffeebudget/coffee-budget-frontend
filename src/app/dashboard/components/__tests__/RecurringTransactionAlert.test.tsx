import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecurringTransactionAlert from '../RecurringTransactionAlert';
import * as api from '@/utils/api';
import { SessionProvider } from 'next-auth/react';

// Mock imports need to be before using the mock data
import { mockUnconfirmedPatterns, mockLinkedTransactions } from '@/mocks/recurringPatternsMock';

// Mock the API functions directly
jest.mock('@/utils/api', () => ({
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders alert when unconfirmed patterns exist', async () => {
    render(<RecurringTransactionAlert />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Recurring Transactions Detected')).toBeInTheDocument();
    });
  });

  test('opens modal when review button is clicked', async () => {
    render(<RecurringTransactionAlert />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Review Patterns')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Review Patterns'));
    
    await waitFor(() => {
      expect(screen.getByText('Recurring Transaction Pattern')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
  });

  test('confirms pattern when confirm button is clicked', async () => {
    const spy = jest.spyOn(api, 'confirmPattern');
    
    render(<RecurringTransactionAlert />, { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Review Patterns')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Review Patterns'));
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Pattern')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Confirm Pattern'));
    
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
}); 