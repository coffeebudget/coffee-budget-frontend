"use client";

import { useMemo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Building2,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Target,
} from "lucide-react";
import {
  ExpensePlan,
  AccountCoverage,
  formatCurrency,
  AccountAllocationSummary,
  getAccountHealthStatusLabel,
  getAccountHealthStatusColor,
  getFixedMonthlyAllocationStatusColor,
  getSinkingFundAllocationStatusColor,
} from "@/types/expense-plan-types";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import { useAccountAllocationSummary } from "@/hooks/useExpensePlans";
import ExpensePlanCard from "./ExpensePlanCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface ExpensePlansByAccountProps {
  plans: ExpensePlan[];
  onEdit: (plan: ExpensePlan) => void;
  onDelete: (id: number) => void;
  onReviewAdjustment: (plan: ExpensePlan) => void;
  accountCoverageMap?: Map<number, AccountCoverage>;
}

interface AccountGroup {
  accountId: number | null;
  accountName: string;
  accountType: "bank_account" | "credit_card" | "unassigned";
  plans: ExpensePlan[];
  totalMonthly: number;
  balance?: number;
  allocationSummary?: AccountAllocationSummary;
}

export default function ExpensePlansByAccount({
  plans,
  onEdit,
  onDelete,
  onReviewAdjustment,
  accountCoverageMap,
}: ExpensePlansByAccountProps) {
  const { bankAccounts, fetchBankAccounts } = useBankAccounts();
  const { data: allocationSummaryResponse, isLoading: isLoadingAllocation } =
    useAccountAllocationSummary();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(["unassigned"])
  );
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(
    new Set()
  );

  // Fetch bank accounts on mount
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Create a map of account allocations by account ID
  const allocationMap = useMemo(() => {
    const map = new Map<number, AccountAllocationSummary>();
    if (allocationSummaryResponse?.accounts) {
      allocationSummaryResponse.accounts.forEach((acc) => {
        map.set(acc.accountId, acc);
      });
    }
    return map;
  }, [allocationSummaryResponse]);

  // Group plans by account
  const groupedByAccount = useMemo(() => {
    const accountMap = new Map<number, BankAccount>();
    bankAccounts.forEach((acc) => accountMap.set(acc.id, acc));

    const groups: AccountGroup[] = [];
    const plansByAccount = new Map<number | "unassigned", ExpensePlan[]>();

    // Group plans
    plans.forEach((plan) => {
      const key = plan.paymentAccountId || "unassigned";
      if (!plansByAccount.has(key)) {
        plansByAccount.set(key, []);
      }
      plansByAccount.get(key)!.push(plan);
    });

    // Create account groups
    plansByAccount.forEach((accountPlans, key) => {
      if (key === "unassigned") {
        groups.push({
          accountId: null,
          accountName: "Non assegnati",
          accountType: "unassigned",
          plans: accountPlans,
          totalMonthly: accountPlans.reduce(
            (sum, p) => sum + Number(p.monthlyContribution),
            0
          ),
        });
      } else {
        const account = accountMap.get(key as number);
        groups.push({
          accountId: key as number,
          accountName: account?.name || `Conto #${key}`,
          accountType: "bank_account",
          plans: accountPlans,
          totalMonthly: accountPlans.reduce(
            (sum, p) => sum + Number(p.monthlyContribution),
            0
          ),
          balance: account?.balance,
          allocationSummary: allocationMap.get(key as number),
        });
      }
    });

    // Sort: accounts with plans first, unassigned last
    groups.sort((a, b) => {
      if (a.accountType === "unassigned") return 1;
      if (b.accountType === "unassigned") return -1;
      return b.totalMonthly - a.totalMonthly;
    });

    return groups;
  }, [plans, bankAccounts, allocationMap]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return groupedByAccount.reduce((sum, group) => sum + group.totalMonthly, 0);
  }, [groupedByAccount]);

  const toggleAccount = (accountKey: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountKey)) {
        next.delete(accountKey);
      } else {
        next.add(accountKey);
      }
      return next;
    });
  };

  const toggleBreakdown = (accountKey: string) => {
    setExpandedBreakdowns((prev) => {
      const next = new Set(prev);
      if (next.has(accountKey)) {
        next.delete(accountKey);
      } else {
        next.add(accountKey);
      }
      return next;
    });
  };

  const getAccountIcon = (type: AccountGroup["accountType"]) => {
    switch (type) {
      case "credit_card":
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case "unassigned":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Building2 className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAccountColor = (type: AccountGroup["accountType"]) => {
    switch (type) {
      case "credit_card":
        return "border-purple-200 bg-purple-50";
      case "unassigned":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "tight":
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case "shortfall":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "short":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "ahead":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "on_track":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "behind":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (plans.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Smistamento per Conto
            </h3>
            <p className="text-sm text-gray-600">
              Totale da versare ogni mese per conto bancario
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Totale Mensile</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(grandTotal)}
            </div>
          </div>
        </div>

        {/* Overall Allocation Status */}
        {allocationSummaryResponse && allocationSummaryResponse.totalShortfall > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Deficit totale: {formatCurrency(allocationSummaryResponse.totalShortfall)}
              </span>
              <span className="text-sm text-red-600">
                su {allocationSummaryResponse.accountsWithShortfall} conto/i
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Account Groups */}
      <div className="space-y-4">
        {groupedByAccount.map((group) => {
          const accountKey = group.accountId?.toString() || "unassigned";
          const isExpanded = expandedAccounts.has(accountKey);
          const isBreakdownExpanded = expandedBreakdowns.has(accountKey);
          const allocation = group.allocationSummary;

          return (
            <Collapsible
              key={accountKey}
              open={isExpanded}
              onOpenChange={() => toggleAccount(accountKey)}
            >
              <Card
                className={`overflow-hidden ${getAccountColor(group.accountType)}`}
              >
                {/* Account Header */}
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 flex items-center justify-between hover:bg-white/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      {getAccountIcon(group.accountType)}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {group.accountName}
                          {allocation && (
                            <Badge
                              className={getAccountHealthStatusColor(
                                allocation.healthStatus
                              )}
                            >
                              {getHealthIcon(allocation.healthStatus)}
                              <span className="ml-1">
                                {getAccountHealthStatusLabel(allocation.healthStatus)}
                              </span>
                            </Badge>
                          )}
                        </div>
                        {group.balance !== undefined && (
                          <div className="text-sm text-gray-500">
                            Saldo: {formatCurrency(group.balance)}
                            {allocation && (
                              <span className="mx-1">|</span>
                            )}
                            {allocation && (
                              <span
                                className={
                                  allocation.shortfall > 0
                                    ? "text-red-600 font-medium"
                                    : "text-green-600"
                                }
                              >
                                Necessario oggi: {formatCurrency(allocation.totalRequiredToday)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {group.plans.length} piano
                        {group.plans.length !== 1 ? "i" : ""}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {allocation && allocation.shortfall > 0 && (
                        <div className="text-sm text-red-600 font-medium">
                          Deficit: {formatCurrency(allocation.shortfall)}
                        </div>
                      )}
                      {allocation && allocation.surplus > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Surplus: {formatCurrency(allocation.surplus)}
                        </div>
                      )}
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(group.totalMonthly)}
                      </div>
                      <div className="text-xs text-gray-500">/mese</div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Content Area */}
                <CollapsibleContent>
                  <div className="border-t border-gray-200 bg-white">
                    {/* Account Allocation Breakdown */}
                    {allocation && (
                      <div className="p-4 border-b border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBreakdown(accountKey);
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              {isBreakdownExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Target className="h-4 w-4" />
                              Dettaglio Allocazione
                            </h4>
                            <span className="text-sm text-gray-500">
                              Clicca per {isBreakdownExpanded ? "nascondere" : "espandere"}
                            </span>
                          </div>
                        </button>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              Saldo vs Necessario
                            </span>
                            <span className="font-medium">
                              {formatCurrency(allocation.currentBalance)} /{" "}
                              {formatCurrency(allocation.totalRequiredToday)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(
                              100,
                              (allocation.currentBalance /
                                allocation.totalRequiredToday) *
                                100
                            )}
                            className="h-2"
                          />
                        </div>

                        {isBreakdownExpanded && (
                          <div className="space-y-4 mt-4">
                            {/* Fixed Monthly Section */}
                            {allocation.fixedMonthlyPlans.length > 0 && (
                              <div className="rounded-lg border border-gray-200 p-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  Spese Fisse Mensili
                                  <Badge variant="outline" className="ml-auto">
                                    {formatCurrency(allocation.fixedMonthlyTotal)}
                                  </Badge>
                                </h5>
                                <div className="space-y-2">
                                  {allocation.fixedMonthlyPlans.map((plan) => (
                                    <div
                                      key={plan.id}
                                      className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{plan.icon || "📋"}</span>
                                        <span className="text-gray-700">
                                          {plan.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-gray-600">
                                          {formatCurrency(plan.requiredToday)}
                                        </span>
                                        <Badge
                                          className={getFixedMonthlyAllocationStatusColor(
                                            plan.status
                                          )}
                                        >
                                          {getStatusIcon(plan.status)}
                                          <span className="ml-1">
                                            {plan.status === "paid"
                                              ? "Pagato"
                                              : "Pronto"}
                                          </span>
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sinking Funds Section */}
                            {allocation.sinkingFundPlans.length > 0 && (
                              <div className="rounded-lg border border-gray-200 p-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-purple-600" />
                                  Fondi di Accumulo (Previsto ad Oggi)
                                  <Badge variant="outline" className="ml-auto">
                                    {formatCurrency(allocation.sinkingFundTotal)}
                                  </Badge>
                                </h5>
                                <div className="space-y-2">
                                  {allocation.sinkingFundPlans.map((plan) => (
                                    <div
                                      key={plan.id}
                                      className="py-2 border-b border-gray-100 last:border-0"
                                    >
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <span>{plan.icon || "📦"}</span>
                                          <span className="text-gray-700">
                                            {plan.name}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-gray-500 text-xs">
                                            {formatCurrency(plan.requiredToday)} previsto
                                          </span>
                                          <Badge
                                            className={getSinkingFundAllocationStatusColor(
                                              plan.status
                                            )}
                                          >
                                            {getStatusIcon(plan.status)}
                                            <span className="ml-1">
                                              {plan.status === "on_track"
                                                ? "In linea"
                                                : "Indietro"}
                                            </span>
                                          </Badge>
                                        </div>
                                      </div>
                                      {/* Mini progress bar */}
                                      <div className="mt-1">
                                        <Progress
                                          value={plan.progressPercent}
                                          className="h-1"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                          <span>
                                            {plan.progressPercent.toFixed(0)}% del target
                                          </span>
                                          {plan.nextDueDate && (
                                            <span>
                                              Scadenza: {new Date(plan.nextDueDate).toLocaleDateString("it-IT")}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Suggested Catch-up */}
                            {allocation.suggestedCatchUp && allocation.suggestedCatchUp > 0 && (
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 text-yellow-800">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">
                                    <strong>Suggerimento:</strong> Versa{" "}
                                    {formatCurrency(allocation.suggestedCatchUp)} per
                                    metterti in pari
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Plans List */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.plans.map((plan) => (
                          <ExpensePlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReviewAdjustment={onReviewAdjustment}
                            accountCoverage={
                              plan.paymentAccountId && accountCoverageMap
                                ? accountCoverageMap.get(plan.paymentAccountId)
                                : null
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Unassigned Warning */}
      {groupedByAccount.some(
        (g) => g.accountType === "unassigned" && g.plans.length > 0
      ) && (
        <Card className="p-4 border-yellow-300 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Piani senza conto assegnato
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Alcuni piani non hanno un conto di pagamento assegnato. Modifica
                i piani per assegnare un conto e tracciare meglio le tue
                finanze.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
