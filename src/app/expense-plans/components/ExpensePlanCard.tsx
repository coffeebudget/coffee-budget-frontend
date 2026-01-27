"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import AdjustmentBadge from "./AdjustmentBadge";
import FundingStatusBadge from "./FundingStatusBadge";
import {
  ExpensePlan,
  AccountCoverage,
  getExpensePlanStatusLabel,
  getExpensePlanPriorityLabel,
  getExpensePlanTypeLabel,
  getExpensePlanFrequencyLabel,
  getPriorityColor,
  getStatusColor,
  formatCurrency,
  calculateExpectedFundedByNow,
} from "@/types/expense-plan-types";

interface ExpensePlanCardProps {
  plan: ExpensePlan;
  onEdit: (plan: ExpensePlan) => void;
  onDelete: (id: number) => void;
  onReviewAdjustment?: (plan: ExpensePlan) => void;
  /** Account coverage info - shows warning if account has shortfall */
  accountCoverage?: AccountCoverage | null;
}

/**
 * Calculate time-based funding status for sinking funds.
 * Based on contribution rate vs required rate.
 */
function calculateTimeFundingStatus(plan: ExpensePlan): 'on_track' | 'behind' | null {
  if (plan.purpose !== 'sinking_fund' || !plan.nextDueDate) {
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
    return 'behind'; // Past due
  }

  const requiredMonthly = plan.targetAmount / monthsUntilDue;
  // On track if current contribution is within 10% of required
  return requiredMonthly <= plan.monthlyContribution * 1.1 ? 'on_track' : 'behind';
}

/**
 * Calculate months until due date.
 */
function getMonthsUntilDue(plan: ExpensePlan): number | null {
  if (!plan.nextDueDate) return null;

  const now = new Date();
  const dueDate = new Date(plan.nextDueDate);
  const monthsUntilDue = Math.max(
    0,
    (dueDate.getFullYear() - now.getFullYear()) * 12 +
      (dueDate.getMonth() - now.getMonth())
  );
  return monthsUntilDue;
}

export default function ExpensePlanCard({
  plan,
  onEdit,
  onDelete,
  onReviewAdjustment,
  accountCoverage,
}: ExpensePlanCardProps) {
  const fundingStatus = calculateTimeFundingStatus(plan);
  const monthsUntilDue = getMonthsUntilDue(plan);

  // Calculate expected funding for sinking funds
  const expectedFundedByNow = plan.purpose === 'sinking_fund'
    ? calculateExpectedFundedByNow(plan)
    : null;

  // Calculate required monthly contribution
  const requiredMonthly = monthsUntilDue !== null && monthsUntilDue > 0
    ? plan.targetAmount / monthsUntilDue
    : null;

  // Check if contribution rate needs adjustment
  const needsIncrease = requiredMonthly !== null &&
    plan.monthlyContribution < requiredMonthly * 0.9;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {plan.icon && <span className="text-2xl">{plan.icon}</span>}
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {plan.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(plan.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          <AdjustmentBadge
            plan={plan}
            onClick={() => onReviewAdjustment?.(plan)}
          />
          {fundingStatus && (
            <FundingStatusBadge status={fundingStatus} size="sm" />
          )}
          <Badge variant="outline" className={getStatusColor(plan.status)}>
            {getExpensePlanStatusLabel(plan.status)}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(plan.priority)}>
            {getExpensePlanPriorityLabel(plan.priority)}
          </Badge>
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {getExpensePlanTypeLabel(plan.planType)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Target & Schedule Info for Sinking Funds */}
        {plan.purpose === 'sinking_fund' && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Target</span>
              <span className="font-medium">{formatCurrency(plan.targetAmount)}</span>
            </div>
            {monthsUntilDue !== null && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Time to due</span>
                <span className="font-medium">
                  {monthsUntilDue === 0 ? 'This month' : `${monthsUntilDue} month${monthsUntilDue !== 1 ? 's' : ''}`}
                </span>
              </div>
            )}
            {expectedFundedByNow !== null && expectedFundedByNow > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expected by now</span>
                <span className="font-medium">{formatCurrency(expectedFundedByNow)}</span>
              </div>
            )}
          </div>
        )}

        {/* Fixed Monthly Status */}
        {plan.planType === "fixed_monthly" && plan.fixedMonthlyStatus && (
          <div className="mb-4">
            <div
              className={`p-2 rounded-md flex items-center gap-2 ${
                plan.fixedMonthlyStatus.currentMonthPaymentMade
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              {plan.fixedMonthlyStatus.currentMonthPaymentMade ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Paid this month
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Not yet paid this month
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Contribution Rate Warning */}
        {needsIncrease && requiredMonthly !== null && (
          <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center gap-1.5 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <span className="font-medium">Contribution rate too low</span>
            </div>
            <div className="text-xs text-amber-600 mt-1 ml-5">
              Need {formatCurrency(requiredMonthly)}/mo to reach target,
              currently {formatCurrency(plan.monthlyContribution)}/mo
            </div>
          </div>
        )}

        {/* Account Coverage Warning */}
        {accountCoverage?.hasShortfall && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-1.5 text-xs text-red-800">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              <span className="font-medium">{accountCoverage.accountName} shortfall</span>
            </div>
            <div className="text-xs text-red-600 mt-1 ml-5">
              {accountCoverage.planCount} bills need {formatCurrency(accountCoverage.upcomingPlansTotal)},
              but only {formatCurrency(accountCoverage.currentBalance)} available
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Monthly Contribution</span>
            <span className="font-medium">
              {formatCurrency(plan.monthlyContribution)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Frequency</span>
            <span>{getExpensePlanFrequencyLabel(plan.frequency)}</span>
          </div>

          {plan.nextDueDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next Due
              </span>
              <span>{formatDate(plan.nextDueDate)}</span>
            </div>
          )}

          {plan.category && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Category</span>
              <span>{plan.category.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
