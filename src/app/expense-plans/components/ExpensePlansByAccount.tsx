"use client";

import { useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Building2,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  ExpensePlan,
  formatCurrency,
} from "@/types/expense-plan-types";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import ExpensePlanCard from "./ExpensePlanCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface ExpensePlansByAccountProps {
  plans: ExpensePlan[];
  onEdit: (plan: ExpensePlan) => void;
  onDelete: (id: number) => void;
  onContribute: (plan: ExpensePlan) => void;
  onWithdraw: (plan: ExpensePlan) => void;
  onReviewAdjustment: (plan: ExpensePlan) => void;
}

interface AccountGroup {
  accountId: number | null;
  accountName: string;
  accountType: "bank_account" | "credit_card" | "unassigned";
  plans: ExpensePlan[];
  totalMonthly: number;
  balance?: number;
}

export default function ExpensePlansByAccount({
  plans,
  onEdit,
  onDelete,
  onContribute,
  onWithdraw,
  onReviewAdjustment,
}: ExpensePlansByAccountProps) {
  const { bankAccounts, fetchBankAccounts } = useBankAccounts();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(["unassigned"]));

  // Fetch bank accounts on mount
  useEffect(() => {
    fetchBankAccounts();
  }, []);

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
          accountType: "bank_account", // TODO: support credit cards
          plans: accountPlans,
          totalMonthly: accountPlans.reduce(
            (sum, p) => sum + Number(p.monthlyContribution),
            0
          ),
          balance: account?.balance,
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
  }, [plans, bankAccounts]);

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
      </Card>

      {/* Account Groups */}
      <div className="space-y-4">
        {groupedByAccount.map((group) => {
          const accountKey = group.accountId?.toString() || "unassigned";
          const isExpanded = expandedAccounts.has(accountKey);

          return (
            <Collapsible
              key={accountKey}
              open={isExpanded}
              onOpenChange={() => toggleAccount(accountKey)}
            >
              <Card className={`overflow-hidden ${getAccountColor(group.accountType)}`}>
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
                        <div className="font-semibold text-gray-900">
                          {group.accountName}
                        </div>
                        {group.balance !== undefined && (
                          <div className="text-sm text-gray-500">
                            Saldo: {formatCurrency(group.balance)}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {group.plans.length} piano{group.plans.length !== 1 ? "i" : ""}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(group.totalMonthly)}
                      </div>
                      <div className="text-xs text-gray-500">/mese</div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Plans List */}
                <CollapsibleContent>
                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.plans.map((plan) => (
                        <ExpensePlanCard
                          key={plan.id}
                          plan={plan}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onContribute={onContribute}
                          onWithdraw={onWithdraw}
                          onReviewAdjustment={onReviewAdjustment}
                        />
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Unassigned Warning */}
      {groupedByAccount.some((g) => g.accountType === "unassigned" && g.plans.length > 0) && (
        <Card className="p-4 border-yellow-300 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Piani senza conto assegnato
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Alcuni piani non hanno un conto di pagamento assegnato.
                Modifica i piani per assegnare un conto e tracciare meglio le tue finanze.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
