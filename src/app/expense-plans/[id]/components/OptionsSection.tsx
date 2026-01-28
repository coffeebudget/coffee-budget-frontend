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
import { Settings, Loader2, CheckCircle2, XCircle, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useUpdateExpensePlan } from "@/hooks/useExpensePlans";
import { fetchCategories } from "@/utils/api";
import {
  ExpensePlan,
  EXPENSE_PLAN_STATUSES,
  getExpensePlanStatusLabel,
} from "@/types/expense-plan-types";

interface Category {
  id: number;
  name: string;
  icon?: string | null;
}

interface OptionsSectionProps {
  plan: ExpensePlan;
  isEditing: boolean;
}

export function OptionsSection({ plan, isEditing }: OptionsSectionProps) {
  const { data: session } = useSession();
  const updateMutation = useUpdateExpensePlan();
  const [formData, setFormData] = useState({
    status: plan.status,
    autoCalculate: plan.autoCalculate,
    rolloverSurplus: plan.rolloverSurplus,
    categoryId: plan.categoryId,
    autoTrackCategory: plan.autoTrackCategory,
  });

  // Fetch categories for selection
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(session!.user!.accessToken as string),
    enabled: !!session && isEditing,
  });

  // Reset form data when plan changes
  useEffect(() => {
    setFormData({
      status: plan.status,
      autoCalculate: plan.autoCalculate,
      rolloverSurplus: plan.rolloverSurplus,
      categoryId: plan.categoryId,
      autoTrackCategory: plan.autoTrackCategory,
    });
  }, [plan.status, plan.autoCalculate, plan.rolloverSurplus, plan.categoryId, plan.autoTrackCategory]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      data: {
        status: formData.status,
        autoCalculate: formData.autoCalculate,
        rolloverSurplus: formData.rolloverSurplus,
        categoryId: formData.categoryId || undefined,
        autoTrackCategory: formData.autoTrackCategory,
      },
    });
  };

  const hasChanges =
    formData.status !== plan.status ||
    formData.autoCalculate !== plan.autoCalculate ||
    formData.rolloverSurplus !== plan.rolloverSurplus ||
    formData.categoryId !== plan.categoryId ||
    formData.autoTrackCategory !== plan.autoTrackCategory;

  // Get selected category for display
  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

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
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-500">Category</p>
            </div>
            {plan.category ? (
              <div className="flex items-center gap-2">
                {plan.category.icon && <span>{plan.category.icon}</span>}
                <span className="font-medium">{plan.category.name}</span>
                {plan.autoTrackCategory && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Auto-track
                  </span>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">No category linked</p>
            )}
          </div>
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

        {/* Category selection */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId?.toString() || "none"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: v === "none" ? null : parseInt(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No category</span>
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <span className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Link a category to enable transaction tracking and suggestions
              </p>
            </div>

            <div className="flex items-center space-x-2 md:pt-6">
              <Checkbox
                id="autoTrackCategory"
                checked={formData.autoTrackCategory}
                disabled={!formData.categoryId}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    autoTrackCategory: checked as boolean,
                  }))
                }
              />
              <Label
                htmlFor="autoTrackCategory"
                className={`font-normal ${!formData.categoryId ? "text-gray-400" : ""}`}
              >
                Auto-track transactions in this category
              </Label>
            </div>
          </div>

          {selectedCategory && formData.autoTrackCategory && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Transactions categorized as &quot;{selectedCategory.icon} {selectedCategory.name}&quot;
                will be automatically tracked against this expense plan.
              </p>
            </div>
          )}
        </div>

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
                  categoryId: plan.categoryId,
                  autoTrackCategory: plan.autoTrackCategory,
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
