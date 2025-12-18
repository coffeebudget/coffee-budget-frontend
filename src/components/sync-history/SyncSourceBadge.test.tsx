import { render, screen } from '@testing-library/react';
import { SyncSourceBadge } from './SyncSourceBadge';
import { SyncSource } from '@/types/sync-history';

describe('SyncSourceBadge', () => {
  it('should render GoCardless source badge', () => {
    render(<SyncSourceBadge source={SyncSource.GOCARDLESS} />);

    const badge = screen.getByText('GoCardless');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-blue-100');
    expect(badge.parentElement).toHaveClass('text-blue-800');
  });

  it('should render PayPal source badge', () => {
    render(<SyncSourceBadge source={SyncSource.PAYPAL} />);

    const badge = screen.getByText('PayPal');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-indigo-100');
    expect(badge.parentElement).toHaveClass('text-indigo-800');
  });

  it('should render Stripe source badge', () => {
    render(<SyncSourceBadge source={SyncSource.STRIPE} />);

    const badge = screen.getByText('Stripe');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-purple-100');
    expect(badge.parentElement).toHaveClass('text-purple-800');
  });

  it('should render Plaid source badge', () => {
    render(<SyncSourceBadge source={SyncSource.PLAID} />);

    const badge = screen.getByText('Plaid');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-teal-100');
    expect(badge.parentElement).toHaveClass('text-teal-800');
  });

  it('should render Manual source badge', () => {
    render(<SyncSourceBadge source={SyncSource.MANUAL} />);

    const badge = screen.getByText('Manual');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('bg-gray-100');
    expect(badge.parentElement).toHaveClass('text-gray-800');
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <SyncSourceBadge source={SyncSource.GOCARDLESS} className="custom-class" />
    );

    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });
});
