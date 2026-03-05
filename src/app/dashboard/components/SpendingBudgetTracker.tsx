"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useExpensePlansWithStatus } from "@/hooks/useExpensePlans";
import {
  ExpensePlanWithStatus,
  formatCurrency,
} from "@/types/expense-plan-types";
import FundingStatusBadge from "@/app/expense-plans/components/FundingStatusBadge";
import { ArrowUpDown } from "lucide-react";

type SortField = "name" | "spent" | "budget" | "utilization";
type SortDirection = "asc" | "desc";

function getSpent(plan: ExpensePlanWithStatus): number {
  const remaining = (plan.progressPercent / 100) * plan.targetAmount;
  return plan.monthlyContribution - remaining;
}

function getUtilization(plan: ExpensePlanWithStatus): number {
  return 100 - plan.progressPercent;
}

function getProgressColor(utilization: number): string {
  if (utilization >= 90) return "[&>div]:bg-red-500";
  if (utilization >= 75) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-green-500";
}

export default function SpendingBudgetTracker() {
  const { data: plans, isLoading } = useExpensePlansWithStatus();
  const [sortField, setSortField] = useState<SortField>("utilization");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const spendingPlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(
      (p) => p.purpose === "spending_budget" && p.status === "active"
    );
  }, [plans]);

  const sorted = useMemo(() => {
    return [...spendingPlans].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "spent":
          cmp = getSpent(a) - getSpent(b);
          break;
        case "budget":
          cmp = a.monthlyContribution - b.monthlyContribution;
          break;
        case "utilization":
          cmp = getUtilization(a) - getUtilization(b);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [spendingPlans, sortField, sortDir]);

  const totals = useMemo(() => {
    const totalSpent = spendingPlans.reduce(
      (sum, p) => sum + getSpent(p),
      0
    );
    const totalBudget = spendingPlans.reduce(
      (sum, p) => sum + p.monthlyContribution,
      0
    );
    const overallUtilization =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalSpent, totalBudget, overallUtilization };
  }, [spendingPlans]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (spendingPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active spending budgets.
          </p>
        </CardContent>
      </Card>
    );
  }

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Spending Budgets</CardTitle>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(totals.totalSpent)} /{" "}
            {formatCurrency(totals.totalBudget)} ({totals.overallUtilization}%)
          </span>
        </div>
        <Progress
          value={totals.overallUtilization}
          className={`h-2 ${getProgressColor(totals.overallUtilization)}`}
        />
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="name">Budget</SortableHeader>
              <SortableHeader field="spent" className="text-right">
                Spent
              </SortableHeader>
              <SortableHeader field="budget" className="text-right hidden sm:table-cell">
                Budget
              </SortableHeader>
              <SortableHeader field="utilization" className="text-right">
                Used
              </SortableHeader>
              <TableHead className="text-right hidden sm:table-cell">
                Remaining
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((plan) => {
              const spent = getSpent(plan);
              const remaining = plan.monthlyContribution - spent;
              const utilization = getUtilization(plan);
              return (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <span className="mr-1">{plan.icon || "📋"}</span>
                    {plan.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(spent)}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {formatCurrency(plan.monthlyContribution)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={utilization}
                        className={`h-2 w-16 ${getProgressColor(utilization)}`}
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {Math.round(utilization)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    <span className={remaining < 0 ? "text-red-500 font-medium" : ""}>
                      {formatCurrency(remaining)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {plan.fundingStatus && (
                      <FundingStatusBadge
                        status={plan.fundingStatus}
                        size="sm"
                        showLabel={false}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
