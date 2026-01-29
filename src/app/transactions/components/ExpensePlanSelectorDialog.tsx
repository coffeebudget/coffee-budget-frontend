"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Check, Calendar, Wallet } from "lucide-react";
import { useActiveExpensePlans, useLinkTransaction } from "@/hooks/useExpensePlans";
import { formatCurrency } from "@/types/expense-plan-types";
import { Transaction } from "@/utils/types";

interface ExpensePlanSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function ExpensePlanSelectorDialog({
  open,
  onOpenChange,
  transaction,
}: ExpensePlanSelectorDialogProps) {
  const { data: plans = [], isLoading } = useActiveExpensePlans();
  const linkMutation = useLinkTransaction();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Filter plans by search term
  const filteredPlans = useMemo(() => {
    if (!searchTerm.trim()) return plans;
    const term = searchTerm.toLowerCase();
    return plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(term) ||
        plan.description?.toLowerCase().includes(term)
    );
  }, [plans, searchTerm]);

  // Sort: matching category first
  const sortedPlans = useMemo(() => {
    if (!transaction) return filteredPlans;
    return [...filteredPlans].sort((a, b) => {
      const aMatches = a.categoryId === transaction.categoryId;
      const bMatches = b.categoryId === transaction.categoryId;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredPlans, transaction]);

  // Reset state when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedPlanId(null);
    }
    onOpenChange(isOpen);
  };

  const handleLink = async () => {
    if (!selectedPlanId || !transaction?.id) return;

    await linkMutation.mutateAsync({
      planId: selectedPlanId,
      transactionId: transaction.id,
    });

    handleOpenChange(false);
  };

  const getPlanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed_monthly: "Monthly",
      yearly_fixed: "Yearly",
      yearly_variable: "Variable Yearly",
      multi_year: "Multi-Year",
      seasonal: "Seasonal",
      goal: "Goal",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link to Expense Plan</DialogTitle>
          <DialogDescription>
            {transaction ? (
              <>
                Link &quot;{transaction.description}&quot; (
                {formatCurrency(Math.abs(transaction.amount))}) to an expense plan
              </>
            ) : (
              "Select an expense plan to link this transaction to"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search expense plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!isLoading && sortedPlans.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No matching plans found" : "No active expense plans"}
            </div>
          )}

          {sortedPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const matchesCategory = transaction && plan.categoryId === transaction.categoryId;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : matchesCategory
                    ? "border-green-200 bg-green-50 hover:border-green-300"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-medium">
                        {plan.icon} {plan.name}
                      </span>
                      {matchesCategory && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 border-green-200 text-xs"
                        >
                          Same category
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {getPlanTypeLabel(plan.planType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        {formatCurrency(plan.targetAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedPlanId || linkMutation.isPending}
          >
            {linkMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Link to Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
