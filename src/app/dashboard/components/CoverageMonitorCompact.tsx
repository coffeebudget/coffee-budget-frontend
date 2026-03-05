"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCoverageSummary } from "@/hooks/useExpensePlans";
import {
  formatCurrency,
  getCoverageStatusColor,
  CoveragePeriodType,
  VALID_COVERAGE_PERIODS,
} from "@/types/expense-plan-types";
import { AlertTriangle, TrendingDown } from "lucide-react";

const PERIOD_LABELS: Record<CoveragePeriodType, string> = {
  this_month: "This Month",
  next_month: "Next Month",
  next_3_months: "3 Months",
  next_30_days: "30 Days",
  next_60_days: "60 Days",
  next_90_days: "90 Days",
};

export default function CoverageMonitorCompact() {
  const [period, setPeriod] = useState<CoveragePeriodType>("next_30_days");
  const { data: coverage, isLoading } = useCoverageSummary(period);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🛡️ Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coverage || coverage.accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🛡️ Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No accounts with plans to cover.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusLabel =
    coverage.overallStatus === "all_covered"
      ? "All covered"
      : coverage.overallStatus === "has_shortfall"
        ? "Shortfall"
        : "No data";

  const statusColor = getCoverageStatusColor(coverage.overallStatus);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">🛡️ Coverage</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as CoveragePeriodType)}
              className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VALID_COVERAGE_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
            <Badge variant="outline" className={statusColor}>
              {statusLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {coverage.accounts.map((account) => {
          // Prefer cash flow ending balance over lump-sum projected balance
          const endBalance = account.cashFlow?.endingBalance ?? account.projectedBalance;
          const isNegative = endBalance < 0;

          return (
          <div key={account.accountId}>
            <div
              className={`flex items-center gap-2 text-sm py-1 ${
                account.hasShortfall ? "text-red-600" : ""
              }`}
            >
              <span className="font-medium truncate flex-1">
                {account.accountName}
              </span>
              <span className="hidden sm:inline text-muted-foreground">
                {formatCurrency(account.currentBalance)}
              </span>
              <span className="hidden sm:inline text-muted-foreground">→</span>
              <span className="hidden sm:inline text-muted-foreground">
                Obligations {formatCurrency(account.upcomingPlansTotal)}
              </span>
              <span className="hidden sm:inline text-muted-foreground">→</span>
              <span className={account.hasShortfall ? "font-semibold" : ""}>
                {isNegative ? "−" : "+"}{" "}
                {formatCurrency(Math.abs(endBalance))}
              </span>
              <span>{account.hasShortfall ? "❌" : "✅"}</span>
            </div>
            {account.cashFlow && account.cashFlow.minimumBalance < account.currentBalance && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-0 pb-1">
                <TrendingDown className={`h-3 w-3 ${account.cashFlow.hasShortfall ? "text-red-500" : "text-yellow-500"}`} />
                <span>
                  Lowest balance {formatCurrency(account.cashFlow.minimumBalance)} on day {account.cashFlow.minimumBalanceDay}
                </span>
              </div>
            )}
          </div>
          );
        })}

        {coverage.unassignedPlans.count > 0 && (
          <div className="flex items-center gap-2 text-xs text-yellow-600 mt-2 pt-2 border-t">
            <AlertTriangle className="h-3 w-3" />
            <span>
              {coverage.unassignedPlans.count} plans without assigned account (
              {formatCurrency(coverage.unassignedPlans.totalAmount)})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
