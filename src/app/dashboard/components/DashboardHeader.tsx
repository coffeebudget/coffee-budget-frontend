'use client';

import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth } from '@/types/free-to-spend-types';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  notificationCount: number;
  onBellClick: () => void;
}

function changeMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

export default function DashboardHeader({
  selectedMonth,
  onMonthChange,
  notificationCount,
  onBellClick,
}: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold hidden md:block">Financial Dashboard</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onMonthChange(changeMonth(selectedMonth, -1))}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium min-w-[140px] text-center capitalize">
          {formatMonth(selectedMonth, 'it-IT')}
        </span>
        <button
          onClick={() => onMonthChange(changeMonth(selectedMonth, 1))}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={onBellClick}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1 rounded-full",
            "bg-red-500 text-white text-xs font-medium"
          )}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>
    </div>
  );
}
