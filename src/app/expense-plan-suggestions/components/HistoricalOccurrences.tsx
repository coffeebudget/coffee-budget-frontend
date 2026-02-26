'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/types/expense-plan-suggestion-types';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

interface HistoricalOccurrencesProps {
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
  nextExpectedDate: string;
  averageAmount: number;
  amountRange?: { min: number; max: number };
  className?: string;
}

export function HistoricalOccurrences({
  occurrenceCount,
  firstOccurrence,
  lastOccurrence,
  nextExpectedDate,
  averageAmount,
  amountRange,
  className,
}: HistoricalOccurrencesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilNext = () => {
    const today = new Date();
    const nextDate = new Date(nextExpectedDate);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilNext = getDaysUntilNext();

  return (
    <div className={cn('space-y-3', className)}>
      {/* Occurrence count and date range */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{occurrenceCount}</span>{' '}
          occurrences from {formatDate(firstOccurrence)} to{' '}
          {formatDate(lastOccurrence)}
        </span>
      </div>

      {/* Amount range if available */}
      {amountRange && amountRange.min !== amountRange.max && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">
            Amount range: {formatCurrency(amountRange.min)} -{' '}
            {formatCurrency(amountRange.max)}
          </span>
        </div>
      )}

      {/* Next expected date */}
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span className="text-gray-600">
          Next expected:{' '}
          <span className="font-semibold text-gray-900">
            {formatFullDate(nextExpectedDate)}
          </span>
          {daysUntilNext > 0 && (
            <span className="text-blue-600 ml-1">
              ({daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''} away)
            </span>
          )}
          {daysUntilNext <= 0 && daysUntilNext >= -7 && (
            <span className="text-orange-600 ml-1">(overdue)</span>
          )}
        </span>
      </div>
    </div>
  );
}

export function HistoricalOccurrencesCompact({
  occurrenceCount,
  firstOccurrence,
  lastOccurrence,
  className,
}: Pick<
  HistoricalOccurrencesProps,
  'occurrenceCount' | 'firstOccurrence' | 'lastOccurrence' | 'className'
>) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    });
  };

  return (
    <div className={cn('text-xs text-gray-500', className)}>
      {occurrenceCount} occurrences ({formatDate(firstOccurrence)} -{' '}
      {formatDate(lastOccurrence)})
    </div>
  );
}
