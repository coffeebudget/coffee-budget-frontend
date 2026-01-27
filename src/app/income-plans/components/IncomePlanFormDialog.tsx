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
import { Loader2, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBankAccounts } from "@/utils/api-client";
import {
  useCreateIncomePlan,
  useUpdateIncomePlan,
} from "@/hooks/useIncomePlans";
import {
  IncomePlan,
  IncomePlanFormData,
  IncomePlanFormErrors,
  MonthlyAmounts,
  INCOME_PLAN_RELIABILITIES,
  INCOME_PLAN_STATUSES,
  getReliabilityLabel,
  getReliabilityDescription,
  getStatusLabel,
  getDefaultFormData,
  incomePlanToFormData,
  formDataToCreateDto,
  formDataToUpdateDto,
} from "@/types/income-plan-types";
import MonthlyCalendarInput from "./MonthlyCalendarInput";

interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

interface IncomePlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: IncomePlan | null;
  onComplete: () => void;
}

export default function IncomePlanFormDialog({
  open,
  onOpenChange,
  plan,
  onComplete,
}: IncomePlanFormDialogProps) {
  const isEditMode = !!plan;
  const createMutation = useCreateIncomePlan();
  const updateMutation = useUpdateIncomePlan();

  const [formData, setFormData] = useState<IncomePlanFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<IncomePlanFormErrors>({});

  // Fetch bank accounts for deposit account selection
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["bankAccounts"],
    queryFn: fetchBankAccounts,
  });

  // Initialize form when dialog opens - use plan.id to avoid resetting on object reference changes
  useEffect(() => {
    if (!open) return;

    if (plan) {
      setFormData(incomePlanToFormData(plan));
    } else {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, open]);

  const validate = (): boolean => {
    const newErrors: IncomePlanFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate expected day if provided
    if (formData.expectedDay !== null) {
      if (formData.expectedDay < 1 || formData.expectedDay > 31) {
        newErrors.expectedDay = "Day must be between 1 and 31";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditMode && plan) {
        const data = formDataToUpdateDto(formData);
        await updateMutation.mutateAsync({ id: plan.id, data });
      } else {
        const data = formDataToCreateDto(formData);
        await createMutation.mutateAsync(data);
      }
      onComplete();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const handleMonthlyAmountsChange = (amounts: MonthlyAmounts) => {
    setFormData((prev) => ({
      ...prev,
      ...amounts,
    }));
  };

  const getMonthlyAmounts = (): MonthlyAmounts => ({
    january: formData.january,
    february: formData.february,
    march: formData.march,
    april: formData.april,
    may: formData.may,
    june: formData.june,
    july: formData.july,
    august: formData.august,
    september: formData.september,
    october: formData.october,
    november: formData.november,
    december: formData.december,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Income Plan" : "Create Income Plan"}
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
                  placeholder="e.g., Stipendio Alessandro"
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
                  placeholder="e.g., 💼"
                  maxLength={4}
                />
              </div>

              <div>
                <Label htmlFor="reliability">Reliability</Label>
                <Select
                  value={formData.reliability}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, reliability: v as typeof formData.reliability }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_PLAN_RELIABILITIES.map((rel) => (
                      <SelectItem key={rel} value={rel}>
                        <div className="flex flex-col">
                          <span>{getReliabilityLabel(rel)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {getReliabilityDescription(formData.reliability)}
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, status: v as typeof formData.status }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_PLAN_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectedDay">Expected Day of Month</Label>
                <Input
                  id="expectedDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.expectedDay ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedDay: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g., 27"
                />
                {errors.expectedDay && (
                  <p className="text-red-500 text-sm mt-1">{errors.expectedDay}</p>
                )}
              </div>
            </div>
          </div>

          {/* Deposit Account */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Deposit Account</h3>

            <div>
              <Label htmlFor="paymentAccountId">Account</Label>
              <Select
                value={formData.paymentAccountId?.toString() ?? "none"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentAccountId: v === "none" ? null : parseInt(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No account selected</span>
                  </SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span>{account.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                The bank account where this income is typically deposited
              </p>
            </div>
          </div>

          {/* Monthly Calendar */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Monthly Amounts</h3>
            <p className="text-sm text-gray-500">
              Enter the expected income amount for each month. Use the copy buttons to quickly fill similar months.
            </p>
            <MonthlyCalendarInput
              values={getMonthlyAmounts()}
              onChange={handleMonthlyAmountsChange}
              errors={{
                january: errors.january,
                february: errors.february,
                march: errors.march,
                april: errors.april,
                may: errors.may,
                june: errors.june,
                july: errors.july,
                august: errors.august,
                september: errors.september,
                october: errors.october,
                november: errors.november,
                december: errors.december,
              }}
            />
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
