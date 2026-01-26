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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wallet, CreditCard, AlertCircle, CheckCircle2, Info, Calculator } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { fetchBankAccounts, fetchCreditCards } from "@/utils/api-client";

interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

interface CreditCardAccount {
  id: number;
  name: string;
  creditLimit: number;
  availableCredit: number;
}
import {
  useCreateExpensePlan,
  useUpdateExpensePlan,
} from "@/hooks/useExpensePlans";
import {
  ExpensePlan,
  CreateExpensePlanDto,
  UpdateExpensePlanDto,
  EXPENSE_PLAN_TYPES,
  EXPENSE_PLAN_PRIORITIES,
  EXPENSE_PLAN_FREQUENCIES,
  EXPENSE_PLAN_STATUSES,
  CONTRIBUTION_SOURCES,
  getExpensePlanTypeLabel,
  getExpensePlanPriorityLabel,
  getExpensePlanFrequencyLabel,
  getExpensePlanStatusLabel,
  getDefaultFormData,
  ExpensePlanFormData,
  ExpensePlanFormErrors,
  PaymentAccountType,
} from "@/types/expense-plan-types";

interface ExpensePlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExpensePlan | null;
  onComplete: () => void;
}

export default function ExpensePlanFormDialog({
  open,
  onOpenChange,
  plan,
  onComplete,
}: ExpensePlanFormDialogProps) {
  const isEditMode = !!plan;
  const createMutation = useCreateExpensePlan();
  const updateMutation = useUpdateExpensePlan();

  const [formData, setFormData] = useState<ExpensePlanFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<ExpensePlanFormErrors>({});

  // Fetch bank accounts for payment source selection
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["bankAccounts"],
    queryFn: fetchBankAccounts,
  });

  // Fetch credit cards for payment source selection
  const { data: creditCards = [] } = useQuery<CreditCardAccount[]>({
    queryKey: ["creditCards"],
    queryFn: fetchCreditCards,
  });

  // Only initialize form when dialog opens - use plan.id to avoid resetting on object reference changes
  useEffect(() => {
    if (!open) return; // Only run when dialog is open

    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || "",
        icon: plan.icon || "",
        planType: plan.planType,
        priority: plan.priority,
        purpose: plan.purpose || "sinking_fund",
        categoryId: plan.categoryId,
        autoTrackCategory: plan.autoTrackCategory,
        targetAmount: plan.targetAmount.toString(),
        monthlyContribution: plan.monthlyContribution.toString(),
        contributionSource: plan.contributionSource,
        frequency: plan.frequency,
        frequencyYears: plan.frequencyYears?.toString() || "",
        dueMonth: plan.dueMonth?.toString() || "",
        dueDay: plan.dueDay?.toString() || "",
        targetDate: plan.targetDate || "",
        seasonalMonths: plan.seasonalMonths || [],
        autoCalculate: plan.autoCalculate,
        rolloverSurplus: plan.rolloverSurplus,
        initialBalanceSource: plan.initialBalanceSource,
        initialBalanceCustom: plan.initialBalanceCustom?.toString() || "",
        paymentAccountType: plan.paymentAccountType,
        paymentAccountId: plan.paymentAccountId,
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, open]); // Use plan?.id instead of plan to avoid resetting on reference changes

  const validate = (): boolean => {
    const newErrors: ExpensePlanFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }

    const monthlyContribution = parseFloat(formData.monthlyContribution);
    if (isNaN(monthlyContribution) || monthlyContribution < 0) {
      newErrors.monthlyContribution = "Monthly contribution must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CreateExpensePlanDto | UpdateExpensePlanDto = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      planType: formData.planType,
      priority: formData.priority,
      categoryId: formData.categoryId || undefined,
      autoTrackCategory: formData.autoTrackCategory,
      targetAmount: parseFloat(formData.targetAmount),
      monthlyContribution: parseFloat(formData.monthlyContribution),
      contributionSource: formData.contributionSource,
      frequency: formData.frequency,
      frequencyYears: formData.frequencyYears ? parseInt(formData.frequencyYears) : undefined,
      dueMonth: formData.dueMonth ? parseInt(formData.dueMonth) : undefined,
      dueDay: formData.dueDay ? parseInt(formData.dueDay) : undefined,
      targetDate: formData.targetDate || undefined,
      seasonalMonths: formData.seasonalMonths.length > 0 ? formData.seasonalMonths : undefined,
      autoCalculate: formData.autoCalculate,
      rolloverSurplus: formData.rolloverSurplus,
      paymentAccountType: formData.paymentAccountType || undefined,
      paymentAccountId: formData.paymentAccountId || undefined,
    };

    try {
      if (isEditMode && plan) {
        await updateMutation.mutateAsync({ id: plan.id, data: data as UpdateExpensePlanDto });
      } else {
        const createData = {
          ...data,
          initialBalanceSource: formData.initialBalanceSource,
          initialBalanceCustom: formData.initialBalanceCustom
            ? parseFloat(formData.initialBalanceCustom)
            : undefined,
        } as CreateExpensePlanDto;
        await createMutation.mutateAsync(createData);
      }
      onComplete();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Expense Plan" : "Create Expense Plan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Car Insurance"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon (emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  placeholder="e.g., 🚗"
                  maxLength={4}
                />
              </div>

              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select
                  value={formData.planType}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, planType: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PLAN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getExpensePlanTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, priority: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PLAN_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {getExpensePlanPriorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, frequency: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PLAN_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {getExpensePlanFrequencyLabel(freq)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Financial</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAmount">Target Amount *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))
                  }
                  placeholder="0.00"
                />
                {errors.targetAmount && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetAmount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="monthlyContribution">Monthly Contribution *</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyContribution}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyContribution: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
                {errors.monthlyContribution && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.monthlyContribution}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contributionSource">Contribution Source</Label>
                <Select
                  value={formData.contributionSource}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, contributionSource: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRIBUTION_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Account Selection with Prompt */}
              <div className="md:col-span-2">
                <div className={`p-4 rounded-lg border ${
                  formData.paymentAccountId
                    ? "border-green-200 bg-green-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    {formData.paymentAccountId ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <Label htmlFor="paymentAccount" className="text-base font-medium">
                        {formData.paymentAccountId ? "Payment Account" : "Assign a Payment Account"}
                      </Label>
                      <p className={`text-sm mt-0.5 ${
                        formData.paymentAccountId ? "text-green-700" : "text-yellow-700"
                      }`}>
                        {formData.paymentAccountId
                          ? "This expense will be tracked for coverage monitoring"
                          : "Link to a bank account or credit card to enable coverage tracking and allocation by account"}
                      </p>
                    </div>
                  </div>

                  <Select
                    value={
                      formData.paymentAccountId && formData.paymentAccountType
                        ? `${formData.paymentAccountType}:${formData.paymentAccountId}`
                        : "none"
                    }
                    onValueChange={(v) => {
                      if (v === "none") {
                        setFormData((prev) => ({
                          ...prev,
                          paymentAccountType: null,
                          paymentAccountId: null,
                        }));
                      } else {
                        const [type, id] = v.split(":");
                        setFormData((prev) => ({
                          ...prev,
                          paymentAccountType: type as PaymentAccountType,
                          paymentAccountId: parseInt(id),
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select payment account..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-500">No account selected</span>
                      </SelectItem>
                      {/* Bank Accounts */}
                      {bankAccounts.length > 0 && (
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                          Bank Accounts
                        </div>
                      )}
                      {bankAccounts.map((account) => (
                        <SelectItem key={`bank_account:${account.id}`} value={`bank_account:${account.id}`}>
                          <span className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            <span>{account.name}</span>
                            <span className="text-gray-500 ml-2">
                              ({new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "EUR",
                              }).format(Math.abs(account.balance))})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                      {/* Credit Cards */}
                      {creditCards.length > 0 && (
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                          Credit Cards
                        </div>
                      )}
                      {creditCards.map((card) => (
                        <SelectItem key={`credit_card:${card.id}`} value={`credit_card:${card.id}`}>
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-600" />
                            <span>{card.name}</span>
                            <span className="text-gray-500 ml-2">
                              ({new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "EUR",
                              }).format(card.availableCredit)} available)
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Timing (simplified) */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Timing</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dueMonth">Due Month (1-12)</Label>
                <Input
                  id="dueMonth"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.dueMonth}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueMonth: e.target.value }))
                  }
                  placeholder="e.g., 6"
                />
              </div>

              <div>
                <Label htmlFor="dueDay">Due Day (1-31)</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueDay: e.target.value }))
                  }
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Multi-Year Plan Guidance */}
            {formData.frequency === "multi_year" && (
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 space-y-4">
                <div className="flex items-start gap-3">
                  <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blue-900">Multi-Year Expense Configuration</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              For irregular expenses (e.g., car tires every 2-3 years), set the frequency in years.
                              Use the average interval for balanced savings, or the shortest interval for a conservative approach.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-blue-700">
                      Set how many years between each expense occurrence to calculate your monthly savings rate.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="frequencyYears" className="text-blue-900">Frequency (years)</Label>
                  <Input
                    id="frequencyYears"
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={formData.frequencyYears}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, frequencyYears: e.target.value }))
                    }
                    placeholder="e.g., 2.5 for every 2.5 years"
                    className="mt-1 bg-white"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Tip: For variable intervals (e.g., 2-3 years), use the average (2.5) or the shorter interval (2) for conservative planning.
                  </p>
                </div>

                {/* Calculation Preview */}
                {formData.frequencyYears && parseFloat(formData.frequencyYears) > 0 && formData.targetAmount && parseFloat(formData.targetAmount) > 0 && (
                  <div className="p-3 rounded-md bg-white border border-blue-200">
                    <div className="text-sm text-blue-900">
                      <span className="font-medium">Calculation Preview:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Total target:</span>
                        <span className="ml-2 font-medium">
                          {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(parseFloat(formData.targetAmount))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Every:</span>
                        <span className="ml-2 font-medium">{formData.frequencyYears} years</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Months to save:</span>
                        <span className="ml-2 font-medium">{Math.round(parseFloat(formData.frequencyYears) * 12)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Monthly contribution:</span>
                        <span className="ml-2 font-medium text-blue-700">
                          {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
                            parseFloat(formData.targetAmount) / (parseFloat(formData.frequencyYears) * 12)
                          )}
                        </span>
                      </div>
                    </div>
                    {formData.autoCalculate && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Auto-calculate is enabled - monthly contribution will be calculated automatically
                      </p>
                    )}
                    {!formData.autoCalculate && parseFloat(formData.monthlyContribution) !== parseFloat(formData.targetAmount) / (parseFloat(formData.frequencyYears) * 12) && (
                      <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Your current monthly contribution differs from the calculated amount. Enable auto-calculate or update manually.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Options</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoCalculate"
                  checked={formData.autoCalculate}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      autoCalculate: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="autoCalculate" className="font-normal">
                  Auto-calculate monthly contribution
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rolloverSurplus"
                  checked={formData.rolloverSurplus}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      rolloverSurplus: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="rolloverSurplus" className="font-normal">
                  Rollover surplus to next period
                </Label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
