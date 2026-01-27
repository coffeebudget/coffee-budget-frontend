"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Link2, Calendar, CheckCircle2 } from "lucide-react";
import {
  useTransactionSuggestions,
  useLinkTransaction,
} from "@/hooks/useIncomePlans";
import {
  IncomePlan,
  formatCurrency,
  MONTH_FULL_LABELS,
  MONTH_NAMES,
} from "@/types/income-plan-types";

interface LinkTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: IncomePlan;
  year: number;
  month: number;
  onComplete: () => void;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-100 text-green-800";
  if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
  if (confidence >= 40) return "bg-orange-100 text-orange-800";
  return "bg-gray-100 text-gray-800";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return "High Match";
  if (confidence >= 60) return "Good Match";
  if (confidence >= 40) return "Possible Match";
  return "Low Match";
}

export default function LinkTransactionDialog({
  open,
  onOpenChange,
  plan,
  year,
  month,
  onComplete,
}: LinkTransactionDialogProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useTransactionSuggestions(
    plan.id,
    year,
    month
  );
  const linkMutation = useLinkTransaction();

  const monthName = MONTH_NAMES[month - 1];
  const monthLabel = MONTH_FULL_LABELS[monthName];

  const handleLink = async () => {
    if (!selectedTransactionId) return;

    try {
      await linkMutation.mutateAsync({
        incomePlanId: plan.id,
        data: {
          transactionId: selectedTransactionId,
          year,
          month,
        },
      });
      onComplete();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const suggestions = suggestionsData?.suggestions ?? [];
  const alreadyLinkedId = suggestionsData?.alreadyLinkedTransactionId;
  const expectedAmount = suggestionsData?.expectedAmount ?? 0;

  const isLoading = linkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link Transaction
          </DialogTitle>
          <DialogDescription>
            Select a transaction to link to{" "}
            <span className="font-medium">{plan.name}</span> for{" "}
            <span className="font-medium">{monthLabel} {year}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Expected Amount */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Expected Amount</span>
          <span className="font-medium">{formatCurrency(expectedAmount)}</span>
        </div>

        {/* Already Linked Warning */}
        {alreadyLinkedId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                A transaction is already linked for this month
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Selecting a new transaction will replace the existing link.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isSuggestionsLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Finding matching transactions...</p>
          </div>
        )}

        {/* No Suggestions */}
        {!isSuggestionsLoading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-500">No matching transactions found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adding an income transaction for this month first
            </p>
          </div>
        )}

        {/* Transaction List */}
        {!isSuggestionsLoading && suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-3">
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} found
            </p>

            <RadioGroup
              value={selectedTransactionId?.toString() ?? ""}
              onValueChange={(value: string) => setSelectedTransactionId(parseInt(value))}
              className="space-y-2"
            >
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.transactionId}
                  className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTransactionId === suggestion.transactionId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedTransactionId(suggestion.transactionId)}
                >
                  <RadioGroupItem
                    value={suggestion.transactionId.toString()}
                    id={`transaction-${suggestion.transactionId}`}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={`transaction-${suggestion.transactionId}`}
                    className="flex-grow ml-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {suggestion.description}
                        </p>
                        <div className="flex flex-wrap gap-1 text-xs">
                          <span className="text-gray-500">
                            {new Date(suggestion.date).toLocaleDateString("it-IT")}
                          </span>
                          {suggestion.merchantName && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-500">
                                {suggestion.merchantName}
                              </span>
                            </>
                          )}
                          {suggestion.categoryName && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-500">
                                {suggestion.categoryName}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Match Reasons */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.matchReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-medium text-green-600">
                          {formatCurrency(suggestion.amount)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${getConfidenceColor(suggestion.confidence)}`}
                        >
                          {suggestion.confidence}% - {getConfidenceLabel(suggestion.confidence)}
                        </Badge>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={isLoading || !selectedTransactionId}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Link2 className="h-4 w-4 mr-2" />
            Link Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
