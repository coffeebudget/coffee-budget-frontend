'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Link2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Ban,
} from 'lucide-react';
import {
  usePendingLinkSuggestions,
  useLinkSuggestionCounts,
  useApproveLinkSuggestion,
  useRejectLinkSuggestion,
} from '@/hooks/useTransactionLinkSuggestions';
import {
  TransactionLinkSuggestion,
  formatSuggestionAmount,
  formatSuggestionDate,
} from '@/types/transaction-link-suggestion-types';

interface TransactionLinkAlertsProps {
  className?: string;
}

export default function TransactionLinkAlerts({
  className = '',
}: TransactionLinkAlertsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: suggestions, isLoading, refetch } = usePendingLinkSuggestions();
  const { data: counts } = useLinkSuggestionCounts();
  const approveMutation = useApproveLinkSuggestion();
  const rejectMutation = useRejectLinkSuggestion();

  const handleApprove = async (suggestion: TransactionLinkSuggestion) => {
    await approveMutation.mutateAsync({ id: suggestion.id });
  };

  const handleReject = async (
    suggestion: TransactionLinkSuggestion,
    neverAskForPlan: boolean = false
  ) => {
    await rejectMutation.mutateAsync({
      id: suggestion.id,
      data: { neverAskForPlan },
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Caricamento suggerimenti...</span>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null; // Don't show anything if no suggestions
  }

  const pendingCount = counts?.pending ?? suggestions.length;
  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 3);

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Link2 className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Suggerimenti Collegamento
          </h3>
          <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
            {pendingCount} pending
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="p-1 hover:bg-gray-100 rounded"
            title="Aggiorna"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded"
            title={collapsed ? 'Espandi' : 'Comprimi'}
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {displayedSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApprove={() => handleApprove(suggestion)}
              onReject={() => handleReject(suggestion, false)}
              onNeverAsk={() => handleReject(suggestion, true)}
              isApproving={approveMutation.isPending}
              isRejecting={rejectMutation.isPending}
            />
          ))}

          {/* Show More / Less button */}
          {suggestions.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {showAll
                ? 'Mostra meno'
                : `Mostra altri ${suggestions.length - 3} suggerimenti`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTION CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SuggestionCardProps {
  suggestion: TransactionLinkSuggestion;
  onApprove: () => void;
  onReject: () => void;
  onNeverAsk: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
  onNeverAsk,
  isApproving,
  isRejecting,
}: SuggestionCardProps) {
  const isProcessing = isApproving || isRejecting;

  return (
    <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Transaction Info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 truncate">
              &quot;{suggestion.transactionDescription}&quot;
            </span>
            <span className="text-gray-700 font-semibold whitespace-nowrap">
              {formatSuggestionAmount(suggestion.transactionAmount)}
            </span>
          </div>

          {/* Date */}
          <p className="text-xs text-gray-500 mb-2">
            {formatSuggestionDate(suggestion.transactionDate)}
          </p>

          {/* Expense Plan Link */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-1">→</span>
            <span>Collega a: </span>
            <span className="ml-1">
              {suggestion.expensePlanIcon && (
                <span className="mr-1">{suggestion.expensePlanIcon}</span>
              )}
              <Link
                href={`/expense-plans/${suggestion.expensePlanId}`}
                className="font-medium text-purple-700 hover:text-purple-900 hover:underline"
              >
                {suggestion.expensePlanName}
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-200">
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4 mr-1" />
          Collega
        </button>

        <button
          onClick={onReject}
          disabled={isProcessing}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4 mr-1" />
          Ignora
        </button>

        <button
          onClick={onNeverAsk}
          disabled={isProcessing}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Non chiedere più per questo piano"
        >
          <Ban className="w-4 h-4 mr-1" />
          Non chiedere più
        </button>
      </div>
    </div>
  );
}
