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
import {
  ArrowRightLeft,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  Wallet,
  PieChart,
} from "lucide-react";
import { MONTH_NAMES, MONTH_LABELS, formatCurrency } from "@/types/income-plan-types";
import { getPriorityLabel } from "@/types/transfer-suggestion-types";
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

      {/* Deficit Accounts */}
      {data && data.deficitAccounts && data.deficitAccounts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Accounts Needing Funding
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.deficitAccounts.map((deficit) => (
              <Card key={deficit.accountId} className="border-red-200 bg-red-50/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">
                      {deficit.accountName}
                    </span>
                    <Badge className="bg-red-100 text-red-800">
                      Needs {formatCurrency(deficit.totalNeed)}/mo
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {deficit.obligationDetails.map((ob) => (
                      <div
                        key={ob.planId}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-700">{ob.name}</span>
                          <span className="text-[10px] text-gray-400">
                            {getPriorityLabel(ob.priority)}
                          </span>
                        </div>
                        <span className="text-gray-600">
                          {formatCurrency(ob.monthlyContribution)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Plan Summary */}
      {data && data.planSummary && data.planSummary.totalDeficit > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">
                Transfer Coverage Summary
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Total Need</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(data.planSummary.totalDeficit)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Available</span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(data.planSummary.totalAvailable)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Coverage</span>
                <span
                  className={`font-semibold ${
                    data.planSummary.coveragePercent >= 100
                      ? "text-green-700"
                      : data.planSummary.coveragePercent >= 75
                        ? "text-yellow-700"
                        : "text-red-700"
                  }`}
                >
                  {Math.round(data.planSummary.coveragePercent)}%
                </span>
              </div>
              {data.planSummary.uncoveredAmount > 0 && (
                <div>
                  <span className="text-gray-500 block">Uncovered</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(data.planSummary.uncoveredAmount)}
                  </span>
                </div>
              )}
            </div>
            {/* Coverage bar */}
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  data.planSummary.coveragePercent >= 100
                    ? "bg-green-500"
                    : data.planSummary.coveragePercent >= 75
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(100, Math.round(data.planSummary.coveragePercent))}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
