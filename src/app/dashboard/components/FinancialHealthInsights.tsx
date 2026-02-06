"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface HealthData {
  monthlyIncome: number;
  monthlyExpenses: number;
  netFlow: number;
  savingsRate: number;
  topExpenseCategory: {
    name: string;
    amount: number;
    percentage: number;
  } | null;
}

interface FinancialHealthInsightsProps {
  className?: string;
}

export default function FinancialHealthInsights({
  className = "",
}: FinancialHealthInsightsProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, summaryRes] = await Promise.all([
        fetch("/api/dashboard/monthly-statistics"),
        fetch("/api/dashboard/monthly-summary?months=2"),
      ]);

      if (!statsRes.ok || !summaryRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const statsData = await statsRes.json();
      const summaryData = await summaryRes.json();

      const currentMonth = summaryData[summaryData.length - 1] || {
        income: 0,
        expenses: 0,
      };
      const netFlow = currentMonth.income - currentMonth.expenses;
      const savingsRate =
        currentMonth.income > 0
          ? (netFlow / currentMonth.income) * 100
          : 0;

      setData({
        monthlyIncome: currentMonth.income,
        monthlyExpenses: currentMonth.expenses,
        netFlow,
        savingsRate,
        topExpenseCategory: statsData.topExpenseCategory
          ? {
              name: statsData.topExpenseCategory.name,
              amount: statsData.topExpenseCategory.amount,
              percentage:
                currentMonth.expenses > 0
                  ? (statsData.topExpenseCategory.amount /
                      currentMonth.expenses) *
                    100
                  : 0,
            }
          : null,
      });
    } catch (err) {
      console.error("Error loading financial health insights:", err);
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl shadow border p-5 ${className}`}
      >
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Loading insights...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={`bg-white rounded-xl shadow border p-5 ${className}`}
      >
        <div className="flex items-center text-red-500 text-sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {error || "Unable to load insights"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow border p-5 ${className}`}
    >
      <h3 className="font-semibold text-gray-900 mb-4">Financial Health</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Savings Rate */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500 mb-1">Savings Rate</div>
          <div
            className={`text-xl font-bold ${
              data.savingsRate > 10
                ? "text-green-700"
                : data.savingsRate > 0
                  ? "text-yellow-700"
                  : "text-red-700"
            }`}
          >
            {data.savingsRate >= 0 ? "+" : ""}
            {data.savingsRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-gray-500">
            {data.savingsRate > 20
              ? "Excellent"
              : data.savingsRate > 10
                ? "Good"
                : data.savingsRate > 0
                  ? "Fair"
                  : "Needs attention"}
          </div>
        </div>

        {/* Net Flow */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            {data.netFlow >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            Net Flow
          </div>
          <div
            className={`text-xl font-bold ${
              data.netFlow >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatCurrency(data.netFlow)}
          </div>
          <div className="text-[10px] text-gray-500">This month</div>
        </div>

        {/* Top Expense Category */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500 mb-1">Top Category</div>
          {data.topExpenseCategory ? (
            <>
              <div className="text-sm font-bold text-gray-800 truncate">
                {data.topExpenseCategory.name}
              </div>
              <div className="text-[10px] text-gray-500">
                {formatCurrency(data.topExpenseCategory.amount)} (
                {data.topExpenseCategory.percentage.toFixed(0)}%)
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No data</div>
          )}
        </div>

        {/* Suggested Action */}
        <div className="rounded-lg bg-gray-50 p-3 flex flex-col items-center justify-center text-center">
          <div className="text-xs text-gray-500 mb-1">Action</div>
          {data.netFlow < 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-500 mb-1" />
              <div className="text-xs font-medium text-yellow-700">
                Review budget
              </div>
            </>
          ) : data.savingsRate < 10 ? (
            <>
              <Target className="h-5 w-5 text-blue-500 mb-1" />
              <div className="text-xs font-medium text-blue-700">
                Boost savings
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
              <div className="text-xs font-medium text-green-700">
                Great job!
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
