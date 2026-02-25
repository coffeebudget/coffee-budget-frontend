import { isRouteActive, isGroupActive, primaryItems, navGroups } from '../AppSidebar';
import type { NavGroup } from '../AppSidebar';

describe('AppSidebar', () => {
  describe('isRouteActive', () => {
    it('should match exact dashboard route', () => {
      expect(isRouteActive('/dashboard', '/dashboard')).toBe(true);
    });

    it('should not match dashboard for sub-routes', () => {
      expect(isRouteActive('/dashboard/ai-analysis', '/dashboard')).toBe(false);
    });

    it('should match exact route for non-dashboard paths', () => {
      expect(isRouteActive('/transactions', '/transactions')).toBe(true);
    });

    it('should match sub-routes for non-dashboard paths', () => {
      expect(isRouteActive('/expense-plans/123', '/expense-plans')).toBe(true);
    });

    it('should not match unrelated routes', () => {
      expect(isRouteActive('/categories', '/transactions')).toBe(false);
    });
  });

  describe('isGroupActive', () => {
    const planningGroup: NavGroup = {
      label: 'Planning',
      items: [
        { href: '/expense-plans', label: 'Expense Plans', icon: (() => null) as any },
        { href: '/income-plans', label: 'Income Plans', icon: (() => null) as any },
      ],
    };

    it('should return true when pathname matches a group item', () => {
      expect(isGroupActive('/expense-plans', planningGroup)).toBe(true);
    });

    it('should return true when pathname matches a group item sub-route', () => {
      expect(isGroupActive('/income-plans/new', planningGroup)).toBe(true);
    });

    it('should return false when pathname does not match any group item', () => {
      expect(isGroupActive('/transactions', planningGroup)).toBe(false);
    });
  });

  describe('Navigation structure', () => {
    it('should have Dashboard and Transactions as primary items', () => {
      expect(primaryItems).toHaveLength(2);
      expect(primaryItems[0].href).toBe('/dashboard');
      expect(primaryItems[1].href).toBe('/transactions');
    });

    it('should have 4 navigation groups', () => {
      expect(navGroups).toHaveLength(4);
      expect(navGroups.map((g) => g.label)).toEqual([
        'Planning',
        'Bank Accounts',
        'Payment Services',
        'Settings',
      ]);
    });

    it('should include AI Suggestions in Planning group', () => {
      const planning = navGroups.find((g) => g.label === 'Planning');
      expect(planning?.items.some((i) => i.href === '/expense-plan-suggestions')).toBe(true);
    });

    it('should include Sync History in Settings group', () => {
      const settings = navGroups.find((g) => g.label === 'Settings');
      expect(settings?.items.some((i) => i.href === '/sync-history')).toBe(true);
    });

    it('should separate Bank Accounts from Payment Services', () => {
      const bankAccounts = navGroups.find((g) => g.label === 'Bank Accounts');
      const paymentServices = navGroups.find((g) => g.label === 'Payment Services');

      expect(bankAccounts?.items.map((i) => i.href)).toEqual(['/bank-accounts', '/credit-cards']);
      expect(paymentServices?.items.map((i) => i.href)).toEqual([
        '/payment-accounts',
        '/payment-activities',
        '/payment-reconciliation',
      ]);
    });

    it('should not include Duplicates in sidebar navigation', () => {
      const allHrefs = [
        ...primaryItems.map((i) => i.href),
        ...navGroups.flatMap((g) => g.items.map((i) => i.href)),
      ];
      expect(allHrefs).not.toContain('/pending-duplicates');
    });

    it('should have 14 total navigation items', () => {
      const totalGroupItems = navGroups.reduce((sum, g) => sum + g.items.length, 0);
      const total = primaryItems.length + totalGroupItems;
      expect(total).toBe(14);
    });
  });
});
