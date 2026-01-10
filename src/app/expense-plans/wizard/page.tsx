"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wand2,
  X,
  ArrowLeft,
} from "lucide-react";
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
import { CategorySelector } from "../components/wizard/CategorySelector";
import { CategoryExpenseForm } from "../components/wizard/CategoryExpenseForm";
import { WizardSummary } from "../components/wizard/WizardSummary";

export default function ExpensePlanWizardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [state, setState] = useState<WizardState>(getDefaultWizardState());
  const createMutation = useCreateExpensePlan();

  // Calculate total steps: 1 (category selection) + selected categories + 1 (summary)
  const totalSteps =
    state.selectedCategories.length > 0
      ? 1 + state.selectedCategories.length + 1
      : 1;

  const progressPercent = ((state.currentStep + 1) / totalSteps) * 100;

  const handleCategorySelection = useCallback(
    (categories: WizardExpenseCategory[]) => {
      setState((prev) => ({
        ...prev,
        selectedCategories: categories,
        totalSteps: categories.length > 0 ? 1 + categories.length + 1 : 1,
      }));
    },
    []
  );

  const handleNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: prev.currentStep + 1,
      currentCategoryIndex:
        prev.currentStep >= 1 &&
        prev.currentStep < prev.selectedCategories.length
          ? prev.currentCategoryIndex + 1
          : prev.currentCategoryIndex,
    }));
  }, []);

  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
      currentCategoryIndex:
        prev.currentStep > 1 ? Math.max(0, prev.currentCategoryIndex - 1) : 0,
    }));
  }, []);

  const handleAddPlan = useCallback(
    (plan: Omit<WizardExpensePlan, "tempId">) => {
      const newPlan: WizardExpensePlan = {
        ...plan,
        tempId: generateTempId(),
      };
      setState((prev) => ({
        ...prev,
        plans: [...prev.plans, newPlan],
      }));
    },
    []
  );

  const handleUpdatePlan = useCallback(
    (tempId: string, updates: Partial<WizardExpensePlan>) => {
      setState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) =>
          p.tempId === tempId ? { ...p, ...updates } : p
        ),
      }));
    },
    []
  );

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

      // Navigate back to expense plans page
      router.push("/expense-plans");
    } catch (error) {
      console.error("Failed to create expense plans:", error);
      // Keep on page so user can retry
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleCancel = () => {
    router.push("/expense-plans");
  };

  // Determine which step to render
  const renderStep = () => {
    if (state.currentStep === 0) {
      return (
        <CategorySelector
          selectedCategories={state.selectedCategories}
          onSelectionChange={handleCategorySelection}
        />
      );
    }

    if (state.currentStep <= state.selectedCategories.length) {
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

  const getStepTitle = () => {
    if (state.currentStep === 0) {
      return "Select Expense Categories";
    }
    if (state.currentStep <= state.selectedCategories.length) {
      const categoryIndex = state.currentStep - 1;
      const categoryId = state.selectedCategories[categoryIndex];
      const categoryDef = getWizardCategoryDefinition(categoryId);
      return `Configure ${categoryDef?.label || "Expenses"}`;
    }
    return "Review & Create";
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to create expense plans.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Plans
              </Button>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Wand2 className="h-5 w-5" />
              <span className="font-semibold">Expense Plan Wizard</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span className="font-medium text-gray-700">{getStepTitle()}</span>
              <span>
                Step {state.currentStep + 1} of {totalSteps}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
        </Card>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep || state.isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={state.isSubmitting}
            >
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
                  <>
                    Create {state.plans.length} Plan
                    {state.plans.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom padding to account for fixed footer */}
      <div className="h-20" />
    </div>
  );
}
