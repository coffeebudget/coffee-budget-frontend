'use client';

import { cn } from '@/lib/utils';
import {
  ExpensePlanSuggestion,
  getExpenseTypeLabel,
  getExpenseTypeIcon,
  getStatusLabel,
  getStatusColor,
  getSuggestedPurposeLabel,
  getSuggestedPurposeIcon,
  getSuggestedPurposeColor,
} from '@/types/expense-plan-suggestion-types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useState } from 'react';
import { ConfidenceBadge } from './ConfidenceIndicator';
import { MonthlyBreakdownCompact } from './MonthlyBreakdown';
import { HistoricalOccurrencesCompact } from './HistoricalOccurrences';

interface SuggestionCardProps {
  suggestion: ExpensePlanSuggestion;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onSelect?: (id: number, selected: boolean) => void;
  isSelected?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
  onSelect,
  isSelected = false,
  isLoading = false,
  className,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = suggestion.status === 'pending';

  const displayName = suggestion.suggestedName || suggestion.merchantName || suggestion.representativeDescription;

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500',
        !isPending && 'opacity-75',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Selection checkbox for bulk actions */}
            {onSelect && isPending && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(suggestion.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">Select for bulk action</span>
              </label>
            )}

            {/* Purpose badge - prominent display */}
            {suggestion.suggestedPurpose && (
              <Badge className={cn('mb-2', getSuggestedPurposeColor(suggestion.suggestedPurpose))}>
                <span className="mr-1">{getSuggestedPurposeIcon(suggestion.suggestedPurpose)}</span>
                {getSuggestedPurposeLabel(suggestion.suggestedPurpose)}
              </Badge>
            )}

            {/* Name and badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {displayName}
              </h3>
              {suggestion.isEssential && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <Star className="h-3 w-3 mr-1" />
                  Essential
                </Badge>
              )}
            </div>

            {/* Expense type and category */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <span className="mr-1">{getExpenseTypeIcon(suggestion.expenseType)}</span>
                {getExpenseTypeLabel(suggestion.expenseType)}
              </Badge>
              {suggestion.categoryName && (
                <Badge variant="outline" className="text-xs text-gray-600">
                  {suggestion.categoryName}
                </Badge>
              )}
              {!isPending && (
                <Badge className={cn('text-xs', getStatusColor(suggestion.status))}>
                  {getStatusLabel(suggestion.status)}
                </Badge>
              )}
            </div>
          </div>

          {/* Monthly contribution */}
          <div className="text-right shrink-0">
            <MonthlyBreakdownCompact
              averageAmount={suggestion.averageAmount}
              monthlyContribution={suggestion.monthlyContribution}
              frequencyType={suggestion.frequencyType}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        {/* Confidence and occurrences */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <HistoricalOccurrencesCompact
            occurrenceCount={suggestion.occurrenceCount}
            firstOccurrence={suggestion.firstOccurrence}
            lastOccurrence={suggestion.lastOccurrence}
          />
          <ConfidenceBadge confidence={suggestion.overallConfidence} />
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2 w-full justify-center"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Less details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              More details
            </>
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Representative transaction:</span>{' '}
              {suggestion.representativeDescription}
            </p>
            <p>
              <span className="font-medium">Detection interval:</span>{' '}
              {suggestion.intervalDays} days between occurrences
            </p>
            <p>
              <span className="font-medium">Yearly total:</span>{' '}
              {new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR',
              }).format(suggestion.yearlyTotal)}
            </p>
            {suggestion.classificationReasoning && (
              <p>
                <span className="font-medium">AI reasoning:</span>{' '}
                {suggestion.classificationReasoning}
              </p>
            )}
            {suggestion.metadata?.amountRange && (
              <p>
                <span className="font-medium">Amount range:</span>{' '}
                {new Intl.NumberFormat('it-IT', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(suggestion.metadata.amountRange.min)}{' '}
                -{' '}
                {new Intl.NumberFormat('it-IT', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(suggestion.metadata.amountRange.max)}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Action buttons (only for pending) */}
      {isPending && (onApprove || onReject) && (
        <CardFooter className="pt-2 border-t border-gray-100">
          <div className="flex gap-2 w-full">
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(suggestion.id)}
                disabled={isLoading}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            {onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(suggestion.id)}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Create Plan
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// Compact card variant for list views
export function SuggestionCardCompact({
  suggestion,
  onApprove,
  onReject,
  onSelect,
  isSelected = false,
  isLoading = false,
  className,
}: SuggestionCardProps) {
  const isPending = suggestion.status === 'pending';
  const displayName = suggestion.suggestedName || suggestion.merchantName || suggestion.representativeDescription;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 bg-white rounded-lg border transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500',
        !isPending && 'opacity-75',
        className
      )}
    >
      {/* Selection checkbox */}
      {onSelect && isPending && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(suggestion.id, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
        />
      )}

      {/* Expense type icon */}
      <span className="text-xl shrink-0" title={getExpenseTypeLabel(suggestion.expenseType)}>
        {getExpenseTypeIcon(suggestion.expenseType)}
      </span>

      {/* Name and details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{displayName}</span>
          {suggestion.isEssential && (
            <Star className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          {suggestion.suggestedPurpose && (
            <Badge className={cn('text-xs shrink-0', getSuggestedPurposeColor(suggestion.suggestedPurpose))}>
              {getSuggestedPurposeIcon(suggestion.suggestedPurpose)} {getSuggestedPurposeLabel(suggestion.suggestedPurpose)}
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {suggestion.occurrenceCount} occurrences
        </div>
      </div>

      {/* Monthly amount */}
      <div className="text-right shrink-0">
        <div className="font-semibold text-gray-900">
          {new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
          }).format(suggestion.monthlyContribution)}
        </div>
        <div className="text-xs text-gray-500">/month</div>
      </div>

      {/* Confidence */}
      <ConfidenceBadge confidence={suggestion.overallConfidence} className="shrink-0" />

      {/* Actions */}
      {isPending && (onApprove || onReject) && (
        <div className="flex gap-1 shrink-0">
          {onReject && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReject(suggestion.id)}
              disabled={isLoading}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Reject"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {onApprove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onApprove(suggestion.id)}
              disabled={isLoading}
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Create Plan"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
