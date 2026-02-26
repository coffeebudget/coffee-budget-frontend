"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCreditCards } from "@/hooks/useCreditCards";
import { formatCurrency } from "@/types/expense-plan-types";

export default function CreditCardsSummary() {
  const { data: cards, isLoading } = useCreditCards();

  if (isLoading) return null;
  if (!cards || cards.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">💳 Credit Cards</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {cards.map((card) => {
          const used = card.creditLimit - card.availableCredit;
          const usagePercent =
            card.creditLimit > 0
              ? Math.round((used / card.creditLimit) * 100)
              : 0;
          return (
            <div key={card.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{card.name}</span>
                <span className="text-muted-foreground">
                  Used {formatCurrency(used)} / {formatCurrency(card.creditLimit)} |
                  Avail. {formatCurrency(card.availableCredit)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={usagePercent} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {usagePercent}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
