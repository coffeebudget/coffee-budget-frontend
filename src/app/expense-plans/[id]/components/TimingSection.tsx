"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useUpdateExpensePlan } from "@/hooks/useExpensePlans";
import {
  ExpensePlan,
  EXPENSE_PLAN_FREQUENCIES,
  getExpensePlanFrequencyLabel,
  getMonthName,
} from "@/types/expense-plan-types";

// All months for the seasonal selector
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface TimingSectionProps {
  plan: ExpensePlan;
  isEditing: boolean;
}

export function TimingSection({ plan, isEditing }: TimingSectionProps) {
  const updateMutation = useUpdateExpensePlan();
  const [formData, setFormData] = useState({
    frequency: plan.frequency,
    frequencyYears: plan.frequencyYears?.toString() || "",
    dueMonth: plan.dueMonth?.toString() || "",
    dueDay: plan.dueDay?.toString() || "",
    targetDate: plan.targetDate || "",
    seasonalMonths: plan.seasonalMonths || [],
  });

  // Reset form data when plan changes
  useEffect(() => {
    setFormData({
      frequency: plan.frequency,
      frequencyYears: plan.frequencyYears?.toString() || "",
      dueMonth: plan.dueMonth?.toString() || "",
      dueDay: plan.dueDay?.toString() || "",
      targetDate: plan.targetDate || "",
      seasonalMonths: plan.seasonalMonths || [],
    });
  }, [plan.frequency, plan.frequencyYears, plan.dueMonth, plan.dueDay, plan.targetDate, plan.seasonalMonths]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      data: {
        frequency: formData.frequency,
        frequencyYears: formData.frequencyYears ? parseInt(formData.frequencyYears) : null,
        dueMonth: formData.dueMonth ? parseInt(formData.dueMonth) : null,
        dueDay: formData.dueDay ? parseInt(formData.dueDay) : null,
        targetDate: formData.targetDate || null,
        seasonalMonths: formData.seasonalMonths.length > 0 ? formData.seasonalMonths : null,
      },
    });
  };

  const toggleSeasonalMonth = (month: number) => {
    setFormData((prev) => {
      const current = prev.seasonalMonths || [];
      const isSelected = current.includes(month);
      const updated = isSelected
        ? current.filter((m) => m !== month)
        : [...current, month].sort((a, b) => a - b);
      return { ...prev, seasonalMonths: updated };
    });
  };

  const hasChanges =
    formData.frequency !== plan.frequency ||
    (formData.frequencyYears || "") !== (plan.frequencyYears?.toString() || "") ||
    (formData.dueMonth || "") !== (plan.dueMonth?.toString() || "") ||
    (formData.dueDay || "") !== (plan.dueDay?.toString() || "") ||
    (formData.targetDate || "") !== (plan.targetDate || "") ||
    JSON.stringify(formData.seasonalMonths || []) !== JSON.stringify(plan.seasonalMonths || []);

  const formatDueDate = () => {
    if (plan.dueMonth && plan.dueDay) {
      return `${getMonthName(plan.dueMonth)} ${plan.dueDay}`;
    }
    if (plan.dueMonth) {
      return getMonthName(plan.dueMonth);
    }
    return null;
  };

  const formatNextDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Timing</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Frequency</p>
              <p className="text-lg font-semibold">
                {getExpensePlanFrequencyLabel(plan.frequency)}
              </p>
            </div>
            {plan.frequency === "multi_year" && plan.frequencyYears && (
              <div>
                <p className="text-sm text-gray-500">Every</p>
                <p className="text-lg font-semibold">{plan.frequencyYears} years</p>
              </div>
            )}
            {formatDueDate() && (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="text-lg font-semibold">{formatDueDate()}</p>
              </div>
            )}
            {plan.nextDueDate && (
              <div>
                <p className="text-sm text-gray-500">Next Due</p>
                <p className="text-lg font-semibold">
                  {formatNextDueDate(plan.nextDueDate)}
                </p>
              </div>
            )}
            {plan.targetDate && (
              <div>
                <p className="text-sm text-gray-500">Target Date</p>
                <p className="text-lg font-semibold">
                  {new Date(plan.targetDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Seasonal months display */}
          {plan.seasonalMonths && plan.seasonalMonths.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Active Months</p>
              <div className="flex flex-wrap gap-2">
                {plan.seasonalMonths.map((month) => (
                  <span
                    key={month}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {getMonthName(month)}
                  </span>
                ))}
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
          <Calendar className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg">Timing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, frequency: v as typeof plan.frequency }))
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

          {formData.frequency === "multi_year" && (
            <div>
              <Label htmlFor="frequencyYears">Years</Label>
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
                placeholder="e.g., 2"
              />
            </div>
          )}

          <div>
            <Label htmlFor="dueMonth">Due Month</Label>
            <Input
              id="dueMonth"
              type="number"
              min="1"
              max="12"
              value={formData.dueMonth}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueMonth: e.target.value }))
              }
              placeholder="1-12"
            />
          </div>

          <div>
            <Label htmlFor="dueDay">Due Day</Label>
            <Input
              id="dueDay"
              type="number"
              min="1"
              max="31"
              value={formData.dueDay}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDay: e.target.value }))
              }
              placeholder="1-31"
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

        {/* Seasonal months selector */}
        {formData.frequency === "seasonal" && (
          <div className="pt-2">
            <Label className="mb-2 block">Active Months</Label>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {ALL_MONTHS.map((month) => (
                <div key={month} className="flex items-center space-x-2">
                  <Checkbox
                    id={`month-${month}`}
                    checked={(formData.seasonalMonths || []).includes(month)}
                    onCheckedChange={() => toggleSeasonalMonth(month)}
                  />
                  <label
                    htmlFor={`month-${month}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {getMonthName(month)}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Due Date (read-only) */}
        {plan.nextDueDate && (
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Next due: {formatNextDueDate(plan.nextDueDate)}</span>
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFormData({
                  frequency: plan.frequency,
                  frequencyYears: plan.frequencyYears?.toString() || "",
                  dueMonth: plan.dueMonth?.toString() || "",
                  dueDay: plan.dueDay?.toString() || "",
                  targetDate: plan.targetDate || "",
                  seasonalMonths: plan.seasonalMonths || [],
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
