"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useMonthlySummary } from "@/hooks/useIncomePlans";
import { useMonthlyDepositSummary } from "@/hooks/useExpensePlans";
import { formatCurrency } from "@/types/expense-plan-types";
export default function BudgetSummaryBar() {
  const { data: incomeSummary, isLoading: incomeLoading } = useMonthlySummary();
  const { data: depositSummary, isLoading: depositLoading } =
    useMonthlyDepositSummary();

  const isLoading = incomeLoading || depositLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const income = incomeSummary?.budgetSafeIncome ?? 0;
  const obligations = depositSummary?.totalMonthlyDeposit ?? 0;
  const available = income - obligations;

  const availableColor =
    available < 0
      ? "text-red-600"
      : available < 500
        ? "text-yellow-600"
        : "text-green-600";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Entrate
            </p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Obblighi
            </p>
            <p className="text-lg font-semibold text-slate-700">
              {formatCurrency(obligations)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Disponibile
            </p>
            <p className={`text-lg font-semibold ${availableColor}`}>
              {formatCurrency(available)}
            </p>
          </div>
        </div>
        {available < 0 && (
          <p className="text-xs text-red-600 text-center mt-2">
            ⚠ Deficit di budget: le spese pianificate superano le entrate di{" "}
            {formatCurrency(Math.abs(available))}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
