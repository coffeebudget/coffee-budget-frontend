"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2, Wand2 } from "lucide-react";
import {
  WizardState,
  WizardExpenseCategory,
  WizardExpensePlan,
  getDefaultWizardState,
  generateTempId,
  mapWizardPlanToCreateDto,
  getWizardCategoryDefinition,
} from "@/types/expense-plan-types";
import { useCreateExpensePlan } from "@/hooks/useExpensePlans";
import { CategorySelector } from "./CategorySelector";
import { CategoryExpenseForm } from "./CategoryExpenseForm";
import { WizardSummary } from "./WizardSummary";

interface ExpensePlanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ExpensePlanWizard({
  open,
  onOpenChange,
  onComplete,
}: ExpensePlanWizardProps) {
  const [state, setState] = useState<WizardState>(getDefaultWizardState());
  const createMutation = useCreateExpensePlan();

  // Calculate total steps: 1 (category selection) + selected categories + 1 (summary)
  const totalSteps = state.selectedCategories.length > 0
    ? 1 + state.selectedCategories.length + 1
    : 1;

  const progressPercent = ((state.currentStep + 1) / totalSteps) * 100;

  const handleCategorySelection = useCallback((categories: WizardExpenseCategory[]) => {
    setState((prev) => ({
      ...prev,
      selectedCategories: categories,
      totalSteps: categories.length > 0 ? 1 + categories.length + 1 : 1,
    }));
  }, []);

  const handleNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: prev.currentStep + 1,
      currentCategoryIndex:
        prev.currentStep >= 1 && prev.currentStep < prev.selectedCategories.length
          ? prev.currentCategoryIndex + 1
          : prev.currentCategoryIndex,
    }));
  }, []);

  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
      currentCategoryIndex:
        prev.currentStep > 1
          ? Math.max(0, prev.currentCategoryIndex - 1)
          : 0,
    }));
  }, []);

  const handleAddPlan = useCallback((plan: Omit<WizardExpensePlan, "tempId">) => {
    const newPlan: WizardExpensePlan = {
      ...plan,
      tempId: generateTempId(),
    };
    setState((prev) => ({
      ...prev,
      plans: [...prev.plans, newPlan],
    }));
  }, []);

  const handleUpdatePlan = useCallback((tempId: string, updates: Partial<WizardExpensePlan>) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) =>
        p.tempId === tempId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const handleRemovePlan = useCallback((tempId: string) => {
    setState((prev) => ({
      ...prev,
      plans: prev.plans.filter((p) => p.tempId !== tempId),
    }));
  }, []);

  const handleSkipCategory = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleCreateAllPlans = async () => {
    if (state.plans.length === 0) return;

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      // Create plans sequentially (MVP approach)
      for (const plan of state.plans) {
        const dto = mapWizardPlanToCreateDto(plan);
        await createMutation.mutateAsync(dto);
      }

      // Reset and close
      setState(getDefaultWizardState());
      onComplete();
    } catch (error) {
      console.error("Failed to create expense plans:", error);
      // Keep dialog open so user can retry
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleClose = () => {
    setState(getDefaultWizardState());
    onOpenChange(false);
  };

  // Determine which step to render
  const renderStep = () => {
    if (state.currentStep === 0) {
      // Step 1: Category Selection
      return (
        <CategorySelector
          selectedCategories={state.selectedCategories}
          onSelectionChange={handleCategorySelection}
        />
      );
    }

    if (state.currentStep <= state.selectedCategories.length) {
      // Steps 2-N: Category Configuration
      const categoryIndex = state.currentStep - 1;
      const categoryId = state.selectedCategories[categoryIndex];
      const categoryDef = getWizardCategoryDefinition(categoryId);

      if (!categoryDef) return null;

      return (
        <CategoryExpenseForm
          category={categoryDef}
          existingPlans={state.plans.filter((p) => p.categoryType === categoryId)}
          onAddPlan={handleAddPlan}
          onUpdatePlan={handleUpdatePlan}
          onRemovePlan={handleRemovePlan}
          onSkip={handleSkipCategory}
        />
      );
    }

    // Final Step: Summary
    return (
      <WizardSummary
        plans={state.plans}
        onEditPlan={handleUpdatePlan}
        onRemovePlan={handleRemovePlan}
        onCreateAll={handleCreateAllPlans}
        isSubmitting={state.isSubmitting}
      />
    );
  };

  const canProceed = () => {
    if (state.currentStep === 0) {
      return state.selectedCategories.length > 0;
    }
    return true;
  };

  const isLastStep = state.currentStep === totalSteps - 1;
  const isFirstStep = state.currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-green-600" />
            Expense Plan Wizard
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              Step {state.currentStep + 1} of {totalSteps}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep || state.isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={state.isSubmitting}>
              Cancel
            </Button>

            {!isLastStep && (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || state.isSubmitting}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {isLastStep && (
              <Button
                onClick={handleCreateAllPlans}
                disabled={state.plans.length === 0 || state.isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {state.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create {state.plans.length} Plan{state.plans.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
