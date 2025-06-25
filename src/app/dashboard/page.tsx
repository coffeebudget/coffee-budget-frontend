"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  fetchExpenseDistribution, 
  fetchMonthlySummary, 
  fetchMonthlyStatistics,
  fetchSavingsPlan,
  fetchCashFlowForecast
} from "@/utils/api";
import ExpenseDistributionChart from "./components/ExpenseDistributionChart";
import MonthlySummaryChart from "./components/MonthlySummaryChart";
import StatisticsCards from "./components/StatisticsCards";
import CurrentBalance from './components/CurrentBalance';
import CashFlowForecastChart from './components/CashFlowForecastChart';
import RecurringTransactionAlert from "./components/RecurringTransactionAlert";
import SavingsPlanTable from "./components/SavingsPlanTable";

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  // State for data
  const [expenseDistribution, setExpenseDistribution] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // Current month for statistics
  const [statisticsMonth, setStatisticsMonth] = useState(
    new Date().toISOString().split('T')[0].substring(0, 7) // Current month in YYYY-MM format
  );
  
  // Months to display in monthly summary chart
  const [summaryMonths, setSummaryMonths] = useState(12);

  const [cashFlowForecast, setCashFlowForecast] = useState([]);
  const [forecastMode, setForecastMode] = useState<'historical' | 'recurring'>('historical');

  const [savingsPlan, setSavingsPlan] = useState([]);
  
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
        // Load dashboard data
        const [savingsPlanData] = await Promise.all([
          fetchSavingsPlan(token),
        ]);
        
        setSavingsPlan(savingsPlanData);
        
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

  // Update statistics when month changes
  useEffect(() => {
    if (!token) return;
    
    const fetchStatisticsForMonth = async () => {
      try {
        // Create a date for the first day of the selected month
        const statsDate = `${statisticsMonth}-01`;
        const statsData = await fetchMonthlyStatistics(token, statsDate);
        setStatistics(statsData);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch statistics for selected month");
      }
    };
    
    fetchStatisticsForMonth();
  }, [token, statisticsMonth]);
  
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

  const fetchForecast = async () => {
    try {
      const forecastData = await fetchCashFlowForecast(token, 24, forecastMode);
      setCashFlowForecast(forecastData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cash flow forecast");
    }
  };
  

  useEffect(() => {
    if (!token) return;
    fetchForecast();
  }, [token, forecastMode]);
  
  
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
  
  // Handle statistics month change
  const handleStatisticsMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatisticsMonth(e.target.value);
  };
  
  // Handle summary months change
  const handleSummaryMonthsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSummaryMonths(parseInt(e.target.value));
  };



  if (!session) {
    return <div className="text-center p-8">Please log in to view your dashboard</div>;
  }

  // Format the selected month for display
  const formatSelectedMonth = () => {
    if (!statisticsMonth) return "Current Month";
    const [year, month] = statisticsMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>
      
      <CurrentBalance />

      {/* Add the RecurringTransactionAlert component here */}
      <RecurringTransactionAlert />

      {loading ? (
        <div className="text-center p-8">Loading dashboard data...</div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : (
        <>
          {/* Month selector for statistics */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Monthly Statistics: {formatSelectedMonth()}</h2>
              <div className="mt-2 md:mt-0">
                <input
                  type="month"
                  value={statisticsMonth}
                  onChange={handleStatisticsMonthChange}
                  className="p-2 border rounded"
                  max={new Date().toISOString().split('T')[0].substring(0, 7)}
                />
              </div>
            </div>
            <StatisticsCards statistics={statistics} />
          </div>

          
          {/* Monthly Summary Chart with its own filter */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Monthly Income & Expenses</h2>
              <div className="mt-2 md:mt-0">
                <select
                  value={summaryMonths}
                  onChange={handleSummaryMonthsChange}
                  className="p-2 border rounded"
                >
                  <option value="3">Last 3 months</option>
                  <option value="6">Last 6 months</option>
                  <option value="12">Last 12 months</option>
                  <option value="24">Last 24 months</option>
                </select>
              </div>
            </div>
            <MonthlySummaryChart data={monthlySummary} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Annual Savings Plan</h2>
            <SavingsPlanTable data={savingsPlan} />
          </div>

          {/* Cash Flow Forecast Section */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Cash Flow Forecast</h2>
              <select
                className="border p-2 rounded mt-2 md:mt-0"
                value={forecastMode}
                onChange={(e) => setForecastMode(e.target.value as 'historical' | 'recurring')}
              >
                <option value="historical">Based on Historical Data</option>
                <option value="recurring">Based on Recurring Transactions</option>
              </select>
            </div>
            <CashFlowForecastChart data={cashFlowForecast} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Expense Distribution by Category (Current Year)</h2>
            <ExpenseDistributionChart data={expenseDistribution} />
          </div>
        </>
      )}
    </div>
  );
} 