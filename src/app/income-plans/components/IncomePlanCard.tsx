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
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpCircle,
} from "lucide-react";
import {
  IncomePlan,
  getReliabilityLabel,
  getReliabilityColor,
  getReliabilityIcon,
  getStatusLabel,
  getStatusColor,
  getEntryStatusLabel,
  getEntryStatusColor,
  formatCurrency,
  getAnnualTotal,
  getMonthlyAverage,
  getCurrentMonthAmount,
  MONTH_LABELS,
  MonthName,
  MONTH_NAMES,
  IncomePlanEntryStatus,
} from "@/types/income-plan-types";
import { useIncomePlanTrackingSummary } from "@/hooks/useIncomePlans";

interface IncomePlanCardProps {
  plan: IncomePlan;
  onEdit: (plan: IncomePlan) => void;
  onDelete: (id: number) => void;
}

// Get tracking status icon component
function getTrackingStatusIcon(status: IncomePlanEntryStatus) {
  switch (status) {
    case 'received':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'exceeded':
      return <ArrowUpCircle className="h-4 w-4" />;
    case 'partial':
      return <AlertCircle className="h-4 w-4" />;
    case 'pending':
    default:
      return <Clock className="h-4 w-4" />;
  }
}

// Get background color for current month section based on status
function getTrackingSectionStyle(status: IncomePlanEntryStatus | undefined) {
  switch (status) {
    case 'received':
      return 'bg-green-50 border-green-200';
    case 'exceeded':
      return 'bg-blue-50 border-blue-200';
    case 'partial':
      return 'bg-yellow-50 border-yellow-200';
    case 'pending':
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

// Get text color for current month section based on status
function getTrackingTextStyle(status: IncomePlanEntryStatus | undefined) {
  switch (status) {
    case 'received':
      return { label: 'text-green-700', value: 'text-green-800' };
    case 'exceeded':
      return { label: 'text-blue-700', value: 'text-blue-800' };
    case 'partial':
      return { label: 'text-yellow-700', value: 'text-yellow-800' };
    case 'pending':
    default:
      return { label: 'text-gray-600', value: 'text-gray-800' };
  }
}

export default function IncomePlanCard({
  plan,
  onEdit,
  onDelete,
}: IncomePlanCardProps) {
  const annualTotal = getAnnualTotal(plan);
  const monthlyAverage = getMonthlyAverage(plan);
  const currentMonthAmount = getCurrentMonthAmount(plan);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIndex];

  // Fetch current month tracking status (month is 1-indexed for API)
  const { data: trackingStatus, isLoading: isTrackingLoading } = useIncomePlanTrackingSummary(
    plan.id,
    currentYear,
    currentMonthIndex + 1
  );

  // Find months with different amounts for display
  const uniqueAmounts = new Set(MONTH_NAMES.map(m => plan[m as MonthName]));
  const hasVariableAmounts = uniqueAmounts.size > 1;

  // Tracking display values
  const actualAmount = trackingStatus?.actualAmount ?? 0;
  const expectedAmount = trackingStatus?.expectedAmount ?? currentMonthAmount;
  const status = trackingStatus?.status ?? 'pending';
  const hasTracking = trackingStatus?.hasEntry ?? false;
  const percentageReceived = trackingStatus?.percentageReceived ?? 0;

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
          {/* Tracking Status Badge */}
          {!isTrackingLoading && (
            <Badge variant="outline" className={getEntryStatusColor(status)}>
              {getTrackingStatusIcon(status)}
              <span className="ml-1">{getEntryStatusLabel(status)}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Current Month Tracking Status */}
        <div className={`mb-4 p-3 border rounded-lg ${getTrackingSectionStyle(status)}`}>
          {/* Header with month and status */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${getTrackingTextStyle(status).label}`}>
              <Calendar className="h-4 w-4 inline mr-1" />
              {MONTH_LABELS[currentMonthName]}
            </span>
            {!isTrackingLoading && hasTracking && (
              <span className={`text-xs ${getTrackingTextStyle(status).label}`}>
                {percentageReceived.toFixed(0)}% received
              </span>
            )}
          </div>

          {/* Expected vs Received */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${getTrackingTextStyle(status).label}`}>
                Expected
              </span>
              <span className={`font-medium ${getTrackingTextStyle(status).value}`}>
                {formatCurrency(expectedAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${getTrackingTextStyle(status).label}`}>
                Received
              </span>
              <span className={`font-bold ${getTrackingTextStyle(status).value}`}>
                {isTrackingLoading ? '...' : formatCurrency(actualAmount)}
              </span>
            </div>
            {/* Difference indicator */}
            {!isTrackingLoading && hasTracking && actualAmount !== expectedAmount && (
              <div className="flex items-center justify-between pt-1 border-t border-current/10">
                <span className={`text-xs ${getTrackingTextStyle(status).label}`}>
                  Difference
                </span>
                <span className={`text-sm font-medium ${
                  actualAmount > expectedAmount ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {actualAmount > expectedAmount ? '+' : ''}{formatCurrency(actualAmount - expectedAmount)}
                </span>
              </div>
            )}
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
