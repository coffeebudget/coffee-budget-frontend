"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Wallet,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBankAccounts, fetchCreditCards } from "@/utils/api-client";
import { useUpdateExpensePlan } from "@/hooks/useExpensePlans";
import {
  ExpensePlan,
  PaymentAccountType,
  formatCurrency,
} from "@/types/expense-plan-types";

interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

interface CreditCardAccount {
  id: number;
  name: string;
  creditLimit: number;
  availableCredit: number;
}

interface PaymentAccountSectionProps {
  plan: ExpensePlan;
  isEditing: boolean;
}

export function PaymentAccountSection({
  plan,
  isEditing,
}: PaymentAccountSectionProps) {
  const updateMutation = useUpdateExpensePlan();
  const [selectedAccount, setSelectedAccount] = useState<string>(
    plan.paymentAccountId && plan.paymentAccountType
      ? `${plan.paymentAccountType}:${plan.paymentAccountId}`
      : "none"
  );
  const [isLinking, setIsLinking] = useState(false);

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["bankAccounts"],
    queryFn: fetchBankAccounts,
  });

  // Fetch credit cards
  const { data: creditCards = [] } = useQuery<CreditCardAccount[]>({
    queryKey: ["creditCards"],
    queryFn: fetchCreditCards,
  });

  // Reset selection when plan changes
  useEffect(() => {
    setSelectedAccount(
      plan.paymentAccountId && plan.paymentAccountType
        ? `${plan.paymentAccountType}:${plan.paymentAccountId}`
        : "none"
    );
  }, [plan.paymentAccountId, plan.paymentAccountType]);

  const handleLinkAccount = async () => {
    if (selectedAccount === "none") {
      await updateMutation.mutateAsync({
        id: plan.id,
        data: {
          paymentAccountType: undefined,
          paymentAccountId: undefined,
        },
      });
    } else {
      const [type, id] = selectedAccount.split(":");
      await updateMutation.mutateAsync({
        id: plan.id,
        data: {
          paymentAccountType: type as PaymentAccountType,
          paymentAccountId: parseInt(id),
        },
      });
    }
    setIsLinking(false);
  };

  const hasLinkedAccount = plan.paymentAccountId && plan.paymentAccountType;

  // Get account display info
  const getAccountInfo = () => {
    if (!plan.paymentAccountId || !plan.paymentAccountType) return null;

    if (plan.paymentAccountType === "bank_account") {
      const account = bankAccounts.find((a) => a.id === plan.paymentAccountId);
      if (account) {
        return {
          name: account.name,
          balance: account.balance,
          type: "bank_account" as const,
        };
      }
    } else if (plan.paymentAccountType === "credit_card") {
      const card = creditCards.find((c) => c.id === plan.paymentAccountId);
      if (card) {
        return {
          name: card.name,
          balance: card.availableCredit,
          type: "credit_card" as const,
        };
      }
    }

    // Fallback to plan's embedded account info
    if (plan.paymentAccount) {
      return {
        name: plan.paymentAccount.name,
        balance: plan.paymentAccount.balance,
        type: plan.paymentAccountType,
      };
    }

    return null;
  };

  const accountInfo = getAccountInfo();

  // Unlinked state
  if (!hasLinkedAccount) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-900">
              No Payment Account Linked
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800 mb-4">
            Link a bank account or credit card to enable:
          </p>
          <ul className="text-sm text-amber-700 space-y-1 mb-4">
            <li>Coverage tracking for this expense</li>
            <li>Balance verification before due dates</li>
            <li>Account allocation summaries</li>
          </ul>

          {isLinking ? (
            <div className="space-y-3">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select payment account..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No account selected</span>
                  </SelectItem>
                  {bankAccounts.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                      Bank Accounts
                    </div>
                  )}
                  {bankAccounts.map((account) => (
                    <SelectItem
                      key={`bank_account:${account.id}`}
                      value={`bank_account:${account.id}`}
                    >
                      <span className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span>{account.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({formatCurrency(Math.abs(account.balance))})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                  {creditCards.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                      Credit Cards
                    </div>
                  )}
                  {creditCards.map((card) => (
                    <SelectItem
                      key={`credit_card:${card.id}`}
                      value={`credit_card:${card.id}`}
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span>{card.name}</span>
                        <span className="text-gray-500 ml-2">
                          ({formatCurrency(card.availableCredit)} available)
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleLinkAccount}
                  disabled={selectedAccount === "none" || updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Link Account
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsLinking(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsLinking(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Link Account
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Linked state
  return (
    <Card className="border-green-300 bg-green-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg text-green-900">
              Payment Account Linked
            </CardTitle>
          </div>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLinking(true)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Change
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLinking ? (
          <div className="space-y-3">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select payment account..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-gray-500">Remove link</span>
                </SelectItem>
                {bankAccounts.length > 0 && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    Bank Accounts
                  </div>
                )}
                {bankAccounts.map((account) => (
                  <SelectItem
                    key={`bank_account:${account.id}`}
                    value={`bank_account:${account.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span>{account.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({formatCurrency(Math.abs(account.balance))})
                      </span>
                    </span>
                  </SelectItem>
                ))}
                {creditCards.length > 0 && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                    Credit Cards
                  </div>
                )}
                {creditCards.map((card) => (
                  <SelectItem
                    key={`credit_card:${card.id}`}
                    value={`credit_card:${card.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span>{card.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({formatCurrency(card.availableCredit)} available)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleLinkAccount}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAccount(
                    plan.paymentAccountId && plan.paymentAccountType
                      ? `${plan.paymentAccountType}:${plan.paymentAccountId}`
                      : "none"
                  );
                  setIsLinking(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {accountInfo?.type === "bank_account" ? (
              <Wallet className="h-5 w-5 text-blue-600" />
            ) : (
              <CreditCard className="h-5 w-5 text-purple-600" />
            )}
            <div>
              <p className="font-medium text-green-900">
                {accountInfo?.name || "Unknown Account"}
              </p>
              {accountInfo && (
                <p className="text-sm text-green-700">
                  Balance: {formatCurrency(accountInfo.balance)}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
