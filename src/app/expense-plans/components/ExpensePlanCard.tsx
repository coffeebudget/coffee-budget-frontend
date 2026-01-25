"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Plus,
  Minus,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import AdjustmentBadge from "./AdjustmentBadge";
import FundingStatusBadge from "./FundingStatusBadge";
import {
  ExpensePlan,
  calculateProgress,
  getProgressColor,
  getExpensePlanStatusLabel,
  getExpensePlanPriorityLabel,
  getExpensePlanTypeLabel,
  getExpensePlanFrequencyLabel,
  getPriorityColor,
  getStatusColor,
  formatCurrency,
  calculateFundingStatus,
  calculateExpectedFundedByNow,
  calculateFundingGapFromExpected,
} from "@/types/expense-plan-types";

interface ExpensePlanCardProps {
  plan: ExpensePlan;
  onEdit: (plan: ExpensePlan) => void;
  onDelete: (id: number) => void;
  onContribute: (plan: ExpensePlan) => void;
  onWithdraw: (plan: ExpensePlan) => void;
  onReviewAdjustment?: (plan: ExpensePlan) => void;
}

export default function ExpensePlanCard({
  plan,
  onEdit,
  onDelete,
  onContribute,
  onWithdraw,
  onReviewAdjustment,
}: ExpensePlanCardProps) {
  const progress = calculateProgress(plan.currentBalance, plan.targetAmount);
  const progressColor = getProgressColor(progress);
  const remaining = Math.max(0, plan.targetAmount - plan.currentBalance);
  const isFullyFunded = plan.currentBalance >= plan.targetAmount;
  const fundingStatus = plan.purpose === 'sinking_fund' ? calculateFundingStatus(plan) : null;

  // Calculate expected funding for sinking funds
  const expectedFundedByNow = plan.purpose === 'sinking_fund'
    ? calculateExpectedFundedByNow(plan)
    : null;
  const fundingGapFromExpected = plan.purpose === 'sinking_fund'
    ? calculateFundingGapFromExpected(plan)
    : null;
  const hasFundingGap = fundingGapFromExpected !== null && fundingGapFromExpected > 0;

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
              <DropdownMenuItem onClick={() => onContribute(plan)}>
                <Plus className="h-4 w-4 mr-2" />
                Contribute
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onWithdraw(plan)}
                disabled={plan.currentBalance <= 0}
              >
                <Minus className="h-4 w-4 mr-2" />
                Withdraw
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
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">
              {formatCurrency(plan.currentBalance)}
            </span>
            <span className="text-gray-500">
              of {formatCurrency(plan.targetAmount)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{progress.toFixed(1)}% funded</span>
            {!isFullyFunded && <span>{formatCurrency(remaining)} to go</span>}
          </div>
        </div>

        {/* Fixed Monthly Status OR Funding Gap */}
        {plan.planType === "fixed_monthly" && plan.fixedMonthlyStatus ? (
          <div className="mb-4 space-y-2">
            {/* Payment Status */}
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

            {/* Ready for Next Month (only show if not paid yet) */}
            {!plan.fixedMonthlyStatus.currentMonthPaymentMade && (
              <div
                className={`p-2 rounded-md flex items-center gap-2 ${
                  plan.fixedMonthlyStatus.readyForNextMonth
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                {plan.fixedMonthlyStatus.readyForNextMonth ? (
                  <span className="text-sm text-blue-800">Ready to pay</span>
                ) : (
                  <span className="text-sm text-amber-800">
                    Need {formatCurrency(plan.fixedMonthlyStatus.amountShort || 0)}{" "}
                    more
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          hasFundingGap &&
          expectedFundedByNow !== null && (
            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-1 text-xs text-amber-800">
                <span className="font-medium">Expected by now:</span>
                <span>{formatCurrency(expectedFundedByNow)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                <span>Gap:</span>
                <span className="font-medium text-amber-700">
                  {formatCurrency(fundingGapFromExpected!)}
                </span>
                <span className="text-amber-500">behind schedule</span>
              </div>
            </div>
          )
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
