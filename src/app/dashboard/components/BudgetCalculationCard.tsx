"use client";

import { useRouter } from "next/navigation";
import { useMonthlySummary } from "@/hooks/useIncomePlans";
import { useMonthlyDepositSummary } from "@/hooks/useExpensePlans";
import {
  Calculator,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  MONTH_LABELS,
  MONTH_NAMES,
} from "@/types/income-plan-types";

interface BudgetCalculationCardProps {
  className?: string;
}

export default function BudgetCalculationCard({ className = "" }: BudgetCalculationCardProps) {
  const router = useRouter();

  // Income Plans data
  const {
    data: incomeSummary,
    isLoading: incomeLoading,
    error: incomeError,
  } = useMonthlySummary();

  // Expense Plans data
  const {
    data: expenseSummary,
    isLoading: expenseLoading,
    error: expenseError,
  } = useMonthlyDepositSummary();

  const isLoading = incomeLoading || expenseLoading;
  const hasError = incomeError || expenseError;

  // Get current month name
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIndex];
  const currentYear = new Date().getFullYear();

  // Calculate budget
  const budgetSafeIncome = incomeSummary?.budgetSafeIncome || 0;
  const guaranteedIncome = incomeSummary?.guaranteedTotal || 0;
  const expectedIncome = incomeSummary?.expectedTotal || 0;
  const uncertainIncome = incomeSummary?.uncertainTotal || 0;
  const totalIncome = incomeSummary?.totalIncome || 0;
  const plannedExpenses = expenseSummary?.totalMonthlyDeposit || 0;
  const availableForDiscretionary = budgetSafeIncome - plannedExpenses;

  // Determine budget health
  const getBudgetHealth = () => {
    if (availableForDiscretionary < 0) return "critical";
    if (availableForDiscretionary < 500) return "warning";
    if (availableForDiscretionary < 1000) return "fair";
    return "healthy";
  };

  const budgetHealth = getBudgetHealth();

  const healthColors = {
    critical: "text-red-600",
    warning: "text-yellow-600",
    fair: "text-blue-600",
    healthy: "text-green-600",
  };

  const healthBgColors = {
    critical: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    fair: "bg-blue-50 border-blue-200",
    healthy: "bg-green-50 border-green-200",
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-xl shadow-lg border border-indigo-200 mb-8 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-indigo-700">Calculating budget...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200 mb-8 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="ml-2 text-red-700">Failed to load budget data</span>
        </div>
      </div>
    );
  }

  // Check if we have any income plans set up
  const hasIncomePlans = (incomeSummary?.planCount || 0) > 0;

  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-100 p-6 rounded-xl mb-8 border border-indigo-200 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-indigo-600 rounded-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-indigo-900">
              Budget {MONTH_LABELS[currentMonthName]} {currentYear}
            </h3>
            <p className="text-indigo-700 text-sm">
              Income vs Planned Expenses
            </p>
          </div>
        </div>
        <Link
          href="/income-plans"
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold"
        >
          Manage Income
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>

      {/* Empty State - No Income Plans */}
      {!hasIncomePlans && (
        <div className="bg-white rounded-lg p-6 text-center border border-indigo-200 mb-6">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
          <h4 className="font-semibold text-gray-800 mb-2">Set Up Your Income Plans</h4>
          <p className="text-gray-500 text-sm mb-4">
            Add your expected income sources to see a complete budget calculation.
          </p>
          <button
            onClick={() => router.push("/income-plans")}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Create Income Plans
          </button>
        </div>
      )}

      {/* Budget Calculation - Only show if we have income plans */}
      {hasIncomePlans && (
        <>
          {/* Main Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Income */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Expected Income</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(totalIncome)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Budget safe: {formatCurrency(budgetSafeIncome)}
              </div>
            </div>

            {/* Planned Expenses */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-600">Planned Expenses</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(plannedExpenses)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {expenseSummary?.planCount || 0} active expense plans
              </div>
            </div>

            {/* Available for Discretionary */}
            <div className={`bg-white rounded-lg p-4 border-l-4 ${
              budgetHealth === "critical" ? "border-red-500" :
              budgetHealth === "warning" ? "border-yellow-500" :
              budgetHealth === "fair" ? "border-blue-500" :
              "border-green-500"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PiggyBank className={`w-5 h-5 ${healthColors[budgetHealth]}`} />
                  <span className="text-sm text-gray-600">Available</span>
                </div>
              </div>
              <div className={`text-2xl font-bold ${healthColors[budgetHealth]}`}>
                {formatCurrency(availableForDiscretionary)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                For discretionary spending
              </div>
            </div>
          </div>

          {/* Income Breakdown by Reliability */}
          <div className="bg-white rounded-lg p-4 border border-indigo-200 mb-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              Income by Reliability
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Guaranteed */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Guaranteed</span>
                </div>
                <span className="font-semibold text-green-700">
                  {formatCurrency(guaranteedIncome)}
                </span>
              </div>

              {/* Expected */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Expected</span>
                </div>
                <span className="font-semibold text-yellow-700">
                  {formatCurrency(expectedIncome)}
                </span>
              </div>

              {/* Uncertain */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Uncertain</span>
                </div>
                <span className="font-semibold text-gray-600">
                  {formatCurrency(uncertainIncome)}
                </span>
              </div>
            </div>

            {uncertainIncome > 0 && (
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Uncertain income ({formatCurrency(uncertainIncome)}) is excluded from budget calculations
              </p>
            )}
          </div>

          {/* Budget Health Alert */}
          {budgetHealth !== "healthy" && (
            <div className={`rounded-lg p-4 border ${healthBgColors[budgetHealth]}`}>
              <div className="flex items-start gap-3">
                {budgetHealth === "critical" ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : budgetHealth === "warning" ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className={`font-medium ${
                    budgetHealth === "critical" ? "text-red-800" :
                    budgetHealth === "warning" ? "text-yellow-800" :
                    "text-blue-800"
                  }`}>
                    {budgetHealth === "critical" && "Budget Deficit Warning"}
                    {budgetHealth === "warning" && "Low Available Funds"}
                    {budgetHealth === "fair" && "Moderate Available Funds"}
                  </h5>
                  <p className={`text-sm mt-1 ${
                    budgetHealth === "critical" ? "text-red-700" :
                    budgetHealth === "warning" ? "text-yellow-700" :
                    "text-blue-700"
                  }`}>
                    {budgetHealth === "critical" &&
                      `Your planned expenses exceed your guaranteed income by ${formatCurrency(Math.abs(availableForDiscretionary))}. Consider reviewing your expense plans.`}
                    {budgetHealth === "warning" &&
                      `You have ${formatCurrency(availableForDiscretionary)} available for discretionary spending. Consider building an emergency buffer.`}
                    {budgetHealth === "fair" &&
                      `You have ${formatCurrency(availableForDiscretionary)} available. This is a moderate buffer for unexpected expenses.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-indigo-200">
            <Link
              href="/income-plans"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Wallet className="w-4 h-4" />
              Manage Income Plans
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/expense-plans"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <PiggyBank className="w-4 h-4" />
              Manage Expense Plans
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
