"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, ArrowRight } from "lucide-react";
import {
  MONTH_NAMES,
  MONTH_LABELS,
  MonthName,
  MonthlyAmounts,
  formatCurrency,
} from "@/types/income-plan-types";

interface MonthlyCalendarInputProps {
  values: MonthlyAmounts;
  onChange: (values: MonthlyAmounts) => void;
  errors?: Partial<Record<MonthName, string>>;
}

export default function MonthlyCalendarInput({
  values,
  onChange,
  errors,
}: MonthlyCalendarInputProps) {
  const handleMonthChange = (month: MonthName, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    onChange({
      ...values,
      [month]: isNaN(numValue) ? 0 : numValue,
    });
  };

  // Calculate totals
  const total = Object.values(values).reduce((sum, val) => sum + val, 0);
  const average = total / 12;

  // Copy value to all months
  const copyToAll = (sourceMonth: MonthName) => {
    const sourceValue = values[sourceMonth];
    const newValues = {} as MonthlyAmounts;
    for (const month of MONTH_NAMES) {
      newValues[month] = sourceValue;
    }
    onChange(newValues);
  };

  // Copy value to remaining months (from source month onwards)
  const copyToRemaining = (sourceMonth: MonthName) => {
    const sourceValue = values[sourceMonth];
    const sourceIndex = MONTH_NAMES.indexOf(sourceMonth);
    const newValues = { ...values };
    for (let i = sourceIndex + 1; i < MONTH_NAMES.length; i++) {
      newValues[MONTH_NAMES[i]] = sourceValue;
    }
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="text-sm">
          <span className="text-gray-500">Annual Total:</span>
          <span className="ml-2 font-semibold text-green-600">
            {formatCurrency(total)}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Monthly Average:</span>
          <span className="ml-2 font-semibold text-blue-600">
            {formatCurrency(average)}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {MONTH_NAMES.map((month, index) => (
          <div key={month} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`month-${month}`}
                className="text-sm font-medium text-gray-700"
              >
                {MONTH_LABELS[month]}
              </Label>
              <div className="flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => copyToAll(month)}
                  title="Copy to all months"
                >
                  <Copy className="h-3 w-3 text-gray-400" />
                </Button>
                {index < 11 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => copyToRemaining(month)}
                    title="Copy to remaining months"
                  >
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </Button>
                )}
              </div>
            </div>
            <Input
              id={`month-${month}`}
              type="number"
              step="0.01"
              min="0"
              value={values[month] || ""}
              onChange={(e) => handleMonthChange(month, e.target.value)}
              placeholder="0.00"
              className={`text-right ${errors?.[month] ? "border-red-500" : ""}`}
            />
            {errors?.[month] && (
              <p className="text-red-500 text-xs">{errors[month]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newValues = {} as MonthlyAmounts;
            for (const month of MONTH_NAMES) {
              newValues[month] = 0;
            }
            onChange(newValues);
          }}
        >
          Clear All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const firstValue = values.january;
            if (firstValue > 0) {
              const newValues = {} as MonthlyAmounts;
              for (const month of MONTH_NAMES) {
                newValues[month] = firstValue;
              }
              onChange(newValues);
            }
          }}
        >
          Copy January to All
        </Button>
      </div>
    </div>
  );
}
