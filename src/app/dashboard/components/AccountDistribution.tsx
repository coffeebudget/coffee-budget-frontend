"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAccountAllocationSummary } from "@/hooks/useExpensePlans";
import {
  AccountAllocationSummary,
  formatCurrency,
  getAccountHealthStatusColor,
  getAccountHealthStatusIcon,
} from "@/types/expense-plan-types";
import { ChevronRight } from "lucide-react";

function AccountRow({ account }: { account: AccountAllocationSummary }) {
  const [open, setOpen] = useState(false);
  const free = account.surplus;
  const allocPercent =
    account.currentBalance > 0
      ? Math.min(
          Math.round(
            (account.totalRequiredToday / account.currentBalance) * 100
          ),
          100
        )
      : 0;

  const healthIcon = getAccountHealthStatusIcon(account.healthStatus);
  const healthColor = getAccountHealthStatusColor(account.healthStatus);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 py-2 px-1 hover:bg-muted/50 rounded transition-colors text-sm">
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          />
          <span className="font-medium truncate min-w-0 flex-1 text-left">
            {account.accountName}
          </span>
          <span className="text-right w-24 shrink-0">
            {formatCurrency(account.currentBalance)}
          </span>
          <span className="text-right w-24 shrink-0 text-muted-foreground hidden sm:block">
            Alloc. {formatCurrency(account.totalRequiredToday)}
          </span>
          <span className="text-right w-24 shrink-0 text-muted-foreground hidden sm:block">
            Free {formatCurrency(free)}
          </span>
          <Badge variant="outline" className={`${healthColor} shrink-0`}>
            {healthIcon}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-8 mb-3 space-y-1 text-xs text-muted-foreground">
          {account.fixedMonthlyPlans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-2">
              <span>{plan.icon || "📄"}</span>
              <span className="flex-1">{plan.name}</span>
              <span>{formatCurrency(plan.requiredToday)}</span>
              <span className="text-xs">
                ({plan.status === "paid" ? "✓ paid" : "pending"})
              </span>
            </div>
          ))}
          {account.sinkingFundPlans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-2">
              <span>{plan.icon || "📦"}</span>
              <span className="flex-1">{plan.name}</span>
              <span>
                {formatCurrency(plan.requiredToday)}/
                {formatCurrency(plan.targetAmount)}
              </span>
              <span className="text-xs">
                ({plan.status === "on_track" ? "on track" : "behind"})
              </span>
            </div>
          ))}
          {account.fixedMonthlyPlans.length === 0 &&
            account.sinkingFundPlans.length === 0 && (
              <span className="italic">No plans assigned</span>
            )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AccountDistribution() {
  const { data: allocationData, isLoading } = useAccountAllocationSummary();

  const globalTotals = useMemo(() => {
    if (!allocationData?.accounts) return null;
    const totalBalance = allocationData.accounts.reduce(
      (sum, a) => sum + a.currentBalance,
      0
    );
    const totalAllocated = allocationData.accounts.reduce(
      (sum, a) => sum + a.totalRequiredToday,
      0
    );
    const totalFree = totalBalance - totalAllocated;
    const allocPercent =
      totalBalance > 0
        ? Math.min(Math.round((totalAllocated / totalBalance) * 100), 100)
        : 0;
    return { totalBalance, totalAllocated, totalFree, allocPercent };
  }, [allocationData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🏦 Account Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allocationData?.accounts || allocationData.accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🏦 Account Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No accounts with assigned plans.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">🏦 Account Distribution</CardTitle>
        {globalTotals && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Total: {formatCurrency(globalTotals.totalBalance)} | Allocated:{" "}
                {formatCurrency(globalTotals.totalAllocated)} | Free:{" "}
                {formatCurrency(globalTotals.totalFree)}
              </span>
              <span>{globalTotals.allocPercent}% allocated</span>
            </div>
            <Progress value={globalTotals.allocPercent} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y">
          {allocationData.accounts.map((account) => (
            <AccountRow key={account.accountId} account={account} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
