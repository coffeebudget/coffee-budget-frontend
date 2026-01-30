"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  ExpensePlan,
  formatCurrency,
  calculateExpectedFundedByNow,
  getEffectiveTargetForNextDue,
} from "@/types/expense-plan-types";

interface StatusSectionProps {
  plan: ExpensePlan;
}

export function StatusSection({ plan }: StatusSectionProps) {
  // Get effective target (per-occurrence for seasonal plans)
  const effectiveTarget = getEffectiveTargetForNextDue(plan);

  // Calculate time-based funding status for sinking funds
  const calculateTimeFundingStatus = (): "on_track" | "behind" | "funded" | null => {
    if (plan.purpose !== "sinking_fund" || !plan.nextDueDate) {
      return null;
    }

    const now = new Date();
    const dueDate = new Date(plan.nextDueDate);
    const monthsUntilDue = Math.max(
      0,
      (dueDate.getFullYear() - now.getFullYear()) * 12 +
        (dueDate.getMonth() - now.getMonth())
    );

    if (monthsUntilDue <= 0) {
      return "behind"; // Past due
    }

    // Use effective target (per-occurrence for seasonal plans)
    const requiredMonthly = effectiveTarget / monthsUntilDue;
    // On track if current contribution is within 10% of required
    if (requiredMonthly <= plan.monthlyContribution * 1.1) {
      return "on_track";
    }
    return "behind";
  };

  const getMonthsUntilDue = (): number | null => {
    if (!plan.nextDueDate) return null;

    const now = new Date();
    const dueDate = new Date(plan.nextDueDate);
    return Math.max(
      0,
      (dueDate.getFullYear() - now.getFullYear()) * 12 +
        (dueDate.getMonth() - now.getMonth())
    );
  };

  const fundingStatus = calculateTimeFundingStatus();
  const monthsUntilDue = getMonthsUntilDue();
  const expectedFundedByNow = calculateExpectedFundedByNow(plan);

  // Calculate required monthly for sinking funds (using effective target)
  const requiredMonthly =
    monthsUntilDue !== null && monthsUntilDue > 0
      ? effectiveTarget / monthsUntilDue
      : null;

  const needsIncrease =
    requiredMonthly !== null && plan.monthlyContribution < requiredMonthly * 0.9;

  // For fixed monthly plans
  if (plan.planType === "fixed_monthly") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {plan.fixedMonthlyStatus ? (
            <div
              className={`p-4 rounded-md flex items-center gap-3 ${
                plan.fixedMonthlyStatus.currentMonthPaymentMade
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {plan.fixedMonthlyStatus.currentMonthPaymentMade ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Paid this month</p>
                    {plan.fixedMonthlyStatus.paymentDate && (
                      <p className="text-sm text-green-600">
                        Payment date:{" "}
                        {new Date(plan.fixedMonthlyStatus.paymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">Not yet paid this month</p>
                    <p className="text-sm text-gray-600">
                      Amount due: {formatCurrency(plan.targetAmount)}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Monthly Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(plan.targetAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge
                  variant="outline"
                  className={
                    plan.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // For sinking funds
  if (plan.purpose === "sinking_fund") {
    // Use effective target (per-occurrence for seasonal plans)
    const progressPercent =
      expectedFundedByNow !== null && effectiveTarget > 0
        ? Math.min((expectedFundedByNow / effectiveTarget) * 100, 100)
        : 0;

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">Funding Status</CardTitle>
            </div>
            {fundingStatus && (
              <Badge
                variant="outline"
                className={
                  fundingStatus === "on_track"
                    ? "bg-green-100 text-green-800"
                    : fundingStatus === "funded"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {fundingStatus === "on_track"
                  ? "On Track"
                  : fundingStatus === "funded"
                  ? "Funded"
                  : "Behind Schedule"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Expected by now</span>
              <span className="font-medium">
                {expectedFundedByNow !== null
                  ? formatCurrency(expectedFundedByNow)
                  : "N/A"}{" "}
                / {formatCurrency(effectiveTarget)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progressPercent)}% of target
              {plan.frequency === "seasonal" && plan.seasonalMonths && plan.seasonalMonths.length > 1 && (
                <span className="text-gray-400"> (per occurrence)</span>
              )}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <p className="text-sm text-gray-500">
                {plan.frequency === "seasonal" && plan.seasonalMonths && plan.seasonalMonths.length > 1
                  ? "Per Occurrence"
                  : "Target"}
              </p>
              <p className="text-lg font-semibold">{formatCurrency(effectiveTarget)}</p>
              {plan.frequency === "seasonal" && plan.seasonalMonths && plan.seasonalMonths.length > 1 && (
                <p className="text-xs text-gray-400">({formatCurrency(plan.targetAmount)} yearly)</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Contribution</p>
              <p className="text-lg font-semibold">
                {formatCurrency(plan.monthlyContribution)}
              </p>
            </div>
            {monthsUntilDue !== null && (
              <div>
                <p className="text-sm text-gray-500">Time Until Due</p>
                <p className="text-lg font-semibold">
                  {monthsUntilDue === 0
                    ? "This month"
                    : `${monthsUntilDue} month${monthsUntilDue !== 1 ? "s" : ""}`}
                </p>
              </div>
            )}
            {requiredMonthly !== null && (
              <div>
                <p className="text-sm text-gray-500">Required Monthly</p>
                <p className="text-lg font-semibold">{formatCurrency(requiredMonthly)}</p>
              </div>
            )}
          </div>

          {/* Warning if contribution too low */}
          {needsIncrease && requiredMonthly !== null && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Contribution rate too low</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Need {formatCurrency(requiredMonthly)}/mo to reach target, currently{" "}
                {formatCurrency(plan.monthlyContribution)}/mo
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default status display
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg">Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Target Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(plan.targetAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Contribution</p>
            <p className="text-lg font-semibold">
              {formatCurrency(plan.monthlyContribution)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
