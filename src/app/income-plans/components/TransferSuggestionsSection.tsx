"use client";

import { useState } from "react";
import { useTransferSuggestions } from "@/hooks/useIncomePlans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Loader2, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES, MONTH_LABELS } from "@/types/income-plan-types";
import AccountTransferCard from "./AccountTransferCard";

const MONTHS = MONTH_NAMES.map((name, index) => ({
  value: (index + 1).toString(),
  label: MONTH_LABELS[name as keyof typeof MONTH_LABELS] || name,
}));

export default function TransferSuggestionsSection() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());

  const { data, isLoading, error } = useTransferSuggestions(
    selectedYear,
    selectedMonth,
  );

  const handlePrevMonth = () => {
    setSelectedMonth((m) => (m <= 1 ? 12 : m - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((m) => (m >= 12 ? 1 : m + 1));
  };

  return (
    <div className="max-w-7xl mx-auto mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Transfer Suggestions
          </h2>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v, 10))}
          >
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Card */}
      {data && data.distinctIncomeAccountCount > 1 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Expense plans not linked to a specific account are split equally
                across {data.distinctIncomeAccountCount} income accounts (
                {Math.round(100 / data.distinctIncomeAccountCount)}% each).
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 text-center text-red-500">
          Failed to load transfer suggestions.
        </Card>
      )}

      {/* No Data */}
      {data && data.accounts.length === 0 && (
        <Card className="p-6 text-center text-gray-500">
          <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            No income accounts found. Link your income plans to bank accounts to
            see transfer suggestions.
          </p>
        </Card>
      )}

      {/* Account Cards */}
      {data && data.accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.accounts.map((account) => (
            <AccountTransferCard
              key={account.accountId}
              suggestion={account}
              month={selectedMonth}
              distinctAccountCount={data.distinctIncomeAccountCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
