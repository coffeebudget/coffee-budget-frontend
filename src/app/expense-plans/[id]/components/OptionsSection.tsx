"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useUpdateExpensePlan } from "@/hooks/useExpensePlans";
import {
  ExpensePlan,
  EXPENSE_PLAN_STATUSES,
  getExpensePlanStatusLabel,
} from "@/types/expense-plan-types";

interface OptionsSectionProps {
  plan: ExpensePlan;
  isEditing: boolean;
}

export function OptionsSection({ plan, isEditing }: OptionsSectionProps) {
  const updateMutation = useUpdateExpensePlan();
  const [formData, setFormData] = useState({
    status: plan.status,
    autoCalculate: plan.autoCalculate,
    rolloverSurplus: plan.rolloverSurplus,
  });

  // Reset form data when plan changes
  useEffect(() => {
    setFormData({
      status: plan.status,
      autoCalculate: plan.autoCalculate,
      rolloverSurplus: plan.rolloverSurplus,
    });
  }, [plan.status, plan.autoCalculate, plan.rolloverSurplus]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      data: {
        status: formData.status,
        autoCalculate: formData.autoCalculate,
        rolloverSurplus: formData.rolloverSurplus,
      },
    });
  };

  const hasChanges =
    formData.status !== plan.status ||
    formData.autoCalculate !== plan.autoCalculate ||
    formData.rolloverSurplus !== plan.rolloverSurplus;

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold capitalize">
                {getExpensePlanStatusLabel(plan.status)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {plan.autoCalculate ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm text-gray-500">Auto-calculate</p>
                <p className="font-medium">{plan.autoCalculate ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {plan.rolloverSurplus ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm text-gray-500">Rollover Surplus</p>
                <p className="font-medium">{plan.rolloverSurplus ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </div>

          {/* Category info */}
          {plan.category && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Linked Category</p>
              <div className="flex items-center gap-2 mt-1">
                {plan.category.icon && <span>{plan.category.icon}</span>}
                <span className="font-medium">{plan.category.name}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg">Options</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, status: v as typeof plan.status }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_PLAN_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getExpensePlanStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 md:pt-6">
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

          <div className="flex items-center space-x-2 md:pt-6">
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

        {/* Category info (read-only) */}
        {plan.category && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Linked Category:{" "}
              <span className="font-medium">
                {plan.category.icon} {plan.category.name}
              </span>
            </p>
          </div>
        )}

        {hasChanges && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFormData({
                  status: plan.status,
                  autoCalculate: plan.autoCalculate,
                  rolloverSurplus: plan.rolloverSurplus,
                });
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
