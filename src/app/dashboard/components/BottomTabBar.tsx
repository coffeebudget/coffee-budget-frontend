'use client';

import { LayoutDashboard, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t",
        "h-16 pb-[env(safe-area-inset-bottom)]",
        "md:hidden",
        "flex items-stretch"
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-2 gap-1",
              "transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
