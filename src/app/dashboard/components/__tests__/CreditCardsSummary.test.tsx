import React from 'react';
import { render, screen } from '@testing-library/react';

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

    expect(screen.getByText('💳 Carte di Credito')).toBeInTheDocument();
    expect(screen.getByText('Impronta')).toBeInTheDocument();
    // Used: 1200 - 800 = 400
    expect(screen.getByText(/€400.00/)).toBeInTheDocument();
    expect(screen.getByText(/€1,200.00/)).toBeInTheDocument();
    expect(screen.getByText(/€800.00/)).toBeInTheDocument();
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
