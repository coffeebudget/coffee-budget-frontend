"use client";

/**
 * BudgetAllocationHeader Component
 *
 * YNAB-style "Da Assegnare" (To Be Assigned) sticky header.
 * Shows unallocated income for the current month with real-time updates.
 *
 * Color coding:
 * - Green: All income allocated (€0.00 remaining)
 * - Yellow: Income still to allocate (> €0)
 * - Red: Over-allocated (< €0)
 */

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Edit2, Check, X, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAllocationState, useSetIncomeOverride } from "@/hooks/useBudgetAllocation";
import { useCoverageSummary } from "@/hooks/useExpensePlans";
import {
  getCurrentMonth,
  formatMonthDisplay,
  formatCurrency,
  getStatusBannerClass,
  getStatusIcon,
} from "@/types/budget-allocation-types";

interface BudgetAllocationHeaderProps {
  month?: string;
  onAllocateClick?: () => void;
}

export default function BudgetAllocationHeader({
  month,
  onAllocateClick,
}: BudgetAllocationHeaderProps) {
  const targetMonth = month || getCurrentMonth();
  const { data: allocationState, isLoading, error } = useAllocationState(targetMonth);
  const { data: coverageSummary, isLoading: coverageLoading } = useCoverageSummary();
  const setIncomeOverrideMutation = useSetIncomeOverride();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [editedIncome, setEditedIncome] = useState<string>("");

  // Calculate coverage status
  const accountsWithShortfall = coverageSummary?.accounts?.filter(a => a.hasShortfall) || [];
  const accountsCovered = coverageSummary?.accounts?.filter(a => !a.hasShortfall) || [];
  const hasAnyCoverageIssues = accountsWithShortfall.length > 0;

  if (isLoading) {
    return (
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Caricamento allocazione...</span>
        </div>
      </div>
    );
  }

  if (error || !allocationState) {
    return (
      <div className="sticky top-0 z-10 bg-red-50 border-b border-red-200 shadow-sm p-4">
        <div className="max-w-7xl mx-auto text-center text-red-600">
          Errore nel caricamento dello stato di allocazione
        </div>
      </div>
    );
  }

  const {
    income,
    totalAllocated,
    unallocated,
    isComplete,
    statusColor,
  } = allocationState;

  const bannerClass = getStatusBannerClass(statusColor);
  const statusIcon = getStatusIcon(statusColor);

  const handleStartEditIncome = () => {
    setEditedIncome(income.effectiveIncome.toString());
    setIsEditingIncome(true);
  };

  const handleCancelEditIncome = () => {
    setIsEditingIncome(false);
    setEditedIncome("");
  };

  const handleSaveIncome = async () => {
    const amount = parseFloat(editedIncome);
    if (isNaN(amount) || amount < 0) {
      return;
    }

    await setIncomeOverrideMutation.mutateAsync({
      month: targetMonth,
      data: { amount },
    });
    setIsEditingIncome(false);
    setEditedIncome("");
  };

  const handleClearIncomeOverride = async () => {
    await setIncomeOverrideMutation.mutateAsync({
      month: targetMonth,
      data: { amount: null },
    });
  };

  return (
    <div className={`sticky top-0 z-10 border-b shadow-sm ${bannerClass}`}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Main Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Da Assegnare */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{statusIcon === "✓" ? "✓" : statusIcon === "!" ? "⚠️" : "💰"}</span>
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Da Assegnare
                </span>
              </div>
              <div className={`text-3xl font-bold ${
                statusColor === "green"
                  ? "text-green-700"
                  : statusColor === "red"
                    ? "text-red-700"
                    : "text-yellow-700"
              }`}>
                {formatCurrency(unallocated)}
              </div>
            </div>
          </div>

          {/* Center: Month + Coverage Status */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {formatMonthDisplay(targetMonth)}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {isComplete && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Allocazione completa
                </Badge>
              )}
              {!coverageLoading && coverageSummary && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    hasAnyCoverageIssues
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {hasAnyCoverageIssues ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {accountsWithShortfall.length} conto/i scoperti
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tutti i conti coperti
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {onAllocateClick && (
              <Button
                onClick={onAllocateClick}
                variant={isComplete ? "outline" : "default"}
                className={isComplete ? "" : "bg-blue-600 hover:bg-blue-700"}
              >
                {isComplete ? "Modifica Allocazione" : "Alloca Budget"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Income Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  Entrate questo mese
                </div>
                {isEditingIncome ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editedIncome}
                      onChange={(e) => setEditedIncome(e.target.value)}
                      className="w-32"
                      step="0.01"
                      min="0"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveIncome}
                      disabled={setIncomeOverrideMutation.isPending}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEditIncome}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-green-600">
                      +{formatCurrency(income.effectiveIncome)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleStartEditIncome}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {income.manualIncomeOverride !== null && (
                  <div className="text-xs text-gray-500">
                    Auto-rilevato: {formatCurrency(income.autoDetectedIncome)}
                    <Button
                      size="sm"
                      variant="link"
                      onClick={handleClearIncomeOverride}
                      className="text-xs text-blue-600 p-0 h-auto ml-2"
                      disabled={setIncomeOverrideMutation.isPending}
                    >
                      Usa auto-rilevato
                    </Button>
                  </div>
                )}
              </div>

              {/* Allocated Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  Già assegnato
                </div>
                <div className="text-xl font-semibold text-gray-700">
                  -{formatCurrency(totalAllocated)}
                </div>
                <div className="text-xs text-gray-500">
                  {allocationState.plans.length} piani attivi
                </div>
              </div>

              {/* Income Transactions */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  Transazioni rilevate
                </div>
                {income.incomeTransactions.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Nessuna transazione di entrata rilevata
                  </div>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {income.incomeTransactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-600 truncate max-w-[150px]">
                          {tx.description || "Entrata"}
                        </span>
                        <span className="text-green-600 font-medium">
                          +{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                    {income.incomeTransactions.length > 5 && (
                      <div className="text-xs text-gray-400">
                        +{income.incomeTransactions.length - 5} altre transazioni
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Coverage Summary Section */}
            {!coverageLoading && coverageSummary && coverageSummary.accounts && coverageSummary.accounts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Copertura Conti
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {coverageSummary.accounts.map((account) => (
                    <div
                      key={account.accountId}
                      className={`p-3 rounded-lg border ${
                        account.hasShortfall
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
                          {account.accountName}
                        </span>
                        {account.hasShortfall ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Saldo:</span>
                        <span className="font-medium">{formatCurrency(account.currentBalance)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Dopo spese:</span>
                        <span className={`font-medium ${
                          account.projectedBalance < 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          {formatCurrency(account.projectedBalance)}
                        </span>
                      </div>
                      {account.hasShortfall && (
                        <div className="mt-1 text-xs text-red-600">
                          Scoperto: {formatCurrency(account.shortfallAmount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes section if present */}
            {allocationState.notes && (
              <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600 mb-1">Note</div>
                <div className="text-sm text-gray-700">{allocationState.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
