"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  fetchExpenseDistribution,
  fetchMonthlySummary,
} from "@/utils/api";

import FinancialHealthInsights from "./FinancialHealthInsights";
import CashFlowForecast from "./CashFlowForecast";
import AIAnalysisCard from "./AIAnalysisCard";
import MonthlySummaryChart from "./MonthlySummaryChart";
import ExpenseDistributionChart from "./ExpenseDistributionChart";

export default function AnalyticsTab() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [expenseDistribution, setExpenseDistribution] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [summaryMonths, setSummaryMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0];
        const today = new Date().toISOString().split("T")[0];

        const [distributionData, summaryData] = await Promise.all([
          fetchExpenseDistribution(token, startOfYear, today),
          fetchMonthlySummary(token, summaryMonths),
        ]);

        setExpenseDistribution(distributionData);
        setMonthlySummary(summaryData);
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [token, summaryMonths]);

  const handleSummaryMonthsChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSummaryMonths(parseInt(e.target.value));
  };

  return (
    <div className="space-y-6">
      <FinancialHealthInsights />
      <CashFlowForecast />
      <AIAnalysisCard totalTransactions={0} hasUncategorized={false} />

      {loading ? (
        <div className="text-center p-8">Loading analytics data...</div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Summary Chart */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Entrate &amp; Spese Mensili
              </h2>
              <div className="mt-2 md:mt-0">
                <select
                  value={summaryMonths}
                  onChange={handleSummaryMonthsChange}
                  className="p-2 border rounded"
                >
                  <option value="3">Ultimi 3 mesi</option>
                  <option value="6">Ultimi 6 mesi</option>
                  <option value="12">Ultimi 12 mesi</option>
                </select>
              </div>
            </div>
            <MonthlySummaryChart data={monthlySummary} />
          </div>

          {/* Expense Distribution */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Distribuzione Spese per Categoria
            </h2>
            <ExpenseDistributionChart data={expenseDistribution} />
          </div>
        </div>
      )}
    </div>
  );
}
