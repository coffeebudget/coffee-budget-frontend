"use client";

import BudgetSummaryBar from "./BudgetSummaryBar";
import SavingsProgressTable from "./SavingsProgressTable";
import AccountDistribution from "./AccountDistribution";
import CoverageMonitorCompact from "./CoverageMonitorCompact";
import CreditCardsSummary from "./CreditCardsSummary";

interface BudgetTabProps {
  selectedMonth: string;
}

// selectedMonth will be passed to children once they accept it (Phase 4.2)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BudgetTab({ selectedMonth }: BudgetTabProps) {
  return (
    <div className="space-y-6">
      <BudgetSummaryBar />
      <SavingsProgressTable />
      <AccountDistribution />
      <CoverageMonitorCompact />
      <CreditCardsSummary />
    </div>
  );
}
