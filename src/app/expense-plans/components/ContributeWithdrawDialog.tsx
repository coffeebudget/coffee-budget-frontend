"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Minus } from "lucide-react";
import {
  useContributeToExpensePlan,
  useWithdrawFromExpensePlan,
} from "@/hooks/useExpensePlans";
import { ExpensePlan, formatCurrency } from "@/types/expense-plan-types";

interface ContributeWithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExpensePlan | null;
  mode: "contribute" | "withdraw";
  onComplete: () => void;
}

export default function ContributeWithdrawDialog({
  open,
  onOpenChange,
  plan,
  mode,
  onComplete,
}: ContributeWithdrawDialogProps) {
  const contributeMutation = useContributeToExpensePlan();
  const withdrawMutation = useWithdrawFromExpensePlan();

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setAmount("");
      setNotes("");
      setError("");
    }
  }, [open]);

  const validate = (): boolean => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }

    if (mode === "withdraw" && plan && parsedAmount > plan.currentBalance) {
      setError(`Cannot withdraw more than current balance (${formatCurrency(plan.currentBalance)})`);
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plan || !validate()) return;

    const data = {
      amount: parseFloat(amount),
      notes: notes.trim() || undefined,
    };

    try {
      if (mode === "contribute") {
        await contributeMutation.mutateAsync({ planId: plan.id, data });
      } else {
        await withdrawMutation.mutateAsync({ planId: plan.id, data });
      }
      onComplete();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleQuickAmount = (percentage: number) => {
    if (!plan) return;

    let quickAmount: number;
    if (mode === "contribute") {
      // Quick amount based on monthly contribution
      quickAmount = plan.monthlyContribution * percentage;
    } else {
      // Quick amount based on current balance
      quickAmount = plan.currentBalance * percentage;
    }

    setAmount(quickAmount.toFixed(2));
  };

  const isLoading = contributeMutation.isPending || withdrawMutation.isPending;
  const isContribute = mode === "contribute";

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isContribute ? (
              <>
                <Plus className="h-5 w-5 text-green-600" />
                Contribute to {plan.name}
              </>
            ) : (
              <>
                <Minus className="h-5 w-5 text-red-600" />
                Withdraw from {plan.name}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Current Balance Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Current Balance</span>
            <span className="text-lg font-semibold">
              {formatCurrency(plan.currentBalance)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-600">Target Amount</span>
            <span className="text-gray-900">
              {formatCurrency(plan.targetAmount)}
            </span>
          </div>
          {isContribute && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Monthly Contribution</span>
              <span className="text-gray-900">
                {formatCurrency(plan.monthlyContribution)}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={mode === "withdraw" ? plan.currentBalance : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {isContribute ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.5)}
                >
                  50% Monthly
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1)}
                >
                  Full Monthly
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(2)}
                >
                  2x Monthly
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.25)}
                  disabled={plan.currentBalance <= 0}
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.5)}
                  disabled={plan.currentBalance <= 0}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1)}
                  disabled={plan.currentBalance <= 0}
                >
                  100%
                </Button>
              </>
            )}
          </div>

          {/* Notes Input */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this transaction..."
              rows={2}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={isContribute ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isContribute ? "Contribute" : "Withdraw"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
