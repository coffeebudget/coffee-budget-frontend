"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import {
  WizardExpensePlan,
  getWizardCategoryDefinition,
  getWizardFrequencyLabel,
  calculateMonthlyContribution,
} from "@/types/expense-plan-types";

interface WizardSummaryProps {
  plans: WizardExpensePlan[];
  onEditPlan: (tempId: string, updates: Partial<WizardExpensePlan>) => void;
  onRemovePlan: (tempId: string) => void;
  onCreateAll: () => void;
  isSubmitting: boolean;
}

export function WizardSummary({
  plans,
  onEditPlan,
  onRemovePlan,
  onCreateAll,
  isSubmitting,
}: WizardSummaryProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  // Calculate budget impact
  const budgetImpact = useMemo(() => {
    let totalMonthly = 0;
    let essentialMonthly = 0;
    let discretionaryMonthly = 0;

    plans.forEach((plan) => {
      const monthlyAmount = calculateMonthlyContribution(plan.amount, plan.frequency);
      totalMonthly += monthlyAmount;

      if (plan.priority === "essential") {
        essentialMonthly += monthlyAmount;
      } else {
        discretionaryMonthly += monthlyAmount;
      }
    });

    const essentialPercent = totalMonthly > 0 ? (essentialMonthly / totalMonthly) * 100 : 0;
    const discretionaryPercent = totalMonthly > 0 ? (discretionaryMonthly / totalMonthly) * 100 : 0;

    return {
      totalMonthly,
      totalAnnual: totalMonthly * 12,
      essentialMonthly,
      discretionaryMonthly,
      essentialPercent,
      discretionaryPercent,
    };
  }, [plans]);

  // Group plans by category
  const plansByCategory = useMemo(() => {
    const grouped: Record<string, WizardExpensePlan[]> = {};
    plans.forEach((plan) => {
      if (!grouped[plan.categoryType]) {
        grouped[plan.categoryType] = [];
      }
      grouped[plan.categoryType].push(plan);
    });
    return grouped;
  }, [plans]);

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Expense Plans Created
        </h3>
        <p className="text-gray-600 mb-4">
          Go back and add some expense plans, or close this wizard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
        <h2 className="text-lg font-semibold text-gray-900">
          Review Your Expense Plans
        </h2>
        <p className="text-sm text-gray-600">
          You&apos;re creating {plans.length} expense plan{plans.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Plans List by Category */}
      <div className="space-y-4">
        {Object.entries(plansByCategory).map(([categoryId, categoryPlans]) => {
          const categoryDef = getWizardCategoryDefinition(categoryId as any);
          if (!categoryDef) return null;

          return (
            <div key={categoryId} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>{categoryDef.icon}</span>
                <span>{categoryDef.label}</span>
                <Badge variant="secondary" className="ml-auto">
                  {categoryPlans.length}
                </Badge>
              </h3>

              {categoryPlans.map((plan) => (
                <Card key={plan.tempId} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {plan.name}
                          </p>
                          <Badge
                            variant={
                              plan.priority === "essential" ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {plan.priority}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="font-medium text-green-600">
                            {formatCurrency(plan.amount)} / {getWizardFrequencyLabel(plan.frequency)}
                          </span>
                          <span>Next: {formatDate(plan.nextDueDate)}</span>
                          {plan.linkedTransactionIds.length > 0 && (
                            <span className="text-blue-600">
                              {plan.linkedTransactionIds.length} linked tx
                            </span>
                          )}
                        </div>
                        {plan.notes && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {plan.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemovePlan(plan.tempId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </div>

      {/* Budget Impact Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Budget Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Monthly Contribution
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(budgetImpact.totalMonthly)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Annual Total
              </p>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(budgetImpact.totalAnnual)}
              </p>
            </div>
          </div>

          <div className="border-t border-blue-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Essential expenses:
              </span>
              <span className="font-medium">
                {formatCurrency(budgetImpact.essentialMonthly)}/month ({Math.round(budgetImpact.essentialPercent)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Discretionary:
              </span>
              <span className="font-medium">
                {formatCurrency(budgetImpact.discretionaryMonthly)}/month ({Math.round(budgetImpact.discretionaryPercent)}%)
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="h-3 rounded-full overflow-hidden bg-gray-200 flex">
            {budgetImpact.essentialPercent > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{ width: `${budgetImpact.essentialPercent}%` }}
              />
            )}
            {budgetImpact.discretionaryPercent > 0 && (
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${budgetImpact.discretionaryPercent}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Essential
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Discretionary
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Create Button */}
      <div className="pt-4">
        <Button
          onClick={onCreateAll}
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Creating Expense Plans...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Create {plans.length} Expense Plan{plans.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
