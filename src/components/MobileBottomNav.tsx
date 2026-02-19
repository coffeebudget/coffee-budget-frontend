'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Landmark,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import { isRouteActive } from './AppSidebar';

interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If set, match active state against any of these prefixes */
  activePrefixes?: string[];
}

const bottomNavItems: BottomNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Trans', icon: ArrowLeftRight },
  { href: '/expense-plans', label: 'Plans', icon: PiggyBank, activePrefixes: ['/expense-plans', '/income-plans', '/expense-plan-suggestions'] },
  { href: '/bank-accounts', label: 'Accts', icon: Landmark, activePrefixes: ['/bank-accounts', '/credit-cards'] },
];

function isBottomNavActive(pathname: string, item: BottomNavItem): boolean {
  if (item.activePrefixes) {
    return item.activePrefixes.some((prefix) => isRouteActive(pathname, prefix));
  }
  return isRouteActive(pathname, item.href);
}

export default function MobileBottomNav() {
  const pathname = usePathname() ?? '/';
  const { data: session } = useSession();
  const { setOpenMobile } = useSidebar();
  const isLoggedIn = !!session?.user;

  // Don't show on landing page for unauthenticated users
  if (!isLoggedIn && pathname === '/') {
    return null;
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background border-t',
        'h-16 pb-[env(safe-area-inset-bottom)]',
        'md:hidden',
        'flex items-stretch'
      )}
      data-testid="mobile-bottom-nav"
    >
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const active = isBottomNavActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-2 gap-1',
              'transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}

      {/* More button - opens sidebar as sheet */}
      <button
        onClick={() => setOpenMobile(true)}
        className={cn(
          'flex flex-col items-center justify-center flex-1 py-2 gap-1',
          'transition-colors text-muted-foreground'
        )}
        aria-label="More navigation options"
        data-testid="mobile-more-button"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-xs">More</span>
      </button>
    </nav>
  );
}
