import { render, screen } from '@testing-library/react';
import Menu from '../Menu';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock AuthButtons component
jest.mock('../AuthButtons', () => {
  return function MockAuthButtons() {
    return <div data-testid="auth-buttons">Auth Buttons</div>;
  };
});

describe('Menu', () => {
  describe('Navigation Links', () => {
    it('should render Payment Accounts link in desktop navigation', () => {
      render(<Menu />);

      const paymentAccountsLink = screen.getByTestId('nav-link-payment-accounts');
      expect(paymentAccountsLink).toBeInTheDocument();
      expect(paymentAccountsLink).toHaveAttribute('href', '/payment-accounts');
      expect(paymentAccountsLink).toHaveTextContent('Payment Accounts');
    });

    it('should render all protected navigation links in desktop menu', () => {
      render(<Menu />);

      // Check that all expected links are present in desktop navigation
      const expectedLinks = [
        { testId: 'nav-link-dashboard', label: 'Dashboard', href: '/dashboard' },
        { testId: 'nav-link-bank-accounts', label: 'Bank Accounts', href: '/bank-accounts' },
        { testId: 'nav-link-credit-cards', label: 'Credit Cards', href: '/credit-cards' },
        { testId: 'nav-link-payment-accounts', label: 'Payment Accounts', href: '/payment-accounts' },
        { testId: 'nav-link-transactions', label: 'Transactions', href: '/transactions' },
        { testId: 'nav-link-recurring-transactions', label: 'Recurring', href: '/recurring-transactions' },
        { testId: 'nav-link-pending-duplicates', label: 'Duplicates', href: '/pending-duplicates' },
        { testId: 'nav-link-categories', label: 'Categories', href: '/categories' },
        { testId: 'nav-link-tags', label: 'Tags', href: '/tags' },
      ];

      expectedLinks.forEach(link => {
        const element = screen.getByTestId(link.testId);
        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('href', link.href);
        expect(element).toHaveTextContent(link.label);
      });
    });

    it('should show Payment Accounts in correct order after Credit Cards', () => {
      render(<Menu />);

      const navigationList = screen.getByTestId('navigation-menu-list');
      const links = Array.from(navigationList.querySelectorAll('a'));
      const linkTexts = links.map(link => link.textContent);

      // Find the indices
      const creditCardsIndex = linkTexts.indexOf('Credit Cards');
      const paymentAccountsIndex = linkTexts.indexOf('Payment Accounts');
      const transactionsIndex = linkTexts.indexOf('Transactions');

      // Payment Accounts should come after Credit Cards and before Transactions
      expect(paymentAccountsIndex).toBeGreaterThan(creditCardsIndex);
      expect(paymentAccountsIndex).toBeLessThan(transactionsIndex);
    });
  });
});
