"use client";

import { useRouter } from "next/navigation";
import { useMonthlyDepositSummary, useExpenseTimeline } from "@/hooks/useExpensePlans";
import {
  PiggyBank,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  formatCurrency,
  getFundingStatusLabel,
  FundingStatus,
} from "@/types/expense-plan-types";

export default function ExpensePlanDashboardCard() {
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useMonthlyDepositSummary();
  const { data: timeline, isLoading: timelineLoading } = useExpenseTimeline(6);

  const handleNavigateToExpensePlans = () => {
    router.push("/expense-plans");
  };

  if (summaryLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-green-200 mb-8">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
          <span className="ml-2 text-green-700">Loading expense plans...</span>
        </div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 mb-8">
        <div className="flex items-center justify-center h-32">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="ml-2 text-red-700">Failed to load expense plans</span>
        </div>
      </div>
    );
  }

  // Get upcoming expenses (next 3 months)
  const upcomingExpenses = timeline?.slice(0, 5) || [];

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-xl mb-8 border border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-green-600 rounded-lg">
            <PiggyBank className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-green-900">
              Expense Plans
            </h3>
            <p className="text-green-700 text-sm">
              Virtual envelopes for future expenses
            </p>
          </div>
        </div>
        <button
          onClick={handleNavigateToExpensePlans}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
        >
          Manage Plans
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Monthly Deposit */}
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Monthly Deposit</div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(summary?.totalMonthlyDeposit || 0)}
          </div>
          <div className="text-xs text-gray-500">Needed this month</div>
        </div>

        {/* Active Plans */}
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Active Plans</div>
          <div className="text-2xl font-bold text-blue-700">
            {summary?.planCount || 0}
          </div>
          <div className="text-xs text-gray-500">Tracking expenses</div>
        </div>

        {/* Fully Funded */}
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-emerald-500">
          <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Fully Funded
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {summary?.fullyFundedCount || 0}
          </div>
          <div className="text-xs text-gray-500">Ready for payment</div>
        </div>

        {/* Behind Schedule */}
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
            Behind Schedule
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {summary?.behindScheduleCount || 0}
          </div>
          <div className="text-xs text-gray-500">Needs attention</div>
        </div>
      </div>

      {/* Upcoming Expenses */}
      {upcomingExpenses.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center mb-3">
            <Calendar className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-semibold text-gray-800">Upcoming Expenses</h4>
          </div>

          <div className="space-y-2">
            {upcomingExpenses.map((entry, index) => (
              <div
                key={`${entry.planId}-${index}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{entry.icon || "📋"}</span>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      {entry.planName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.date)} ({entry.monthsAway === 0 ? "This month" : `${entry.monthsAway}mo`})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">
                    {formatCurrency(entry.amount)}
                  </div>
                  <StatusBadge status={entry.status} />
                </div>
              </div>
            ))}
          </div>

          {timeline && timeline.length > 5 && (
            <button
              onClick={handleNavigateToExpensePlans}
              className="w-full mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View all {timeline.length} upcoming expenses →
            </button>
          )}
        </div>
      )}

      {/* Empty State for Timeline */}
      {upcomingExpenses.length === 0 && !timelineLoading && (
        <div className="bg-white rounded-lg p-6 text-center border border-green-200">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500 text-sm">
            No upcoming expenses scheduled.
          </p>
          <button
            onClick={handleNavigateToExpensePlans}
            className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Create your first expense plan →
          </button>
        </div>
      )}
    </div>
  );
}

// Helper component for status badge
function StatusBadge({ status }: { status: FundingStatus }) {
  const colorMap: Record<FundingStatus, string> = {
    funded: "bg-green-100 text-green-700",
    almost_ready: "bg-blue-100 text-blue-700",
    on_track: "bg-gray-100 text-gray-700",
    behind: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${colorMap[status] || "bg-gray-100 text-gray-600"}`}
    >
      {getFundingStatusLabel(status)}
    </span>
  );
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
