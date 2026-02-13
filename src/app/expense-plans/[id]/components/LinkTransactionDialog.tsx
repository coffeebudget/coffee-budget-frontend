"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  Calendar,
  ArrowRight,
  Star,
  Check,
} from "lucide-react";
import { useLinkTransaction, useLinkedPlansByTransactions } from "@/hooks/useExpensePlans";
import { ExpensePlan, formatCurrency } from "@/types/expense-plan-types";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  executionDate: string | null;
  createdAt: string;
  type: "expense" | "income";
  category?: {
    id: number;
    name: string;
    icon?: string | null;
  } | null;
}

interface LinkTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExpensePlan;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function LinkTransactionDialog({
  open,
  onOpenChange,
  plan,
}: LinkTransactionDialogProps) {
  const { data: session } = useSession();
  const linkMutation = useLinkTransaction();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Fetch recent expense transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions-for-linking", plan.id],
    queryFn: async () => {
      // Fetch recent expense transactions from the backend
      const response = await fetch(`${API_URL}/transactions?limit=100&type=expense`, {
        headers: {
          Authorization: `Bearer ${session!.user!.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      return response.json();
    },
    enabled: open && !!session,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch linked plans for fetched transactions to exclude already-linked ones
  const transactionIds = useMemo(
    () => transactions.map((t) => t.id),
    [transactions]
  );
  const { data: linkedPlansMap = {} } = useLinkedPlansByTransactions(transactionIds);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTransaction(null);
      setSearchTerm("");
    }
  }, [open]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    // Exclude transactions already linked to any expense plan
    const linkedTransactionIds = new Set(
      Object.keys(linkedPlansMap).map(Number).filter((id) => linkedPlansMap[id]?.length > 0)
    );
    let filtered = transactions.filter((t) => !linkedTransactionIds.has(t.id));

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          t.category?.name.toLowerCase().includes(term)
      );
    }

    // Sort: matching category first, then by date
    return [...filtered].sort((a, b) => {
      // Matching category transactions first
      const aMatches = a.category?.id === plan.categoryId;
      const bMatches = b.category?.id === plan.categoryId;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Then by date (newest first)
      const aDate = a.executionDate || a.createdAt;
      const bDate = b.executionDate || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [transactions, searchTerm, plan.categoryId]);

  // Separate matching and other transactions
  const matchingTransactions = filteredTransactions.filter(
    (t) => t.category?.id === plan.categoryId
  );
  const otherTransactions = filteredTransactions.filter(
    (t) => t.category?.id !== plan.categoryId
  );

  const handleLink = async () => {
    if (!selectedTransaction) return;

    await linkMutation.mutateAsync({
      planId: plan.id,
      transactionId: selectedTransaction.id,
    });

    onOpenChange(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Transaction to {plan.name}</DialogTitle>
          <DialogDescription>
            Select a transaction to link to this expense plan
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!isLoading && filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No matching transactions found
            </div>
          )}

          {/* Matching category transactions */}
          {matchingTransactions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Matching Category
              </h4>
              <div className="space-y-1">
                {matchingTransactions.slice(0, 10).map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    isSelected={selectedTransaction?.id === transaction.id}
                    onSelect={() => setSelectedTransaction(transaction)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other transactions */}
          {otherTransactions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Other Transactions
              </h4>
              <div className="space-y-1">
                {otherTransactions.slice(0, 20).map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    isSelected={selectedTransaction?.id === transaction.id}
                    onSelect={() => setSelectedTransaction(transaction)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedTransaction && (
              <span>
                Selected: {formatCurrency(Math.abs(selectedTransaction.amount))}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={!selectedTransaction || linkMutation.isPending}
            >
              {linkMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <ArrowRight className="h-4 w-4 mr-2" />
              Link Transaction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: () => void;
  formatDate: (date: string | null) => string;
}

function TransactionRow({
  transaction,
  isSelected,
  onSelect,
  formatDate,
}: TransactionRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-3 rounded-lg border text-left transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
            <span className="font-medium truncate">{transaction.description}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(transaction.executionDate || transaction.createdAt)}</span>
            {transaction.category && (
              <>
                <span className="text-gray-300">|</span>
                <Badge variant="outline" className="text-xs">
                  {transaction.category.icon} {transaction.category.name}
                </Badge>
              </>
            )}
          </div>
        </div>
        <div className="text-right pl-4">
          <span className="font-semibold text-red-600">
            {formatCurrency(Math.abs(transaction.amount))}
          </span>
        </div>
      </div>
    </button>
  );
}
