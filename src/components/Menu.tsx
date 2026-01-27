'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Menu as MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const AuthButtons = dynamic(() => import('./AuthButtons'), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading...</div>
});

const protectedLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/bank-accounts', label: 'Bank Accounts' },
  { href: '/credit-cards', label: 'Credit Cards' },
  { href: '/payment-accounts', label: 'Payment Accounts' },
  { href: '/payment-activities', label: 'Payment Activities' },
  { href: '/payment-reconciliation', label: 'Reconciliation' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/pending-duplicates', label: 'Duplicates' },
  { href: '/expense-plans', label: 'Expense Plans' },
  { href: '/income-plans', label: 'Income Plans' },
  { href: '/categories', label: 'Categories' },
  { href: '/tags', label: 'Tags' },
];

const publicLinks = [
  { href: '/', label: 'Home' },
];

export default function Menu() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only using pathname after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // For now, show all links - authentication will be handled by AuthButtons
  const links = [...publicLinks, ...protectedLinks];

  return (
    <nav className="border-b bg-background" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left - Logo or Home */}
        <Link href="/" className="text-lg font-semibold text-primary" data-testid="logo-link">
          Coffee Budget ☕
        </Link>

        {/* Desktop Nav */}
        <div className="hidden desktop:flex items-center" data-testid="desktop-navigation">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-4" data-testid="navigation-menu-list">
              {links.map(({ href, label }) => (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={href}
                      data-testid={`nav-link-${href.replace('/', '') || 'home'}`}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-primary',
                        mounted && pathname === href ? 'text-primary underline' : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          
          {/* Auth buttons for desktop */}
          <div className="ml-6 flex items-center" data-testid="desktop-auth-buttons">
            <AuthButtons />
          </div>
        </div>

        {/* Mobile Menu (hamburger) */}
        <div className="desktop:hidden" data-testid="mobile-navigation">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" data-testid="mobile-menu-button">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]" data-testid="mobile-menu-sheet">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="mt-4 space-y-2" data-testid="mobile-navigation-menu">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    data-testid={`mobile-nav-link-${href.replace('/', '') || 'home'}`}
                    className={cn(
                      'block px-2 py-2 rounded hover:bg-accent text-sm font-medium',
                      mounted && pathname === href ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </Link>
                ))}
                
                {/* Auth button for mobile */}
                <div className="pt-4 mt-4 border-t" data-testid="mobile-auth-buttons">
                  <AuthButtons isMobile />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
