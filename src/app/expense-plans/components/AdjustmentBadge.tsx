"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { ExpensePlan, formatCurrency } from "@/types/expense-plan-types";

interface AdjustmentBadgeProps {
  plan: ExpensePlan;
  onClick?: () => void;
}

/**
 * Displays a badge indicating an adjustment suggestion exists for an expense plan.
 * Shows the percentage change and reason (spending increased/decreased).
 */
export default function AdjustmentBadge({ plan, onClick }: AdjustmentBadgeProps) {
  // Don't render if no adjustment suggestion
  if (
    !plan.suggestedMonthlyContribution ||
    !plan.suggestedAdjustmentPercent ||
    !plan.adjustmentReason
  ) {
    return null;
  }

  const isIncrease = plan.adjustmentReason === "spending_increased";
  const percent = Math.abs(plan.suggestedAdjustmentPercent);
  const Icon = isIncrease ? TrendingUp : TrendingDown;

  const tooltipText = isIncrease
    ? `Spending increased ${percent.toFixed(0)}% - click to review suggested adjustment to ${formatCurrency(plan.suggestedMonthlyContribution)}/month`
    : `Spending decreased ${percent.toFixed(0)}% - click to review suggested adjustment to ${formatCurrency(plan.suggestedMonthlyContribution)}/month`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-pointer transition-colors ${
              isIncrease
                ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
            }`}
            onClick={onClick}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            <Icon className="h-3 w-3 mr-1" />
            {isIncrease ? "+" : "-"}{percent.toFixed(0)}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
