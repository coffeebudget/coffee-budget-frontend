"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  useAcceptAdjustment,
  useDismissAdjustment,
} from "@/hooks/useExpensePlans";
import { ExpensePlan, formatCurrency } from "@/types/expense-plan-types";

interface AdjustmentAlertProps {
  plan: ExpensePlan;
}

export function AdjustmentAlert({ plan }: AdjustmentAlertProps) {
  const acceptMutation = useAcceptAdjustment();
  const dismissMutation = useDismissAdjustment();

  if (!plan.suggestedMonthlyContribution) return null;

  const isIncrease = plan.suggestedMonthlyContribution > plan.monthlyContribution;
  const percentChange = plan.suggestedAdjustmentPercent || 0;

  const handleAccept = async () => {
    await acceptMutation.mutateAsync({ planId: plan.id });
  };

  const handleDismiss = async () => {
    await dismissMutation.mutateAsync(plan.id);
  };

  const getReasonText = () => {
    switch (plan.adjustmentReason) {
      case "spending_increased":
        return "Your spending on this category has increased";
      case "spending_decreased":
        return "Your spending on this category has decreased";
      default:
        return "Based on your spending patterns";
    }
  };

  return (
    <Card className={isIncrease ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {isIncrease ? (
            <TrendingUp className="h-6 w-6 text-amber-600 mt-0.5" />
          ) : (
            <TrendingDown className="h-6 w-6 text-green-600 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-medium ${isIncrease ? "text-amber-900" : "text-green-900"}`}>
              Adjustment Suggested
            </h3>
            <p className={`text-sm mt-1 ${isIncrease ? "text-amber-700" : "text-green-700"}`}>
              {getReasonText()}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${isIncrease ? "text-amber-600" : "text-green-600"}`}>
                  Current
                </p>
                <p className={`font-semibold ${isIncrease ? "text-amber-900" : "text-green-900"}`}>
                  {formatCurrency(plan.monthlyContribution)}/mo
                </p>
              </div>
              <div>
                <p className={`text-xs ${isIncrease ? "text-amber-600" : "text-green-600"}`}>
                  Suggested
                </p>
                <p className={`font-semibold ${isIncrease ? "text-amber-900" : "text-green-900"}`}>
                  {formatCurrency(plan.suggestedMonthlyContribution)}/mo
                  <span className="text-sm font-normal ml-1">
                    ({isIncrease ? "+" : ""}{Math.round(percentChange)}%)
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={acceptMutation.isPending || dismissMutation.isPending}
                className={isIncrease ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}
              >
                {acceptMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                disabled={acceptMutation.isPending || dismissMutation.isPending}
              >
                {dismissMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Dismiss
              </Button>
            </div>

            {plan.adjustmentSuggestedAt && (
              <p className={`text-xs mt-3 ${isIncrease ? "text-amber-600" : "text-green-600"}`}>
                Suggested on {new Date(plan.adjustmentSuggestedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
