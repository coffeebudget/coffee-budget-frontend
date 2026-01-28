"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Loader2 } from "lucide-react";
import { useUpdateExpensePlan } from "@/hooks/useExpensePlans";
import {
  ExpensePlan,
  formatCurrency,
  CONTRIBUTION_SOURCES,
} from "@/types/expense-plan-types";

interface FinancialSectionProps {
  plan: ExpensePlan;
  isEditing: boolean;
}

export function FinancialSection({ plan, isEditing }: FinancialSectionProps) {
  const updateMutation = useUpdateExpensePlan();
  const [formData, setFormData] = useState({
    targetAmount: plan.targetAmount.toString(),
    monthlyContribution: plan.monthlyContribution.toString(),
    contributionSource: plan.contributionSource,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form data when plan changes
  useEffect(() => {
    setFormData({
      targetAmount: plan.targetAmount.toString(),
      monthlyContribution: plan.monthlyContribution.toString(),
      contributionSource: plan.contributionSource,
    });
  }, [plan.targetAmount, plan.monthlyContribution, plan.contributionSource]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const targetAmount = parseFloat(formData.targetAmount);
    const monthlyContribution = parseFloat(formData.monthlyContribution);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }
    if (isNaN(monthlyContribution) || monthlyContribution < 0) {
      newErrors.monthlyContribution = "Monthly contribution must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    await updateMutation.mutateAsync({
      id: plan.id,
      data: {
        targetAmount: parseFloat(formData.targetAmount),
        monthlyContribution: parseFloat(formData.monthlyContribution),
        contributionSource: formData.contributionSource,
      },
    });
  };

  const hasChanges =
    parseFloat(formData.targetAmount) !== plan.targetAmount ||
    parseFloat(formData.monthlyContribution) !== plan.monthlyContribution ||
    formData.contributionSource !== plan.contributionSource;

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Financial</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Target Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(plan.targetAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Contribution</p>
              <p className="text-lg font-semibold">{formatCurrency(plan.monthlyContribution)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contribution Source</p>
              <p className="text-lg font-semibold capitalize">{plan.contributionSource}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg">Financial</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="targetAmount">Target Amount</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))
              }
            />
            {errors.targetAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.targetAmount}</p>
            )}
          </div>
          <div>
            <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
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
            />
            {errors.monthlyContribution && (
              <p className="text-red-500 text-sm mt-1">{errors.monthlyContribution}</p>
            )}
          </div>
          <div>
            <Label htmlFor="contributionSource">Contribution Source</Label>
            <Select
              value={formData.contributionSource}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, contributionSource: v as typeof plan.contributionSource }))
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
        </div>

        {hasChanges && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFormData({
                  targetAmount: plan.targetAmount.toString(),
                  monthlyContribution: plan.monthlyContribution.toString(),
                  contributionSource: plan.contributionSource,
                });
                setErrors({});
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
