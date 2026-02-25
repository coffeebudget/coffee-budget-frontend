'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  Sparkles,
  Landmark,
  CreditCard,
  Wallet,
  Activity,
  GitCompareArrows,
  RefreshCw,
  FolderTree,
  Tag,
  Settings,
  ChevronRight,
  Coffee,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import dynamic from 'next/dynamic';
import type { LucideIcon } from 'lucide-react';

const AuthButtons = dynamic(() => import('./AuthButtons'), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground px-2 py-2">Loading...</div>,
});

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const primaryItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
];

const navGroups: NavGroup[] = [
  {
    label: 'Planning',
    items: [
      { href: '/expense-plans', label: 'Expense Plans', icon: PiggyBank },
      { href: '/income-plans', label: 'Income Plans', icon: TrendingUp },
      { href: '/expense-plan-suggestions', label: 'AI Suggestions', icon: Sparkles },
    ],
  },
  {
    label: 'Bank Accounts',
    items: [
      { href: '/bank-accounts', label: 'Bank Accounts', icon: Landmark },
      { href: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
    ],
  },
  {
    label: 'Payment Services',
    items: [
      { href: '/payment-accounts', label: 'Accounts', icon: Wallet },
      { href: '/payment-activities', label: 'Activities', icon: Activity },
      { href: '/payment-reconciliation', label: 'Reconciliation', icon: GitCompareArrows },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/categories', label: 'Categories', icon: FolderTree },
      { href: '/tags', label: 'Tags', icon: Tag },
      { href: '/sync-history', label: 'Sync History', icon: RefreshCw },
      { href: '/settings', label: 'Account', icon: Settings },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isRouteActive(pathname, item.href));
}

export { primaryItems, navGroups, isRouteActive, isGroupActive };
export type { NavItem, NavGroup };

export default function AppSidebar() {
  const pathname = usePathname() ?? '/';
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Don't render the sidebar on the landing page for unauthenticated users
  if (!isLoggedIn && pathname === '/') {
    return null;
  }

  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Coffee Budget">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Coffee className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Coffee Budget</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary navigation items (no group label) */}
        <SidebarGroup>
          <SidebarMenu>
            {primaryItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isRouteActive(pathname, item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Grouped navigation items */}
        {navGroups.map((group) => (
          <Collapsible
            key={group.label}
            defaultOpen={isGroupActive(pathname, group)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center">
                  {group.label}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isRouteActive(pathname, item.href)}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AuthButtons isMobile />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
