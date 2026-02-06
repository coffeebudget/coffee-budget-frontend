"use client";

import BudgetCalculationCard from "./BudgetCalculationCard";
import ExpensePlanDashboardCard from "./ExpensePlanDashboardCard";
import AccountHealthPanel from "./AccountHealthPanel";
import CoverageSection from "./CoverageSection";

interface BudgetTabProps {
  selectedMonth: string;
}

// selectedMonth will be passed to children once they accept it (Phase 4.2)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BudgetTab({ selectedMonth }: BudgetTabProps) {
  return (
    <div className="space-y-6">
      <BudgetCalculationCard />
      <ExpensePlanDashboardCard />
      <AccountHealthPanel />
      <CoverageSection />
    </div>
  );
}
