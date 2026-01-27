"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  IncomePlan,
  getReliabilityLabel,
  getReliabilityColor,
  getReliabilityIcon,
  getStatusLabel,
  getStatusColor,
  formatCurrency,
  getAnnualTotal,
  getMonthlyAverage,
  getCurrentMonthAmount,
  MONTH_LABELS,
  MonthName,
  MONTH_NAMES,
} from "@/types/income-plan-types";

interface IncomePlanCardProps {
  plan: IncomePlan;
  onEdit: (plan: IncomePlan) => void;
  onDelete: (id: number) => void;
}

export default function IncomePlanCard({
  plan,
  onEdit,
  onDelete,
}: IncomePlanCardProps) {
  const annualTotal = getAnnualTotal(plan);
  const monthlyAverage = getMonthlyAverage(plan);
  const currentMonthAmount = getCurrentMonthAmount(plan);
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIndex];

  // Find months with different amounts for display
  const uniqueAmounts = new Set(MONTH_NAMES.map(m => plan[m as MonthName]));
  const hasVariableAmounts = uniqueAmounts.size > 1;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {plan.icon && <span className="text-2xl">{plan.icon}</span>}
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {plan.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(plan.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className={getReliabilityColor(plan.reliability)}>
            {getReliabilityIcon(plan.reliability)} {getReliabilityLabel(plan.reliability)}
          </Badge>
          <Badge variant="outline" className={getStatusColor(plan.status)}>
            {getStatusLabel(plan.status)}
          </Badge>
          {hasVariableAmounts && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Variable
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Current Month Highlight */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">
              <Calendar className="h-4 w-4 inline mr-1" />
              {MONTH_LABELS[currentMonthName]} Expected
            </span>
            <span className="font-bold text-green-800">
              {formatCurrency(currentMonthAmount)}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Annual Total</span>
            <span className="font-medium">{formatCurrency(annualTotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Monthly Average</span>
            <span className="font-medium">{formatCurrency(monthlyAverage)}</span>
          </div>

          {plan.expectedDay && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Expected Day</span>
              <span>Day {plan.expectedDay}</span>
            </div>
          )}

          {plan.category && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Category</span>
              <span className="flex items-center gap-1">
                {plan.category.icon && <span>{plan.category.icon}</span>}
                {plan.category.name}
              </span>
            </div>
          )}

          {plan.paymentAccount && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Deposit Account</span>
              <span>{plan.paymentAccount.name}</span>
            </div>
          )}
        </div>

        {/* Variable Amounts Preview (show if amounts vary) */}
        {hasVariableAmounts && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">Monthly Amounts</p>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {MONTH_NAMES.map((month) => (
                <div
                  key={month}
                  className={`text-center p-1 rounded ${
                    month === currentMonthName
                      ? "bg-green-100 text-green-800 font-medium"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="font-medium">{MONTH_LABELS[month]}</div>
                  <div>{formatCurrency(Number(plan[month]))}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
