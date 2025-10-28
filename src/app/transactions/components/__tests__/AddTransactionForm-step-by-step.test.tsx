import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../../test-utils';
import { mockTransaction, mockCategories, mockTags, mockBankAccounts, mockCreditCards } from '../../../../test-utils/fixtures';

describe('AddTransactionForm Step by Step', () => {
  const mockOnAddTransaction = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onAddTransaction: mockOnAddTransaction,
    initialData: null,
    categories: mockCategories,
    tags: mockTags,
    bankAccounts: mockBankAccounts,
    creditCards: mockCreditCards,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without any mocks', () => {
    const AddTransactionForm = require('../AddTransactionForm').default;
    
    const { container } = renderWithProviders(
      <AddTransactionForm {...defaultProps} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with next-auth mock', () => {
    // Mock next-auth
    jest.mock('next-auth/react', () => ({
      useSession: () => ({
        data: {
          user: {
            accessToken: 'mock-token',
          },
        },
        status: 'authenticated',
      }),
    }));

    const AddTransactionForm = require('../AddTransactionForm').default;
    
    const { container } = renderWithProviders(
      <AddTransactionForm {...defaultProps} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with API mocks', () => {
    // Mock next-auth
    jest.mock('next-auth/react', () => ({
      useSession: () => ({
        data: {
          user: {
            accessToken: 'mock-token',
          },
        },
        status: 'authenticated',
      }),
    }));

    // Mock API functions
    jest.mock('../../../../utils/api', () => ({
      createTag: jest.fn(),
      previewKeywordImpact: jest.fn(),
      applyKeywordToCategory: jest.fn(),
    }));

    const AddTransactionForm = require('../AddTransactionForm').default;
    
    const { container } = renderWithProviders(
      <AddTransactionForm {...defaultProps} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with all mocks', () => {
    // Mock next-auth
    jest.mock('next-auth/react', () => ({
      useSession: () => ({
        data: {
          user: {
            accessToken: 'mock-token',
          },
        },
        status: 'authenticated',
      }),
    }));

    // Mock API functions
    jest.mock('../../../../utils/api', () => ({
      createTag: jest.fn(),
      previewKeywordImpact: jest.fn(),
      applyKeywordToCategory: jest.fn(),
    }));

    // Mock toast functions
    jest.mock('../../../../utils/toast-utils', () => ({
      showSuccessToast: jest.fn(),
      showErrorToast: jest.fn(),
    }));

    const AddTransactionForm = require('../AddTransactionForm').default;
    
    const { container } = renderWithProviders(
      <AddTransactionForm {...defaultProps} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
