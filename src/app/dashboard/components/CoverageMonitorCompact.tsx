"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCoverageSummary } from "@/hooks/useExpensePlans";
import {
  formatCurrency,
  getCoverageStatusColor,
} from "@/types/expense-plan-types";
import { AlertTriangle } from "lucide-react";

export default function CoverageMonitorCompact() {
  const { data: coverage, isLoading } = useCoverageSummary("next_30_days");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🛡️ 30-Day Coverage</CardTitle>
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
          <CardTitle className="text-base">🛡️ 30-Day Coverage</CardTitle>
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
          <CardTitle className="text-base">🛡️ 30-Day Coverage</CardTitle>
          <Badge variant="outline" className={statusColor}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {coverage.accounts.map((account) => (
          <div
            key={account.accountId}
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
              Expenses {formatCurrency(account.upcomingPlansTotal)}
            </span>
            <span className="hidden sm:inline text-muted-foreground">→</span>
            <span className={account.hasShortfall ? "font-semibold" : ""}>
              {account.hasShortfall ? "−" : "+"}{" "}
              {formatCurrency(
                Math.abs(account.projectedBalance)
              )}
            </span>
            <span>{account.hasShortfall ? "❌" : "✅"}</span>
          </div>
        ))}

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
