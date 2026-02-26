"use client";

import Link from "next/link";
import { useExpenseTimeline } from "@/hooks/useExpensePlans";
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/types/expense-plan-types";
import type { TimelineEntry } from "@/types/expense-plan-types";

interface UpcomingExpensesProps {
  className?: string;
  onNavigateToBudget?: () => void;
}

function getStatusIcon(status: TimelineEntry["status"]) {
  switch (status) {
    case "funded":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "on_track":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "behind":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
}

function getStatusBadge(status: TimelineEntry["status"]) {
  const styles: Record<string, string> = {
    funded: "bg-green-100 text-green-700",
    on_track: "bg-blue-100 text-blue-700",
    behind: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    funded: "Funded",
    on_track: "On Track",
    behind: "Behind",
  };
  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getDaysLabel(monthsAway: number): string {
  if (monthsAway === 0) return "This month";
  if (monthsAway === 1) return "Next month";
  return `In ${monthsAway} months`;
}

export default function UpcomingExpenses({
  className = "",
  onNavigateToBudget,
}: UpcomingExpensesProps) {
  const { data: timeline, isLoading } = useExpenseTimeline(3);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow border p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Upcoming Expenses</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const items = timeline?.slice(0, 5) || [];

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow border p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Upcoming Expenses</h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          No upcoming expense plan payments
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow border p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Upcoming Expenses</h3>
        </div>
        {onNavigateToBudget && (
          <button
            onClick={onNavigateToBudget}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Expense list */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <Link
            key={`${item.planId}-${item.date}-${index}`}
            href={`/expense-plans?highlight=${item.planId}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            {/* Icon */}
            <span className="text-lg shrink-0">
              {item.icon || "📋"}
            </span>

            {/* Name + date */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {item.planName}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                {formatDueDate(item.date)}
                <span className="text-gray-300">|</span>
                {getDaysLabel(item.monthsAway)}
              </div>
            </div>

            {/* Amount + status */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  {formatCurrency(item.amount)}
                </div>
                {getStatusBadge(item.status)}
              </div>
              {getStatusIcon(item.status)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
