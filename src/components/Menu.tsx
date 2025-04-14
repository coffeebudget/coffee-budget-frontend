'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/bank-accounts', label: 'Bank Accounts' },
  { href: '/credit-cards', label: 'Credit Cards' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/recurring-transactions', label: 'Recurring' },
  { href: '/pending-duplicates', label: 'Duplicates' },
  { href: '/categories', label: 'Categories' },
  { href: '/tags', label: 'Tags' },
];

export default function Menu() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left - Logo or Home */}
        <Link href="/" className="text-lg font-semibold text-primary">
          Coffee Budget ☕
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-4">
              {links.map(({ href, label }) => (
                <NavigationMenuItem key={href}>
                  <Link href={href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-primary',
                        pathname === href ? 'text-primary underline' : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu (hamburger) */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="mt-4 space-y-2">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'block px-2 py-2 rounded hover:bg-accent text-sm font-medium',
                      pathname === href ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
