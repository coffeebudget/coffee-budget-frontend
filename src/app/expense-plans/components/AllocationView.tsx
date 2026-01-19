"use client";

/**
 * AllocationView Component
 *
 * YNAB-style monthly allocation interface.
 * Allows users to allocate their income to expense plans.
 *
 * Features:
 * - Inline allocation inputs for each plan
 * - Real-time updates of "Da Assegnare" amount
 * - Auto-allocate button to use suggested amounts
 * - Save allocations to backend
 * - Group by purpose OR by bank account
 * - Coverage feedback when grouped by account
 */

import { useState, useEffect, useMemo } from "react";
import { Loader2, Wand2, Save, RotateCcw, CheckCircle, Layers, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAllocationState,
  useSaveAllocations,
  useAutoAllocate,
} from "@/hooks/useBudgetAllocation";
import { useCoverageSummary } from "@/hooks/useExpensePlans";
import {
  AllocationItem,
  PlanAllocation,
  formatCurrency,
  getCurrentMonth,
  getStatusBannerClass,
} from "@/types/budget-allocation-types";
import {
  getExpensePlanPurposeIcon,
  getExpensePlanPurposeLabel,
  AccountCoverage,
} from "@/types/expense-plan-types";

type GroupingMode = "purpose" | "account";

interface AllocationViewProps {
  month?: string;
  onClose?: () => void;
}

