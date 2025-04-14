"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  fetchExpenseDistribution, 
  fetchMonthlySummary, 
  fetchMonthlyStatistics,
  fetchFilteredTransactions,
  fetchCategories,
  fetchTags,
  fetchSavingsPlan,
  fetchCashFlowForecast
} from "@/utils/api";
import { Category, Tag, Transaction } from "@/utils/types";
import DashboardFilters from "./components/DashboardFilters";
import ExpenseDistributionChart from "./components/ExpenseDistributionChart";
import MonthlySummaryChart from "./components/MonthlySummaryChart";
import StatisticsCards from "./components/StatisticsCards";
import FilteredTransactionList from "./components/FilteredTransactionList";
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
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Current month for statistics
  const [statisticsMonth, setStatisticsMonth] = useState(
    new Date().toISOString().split('T')[0].substring(0, 7) // Current month in YYYY-MM format
  );
  
  // Months to display in monthly summary chart
  const [summaryMonths, setSummaryMonths] = useState(12);

  const [cashFlowForecast, setCashFlowForecast] = useState([]);
  const [forecastMode, setForecastMode] = useState<'historical' | 'recurring'>('historical');

  const [savingsPlan, setSavingsPlan] = useState([]);

  // State for filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1 of current year
    endDate: new Date().toISOString().split('T')[0], // Today
    categoryIds: [] as number[],
    tagIds: [] as number[],
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
    type: undefined as 'expense' | 'income' | undefined,
    searchTerm: '',
  });
  
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
        // Load categories and tags for filters
        const [categoriesData, tagsData, savingsPlanData] = await Promise.all([
          fetchCategories(token),
          fetchTags(token),
          fetchSavingsPlan(token),
        ]);
        
        setCategories(categoriesData);
        setTags(tagsData);
        setSavingsPlan(savingsPlanData);
        
        // Load dashboard data
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
  
  
  // Function to refresh dashboard data based on current filters
  const refreshDashboardData = async () => {
    if (!token) return;
    
    try {
      const [distributionData, transactionsData] = await Promise.all([
        fetchExpenseDistribution(token, filters.startDate, filters.endDate),
        fetchFilteredTransactions(token, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
          tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
          minAmount: filters.minAmount,
          maxAmount: filters.maxAmount,
          type: filters.type,
          searchTerm: filters.searchTerm || undefined
        })
      ]);
      
      setExpenseDistribution(distributionData);
      setFilteredTransactions(transactionsData);
    } catch (err) {
      console.error(err);
      setError("Failed to refresh dashboard data");
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Handle statistics month change
  const handleStatisticsMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatisticsMonth(e.target.value);
  };
  
  // Handle summary months change
  const handleSummaryMonthsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSummaryMonths(parseInt(e.target.value));
  };

  // Apply filters
  const applyFilters = () => {
    refreshDashboardData();
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

          
          <DashboardFilters 
            filters={filters}
            categories={categories}
            tags={tags}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
          />
          
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Expense Distribution by Category</h2>
            <ExpenseDistributionChart data={expenseDistribution} />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow mt-6">
            <h2 className="text-lg font-semibold mb-4">Filtered Transactions</h2>
            <FilteredTransactionList 
              transactions={filteredTransactions}
              categories={categories}
              tags={tags}
            />
          </div>
        </>
      )}
    </div>
  );
} 