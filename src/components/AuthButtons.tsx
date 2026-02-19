'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthButtonsProps {
  isMobile?: boolean;
}

async function handleLogout() {
  await signOut({ redirect: false });
  window.location.href = '/api/auth/logout';
}

export default function AuthButtons({ isMobile = false }: AuthButtonsProps) {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Only show authentication state on client side
  const isLoggedIn = isClient && !!session && status === 'authenticated';
  
  if (!isClient) {
    // Show loading state during SSR
    return isMobile ? (
      <div className="w-full px-2 py-2 text-sm text-muted-foreground">
        Loading...
      </div>
    ) : (
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }
  
  if (isMobile) {
    return isLoggedIn ? (
      <button
        onClick={handleLogout}
        className="w-full px-2 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 rounded text-sm font-medium"
        data-testid="mobile-logout-button"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    ) : (
      <button
        onClick={() => signIn("auth0")}
        className="w-full px-2 py-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
        data-testid="mobile-login-button"
      >
        <LogIn className="h-4 w-4" />
        Login
      </button>
    );
  }
  
  return isLoggedIn ? (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className="flex items-center gap-1"
      data-testid="logout-button"
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
      data-testid="login-button"
    >
      <LogIn className="h-4 w-4" />
      Login
    </Button>
  );
}