export default function AllocationView({ month, onClose }: AllocationViewProps) {
  const targetMonth = month || getCurrentMonth();
  const { data: allocationState, isLoading, error, refetch } = useAllocationState(targetMonth);
  const { data: coverageSummary, isLoading: coverageLoading } = useCoverageSummary();
  const saveAllocationsMutation = useSaveAllocations();
  const autoAllocateMutation = useAutoAllocate();

  // Local state
  const [localAllocations, setLocalAllocations] = useState<Record<number, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("purpose");

  // Initialize local allocations from server state
  useEffect(() => {
    if (allocationState) {
      const allocations: Record<number, string> = {};
      allocationState.plans.forEach((plan) => {
        allocations[plan.planId] = plan.allocatedAmount.toString();
      });
      setLocalAllocations(allocations);
      setHasChanges(false);
    }
  }, [allocationState]);

  // Group plans by purpose
  const plansByPurpose = useMemo(() => {
    if (!allocationState) return { sinkingFunds: [], spendingBudgets: [] };
    return {
      sinkingFunds: allocationState.plans.filter((p) => p.purpose === "sinking_fund"),
      spendingBudgets: allocationState.plans.filter((p) => p.purpose === "spending_budget"),
    };
  }, [allocationState]);

  // Group plans by bank account
  const plansByAccount = useMemo(() => {
    if (!allocationState) return { byAccount: new Map<number | null, PlanAllocation[]>(), unassigned: [] };

    const byAccount = new Map<number | null, PlanAllocation[]>();
    const unassigned: PlanAllocation[] = [];

    allocationState.plans.forEach((plan) => {
      if (plan.paymentAccountId === null) {
        unassigned.push(plan);
      } else {
        const existing = byAccount.get(plan.paymentAccountId) || [];
        existing.push(plan);
        byAccount.set(plan.paymentAccountId, existing);
      }
    });

    return { byAccount, unassigned };
  }, [allocationState]);

  // Calculate local totals
  const localTotalAllocated = useMemo(() => {
    return Object.values(localAllocations).reduce((sum, val) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [localAllocations]);

  const localUnallocated = useMemo(() => {
    if (!allocationState) return 0;
    return allocationState.income.effectiveIncome - localTotalAllocated;
  }, [allocationState, localTotalAllocated]);

  // Calculate allocated per account for coverage feedback
  const allocatedPerAccount = useMemo(() => {
    const result = new Map<number, number>();
    if (!allocationState) return result;

    allocationState.plans.forEach((plan) => {
      if (plan.paymentAccountId) {
        const allocated = parseFloat(localAllocations[plan.planId] || "0") || 0;
        const existing = result.get(plan.paymentAccountId) || 0;
        result.set(plan.paymentAccountId, existing + allocated);
      }
    });

    return result;
  }, [allocationState, localAllocations]);

  const handleAllocationChange = (planId: number, value: string) => {
    setLocalAllocations((prev) => ({
      ...prev,
      [planId]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const allocations: AllocationItem[] = Object.entries(localAllocations).map(([planId, value]) => ({
      planId: parseInt(planId, 10),
      amount: parseFloat(value) || 0,
    }));

    await saveAllocationsMutation.mutateAsync({
      month: targetMonth,
      data: { allocations },
    });
    setHasChanges(false);
  };

  const handleAutoAllocate = async () => {
    await autoAllocateMutation.mutateAsync(targetMonth);
    refetch();
  };

  const handleReset = () => {
    if (allocationState) {
      const allocations: Record<number, string> = {};
      allocationState.plans.forEach((plan) => {
        allocations[plan.planId] = plan.allocatedAmount.toString();
      });
      setLocalAllocations(allocations);
      setHasChanges(false);
    }
  };

  const handleUseSuggested = (plan: PlanAllocation) => {
    setLocalAllocations((prev) => ({
      ...prev,
      [plan.planId]: plan.suggestedAmount.toString(),
    }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Caricamento allocazioni...</span>
      </div>
    );
  }

  if (error || !allocationState) {
    return (
      <Card className="p-6 text-center text-red-500">
        Errore nel caricamento delle allocazioni. Riprova.
      </Card>
    );
  }

  const statusColor = localUnallocated === 0 ? "green" : localUnallocated < 0 ? "red" : "yellow";
  const bannerClass = getStatusBannerClass(statusColor);

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card className={`${bannerClass} border`}>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Remaining to allocate */}
            <div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Da Assegnare
              </div>
              <div className={`text-3xl font-bold ${
                statusColor === "green"
                  ? "text-green-700"
                  : statusColor === "red"
                    ? "text-red-700"
                    : "text-yellow-700"
              }`}>
                {formatCurrency(localUnallocated)}
              </div>
            </div>

            {/* Center: Income info */}
            <div className="text-center">
              <div className="text-sm text-gray-500">
                Entrate: <span className="font-medium text-green-600">{formatCurrency(allocationState.income.effectiveIncome)}</span>
              </div>
              <div className="text-sm text-gray-500">
                Assegnato: <span className="font-medium">{formatCurrency(localTotalAllocated)}</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Grouping toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupingMode(groupingMode === "purpose" ? "account" : "purpose")}
                className="gap-2"
              >
                {groupingMode === "purpose" ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Per Conto
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    Per Tipo
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleAutoAllocate}
                disabled={autoAllocateMutation.isPending}
                className="gap-2"
              >
                {autoAllocateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Auto-alloca
              </Button>
              {hasChanges && (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveAllocationsMutation.isPending}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {saveAllocationsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salva
                  </Button>
                </>
              )}
              {localUnallocated === 0 && !hasChanges && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Completo
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render based on grouping mode */}
      {groupingMode === "purpose" ? (
        <PurposeGroupedView
          sinkingFunds={plansByPurpose.sinkingFunds}
          spendingBudgets={plansByPurpose.spendingBudgets}
          localAllocations={localAllocations}
          onAllocationChange={handleAllocationChange}
          onUseSuggested={handleUseSuggested}
        />
      ) : (
        <AccountGroupedView
          plansByAccount={plansByAccount.byAccount}
          unassigned={plansByAccount.unassigned}
          coverageSummary={coverageSummary}
          allocatedPerAccount={allocatedPerAccount}
          localAllocations={localAllocations}
          onAllocationChange={handleAllocationChange}
          onUseSuggested={handleUseSuggested}
        />
      )}

      {/* Empty state */}
      {allocationState.plans.length === 0 && (
        <Card className="p-6 text-center text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p>Nessun piano di spesa attivo.</p>
          <p className="text-sm mt-2">Crea un piano per iniziare ad allocare il budget.</p>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PURPOSE GROUPED VIEW
// ═══════════════════════════════════════════════════════════════════════════

interface PurposeGroupedViewProps {
  sinkingFunds: PlanAllocation[];
  spendingBudgets: PlanAllocation[];
  localAllocations: Record<number, string>;
  onAllocationChange: (planId: number, value: string) => void;
  onUseSuggested: (plan: PlanAllocation) => void;
}

function PurposeGroupedView({
  sinkingFunds,
  spendingBudgets,
  localAllocations,
  onAllocationChange,
  onUseSuggested,
}: PurposeGroupedViewProps) {
  return (
    <>
      {/* Sinking Funds Section */}
      {sinkingFunds.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{getExpensePlanPurposeIcon("sinking_fund")}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {getExpensePlanPurposeLabel("sinking_fund")}
            </h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {sinkingFunds.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {sinkingFunds.map((plan) => (
              <AllocationRow
                key={plan.planId}
                plan={plan}
                value={localAllocations[plan.planId] || "0"}
                onChange={(value) => onAllocationChange(plan.planId, value)}
                onUseSuggested={() => onUseSuggested(plan)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Spending Budgets Section */}
      {spendingBudgets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{getExpensePlanPurposeIcon("spending_budget")}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {getExpensePlanPurposeLabel("spending_budget")}
            </h3>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {spendingBudgets.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {spendingBudgets.map((plan) => (
              <AllocationRow
                key={plan.planId}
                plan={plan}
                value={localAllocations[plan.planId] || "0"}
                onChange={(value) => onAllocationChange(plan.planId, value)}
                onUseSuggested={() => onUseSuggested(plan)}
                showSpent
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT GROUPED VIEW
// ═══════════════════════════════════════════════════════════════════════════

type CoverageStatus = "covered" | "tight" | "shortfall";

function getCoverageStatus(balance: number, allocated: number): CoverageStatus {
  if (allocated > balance) return "shortfall";
  const remaining = balance - allocated;
  const percentRemaining = balance > 0 ? (remaining / balance) * 100 : 100;
  if (percentRemaining < 20) return "tight";
  return "covered";
}

function getCoverageColors(status: CoverageStatus) {
  switch (status) {
    case "shortfall":
      return {
        border: "border-red-300 bg-red-50",
        icon: "text-red-600",
        text: "text-red-600",
        badge: "bg-red-100 text-red-800",
        progressBg: "bg-red-100",
        progressFill: "bg-red-500",
      };
    case "tight":
      return {
        border: "border-yellow-300 bg-yellow-50",
        icon: "text-yellow-600",
        text: "text-yellow-600",
        badge: "bg-yellow-100 text-yellow-800",
        progressBg: "bg-yellow-100",
        progressFill: "bg-yellow-500",
      };
    case "covered":
    default:
      return {
        border: "border-gray-200 bg-white",
        icon: "text-blue-600",
        text: "text-green-600",
        badge: "bg-green-100 text-green-800",
        progressBg: "bg-gray-100",
        progressFill: "bg-green-500",
      };
  }
}

interface AccountGroupedViewProps {
  plansByAccount: Map<number | null, PlanAllocation[]>;
  unassigned: PlanAllocation[];
  coverageSummary: { accounts: AccountCoverage[] } | undefined;
  allocatedPerAccount: Map<number, number>;
  localAllocations: Record<number, string>;
  onAllocationChange: (planId: number, value: string) => void;
  onUseSuggested: (plan: PlanAllocation) => void;
}

function AccountGroupedView({
  plansByAccount,
  unassigned,
  coverageSummary,
  allocatedPerAccount,
  localAllocations,
  onAllocationChange,
  onUseSuggested,
}: AccountGroupedViewProps) {
  // Create a map of account coverage data
  const accountCoverageMap = useMemo(() => {
    const map = new Map<number, AccountCoverage>();
    if (coverageSummary?.accounts) {
      coverageSummary.accounts.forEach((acc) => {
        map.set(acc.accountId, acc);
      });
    }
    return map;
  }, [coverageSummary]);

  const accountEntries = Array.from(plansByAccount.entries())
    .filter(([accountId]) => accountId !== null)
    .sort((a, b) => {
      const coverageA = accountCoverageMap.get(a[0] as number);
      const coverageB = accountCoverageMap.get(b[0] as number);
      // Sort by name
      return (coverageA?.accountName || "").localeCompare(coverageB?.accountName || "");
    });

  return (
    <>
      {/* Accounts with plans */}
      {accountEntries.map(([accountId, plans]) => {
        const coverage = accountCoverageMap.get(accountId as number);
        const currentBalance = coverage?.currentBalance || 0;
        const allocatedThisMonth = allocatedPerAccount.get(accountId as number) || 0;
        const projectedAfterAllocation = currentBalance - allocatedThisMonth;
        const coverageStatus = getCoverageStatus(currentBalance, allocatedThisMonth);
        const colors = getCoverageColors(coverageStatus);

        // Calculate allocation percentage (capped at 100%)
        const allocationPercent = currentBalance > 0
          ? Math.min((allocatedThisMonth / currentBalance) * 100, 100)
          : 0;

        return (
          <div key={accountId} className="space-y-3">
            {/* Account Header */}
            <Card className={`border ${colors.border}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className={`h-6 w-6 ${colors.icon}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {coverage?.accountName || `Conto #${accountId}`}
                      </h3>
                      {coverage?.institution && (
                        <div className="text-xs text-gray-500">{coverage.institution}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Saldo</div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(currentBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Allocato</div>
                      <div className="font-medium text-gray-700">
                        -{formatCurrency(allocatedThisMonth)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Proiezione</div>
                      <div className={`font-medium ${colors.text}`}>
                        {formatCurrency(projectedAfterAllocation)}
                        {coverageStatus === "shortfall" && <AlertTriangle className="inline h-4 w-4 ml-1" />}
                        {coverageStatus === "tight" && <span className="ml-1">⚠️</span>}
                      </div>
                    </div>
                  </div>

                  <Badge variant="secondary" className={colors.badge}>
                    {coverageStatus === "covered" && "✓ "}
                    {coverageStatus === "tight" && "⚠ "}
                    {coverageStatus === "shortfall" && "✗ "}
                    {plans.length} piani
                  </Badge>
                </div>

                {/* Allocation Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Allocazione budget</span>
                    <span>
                      {allocationPercent.toFixed(0)}%
                      {coverageStatus === "shortfall" && (
                        <span className="text-red-600 ml-2">
                          (supera di {formatCurrency(allocatedThisMonth - currentBalance)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${colors.progressBg} overflow-hidden`}>
                    <div
                      className={`h-full transition-all duration-200 ${colors.progressFill}`}
                      style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                    />
                  </div>
                  {coverageStatus === "tight" && (
                    <div className="text-xs text-yellow-600 mt-1">
                      ⚠️ Attenzione: meno del 20% di buffer rimanente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plans for this account */}
            <div className="space-y-3 ml-4">
              {plans.map((plan) => (
                <AllocationRow
                  key={plan.planId}
                  plan={plan}
                  value={localAllocations[plan.planId] || "0"}
                  onChange={(value) => onAllocationChange(plan.planId, value)}
                  onUseSuggested={() => onUseSuggested(plan)}
                  showSpent={plan.purpose === "spending_budget"}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Unassigned plans */}
      {unassigned.length > 0 && (
        <div className="space-y-3">
          <Card className="border border-yellow-300 bg-yellow-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Non Assegnati</h3>
                  <div className="text-xs text-gray-500">
                    Questi piani non hanno un conto di pagamento associato
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800">
                  {unassigned.length} piani
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 ml-4">
            {unassigned.map((plan) => (
              <AllocationRow
                key={plan.planId}
                plan={plan}
                value={localAllocations[plan.planId] || "0"}
                onChange={(value) => onAllocationChange(plan.planId, value)}
                onUseSuggested={() => onUseSuggested(plan)}
                showSpent={plan.purpose === "spending_budget"}
                showAccountWarning
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ALLOCATION ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface AllocationRowProps {
  plan: PlanAllocation;
  value: string;
  onChange: (value: string) => void;
  onUseSuggested: () => void;
  showSpent?: boolean;
  showAccountWarning?: boolean;
}

function AllocationRow({
  plan,
  value,
  onChange,
  onUseSuggested,
  showSpent = false,
  showAccountWarning = false,
}: AllocationRowProps) {
  const allocatedAmount = parseFloat(value) || 0;
  const isDifferentFromSuggested = allocatedAmount !== plan.suggestedAmount;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Icon and name */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-2xl">{plan.icon || "📋"}</span>
          <div>
            <div className="font-medium text-gray-900">{plan.planName}</div>
            {plan.paymentAccountName && (
              <div className="text-xs text-gray-500">
                💳 {plan.paymentAccountName}
              </div>
            )}
            {showAccountWarning && !plan.paymentAccountId && (
              <div className="text-xs text-yellow-600">
                ⚠️ Nessun conto assegnato
              </div>
            )}
          </div>
        </div>

        {/* Suggested amount */}
        <div className="text-sm text-gray-500 min-w-[100px]">
          <div className="text-xs uppercase tracking-wide text-gray-400">Suggerito</div>
          <div className="font-medium">{formatCurrency(plan.suggestedAmount)}</div>
        </div>

        {/* Spent this month (for spending budgets) */}
        {showSpent && (
          <div className="text-sm text-gray-500 min-w-[100px]">
            <div className="text-xs uppercase tracking-wide text-gray-400">Speso</div>
            <div className={`font-medium ${
              plan.spentThisMonth > allocatedAmount ? "text-red-600" : "text-gray-700"
            }`}>
              {formatCurrency(plan.spentThisMonth)}
            </div>
          </div>
        )}

        {/* Allocation input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-28 pl-7 text-right"
              step="0.01"
              min="0"
            />
          </div>
          {isDifferentFromSuggested && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUseSuggested}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Usa suggerito
            </Button>
          )}
        </div>

        {/* Status indicator for spending budgets */}
        {showSpent && (
          <div className="w-20 text-right">
            {allocatedAmount > 0 && (
              <div className={`text-sm font-medium ${
                plan.spentThisMonth > allocatedAmount
                  ? "text-red-600"
                  : plan.spentThisMonth === allocatedAmount
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}>
                {formatCurrency(allocatedAmount - plan.spentThisMonth)}
                <div className="text-xs text-gray-400">
                  {plan.spentThisMonth > allocatedAmount ? "sforato" : "rimasto"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
