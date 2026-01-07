'use client';

import { cn } from '@/lib/utils';
import {
  FrequencyType,
  getFrequencyLabel,
  formatCurrency,
} from '@/types/expense-plan-suggestion-types';
import { ArrowRight, Calendar, PiggyBank, TrendingUp } from 'lucide-react';

interface MonthlyBreakdownProps {
  averageAmount: number;
  monthlyContribution: number;
  yearlyTotal: number;
  frequencyType: FrequencyType;
  className?: string;
}

export function MonthlyBreakdown({
  averageAmount,
  monthlyContribution,
  yearlyTotal,
  frequencyType,
  className,
}: MonthlyBreakdownProps) {
  const isMonthly = frequencyType === FrequencyType.MONTHLY;
  const frequencyLabel = getFrequencyLabel(frequencyType);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main breakdown */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">{frequencyLabel} Cost</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(averageAmount)}
            </p>
          </div>
        </div>

        {!isMonthly && (
          <>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Monthly Saving</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(monthlyContribution)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Yearly total */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm text-gray-500">Yearly Total</p>
        </div>
        <p className="font-semibold text-blue-600">
          {formatCurrency(yearlyTotal)}
        </p>
      </div>

      {/* Explanation for non-monthly */}
      {!isMonthly && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-md p-2">
          Save {formatCurrency(monthlyContribution)} each month to cover your{' '}
          {frequencyLabel.toLowerCase()} expense of {formatCurrency(averageAmount)}
        </p>
      )}
    </div>
  );
}

export function MonthlyBreakdownCompact({
  averageAmount,
  monthlyContribution,
  frequencyType,
  className,
}: Omit<MonthlyBreakdownProps, 'yearlyTotal'>) {
  const isMonthly = frequencyType === FrequencyType.MONTHLY;
  const frequencyLabel = getFrequencyLabel(frequencyType);

  return (
    <div className={cn('text-sm', className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-gray-900">
          {formatCurrency(monthlyContribution)}
        </span>
        <span className="text-gray-500">/month</span>
      </div>
      {!isMonthly && (
        <p className="text-xs text-gray-500">
          {formatCurrency(averageAmount)} every {frequencyLabel.toLowerCase().replace('every ', '')}
        </p>
      )}
    </div>
  );
}
