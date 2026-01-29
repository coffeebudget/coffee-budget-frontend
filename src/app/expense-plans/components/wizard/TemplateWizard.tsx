"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import {
  PlanTemplate,
  WizardStep,
  WizardField,
  CreateExpensePlanDto,
} from "@/types/expense-plan-types";
import { useQuery } from "@tanstack/react-query";
import { useCreateExpensePlan } from "@/hooks/useExpensePlans";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { fetchCategories } from "@/utils/api";

interface Category {
  id: number;
  name: string;
  icon?: string | null;
}

interface TemplateWizardProps {
  template: PlanTemplate;
  onBack: () => void;
  onCancel: () => void;
}

interface FormState {
  [key: string]: string | number | boolean | number[] | null | undefined;
}

export function TemplateWizard({
  template,
  onBack,
  onCancel,
}: TemplateWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: session } = useSession();
  const createMutation = useCreateExpensePlan();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(session!.user!.accessToken as string),
    enabled: !!session,
  });
  const { bankAccounts, fetchBankAccounts } = useBankAccounts();

  // Fetch bank accounts on mount
  useEffect(() => {
    if (session) {
      fetchBankAccounts();
    }
  }, [session]);

  const steps = template.wizard.steps;
  const totalSteps = steps.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const currentStepConfig = steps[currentStep];

  const validateStep = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const stepFields = currentStepConfig.fields;

    for (const field of stepFields) {
      if (field.required) {
        const value = formData[field.name];
        if (value === undefined || value === null || value === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStepConfig, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }, [validateStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      onBack();
    } else {
      setCurrentStep((prev) => Math.max(0, prev - 1));
    }
  }, [isFirstStep, onBack]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: string | number | boolean | number[] | null) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      // Clear error when field changes
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    },
    []
  );

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);

    try {
      // Build CreateExpensePlanDto from template defaults + form data
      const dto: CreateExpensePlanDto = {
        ...template.defaults,
        name: formData.name as string,
        targetAmount: Number(formData.targetAmount) || 0,
        monthlyContribution:
          Number(formData.monthlyContribution) ||
          Number(formData.targetAmount) ||
          0,
        frequency: template.defaults.frequency || "monthly",
        planType: template.defaults.planType || "fixed_monthly",
        // Optional fields
        ...(formData.description && { description: formData.description as string }),
        ...(formData.categoryId && { categoryId: Number(formData.categoryId) }),
        ...(formData.paymentAccountId && {
          paymentAccountId: Number(formData.paymentAccountId),
          paymentAccountType: "bank_account" as const,
        }),
        ...(formData.dueDay && { dueDay: Number(formData.dueDay) }),
        ...(formData.dueMonth && { dueMonth: Number(formData.dueMonth) }),
        ...(formData.autoTrackCategory !== undefined && {
          autoTrackCategory: formData.autoTrackCategory === "true" || formData.autoTrackCategory === true,
        }),
        ...(formData.seasonalMonths && {
          seasonalMonths: formData.seasonalMonths as number[],
        }),
      };

      await createMutation.mutateAsync(dto);
      router.push("/expense-plans");
    } catch (error) {
      console.error("Failed to create expense plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: WizardField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case "text":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              placeholder={field.placeholder}
              value={(value as string) || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              step="0.01"
              min="0"
              placeholder={field.placeholder}
              value={(value as number) || ""}
              onChange={(e) =>
                handleFieldChange(
                  field.name,
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className={error ? "border-red-500" : ""}
            />
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={(value as string) || ""}
              onValueChange={(val) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "category":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value?.toString() || ""}
              onValueChange={(val) =>
                handleFieldChange(field.name, val ? parseInt(val, 10) : null)
              }
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "account":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value?.toString() || ""}
              onValueChange={(val) =>
                handleFieldChange(field.name, val ? parseInt(val, 10) : null)
              }
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "month-picker":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value?.toString() || ""}
              onValueChange={(val) =>
                handleFieldChange(field.name, val ? parseInt(val, 10) : null)
              }
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "1", label: "January" },
                  { value: "2", label: "February" },
                  { value: "3", label: "March" },
                  { value: "4", label: "April" },
                  { value: "5", label: "May" },
                  { value: "6", label: "June" },
                  { value: "7", label: "July" },
                  { value: "8", label: "August" },
                  { value: "9", label: "September" },
                  { value: "10", label: "October" },
                  { value: "11", label: "November" },
                  { value: "12", label: "December" },
                ].map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "spending-windows":
        const selectedMonths = (value as number[]) || [];
        const months = [
          { value: 1, label: "Jan" },
          { value: 2, label: "Feb" },
          { value: 3, label: "Mar" },
          { value: 4, label: "Apr" },
          { value: 5, label: "May" },
          { value: 6, label: "Jun" },
          { value: 7, label: "Jul" },
          { value: 8, label: "Aug" },
          { value: 9, label: "Sep" },
          { value: 10, label: "Oct" },
          { value: 11, label: "Nov" },
          { value: 12, label: "Dec" },
        ];

        const toggleMonth = (monthValue: number) => {
          const newMonths = selectedMonths.includes(monthValue)
            ? selectedMonths.filter((m) => m !== monthValue)
            : [...selectedMonths, monthValue].sort((a, b) => a - b);
          handleFieldChange(field.name, newMonths);
        };

        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {months.map((month) => (
                <Button
                  key={month.value}
                  type="button"
                  variant={
                    selectedMonths.includes(month.value) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleMonth(month.value)}
                  className={
                    selectedMonths.includes(month.value)
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  {month.label}
                </Button>
              ))}
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{template.icon}</span>
          <span className="font-medium text-gray-700">{template.name}</span>
        </div>
        <span>
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <Progress value={progressPercent} className="h-2" />

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepConfig.title}</CardTitle>
          {currentStepConfig.description && (
            <p className="text-sm text-gray-500">
              {currentStepConfig.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStepConfig.fields.map(renderField)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {isFirstStep ? "Back to Templates" : "Back"}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {!isLastStep ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Plan
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
