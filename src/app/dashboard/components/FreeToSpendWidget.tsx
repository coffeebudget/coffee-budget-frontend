"use client";

import { useState } from "react";
import { useCurrentFreeToSpend } from "@/hooks/useFreeToSpend";
import {
  formatCurrency,
  formatMonth,
  getIncomePercentage,
  getStatusConfig,
  FreeToSpendStatus,
} from "@/types/free-to-spend-types";
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Receipt,
  PiggyBank,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Banknote,
  Target,
} from "lucide-react";
import Link from "next/link";

interface FreeToSpendWidgetProps {
  className?: string;
}

export default function FreeToSpendWidget({ className = "" }: FreeToSpendWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading, error, refetch, dataUpdatedAt } = useCurrentFreeToSpend();

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return "";
    const now = Date.now();
    const diff = Math.floor((now - dataUpdatedAt) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dataUpdatedAt).toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-emerald-50 to-teal-100 p-6 rounded-xl shadow-lg border border-emerald-200 mb-8 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-emerald-700">Calculating free to spend...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 mb-8 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="ml-2 text-red-700">Failed to load free to spend data</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return null;
  }

  const statusConfig = getStatusConfig(data.status);
  const incomePercentage = getIncomePercentage(data.freeToSpend, data.income.guaranteed);
  const progressPercentage = Math.max(0, Math.min(100, incomePercentage));

  // Status-based gradient backgrounds
  const statusGradients: Record<FreeToSpendStatus, string> = {
    comfortable: "from-emerald-50 to-teal-100 border-emerald-200",
    moderate: "from-blue-50 to-indigo-100 border-blue-200",
    tight: "from-yellow-50 to-amber-100 border-yellow-200",
    overspent: "from-red-50 to-rose-100 border-red-200",
  };

  const statusIconColors: Record<FreeToSpendStatus, string> = {
    comfortable: "bg-emerald-600",
    moderate: "bg-blue-600",
    tight: "bg-yellow-600",
    overspent: "bg-red-600",
  };

  const statusAmountColors: Record<FreeToSpendStatus, string> = {
    comfortable: "text-emerald-700",
    moderate: "text-blue-700",
    tight: "text-yellow-700",
    overspent: "text-red-700",
  };

  return (
    <div className={`bg-gradient-to-r ${statusGradients[data.status]} p-6 rounded-xl mb-8 border shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-3 ${statusIconColors[data.status]} rounded-lg`}>
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-900">
              Free to Spend
            </h3>
            <p className="text-gray-600 text-sm">
              {formatMonth(data.month)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="text-xs text-gray-500">
            {formatLastUpdated()}
          </div>
        </div>
      </div>

      {/* Main Free to Spend Display */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Amount */}
          <div>
            <div className={`text-4xl md:text-5xl font-bold ${statusAmountColors[data.status]}`}>
              {formatCurrency(data.freeToSpend)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-gray-500 text-sm">
                {incomePercentage}% of income remaining
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full md:w-64">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Budget remaining</span>
              <span>{incomePercentage}%</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  data.status === "comfortable" ? "bg-emerald-500" :
                  data.status === "moderate" ? "bg-blue-500" :
                  data.status === "tight" ? "bg-yellow-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Income */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Income</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(data.income.guaranteed)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Guaranteed income
          </div>
        </div>

        {/* Obligations */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Obligations</span>
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {formatCurrency(data.obligations.total)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.obligations.items.length} expense plans
          </div>
        </div>

        {/* Already Spent */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Discretionary</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(data.discretionarySpending.total)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.discretionarySpending.transactionCount} transactions
          </div>
        </div>

        {/* Truly Available (Envelope Buffer) */}
        {data.trulyAvailable !== undefined && data.envelopeBuffer && (
          <div className="bg-white rounded-lg p-4 border-l-4 border-teal-500">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-5 h-5 text-teal-600" />
              <span className="text-sm text-gray-600">Truly Available</span>
            </div>
            <div className="text-2xl font-bold text-teal-700">
              {formatCurrency(data.trulyAvailable)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatCurrency(data.envelopeBuffer.total)} in envelopes
            </div>
          </div>
        )}
      </div>

      {/* Expandable Breakdown */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show Details
          </>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Income Breakdown */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Income Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Guaranteed</span>
                </div>
                <span className="font-semibold text-green-700">
                  {formatCurrency(data.income.guaranteed)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Expected</span>
                </div>
                <span className="font-semibold text-yellow-700">
                  {formatCurrency(data.income.expected)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Uncertain</span>
                </div>
                <span className="font-semibold text-gray-600">
                  {formatCurrency(data.income.uncertain)}
                </span>
              </div>
            </div>
            {data.income.breakdown.length > 0 && (
              <div className="space-y-2">
                {data.income.breakdown.map((source, index) => (
                  <div key={index} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-gray-600">{source.source}</span>
                    <span className="font-medium">{formatCurrency(source.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Obligations Breakdown */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-600" />
              Obligations by Type
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-800">Bills</span>
                </div>
                <span className="font-semibold text-orange-700">
                  {formatCurrency(data.obligations.byType.bills)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Savings</span>
                </div>
                <span className="font-semibold text-blue-700">
                  {formatCurrency(data.obligations.byType.savings)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-800">Budgets</span>
                </div>
                <span className="font-semibold text-purple-700">
                  {formatCurrency(data.obligations.byType.budgets)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
              <span>Committed: {formatCurrency(data.obligations.committed)}</span>
              <span>Already Paid: {formatCurrency(data.obligations.alreadyPaid)}</span>
            </div>
          </div>

          {/* Discretionary Spending Breakdown */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              Discretionary Spending
            </h4>
            {data.discretionarySpending.topCategories.length > 0 ? (
              <div className="space-y-2">
                {data.discretionarySpending.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-gray-600">{category.category}</span>
                    <span className="font-medium">{formatCurrency(category.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No discretionary spending this month</p>
            )}
          </div>

          {/* Envelope Buffer Breakdown */}
          {data.envelopeBuffer && data.envelopeBuffer.breakdown.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-teal-600" />
                Envelope Buffer
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-teal-800">Total in Envelopes</span>
                  </div>
                  <span className="font-semibold text-teal-700">
                    {formatCurrency(data.envelopeBuffer.total)}
                  </span>
                </div>
                {data.trulyAvailable !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-800">Truly Available</span>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(data.trulyAvailable)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {data.envelopeBuffer.breakdown.map((envelope) => {
                  const utilizationColor =
                    envelope.status === 'under_budget' ? 'bg-emerald-500' :
                    envelope.status === 'on_budget' ? 'bg-blue-500' :
                    'bg-red-500';
                  const statusLabel =
                    envelope.status === 'under_budget' ? 'Under Budget' :
                    envelope.status === 'on_budget' ? 'On Budget' :
                    'Over Budget';
                  return (
                    <div key={envelope.planId} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {envelope.planIcon && (
                            <span className="text-lg">{envelope.planIcon}</span>
                          )}
                          <span className="font-medium text-gray-800">{envelope.planName}</span>
                        </div>
                        <span className="font-semibold text-teal-700">
                          {formatCurrency(envelope.currentBalance)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${utilizationColor}`}
                            style={{ width: `${Math.min(100, envelope.utilizationPercent)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-20 text-right">
                          {envelope.utilizationPercent}% used
                        </span>
                      </div>
                      {envelope.status && (
                        <div className="mt-1 text-xs text-gray-500">{statusLabel}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/income-plans"
              className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
            >
              <Wallet className="w-4 h-4" />
              Income Plans
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/expense-plans"
              className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
            >
              <PiggyBank className="w-4 h-4" />
              Expense Plans
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/transactions"
              className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
            >
              <ShoppingBag className="w-4 h-4" />
              Transactions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
