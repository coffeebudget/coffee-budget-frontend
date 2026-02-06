"use client";

import { useState } from "react";
import Link from "next/link";
import { useCoverageSummary } from "@/hooks/useExpensePlans";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  formatCurrency,
  CoveragePeriodType,
  VALID_COVERAGE_PERIODS,
} from "@/types/expense-plan-types";

const PERIOD_LABELS: Record<CoveragePeriodType, string> = {
  this_month: "This Month",
  next_month: "Next Month",
  next_3_months: "Next 3 Months",
  next_30_days: "Next 30 Days",
  next_60_days: "Next 60 Days",
  next_90_days: "Next 90 Days",
};

interface CoverageMonitorSummaryProps {
  className?: string;
}

export default function CoverageMonitorSummary({
  className = "",
}: CoverageMonitorSummaryProps) {
  const [period, setPeriod] = useState<CoveragePeriodType>("next_30_days");
  const { data, isLoading, error } = useCoverageSummary(period);

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-xl shadow border p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Coverage Monitor</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data || data.overallStatus === "no_data") {
    return (
      <div
        className={`bg-white rounded-xl shadow border p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Coverage Monitor</h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          {error
            ? "Unable to load coverage data"
            : "No upcoming expenses to monitor"}
        </p>
      </div>
    );
  }

  const allCovered = data.overallStatus === "all_covered";

  return (
    <div
      className={`bg-white rounded-xl shadow border p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield
            className={`h-5 w-5 ${allCovered ? "text-green-600" : "text-red-600"}`}
          />
          <h3 className="font-semibold text-gray-900">Coverage Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as CoveragePeriodType)
            }
            className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VALID_COVERAGE_PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
          <Link
            href="/expense-plans"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="View All Plans"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Linked Accounts */}
        <div className="rounded-lg bg-blue-50 p-3 text-center border-l-4 border-blue-500">
          <div className="text-xs text-gray-600 mb-1">Accounts</div>
          <div className="text-xl font-bold text-blue-700">
            {data.accounts.length}
          </div>
          <div className="text-[10px] text-gray-500">With plans</div>
        </div>

        {/* Shortfall Count */}
        <div
          className={`rounded-lg p-3 text-center border-l-4 ${
            data.accountsWithShortfall > 0
              ? "bg-red-50 border-red-500"
              : "bg-green-50 border-green-500"
          }`}
        >
          <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
            {data.accountsWithShortfall > 0 ? (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
            {data.accountsWithShortfall > 0 ? "Shortfall" : "Covered"}
          </div>
          <div
            className={`text-xl font-bold ${
              data.accountsWithShortfall > 0
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            {data.accountsWithShortfall > 0
              ? data.accountsWithShortfall
              : data.accounts.length}
          </div>
          <div className="text-[10px] text-gray-500">
            {data.accountsWithShortfall > 0 ? "Needs attention" : "All good"}
          </div>
        </div>

        {/* Total Shortfall */}
        <div
          className={`rounded-lg p-3 text-center border-l-4 ${
            data.totalShortfall > 0
              ? "bg-red-50 border-red-500"
              : "bg-green-50 border-green-500"
          }`}
        >
          <div className="text-xs text-gray-600 mb-1">Shortfall</div>
          <div
            className={`text-xl font-bold ${
              data.totalShortfall > 0 ? "text-red-700" : "text-green-700"
            }`}
          >
            {data.totalShortfall > 0
              ? formatCurrency(data.totalShortfall)
              : "\u20AC0"}
          </div>
          <div className="text-[10px] text-gray-500">
            {data.totalShortfall > 0 ? "Amount needed" : "No shortfall"}
          </div>
        </div>
      </div>
    </div>
  );
}
