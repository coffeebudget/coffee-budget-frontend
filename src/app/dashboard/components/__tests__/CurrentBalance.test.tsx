import React from 'react';
import { renderWithProviders, screen, waitFor } from '../../../../test-utils';
import CurrentBalance from '../CurrentBalance';

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

// Mock API function
jest.mock('../../../../utils/api', () => ({
  fetchCurrentBalance: jest.fn(),
}));

import { fetchCurrentBalance } from '../../../../utils/api';

const mockFetchCurrentBalance = fetchCurrentBalance as jest.MockedFunction<typeof fetchCurrentBalance>;

describe('CurrentBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFetchCurrentBalance.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<CurrentBalance />);
    
    expect(screen.getByText('Loading current balance...')).toBeInTheDocument();
  });

  it('should render current balance when data is loaded', async () => {
    const mockBalance = 1234.56;
    mockFetchCurrentBalance.mockResolvedValue({ currentBalance: mockBalance });

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      expect(screen.getByText('Current Balance')).toBeInTheDocument();
      expect(screen.getByText('$1234.56')).toBeInTheDocument();
    });

    expect(mockFetchCurrentBalance).toHaveBeenCalledWith('mock-token');
  });

  it('should render error state when API call fails', async () => {
    mockFetchCurrentBalance.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch current balance')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch current balance')).toHaveClass('text-red-500');
  });

  it('should handle zero balance correctly', async () => {
    mockFetchCurrentBalance.mockResolvedValue({ currentBalance: 0 });

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  it('should handle negative balance correctly', async () => {
    mockFetchCurrentBalance.mockResolvedValue({ currentBalance: -500.75 });

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      expect(screen.getByText('$-500.75')).toBeInTheDocument();
    });
  });

  it('should handle large balance correctly', async () => {
    mockFetchCurrentBalance.mockResolvedValue({ currentBalance: 1234567.89 });

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      expect(screen.getByText('$1234567.89')).toBeInTheDocument();
    });
  });

  it('should have proper styling classes', async () => {
    mockFetchCurrentBalance.mockResolvedValue({ currentBalance: 1000 });

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      const container = screen.getByText('Current Balance').closest('div');
      expect(container).toHaveClass('bg-blue-100', 'p-4', 'rounded-lg', 'shadow');
    });
  });

  it('should call API only once on mount', async () => {
    mockFetchCurrentBalance.mockResolvedValue({ currentBalance: 1000 });

    renderWithProviders(<CurrentBalance />);
    
    await waitFor(() => {
      expect(screen.getByText('$1000.00')).toBeInTheDocument();
    });

    expect(mockFetchCurrentBalance).toHaveBeenCalledTimes(1);
  });
});
