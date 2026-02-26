import React from 'react';
import { render, screen } from '@testing-library/react';
import { formatCurrency } from '@/utils/format';

// Normalize non-breaking spaces for testing-library matching
const fc = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, ' ');

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { accessToken: 'mock-token' } },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseCreditCards = jest.fn();

jest.mock('@/hooks/useCreditCards', () => ({
  useCreditCards: () => mockUseCreditCards(),
}));

import CreditCardsSummary from '../CreditCardsSummary';

describe('CreditCardsSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when loading', () => {
    mockUseCreditCards.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<CreditCardsSummary />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when no credit cards', () => {
    mockUseCreditCards.mockReturnValue({ data: [], isLoading: false });

    const { container } = render(<CreditCardsSummary />);
    expect(container.firstChild).toBeNull();
  });

  it('should display credit card information', () => {
    mockUseCreditCards.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Impronta',
          billingDay: 15,
          creditLimit: 1200,
          availableCredit: 800,
        },
      ],
      isLoading: false,
    });

    render(<CreditCardsSummary />);

    expect(screen.getByText('💳 Credit Cards')).toBeInTheDocument();
    expect(screen.getByText('Impronta')).toBeInTheDocument();
    // Used: 1200 - 800 = 400
    expect(screen.getByText(fc(400), { exact: false })).toBeInTheDocument();
    expect(screen.getByText(fc(1200), { exact: false })).toBeInTheDocument();
    expect(screen.getByText(fc(800), { exact: false })).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should display multiple credit cards', () => {
    mockUseCreditCards.mockReturnValue({
      data: [
        { id: 1, name: 'Visa', billingDay: 15, creditLimit: 2000, availableCredit: 1500 },
        { id: 2, name: 'Mastercard', billingDay: 1, creditLimit: 5000, availableCredit: 3000 },
      ],
      isLoading: false,
    });

    render(<CreditCardsSummary />);

    expect(screen.getByText('Visa')).toBeInTheDocument();
    expect(screen.getByText('Mastercard')).toBeInTheDocument();
  });
});
