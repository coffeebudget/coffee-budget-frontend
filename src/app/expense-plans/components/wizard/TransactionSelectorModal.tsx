"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Calendar, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchFilteredTransactions, fetchCategories } from "@/utils/api-client";
import { Transaction, Category } from "@/utils/types";

interface TransactionSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTransactionIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function TransactionSelectorModal({
  open,
  onOpenChange,
  selectedTransactionIds,
  onSelectionChange,
}: TransactionSelectorModalProps) {
  // Local selection state (to allow cancel)
  const [localSelection, setLocalSelection] = useState<number[]>(selectedTransactionIds);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"1m" | "3m" | "6m" | "12m">("12m");

  // Reset local selection when modal opens
  useEffect(() => {
    if (open) {
      setLocalSelection(selectedTransactionIds);
    }
  }, [open, selectedTransactionIds]);

  // Calculate start date based on date range
  const getStartDate = () => {
    const now = new Date();
    switch (dateRange) {
      case "1m":
        now.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        now.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        now.setMonth(now.getMonth() - 6);
        break;
      case "12m":
      default:
        now.setMonth(now.getMonth() - 12);
        break;
    }
    return now.toISOString().split("T")[0];
  };

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await fetchCategories();
      return result as Category[];
    },
    enabled: open,
  });

  // Fetch transactions with filters
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["wizard-transactions", categoryId, dateRange, searchTerm],
    queryFn: async () => {
      const filters: {
        startDate: string;
        type: "expense";
        searchTerm?: string;
        categoryIds?: number[];
        orderBy: "executionDate";
        orderDirection: "desc";
      } = {
        startDate: getStartDate(),
        type: "expense",
        orderBy: "executionDate",
        orderDirection: "desc",
      };

      if (searchTerm) {
        filters.searchTerm = searchTerm;
      }

      if (categoryId && categoryId !== "all") {
        filters.categoryIds = [parseInt(categoryId)];
      }

      const result = await fetchFilteredTransactions(filters);
      return result as Transaction[];
    },
    enabled: open,
  });

  const handleTransactionToggle = (transactionId: number) => {
    setLocalSelection((prev) => {
      if (prev.includes(transactionId)) {
        return prev.filter((id) => id !== transactionId);
      }
      return [...prev, transactionId];
    });
  };

  const handleSelectAll = () => {
    const allIds = transactions.map((t) => t.id!);
    setLocalSelection(allIds);
  };

  const handleClearAll = () => {
    setLocalSelection([]);
  };

  const handleConfirm = () => {
    onSelectionChange(localSelection);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSelection(selectedTransactionIds);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(Math.abs(amount));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Link Transactions
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category and Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Date Range</Label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="12m">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
            <Badge variant="secondary">
              {localSelection.length} selected
            </Badge>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {transactions.map((tx) => {
                const isSelected = localSelection.includes(tx.id!);
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                      isSelected
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => handleTransactionToggle(tx.id!)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleTransactionToggle(tx.id!)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(tx.executionDate)}</span>
                        {tx.category && (
                          <>
                            <span>•</span>
                            <span>{tx.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-red-600 whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            Confirm Selection ({localSelection.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
