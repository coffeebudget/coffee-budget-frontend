"use client";

import { useCoverageSummary, useLongTermStatus } from "@/hooks/useExpensePlans";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  Clock,
  ExternalLink,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  formatCurrency,
  getCoverageStatusLabel,
  CoverageSummaryResponse,
  AccountCoverage,
  PlanAtRisk,
  LongTermStatusSummary,
  PlanNeedingAttention,
  CoveragePeriodType,
  VALID_COVERAGE_PERIODS,
} from "@/types/expense-plan-types";
import FundingStatusBadge from "@/app/expense-plans/components/FundingStatusBadge";
import { useState } from "react";
import Link from "next/link";

interface CoverageSectionProps {
  className?: string;
}

// Period display labels
const PERIOD_LABELS: Record<CoveragePeriodType, string> = {
  this_month: "This Month",
  next_month: "Next Month",
  next_3_months: "Next 3 Months",
  next_30_days: "Next 30 Days",
  next_60_days: "Next 60 Days",
  next_90_days: "Next 90 Days",
};

export default function CoverageSection({ className = "" }: CoverageSectionProps) {
  const [period, setPeriod] = useState<CoveragePeriodType>("next_30_days");
  const { data, isLoading, error, refetch } = useCoverageSummary(period);
  const { data: longTermStatus, isLoading: longTermLoading } = useLongTermStatus();
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
        {/* Header skeleton */}
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-200 rounded-lg animate-pulse">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div className="ml-4">
            <div className="h-6 w-40 bg-blue-200 rounded animate-pulse mb-1" />
            <div className="h-4 w-56 bg-blue-100 rounded animate-pulse" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/60 rounded-lg p-4 text-center border-l-4 border-blue-200">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-700 text-sm">Loading coverage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 ${className}`}>
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="p-3 bg-red-500 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-red-900">Coverage Monitor</h3>
            <p className="text-red-700 text-sm">30-day expense coverage status</p>
          </div>
        </div>
        {/* Error content */}
        <div className="bg-white rounded-lg p-6 border border-red-200">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-100 rounded-full mb-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="font-semibold text-red-800 mb-1">Unable to load coverage data</h4>
            <p className="text-sm text-red-600 mb-4">
              There was a problem fetching your account coverage information.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
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
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <CalendarClock className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-700 mb-2">No Upcoming Expenses to Monitor</h4>
            <p className="text-gray-500 text-sm max-w-md mb-4">
              There are no expense plans with due dates in the next 30 days.
              When you have upcoming expenses, this section will show you if your accounts have enough balance to cover them.
            </p>
            <div className="bg-blue-50 rounded-lg p-3 text-left w-full max-w-sm">
              <p className="text-xs text-blue-700 font-medium mb-1">💡 Tip</p>
              <p className="text-xs text-blue-600">
                Link expense plans to payment accounts and set due dates to enable coverage monitoring.
              </p>
            </div>
          </div>
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
              {data.period?.label || PERIOD_LABELS[period]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as CoveragePeriodType)}
            className="text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {VALID_COVERAGE_PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
          <Link
            href="/expense-plans"
            className="hidden sm:flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            View All Plans
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <StatusBadge status={data.overallStatus} label={getCoverageStatusLabel(data.overallStatus)} />
        </div>
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

      {/* Long-Term Sinking Funds Status */}
      {!longTermLoading && longTermStatus && longTermStatus.totalSinkingFunds > 0 && (
        <LongTermStatusSection longTermStatus={longTermStatus} />
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
        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${account.hasShortfall ? "bg-red-50/50" : ""}`}
        onClick={onToggle}
      >
        {/* Mobile & Desktop Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className="mr-3 flex-shrink-0">
              {account.hasShortfall ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{account.accountName}</div>
              <div className="text-xs text-gray-500">
                {account.planCount} plan{account.planCount !== 1 ? "s" : ""} upcoming
              </div>
            </div>
          </div>

          {/* Desktop: Inline stats */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <div className="text-right">
              <div className="text-xs lg:text-sm text-gray-600">Balance</div>
              <div className="font-semibold text-gray-800 text-sm lg:text-base">
                {formatCurrency(account.currentBalance)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs lg:text-sm text-gray-600">Upcoming</div>
              <div className="font-semibold text-gray-800 text-sm lg:text-base">
                {formatCurrency(account.upcomingPlansTotal)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs lg:text-sm text-gray-600">Projected</div>
              <div className={`font-semibold text-sm lg:text-base ${account.projectedBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                {formatCurrency(account.projectedBalance)}
              </div>
            </div>
            {account.hasShortfall && (
              <div className="text-right">
                <div className="text-xs lg:text-sm text-red-600">Shortfall</div>
                <div className="font-semibold text-red-700 text-sm lg:text-base">
                  {formatCurrency(account.shortfallAmount)}
                </div>
              </div>
            )}
          </div>

          {/* Chevron always visible */}
          <div className="ml-2 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Mobile: Stats grid below header */}
        <div className="md:hidden mt-3 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-600">Balance</div>
            <div className="font-semibold text-gray-800 text-sm">
              {formatCurrency(account.currentBalance)}
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-600">Upcoming</div>
            <div className="font-semibold text-gray-800 text-sm">
              {formatCurrency(account.upcomingPlansTotal)}
            </div>
          </div>
          <div className={`rounded p-2 ${account.projectedBalance >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <div className="text-xs text-gray-600">Projected</div>
            <div className={`font-semibold text-sm ${account.projectedBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
              {formatCurrency(account.projectedBalance)}
            </div>
          </div>
          {account.hasShortfall && (
            <div className="bg-red-50 rounded p-2">
              <div className="text-xs text-red-600">Shortfall</div>
              <div className="font-semibold text-red-700 text-sm">
                {formatCurrency(account.shortfallAmount)}
              </div>
            </div>
          )}
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
  const isOverdue = plan.daysUntilDue < 0;
  const isDueToday = plan.daysUntilDue === 0;
  const isDueSoon = plan.daysUntilDue > 0 && plan.daysUntilDue <= 7;

  const getDueDateLabel = () => {
    if (isOverdue) {
      const daysOverdue = Math.abs(plan.daysUntilDue);
      return daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`;
    }
    if (isDueToday) return "Due today";
    if (plan.daysUntilDue === 1) return "Tomorrow";
    return `${plan.daysUntilDue} days`;
  };

  return (
    <Link
      href={`/expense-plans?highlight=${plan.id}`}
      className={`flex items-center justify-between rounded-lg p-3 border transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
        isOverdue
          ? "bg-red-50 border-red-300 hover:bg-red-100"
          : isDueToday
            ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
            : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center min-w-0 flex-1">
        <span className="text-lg mr-2 flex-shrink-0">{plan.icon || "📋"}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-800 text-sm truncate">{plan.name}</div>
          <div className="text-xs flex items-center gap-1 flex-wrap">
            {isOverdue && (
              <Clock className="w-3 h-3 text-red-600 flex-shrink-0" />
            )}
            <span className="text-gray-500">
              {plan.nextDueDate ? formatDate(plan.nextDueDate) : "No due date"}
            </span>
            {plan.nextDueDate && (
              <span className={`font-medium ${
                isOverdue
                  ? "text-red-600"
                  : isDueToday
                    ? "text-orange-600"
                    : isDueSoon
                      ? "text-amber-600"
                      : "text-gray-500"
              }`}>
                ({getDueDateLabel()})
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <div className="font-semibold text-gray-800">
          {formatCurrency(plan.amount)}
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </div>
    </Link>
  );
}

// Helper component for long-term sinking funds status
interface LongTermStatusSectionProps {
  longTermStatus: LongTermStatusSummary;
}

function LongTermStatusSection({ longTermStatus }: LongTermStatusSectionProps) {
  const hasProblems = longTermStatus.behindScheduleCount > 0 || longTermStatus.almostReadyCount > 0;
  const allOnTrack = longTermStatus.behindScheduleCount === 0;

  return (
    <div className={`mt-4 rounded-lg border overflow-hidden ${
      allOnTrack
        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
    }`}>
      {/* Header */}
      <div className={`p-3 border-b ${allOnTrack ? "bg-blue-100/50 border-blue-200" : "bg-amber-100/50 border-amber-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className={`w-5 h-5 mr-2 ${allOnTrack ? "text-blue-600" : "text-amber-600"}`} />
            <h4 className="font-semibold text-gray-800">Sinking Funds Progress</h4>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {longTermStatus.fundedCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {longTermStatus.fundedCount} Funded
              </span>
            )}
            {longTermStatus.onTrackCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <Target className="w-3 h-3" />
                {longTermStatus.onTrackCount} On Track
              </span>
            )}
            {longTermStatus.behindScheduleCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                {longTermStatus.behindScheduleCount} Behind
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Total Plans</div>
            <div className="text-xl font-bold text-gray-800">{longTermStatus.totalSinkingFunds}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Amount Needed</div>
            <div className="text-xl font-bold text-gray-800">{formatCurrency(longTermStatus.totalAmountNeeded)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-green-100">
            <div className="text-xs text-green-600 mb-1">On Track</div>
            <div className="text-xl font-bold text-green-700">
              {longTermStatus.fundedCount + longTermStatus.onTrackCount + longTermStatus.almostReadyCount}
            </div>
          </div>
          <div className={`bg-white rounded-lg p-3 text-center border ${longTermStatus.behindScheduleCount > 0 ? "border-red-100" : "border-gray-100"}`}>
            <div className={`text-xs mb-1 ${longTermStatus.behindScheduleCount > 0 ? "text-red-600" : "text-gray-500"}`}>Behind</div>
            <div className={`text-xl font-bold ${longTermStatus.behindScheduleCount > 0 ? "text-red-700" : "text-gray-400"}`}>
              {longTermStatus.behindScheduleCount}
            </div>
          </div>
        </div>

        {/* Plans Needing Attention */}
        {hasProblems && longTermStatus.plansNeedingAttention.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Plans Needing Attention</div>
            <div className="space-y-2">
              {longTermStatus.plansNeedingAttention.slice(0, 5).map((plan) => (
                <PlanNeedingAttentionRow key={plan.id} plan={plan} />
              ))}
              {longTermStatus.plansNeedingAttention.length > 5 && (
                <Link
                  href="/expense-plans"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 hover:underline py-2"
                >
                  View all {longTermStatus.plansNeedingAttention.length} plans needing attention →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* All Good Message */}
        {!hasProblems && (
          <div className="flex items-center justify-center gap-2 py-3 text-green-700 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">All sinking funds are on track!</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for plan needing attention row
function PlanNeedingAttentionRow({ plan }: { plan: PlanNeedingAttention }) {
  return (
    <Link
      href={`/expense-plans?highlight=${plan.id}`}
      className={`flex items-center justify-between rounded-lg p-3 border transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
        plan.status === "behind"
          ? "bg-red-50 border-red-200 hover:bg-red-100"
          : "bg-blue-50 border-blue-200 hover:bg-blue-100"
      }`}
    >
      <div className="flex items-center min-w-0 flex-1">
        <span className="text-lg mr-2 flex-shrink-0">{plan.icon || "📋"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm truncate">{plan.name}</span>
            <FundingStatusBadge status={plan.status} size="sm" showLabel={false} />
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
            <span>Due: {plan.nextDueDate ? formatDate(plan.nextDueDate) : "No date"}</span>
            {plan.monthsUntilDue > 0 && (
              <span className="text-gray-400">({plan.monthsUntilDue} mo)</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end ml-2 flex-shrink-0">
        <div className="font-semibold text-gray-800 text-sm">
          {formatCurrency(plan.amountNeeded)} needed
        </div>
        <div className={`text-xs ${plan.status === "behind" ? "text-red-600" : "text-blue-600"}`}>
          +{formatCurrency(plan.shortfallPerMonth)}/mo required
        </div>
      </div>
    </Link>
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
