"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Edit3,
} from "lucide-react";
import {
  useAcceptAdjustment,
  useDismissAdjustment,
} from "@/hooks/useExpensePlans";
import { ExpensePlan, formatCurrency } from "@/types/expense-plan-types";

interface AdjustmentSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExpensePlan | null;
  onComplete: () => void;
}

/**
 * Modal for reviewing and accepting/dismissing expense plan adjustment suggestions.
 * Allows accepting the suggested amount, entering a custom amount, or dismissing for 30 days.
 */
export default function AdjustmentSuggestionModal({
  open,
  onOpenChange,
  plan,
  onComplete,
}: AdjustmentSuggestionModalProps) {
  const acceptMutation = useAcceptAdjustment();
  const dismissMutation = useDismissAdjustment();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setShowCustomInput(false);
      setCustomAmount("");
      setError("");
    }
  }, [open]);

  if (!plan) return null;

  // Guard against missing adjustment data
  if (
    !plan.suggestedMonthlyContribution ||
    !plan.suggestedAdjustmentPercent ||
    !plan.adjustmentReason
  ) {
    return null;
  }

  const isIncrease = plan.adjustmentReason === "spending_increased";
  const percentChange = Math.abs(plan.suggestedAdjustmentPercent);
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  const isLoading = acceptMutation.isPending || dismissMutation.isPending;

  const handleAcceptSuggested = async () => {
    try {
      await acceptMutation.mutateAsync({ planId: plan.id });
      onComplete();
    } catch {
      // Error handled by mutation
    }
  };

  const handleAcceptCustom = async () => {
    const parsed = parseFloat(customAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }
    setError("");

    try {
      await acceptMutation.mutateAsync({
        planId: plan.id,
        customAmount: parsed,
      });
      onComplete();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissMutation.mutateAsync(plan.id);
      onComplete();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              className={`h-5 w-5 ${
                isIncrease ? "text-amber-600" : "text-blue-600"
              }`}
            />
            Adjust &ldquo;{plan.name}&rdquo; Plan?
          </DialogTitle>
          <DialogDescription>
            {isIncrease
              ? "Your spending in this category has increased. Consider adjusting your plan to match your actual spending habits."
              : "Your spending in this category has decreased. You may be able to reduce your monthly contribution."}
          </DialogDescription>
        </DialogHeader>

        {/* Comparison Box */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Current Monthly</span>
            <span className="text-lg font-medium">
              {formatCurrency(plan.monthlyContribution)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Suggested Monthly</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-semibold ${
                  isIncrease ? "text-amber-700" : "text-blue-700"
                }`}
              >
                {formatCurrency(plan.suggestedMonthlyContribution)}
              </span>
              <span
                className={`text-sm px-2 py-0.5 rounded-full ${
                  isIncrease
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {isIncrease ? "+" : "-"}
                {percentChange.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              Difference per month
            </span>
            <span
              className={
                isIncrease ? "text-amber-600" : "text-blue-600"
              }
            >
              {isIncrease ? "+" : "-"}
              {formatCurrency(
                Math.abs(
                  plan.suggestedMonthlyContribution - plan.monthlyContribution
                )
              )}
            </span>
          </div>
        </div>

        {/* Custom Amount Input (conditional) */}
        {showCustomInput && (
          <div className="space-y-2">
            <Label htmlFor="customAmount">Custom Monthly Amount</Label>
            <Input
              id="customAmount"
              type="number"
              step="0.01"
              min="0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={plan.suggestedMonthlyContribution.toFixed(2)}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {!showCustomInput ? (
            <>
              {/* Accept Suggested Amount */}
              <Button
                onClick={handleAcceptSuggested}
                disabled={isLoading}
                className={`gap-2 ${
                  isIncrease
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Accept {formatCurrency(plan.suggestedMonthlyContribution)}
              </Button>

              {/* Enter Custom Amount */}
              <Button
                variant="outline"
                onClick={() => setShowCustomInput(true)}
                disabled={isLoading}
                className="gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Enter Custom Amount
              </Button>

              {/* Dismiss */}
              <Button
                variant="ghost"
                onClick={handleDismiss}
                disabled={isLoading}
                className="gap-2 text-gray-600"
              >
                {dismissMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Dismiss for 30 days
              </Button>
            </>
          ) : (
            <>
              {/* Accept Custom Amount */}
              <Button
                onClick={handleAcceptCustom}
                disabled={isLoading}
                className="gap-2"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Accept Custom Amount
              </Button>

              {/* Back to Suggestions */}
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomAmount("");
                  setError("");
                }}
                disabled={isLoading}
              >
                Back
              </Button>
            </>
          )}
        </div>

        {/* Info Footer */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Suggestions are based on your spending patterns over the last 12 months.
        </p>
      </DialogContent>
    </Dialog>
  );
}
