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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useCreateIncomeDistributionRule,
  useUpdateIncomeDistributionRule,
} from "@/hooks/useIncomeDistribution";
import {
  IncomeDistributionRule,
  CreateIncomeDistributionRuleDto,
  UpdateIncomeDistributionRuleDto,
  DistributionStrategy,
  DISTRIBUTION_STRATEGIES,
  getDistributionStrategyLabel,
  getDistributionStrategyDescription,
} from "@/types/expense-plan-types";

interface IncomeDistributionRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: IncomeDistributionRule | null;
  onComplete: () => void;
}

interface FormData {
  name: string;
  expectedAmount: string;
  amountTolerance: string;
  descriptionPattern: string;
  autoDistribute: boolean;
  distributionStrategy: DistributionStrategy;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  expectedAmount?: string;
  amountTolerance?: string;
}

const getDefaultFormData = (): FormData => ({
  name: "",
  expectedAmount: "",
  amountTolerance: "10",
  descriptionPattern: "",
  autoDistribute: true,
  distributionStrategy: "priority",
  isActive: true,
});

export default function IncomeDistributionRuleDialog({
  open,
  onOpenChange,
  rule,
  onComplete,
}: IncomeDistributionRuleDialogProps) {
  const isEditMode = !!rule;
  const createMutation = useCreateIncomeDistributionRule();
  const updateMutation = useUpdateIncomeDistributionRule();

  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        expectedAmount: rule.expectedAmount?.toString() || "",
        amountTolerance: rule.amountTolerance.toString(),
        descriptionPattern: rule.descriptionPattern || "",
        autoDistribute: rule.autoDistribute,
        distributionStrategy: rule.distributionStrategy,
        isActive: rule.isActive,
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  }, [rule, open]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // At least one detection criterion should be set
    if (!formData.expectedAmount && !formData.descriptionPattern) {
      newErrors.expectedAmount = "Enter amount or description pattern";
    }

    if (formData.expectedAmount) {
      const amount = parseFloat(formData.expectedAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.expectedAmount = "Amount must be greater than 0";
      }
    }

    const tolerance = parseFloat(formData.amountTolerance);
    if (isNaN(tolerance) || tolerance < 0 || tolerance > 100) {
      newErrors.amountTolerance = "Tolerance must be 0-100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditMode && rule) {
        const data: UpdateIncomeDistributionRuleDto = {
          name: formData.name.trim(),
          expectedAmount: formData.expectedAmount
            ? parseFloat(formData.expectedAmount)
            : null,
          amountTolerance: parseFloat(formData.amountTolerance),
          descriptionPattern: formData.descriptionPattern.trim() || null,
          autoDistribute: formData.autoDistribute,
          distributionStrategy: formData.distributionStrategy,
          isActive: formData.isActive,
        };
        await updateMutation.mutateAsync({ id: rule.id, data });
      } else {
        const data: CreateIncomeDistributionRuleDto = {
          name: formData.name.trim(),
          expectedAmount: formData.expectedAmount
            ? parseFloat(formData.expectedAmount)
            : undefined,
          amountTolerance: parseFloat(formData.amountTolerance),
          descriptionPattern: formData.descriptionPattern.trim() || undefined,
          autoDistribute: formData.autoDistribute,
          distributionStrategy: formData.distributionStrategy,
        };
        await createMutation.mutateAsync(data);
      }
      onComplete();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Distribution Rule" : "Create Distribution Rule"}
          </DialogTitle>
          <DialogDescription>
            Define how to detect income and distribute it to your expense plans.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rule Name */}
          <div>
            <Label htmlFor="name">Rule Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Monthly Salary"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Detection Criteria */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 text-sm">
              Income Detection (at least one)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expectedAmount">Expected Amount</Label>
                <Input
                  id="expectedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.expectedAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedAmount: e.target.value,
                    }))
                  }
                  placeholder="e.g., 3000"
                />
                {errors.expectedAmount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expectedAmount}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="amountTolerance">Tolerance (%)</Label>
                <Input
                  id="amountTolerance"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.amountTolerance}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amountTolerance: e.target.value,
                    }))
                  }
                  placeholder="e.g., 10"
                />
                {errors.amountTolerance && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.amountTolerance}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="descriptionPattern">Description Pattern</Label>
              <Input
                id="descriptionPattern"
                value={formData.descriptionPattern}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descriptionPattern: e.target.value,
                  }))
                }
                placeholder="e.g., SALARY, PAYROLL, Employer Name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Transaction description must contain this text
              </p>
            </div>
          </div>

          {/* Distribution Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 text-sm">
              Distribution Settings
            </h3>

            <div>
              <Label htmlFor="distributionStrategy">Strategy</Label>
              <Select
                value={formData.distributionStrategy}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    distributionStrategy: v as DistributionStrategy,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTRIBUTION_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      {getDistributionStrategyLabel(strategy)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {getDistributionStrategyDescription(formData.distributionStrategy)}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoDistribute"
                checked={formData.autoDistribute}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    autoDistribute: checked as boolean,
                  }))
                }
              />
              <Label htmlFor="autoDistribute" className="font-normal">
                Automatically distribute when income is detected
              </Label>
            </div>

            {isEditMode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="isActive" className="font-normal">
                  Rule is active
                </Label>
              </div>
            )}
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
