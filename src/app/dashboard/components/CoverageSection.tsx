"use client";

import { useCoverageSummary } from "@/hooks/useExpensePlans";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from "lucide-react";
import {
  formatCurrency,
  getCoverageStatusLabel,
  CoverageSummaryResponse,
  AccountCoverage,
  PlanAtRisk,
} from "@/types/expense-plan-types";
import { useState } from "react";

interface CoverageSectionProps {
  className?: string;
}

export default function CoverageSection({ className = "" }: CoverageSectionProps) {
  const { data, isLoading, error, refetch } = useCoverageSummary();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());

  const toggleAccount = (accountId: number) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg border border-blue-200 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-700">Loading coverage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="ml-2 text-red-700">Failed to load coverage data</span>
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.overallStatus === "no_data") {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-lg border border-gray-200 ${className}`}>
        <div className="flex items-center mb-4">
          <div className="p-3 bg-gray-400 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-700">Coverage Monitor</h3>
            <p className="text-gray-500 text-sm">30-day expense coverage status</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
          <CalendarClock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500 text-sm">
            No expense plans with upcoming due dates found.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Link expense plans to payment accounts to monitor coverage.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(data.overallStatus);

  return (
    <div className={`bg-gradient-to-r ${statusConfig.gradient} p-6 rounded-xl shadow-lg border ${statusConfig.border} hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-3 ${statusConfig.iconBg} rounded-lg`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className={`text-xl font-bold ${statusConfig.titleColor}`}>
              Coverage Monitor
            </h3>
            <p className={`${statusConfig.subtitleColor} text-sm`}>
              30-day expense coverage status
            </p>
          </div>
        </div>
        <StatusBadge status={data.overallStatus} label={getCoverageStatusLabel(data.overallStatus)} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Accounts */}
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Linked Accounts</div>
          <div className="text-2xl font-bold text-blue-700">
            {data.accounts.length}
          </div>
          <div className="text-xs text-gray-500">With upcoming plans</div>
        </div>

        {/* Accounts With Shortfall */}
        <div className={`bg-white rounded-lg p-4 text-center border-l-4 ${data.accountsWithShortfall > 0 ? "border-red-500" : "border-green-500"}`}>
          <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
            {data.accountsWithShortfall > 0 ? (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
            {data.accountsWithShortfall > 0 ? "With Shortfall" : "All Covered"}
          </div>
          <div className={`text-2xl font-bold ${data.accountsWithShortfall > 0 ? "text-red-700" : "text-green-700"}`}>
            {data.accountsWithShortfall > 0 ? data.accountsWithShortfall : data.accounts.length}
          </div>
          <div className="text-xs text-gray-500">
            {data.accountsWithShortfall > 0 ? "Needs attention" : "Accounts covered"}
          </div>
        </div>

        {/* Total Shortfall */}
        <div className={`bg-white rounded-lg p-4 text-center border-l-4 ${data.totalShortfall > 0 ? "border-red-500" : "border-green-500"}`}>
          <div className="text-sm text-gray-600 mb-1">Total Shortfall</div>
          <div className={`text-2xl font-bold ${data.totalShortfall > 0 ? "text-red-700" : "text-green-700"}`}>
            {data.totalShortfall > 0 ? formatCurrency(data.totalShortfall) : "€0.00"}
          </div>
          <div className="text-xs text-gray-500">
            {data.totalShortfall > 0 ? "Amount needed" : "No shortfall"}
          </div>
        </div>
      </div>

      {/* Account Details */}
      {data.accounts.length > 0 && (
        <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
          <div className="p-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-gray-800">Account Coverage Details</h4>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {data.accounts.map((account) => (
              <AccountRow
                key={account.accountId}
                account={account}
                isExpanded={expandedAccounts.has(account.accountId)}
                onToggle={() => toggleAccount(account.accountId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Plans */}
      {data.unassignedPlans.count > 0 && (
        <div className="mt-4 bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-semibold text-yellow-800">
              Unassigned Plans ({data.unassignedPlans.count})
            </h4>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            These plans are not linked to any payment account. Total: {formatCurrency(data.unassignedPlans.totalAmount)}
          </p>
          <div className="space-y-2">
            {data.unassignedPlans.plans.slice(0, 3).map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
            {data.unassignedPlans.plans.length > 3 && (
              <p className="text-xs text-yellow-600 text-center">
                +{data.unassignedPlans.plans.length - 3} more unassigned plans
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for account row
interface AccountRowProps {
  account: AccountCoverage;
  isExpanded: boolean;
  onToggle: () => void;
}

function AccountRow({ account, isExpanded, onToggle }: AccountRowProps) {
  return (
    <div>
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${account.hasShortfall ? "bg-red-50/50" : ""}`}
        onClick={onToggle}
      >
        <div className="flex items-center flex-1">
          <div className="mr-3">
            {account.hasShortfall ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-800">{account.accountName}</div>
            <div className="text-xs text-gray-500">
              {account.planCount} plan{account.planCount !== 1 ? "s" : ""} upcoming
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm text-gray-600">Balance</div>
            <div className="font-semibold text-gray-800">
              {formatCurrency(account.currentBalance)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Upcoming</div>
            <div className="font-semibold text-gray-800">
              {formatCurrency(account.upcomingPlansTotal)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Projected</div>
            <div className={`font-semibold ${account.projectedBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
              {formatCurrency(account.projectedBalance)}
            </div>
          </div>
          {account.hasShortfall && (
            <div className="text-right">
              <div className="text-sm text-red-600">Shortfall</div>
              <div className="font-semibold text-red-700">
                {formatCurrency(account.shortfallAmount)}
              </div>
            </div>
          )}
          <div className="ml-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded plans at risk */}
      {isExpanded && account.plansAtRisk.length > 0 && (
        <div className="bg-gray-50 px-4 pb-4">
          <div className="text-sm font-medium text-gray-600 mb-2 pt-2">
            Plans at Risk:
          </div>
          <div className="space-y-2">
            {account.plansAtRisk.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {isExpanded && account.plansAtRisk.length === 0 && (
        <div className="bg-gray-50 px-4 pb-4 pt-2">
          <p className="text-sm text-gray-500">All plans are covered.</p>
        </div>
      )}
    </div>
  );
}

// Helper component for plan row
function PlanRow({ plan }: { plan: PlanAtRisk }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-center">
        <span className="text-lg mr-2">{plan.icon || "📋"}</span>
        <div>
          <div className="font-medium text-gray-800 text-sm">{plan.name}</div>
          <div className="text-xs text-gray-500">
            {plan.nextDueDate ? formatDate(plan.nextDueDate) : "No due date"}{" "}
            {plan.daysUntilDue >= 0 && (
              <span className={plan.daysUntilDue <= 7 ? "text-red-600 font-medium" : ""}>
                ({plan.daysUntilDue === 0 ? "Today" : plan.daysUntilDue === 1 ? "Tomorrow" : `${plan.daysUntilDue} days`})
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="font-semibold text-gray-800">
        {formatCurrency(plan.amount)}
      </div>
    </div>
  );
}

// Helper component for status badge
interface StatusBadgeProps {
  status: "all_covered" | "has_shortfall" | "no_data";
  label: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    all_covered: "bg-green-100 text-green-700 border-green-300",
    has_shortfall: "bg-red-100 text-red-700 border-red-300",
    no_data: "bg-gray-100 text-gray-600 border-gray-300",
  };

  const iconMap: Record<string, React.ReactNode> = {
    all_covered: <CheckCircle2 className="w-4 h-4 mr-1" />,
    has_shortfall: <AlertTriangle className="w-4 h-4 mr-1" />,
    no_data: null,
  };

  return (
    <span className={`flex items-center text-sm px-3 py-1 rounded-full border ${colorMap[status]}`}>
      {iconMap[status]}
      {label}
    </span>
  );
}

// Helper to get status-based styling
function getStatusConfig(status: "all_covered" | "has_shortfall" | "no_data") {
  const configs = {
    all_covered: {
      gradient: "from-green-50 to-emerald-100",
      border: "border-green-200",
      iconBg: "bg-green-600",
      titleColor: "text-green-900",
      subtitleColor: "text-green-700",
    },
    has_shortfall: {
      gradient: "from-red-50 to-orange-100",
      border: "border-red-200",
      iconBg: "bg-red-600",
      titleColor: "text-red-900",
      subtitleColor: "text-red-700",
    },
    no_data: {
      gradient: "from-gray-50 to-gray-100",
      border: "border-gray-200",
      iconBg: "bg-gray-400",
      titleColor: "text-gray-700",
      subtitleColor: "text-gray-500",
    },
  };

  return configs[status] || configs.no_data;
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
