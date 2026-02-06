"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AccountTransferSuggestion,
  getTransferStatusColor,
  getTransferStatusLabel,
  getReliabilityColor,
  getPriorityLabel,
} from "@/types/transfer-suggestion-types";
import { formatCurrency, MONTH_NAMES } from "@/types/income-plan-types";
import {
  ArrowDownRight,
  ArrowUpRight,
  Shield,
  TrendingUp,
  AlertTriangle,
  MinusCircle,
} from "lucide-react";

interface AccountTransferCardProps {
  suggestion: AccountTransferSuggestion;
  month: number;
  distinctAccountCount: number;
}

export default function AccountTransferCard({
  suggestion,
  month,
  distinctAccountCount,
}: AccountTransferCardProps) {
  const monthName = MONTH_NAMES[month - 1] || "";
  const sharePercent =
    distinctAccountCount > 1
      ? Math.round(100 / distinctAccountCount)
      : 100;

  const statusIcon =
    suggestion.status === "transferable" ? (
      <TrendingUp className="h-4 w-4" />
    ) : suggestion.status === "tight" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <MinusCircle className="h-4 w-4" />
    );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {suggestion.accountName}
          </CardTitle>
          <Badge className={getTransferStatusColor(suggestion.status)}>
            {statusIcon}
            <span className="ml-1">{getTransferStatusLabel(suggestion.status)}</span>
          </Badge>
        </div>
        <p className="text-xs text-gray-500">{monthName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Income Sources */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowDownRight className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Income
            </span>
            <span className="text-sm font-semibold text-green-600 ml-auto">
              {formatCurrency(suggestion.totalIncome)}
            </span>
          </div>
          <div className="space-y-1 pl-5">
            {suggestion.incomeSources.map((source) => (
              <div
                key={source.planId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-700">{source.name}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${getReliabilityColor(source.reliability)}`}
                  >
                    {source.reliability}
                  </Badge>
                </div>
                <span className="text-gray-900 font-medium">
                  {formatCurrency(source.amountForMonth)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Obligations */}
        {suggestion.directObligationDetails.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Direct Obligations
              </span>
              <span className="text-sm font-semibold text-red-600 ml-auto">
                -{formatCurrency(suggestion.directObligations)}
              </span>
            </div>
            <div className="space-y-1 pl-5">
              {suggestion.directObligationDetails.map((ob) => (
                <div
                  key={ob.planId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{ob.name}</span>
                  <span className="text-gray-600">
                    {formatCurrency(ob.monthlyContribution)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Obligations */}
        {suggestion.sharedObligations > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Shared Obligations
              </span>
              <span className="text-[10px] text-gray-400 ml-1">
                ({sharePercent}% share)
              </span>
              <span className="text-sm font-semibold text-orange-600 ml-auto">
                -{formatCurrency(suggestion.sharedObligations)}
              </span>
            </div>
            <div className="space-y-1 pl-5">
              {suggestion.sharedObligationDetails.map((ob) => (
                <div
                  key={ob.planId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{ob.name}</span>
                  <span className="text-gray-400 text-xs">
                    {formatCurrency(ob.monthlyContribution)} total
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Surplus</span>
            <span
              className={`font-medium ${suggestion.surplus >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(suggestion.surplus)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <span className="text-gray-500">Safety margin (10%)</span>
            </div>
            <span className="text-gray-600">
              -{formatCurrency(suggestion.safetyMargin)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-1 border-t border-gray-100">
            <span className="text-gray-900">Suggested Transfer</span>
            <span
              className={
                suggestion.suggestedTransfer > 0
                  ? "text-green-700"
                  : "text-gray-500"
              }
            >
              {formatCurrency(suggestion.suggestedTransfer)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
