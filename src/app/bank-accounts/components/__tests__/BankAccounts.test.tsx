import React from 'react';
import { renderWithProviders } from '../../../../test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import BankAccounts from '../BankAccounts';
import { mockBankAccounts, mockBankAccount } from '../../../../test-utils/fixtures/bank-accounts';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        accessToken: 'mock-token',
      },
    },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock fetch with a default response for connection status
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ alerts: [] }),
});

const defaultProps = {
  bankAccounts: mockBankAccounts,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onAccountUpdated: jest.fn(),
};

describe('BankAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ alerts: [] }),
    });
  });

  describe('Rendering', () => {
    it('should render table with bank accounts', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      expect(screen.getByText('Account Name')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
      expect(screen.getByText('GoCardless')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display all bank accounts in table rows', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      expect(screen.getByText('Checking Account')).toBeInTheDocument();
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Investment Account')).toBeInTheDocument();
      expect(screen.getByText('Inactive Account')).toBeInTheDocument();
    });

    it('should display account balances correctly', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      // Check that all account names are rendered (this confirms all accounts are displayed)
      expect(screen.getByText('Checking Account')).toBeInTheDocument();
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Investment Account')).toBeInTheDocument();
      expect(screen.getByText('Inactive Account')).toBeInTheDocument();
      
      // Check for specific balances
      expect(screen.getByText('$2500.75')).toBeInTheDocument();
      expect(screen.getByText('$10000.00')).toBeInTheDocument();
      expect(screen.getByText('$25000.00')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should show GoCardless connection status', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const connectedBadges = screen.getAllByText('Connected');
      const notConnectedBadges = screen.getAllByText('Not Connected');
      
      expect(connectedBadges).toHaveLength(4); // First 4 accounts are connected
      expect(notConnectedBadges).toHaveLength(1); // Last account is not connected
    });

    it('should render action buttons for each account', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const editButtons = screen.getAllByTitle('Edit Account');
      const deleteButtons = screen.getAllByTitle('Delete Account');
      const importButtons = screen.getAllByTitle('Import Transactions');
      
      expect(editButtons).toHaveLength(5); // All accounts have edit button
      expect(deleteButtons).toHaveLength(5); // All accounts have delete button
      expect(importButtons).toHaveLength(4); // Only connected accounts have import button
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no bank accounts', () => {
      const propsWithNoAccounts = { ...defaultProps, bankAccounts: [] };
      renderWithProviders(<BankAccounts {...propsWithNoAccounts} />);
      
      expect(screen.getByText('No Bank Accounts')).toBeInTheDocument();
      expect(screen.getByText("You haven't added any bank accounts yet.")).toBeInTheDocument();
      expect(screen.getByText(/Click.*Add Account.*to create your first bank account/)).toBeInTheDocument();
    });
  });

  describe('Account Actions', () => {
    it('should call onEdit when edit button is clicked', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const editButtons = screen.getAllByTitle('Edit Account');
      fireEvent.click(editButtons[0]);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockBankAccounts[0]);
    });

    it('should show confirm delete state when delete button is clicked first time', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle('Delete Account');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByTitle('Confirm Delete')).toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked twice', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle('Delete Account');
      fireEvent.click(deleteButtons[0]); // First click - confirm state
      fireEvent.click(deleteButtons[0]); // Second click - actually delete
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockBankAccounts[0].id);
    });

    it('should reset confirm delete state when different account delete is clicked', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const deleteButtons = screen.getAllByTitle('Delete Account');
      fireEvent.click(deleteButtons[0]); // First account - confirm state
      fireEvent.click(deleteButtons[1]); // Second account - should reset first
      
      expect(screen.getAllByTitle('Delete Account')).toHaveLength(4); // 4 accounts back to normal state
      expect(screen.getByTitle('Confirm Delete')).toBeInTheDocument(); // Second account in confirm state
    });
  });

  describe('Import Functionality', () => {
    it('should show import button only for connected accounts', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      expect(importButtons).toHaveLength(4); // Only connected accounts
    });

    it('should handle successful import with new transactions', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          newTransactionsCount: 5,
          duplicatesCount: 2,
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/gocardless/import-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: mockBankAccounts[0].gocardlessAccountId,
            bankAccountId: mockBankAccounts[0].id,
          }),
        });
      });
    });

    it('should handle import with no new transactions', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          newTransactionsCount: 0,
          duplicatesCount: 3,
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle import with no transactions found', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          newTransactionsCount: 0,
          duplicatesCount: 0,
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle import error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should show loading state during import', async () => {
      const mockResponse = {
        ok: true,
        json: () => new Promise(resolve => setTimeout(() => resolve({
          newTransactionsCount: 5,
          duplicatesCount: 2,
        }), 100)),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      // Should show loading spinner
      expect(importButtons[0]).toBeDisabled();
    });

    it('should call onAccountUpdated after successful import', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/gocardless/import-single') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              newTransactionsCount: 5,
              duplicatesCount: 2,
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ alerts: [] }),
        });
      });

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      await waitFor(() => {
        expect(defaultProps.onAccountUpdated).toHaveBeenCalled();
      });
    });
  });

  describe('Balance Formatting', () => {
    it('should format positive balances correctly', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      expect(screen.getByText('$2500.75')).toBeInTheDocument();
      expect(screen.getByText('$10000.00')).toBeInTheDocument();
    });

    it('should format negative balances correctly', () => {
      // Create a test with just the Credit Card account
      const creditCardAccount = mockBankAccounts.find(account => account.name === 'Credit Card');
      const propsWithCreditCard = { ...defaultProps, bankAccounts: [creditCardAccount!] };
      
      renderWithProviders(<BankAccounts {...propsWithCreditCard} />);
      
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText(/-1500.50/)).toBeInTheDocument();
    });

    it('should handle string balance values', () => {
      const accountsWithStringBalance = [
        { ...mockBankAccount, balance: '1500.25' as any }
      ];
      const propsWithStringBalance = { ...defaultProps, bankAccounts: accountsWithStringBalance };
      
      renderWithProviders(<BankAccounts {...propsWithStringBalance} />);
      
      expect(screen.getByText('$1500.25')).toBeInTheDocument();
    });
  });

  describe('GoCardless Status', () => {
    it('should show connected status for accounts with gocardlessAccountId', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const connectedBadges = screen.getAllByText('Connected');
      expect(connectedBadges).toHaveLength(4);
    });

    it('should show not connected status for accounts without gocardlessAccountId', () => {
      const accountsWithoutGoCardless = [
        { ...mockBankAccount, gocardlessAccountId: undefined }
      ];
      const propsWithoutGoCardless = { ...defaultProps, bankAccounts: accountsWithoutGoCardless };
      
      renderWithProviders(<BankAccounts {...propsWithoutGoCardless} />);
      
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(4);
    });

    it('should have proper button labels', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      expect(screen.getAllByTitle('Edit Account')).toHaveLength(5);
      expect(screen.getAllByTitle('Delete Account')).toHaveLength(5);
      expect(screen.getAllByTitle('Import Transactions')).toHaveLength(4);
    });

    it('should have proper button states', () => {
      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      importButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<BankAccounts {...defaultProps} />);
      
      const importButtons = screen.getAllByTitle('Import Transactions');
      fireEvent.click(importButtons[0]);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle accounts without gocardlessAccountId for import', () => {
      const accountsWithoutGoCardless = [
        { ...mockBankAccount, gocardlessAccountId: undefined }
      ];
      const propsWithoutGoCardless = { ...defaultProps, bankAccounts: accountsWithoutGoCardless };
      
      renderWithProviders(<BankAccounts {...propsWithoutGoCardless} />);
      
      // Should not show import buttons for accounts without gocardlessAccountId
      expect(screen.queryByTitle('Import Transactions')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle accounts with null balance', () => {
      const accountsWithNullBalance = [
        { ...mockBankAccount, balance: null as any }
      ];
      const propsWithNullBalance = { ...defaultProps, bankAccounts: accountsWithNullBalance };
      
      renderWithProviders(<BankAccounts {...propsWithNullBalance} />);
      
      expect(screen.getByText('$NaN')).toBeInTheDocument();
    });

    it('should handle accounts with undefined balance', () => {
      const accountsWithUndefinedBalance = [
        { ...mockBankAccount, balance: undefined as any }
      ];
      const propsWithUndefinedBalance = { ...defaultProps, bankAccounts: accountsWithUndefinedBalance };
      
      renderWithProviders(<BankAccounts {...propsWithUndefinedBalance} />);
      
      expect(screen.getByText('$NaN')).toBeInTheDocument();
    });

    it('should handle accounts with zero balance', () => {
      const accountsWithZeroBalance = [
        { ...mockBankAccount, balance: 0 }
      ];
      const propsWithZeroBalance = { ...defaultProps, bankAccounts: accountsWithZeroBalance };
      
      renderWithProviders(<BankAccounts {...propsWithZeroBalance} />);
      
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });
});
