"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  fetchExpenseDistribution, 
  fetchMonthlySummary
} from "@/utils/api";
import ExpenseDistributionChart from "./components/ExpenseDistributionChart";
import MonthlySummaryChart from "./components/MonthlySummaryChart";
import AIAnalysisCard from "./components/AIAnalysisCard";
import BudgetManagementCard from "./components/BudgetManagementCard";
import FinancialOverview from "./components/FinancialOverview";
import SmartAlerts from "./components/SmartAlerts";
import CategoryPerformance12M from "./components/CategoryPerformance12M";
import BudgetProgressRings from "./components/BudgetProgressRings";
import CashFlowForecast from "./components/CashFlowForecast";

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  // State for data
  const [expenseDistribution, setExpenseDistribution] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  
  // Months to display in monthly summary chart
  const [summaryMonths, setSummaryMonths] = useState(12);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!token) return;
    
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load initial analytics data
        await refreshDashboardData();
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [token]);
  
  // Update monthly summary when months change
  useEffect(() => {
    if (!token) return;
    
    const fetchSummaryData = async () => {
      try {
        const summaryData = await fetchMonthlySummary(token, summaryMonths);
        setMonthlySummary(summaryData);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch monthly summary data");
      }
    };
    
    fetchSummaryData();
  }, [token, summaryMonths]);
  
  
  // Function to refresh dashboard analytics data
  const refreshDashboardData = async () => {
    if (!token) return;
    
    try {
      // Load current year expense distribution
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      
      const distributionData = await fetchExpenseDistribution(token, startOfYear, today);
      setExpenseDistribution(distributionData);
    } catch (err) {
      console.error(err);
      setError("Failed to refresh dashboard data");
    }
  };
  
  // Handle summary months change
  const handleSummaryMonthsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSummaryMonths(parseInt(e.target.value));
  };

  if (!session) {
    return <div className="text-center p-8">Please log in to view your dashboard</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>
      
      {/* Hero Section - Financial Overview */}
      <FinancialOverview className="mb-8" />
      
      {/* Smart Alerts */}
      <SmartAlerts className="mb-6" />
      
      {/* Recurring Transaction Alert */}
      <RecurringTransactionAlert />
      
      {/* Budget Management Card */}
      <BudgetManagementCard />

      {/* Advanced Visualizations Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">📊 Visualizzazioni Avanzate</h2>
        
        {/* Budget Progress Rings */}
        <BudgetProgressRings className="mb-6" />
        
        {/* Category Performance 12M */}
        <CategoryPerformance12M className="mb-6" />
        
        {/* Cash Flow Forecast */}
        <CashFlowForecast className="mb-6" />
      </div>

      {/* AI Analysis Card */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">🤖 Analisi Beta</h2>
        <AIAnalysisCard 
          totalTransactions={0}
          hasUncategorized={false}
        />
      </div>

      {loading ? (
        <div className="text-center p-8">Loading dashboard data...</div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : (
        <>
          {/* Traditional Charts Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">📈 Analisi Tradizionali</h2>
            
            {/* Monthly Summary Chart */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Entrate & Spese Mensili</h2>
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
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Distribuzione Spese per Categoria</h2>
              <ExpenseDistributionChart data={expenseDistribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 