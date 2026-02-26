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

type SortField =
  | "name"
  | "saved"
  | "target"
  | "progress"
  | "monthly"
  | "dueDate";
type SortDirection = "asc" | "desc";

function getSavedAmount(plan: ExpensePlanWithStatus): number {
  return (plan.progressPercent / 100) * plan.targetAmount;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function SavingsProgressTable() {
  const { data: plans, isLoading } = useExpensePlansWithStatus();
  const [sortField, setSortField] = useState<SortField>("progress");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const savingsPlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(
      (p) =>
        p.targetAmount > 0 &&
        p.planType !== "fixed_monthly" &&
        p.status === "active"
    );
  }, [plans]);

  const sorted = useMemo(() => {
    return [...savingsPlans].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "saved":
          cmp = getSavedAmount(a) - getSavedAmount(b);
          break;
        case "target":
          cmp = a.targetAmount - b.targetAmount;
          break;
        case "progress":
          cmp = a.progressPercent - b.progressPercent;
          break;
        case "monthly":
          cmp = a.monthlyContribution - b.monthlyContribution;
          break;
        case "dueDate": {
          const dateA = a.nextDueDate || a.targetDate || "";
          const dateB = b.nextDueDate || b.targetDate || "";
          cmp = dateA.localeCompare(dateB);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [savingsPlans, sortField, sortDir]);

  const totals = useMemo(() => {
    const totalSaved = savingsPlans.reduce(
      (sum, p) => sum + getSavedAmount(p),
      0
    );
    const totalTarget = savingsPlans.reduce(
      (sum, p) => sum + p.targetAmount,
      0
    );
    const overallProgress =
      totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    return { totalSaved, totalTarget, overallProgress };
  }, [savingsPlans]);

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
          <CardTitle className="text-base">🎯 Savings Goals</CardTitle>
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

  if (savingsPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎯 Savings Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active savings plans with targets.
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
          <CardTitle className="text-base">🎯 Savings Goals</CardTitle>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(totals.totalSaved)} /{" "}
            {formatCurrency(totals.totalTarget)} ({totals.overallProgress}%)
          </span>
        </div>
        <Progress value={totals.overallProgress} className="h-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="name">Plan</SortableHeader>
              <SortableHeader field="saved" className="text-right">
                Saved
              </SortableHeader>
              <SortableHeader
                field="target"
                className="text-right hidden sm:table-cell"
              >
                Target
              </SortableHeader>
              <SortableHeader field="progress" className="text-right">
                Progress
              </SortableHeader>
              <SortableHeader
                field="monthly"
                className="text-right hidden md:table-cell"
              >
                Monthly
              </SortableHeader>
              <SortableHeader
                field="dueDate"
                className="text-right hidden md:table-cell"
              >
                Due Date
              </SortableHeader>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((plan) => {
              const saved = getSavedAmount(plan);
              const dueDate = plan.nextDueDate || plan.targetDate;
              return (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <span className="mr-1">{plan.icon || "📋"}</span>
                    {plan.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(saved)}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {formatCurrency(plan.targetAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Progress
                        value={plan.progressPercent}
                        className="h-2 w-16"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {Math.round(plan.progressPercent)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatCurrency(plan.monthlyContribution)}
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatDate(dueDate)}
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
