'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from "next-auth/react";
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
import { Menu as MenuIcon, LogOut, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const protectedLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/bank-accounts', label: 'Bank Accounts' },
  { href: '/credit-cards', label: 'Credit Cards' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/recurring-transactions', label: 'Recurring' },
  { href: '/pending-duplicates', label: 'Duplicates' },
  { href: '/categories', label: 'Categories' },
  { href: '/tags', label: 'Tags' },
];

const publicLinks = [
  { href: '/', label: 'Home' },
];

export default function Menu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  
  // Links to display based on authentication status
  const links = isLoggedIn ? [...publicLinks, ...protectedLinks] : publicLinks;

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left - Logo or Home */}
        <Link href="/" className="text-lg font-semibold text-primary">
          Coffee Budget ☕
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center">
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
          
          {/* Auth buttons for desktop */}
          <div className="ml-6 flex items-center">
            {isLoggedIn ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut()}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => signIn("auth0")}
                className="flex items-center gap-1"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>
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
                
                {/* Auth button for mobile */}
                <div className="pt-4 mt-4 border-t">
                  {isLoggedIn ? (
                    <button
                      onClick={() => signOut()}
                      className="w-full px-2 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  ) : (
                    <button
                      onClick={() => signIn("auth0")}
                      className="w-full px-2 py-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
