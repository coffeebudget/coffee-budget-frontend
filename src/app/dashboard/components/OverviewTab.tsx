"use client";

import FreeToSpendWidget from "./FreeToSpendWidget";
import CoverageMonitorSummary from "./CoverageMonitorSummary";
import UpcomingExpenses from "./UpcomingExpenses";

interface OverviewTabProps {
  selectedMonth: string;
  onNavigateToBudget: () => void;
}

export default function OverviewTab({
  selectedMonth,
  onNavigateToBudget,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <FreeToSpendWidget selectedMonth={selectedMonth} />
      <CoverageMonitorSummary />
      <UpcomingExpenses onNavigateToBudget={onNavigateToBudget} />
    </div>
  );
}
