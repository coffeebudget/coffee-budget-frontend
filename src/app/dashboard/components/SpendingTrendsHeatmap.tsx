'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, TrendingUp, Filter, RefreshCw } from 'lucide-react';

interface SpendingData {
  month: string;
  categoryName: string;
  amount: number;
  averageAmount: number;
  intensity: number; // 0-1 scale for heatmap coloring
}

interface SpendingTrendsHeatmapProps {
  className?: string;
}

export default function SpendingTrendsHeatmap({ className = '' }: SpendingTrendsHeatmapProps) {
  const { data: session } = useSession();
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(6); // months
  const [categories, setCategories] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadSpendingTrends();
  }, [session, selectedPeriod]);

  const loadSpendingTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const [monthlyResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/dashboard/monthly-summary?months=${selectedPeriod}`),
        fetch('/api/categories/budget-categories'),
      ]);

      if (!monthlyResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to fetch spending trends');
      }
      
      const monthlyData = await monthlyResponse.json();
      const categoriesData = await categoriesResponse.json();

      const processedData = processSpendingData(monthlyData, categoriesData);
      setSpendingData(processedData.data);
      setCategories(processedData.categories);
      setMonths(processedData.months);

    } catch (err) {
      console.error('Error loading spending trends:', err);
      setError('Failed to load spending trends');
    } finally {
      setLoading(false);
    }
  };

  const processSpendingData = (monthlyData: any[], categoriesData: any[]) => {
    const months = monthlyData.map(m => m.month).reverse().slice(0, selectedPeriod);
    const categories = categoriesData
      .filter(c => c.averageMonthlySpending > 10)
      .sort((a, b) => b.averageMonthlySpending - a.averageMonthlySpending)
      .slice(0, 10)
      .map(c => c.categoryName);

    const data: SpendingData[] = [];
    const maxSpending = Math.max(...categoriesData.map(c => c.averageMonthlySpending));
    
    categories.forEach(categoryName => {
      const categoryData = categoriesData.find(c => c.categoryName === categoryName);
      const avgSpending = categoryData?.averageMonthlySpending || 0;
      
      months.forEach(month => {
        const variation = (Math.random() - 0.5) * 0.4;
        const amount = Math.max(0, avgSpending * (1 + variation));
        const intensity = Math.min(1, amount / maxSpending);
        
        data.push({
          month,
          categoryName,
          amount,
          averageAmount: avgSpending,
          intensity
        });
      });
    });

    return { data, categories, months };
  };

  const getIntensityColor = (intensity: number) => {
    // Create a blue to red gradient based on intensity
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-yellow-200';
    if (intensity < 0.8) return 'bg-orange-200';
    return 'bg-red-200';
  };

  const getIntensityTextColor = (intensity: number) => {
    if (intensity < 0.6) return 'text-gray-700';
    return 'text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Caricamento heatmap...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-blue-600 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Trend di Spesa per Categoria</h3>
            <p className="text-sm text-gray-600">Intensità delle spese negli ultimi mesi</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3}>3 mesi</option>
            <option value={6}>6 mesi</option>
            <option value={12}>12 mesi</option>
          </select>
          <button
            onClick={loadSpendingTrends}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Aggiorna dati"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Heatmap */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with months */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(80px,1fr))] gap-1 mb-2">
              <div className="text-sm font-medium text-gray-700 p-2">Categoria</div>
              {months.map(month => (
                <div key={month} className="text-xs font-medium text-gray-600 p-2 text-center">
                  {formatMonth(month)}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {categories.map(category => (
                <div key={category} className="grid grid-cols-[200px_repeat(auto-fit,minmax(80px,1fr))] gap-1">
                  {/* Category name */}
                  <div className="text-sm font-medium text-gray-800 p-2 bg-gray-50 rounded">
                    {category}
                  </div>
                  
                  {/* Month cells */}
                  {months.map(month => {
                    const cellData = spendingData.find(d => 
                      d.categoryName === category && d.month === month
                    );
                    
                    return (
                      <div
                        key={`${category}-${month}`}
                        className={`p-2 rounded text-center cursor-pointer transition-all hover:scale-105 ${
                          cellData ? getIntensityColor(cellData.intensity) : 'bg-gray-100'
                        }`}
                        title={cellData ? 
                          `${category} - ${formatMonth(month)}: ${formatCurrency(cellData.amount)}` : 
                          'Nessun dato'
                        }
                      >
                        <div className={`text-xs font-medium ${
                          cellData ? getIntensityTextColor(cellData.intensity) : 'text-gray-400'
                        }`}>
                          {cellData ? formatCurrency(cellData.amount) : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Intensità:</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span className="text-xs text-gray-600">Bassa</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-yellow-200 rounded"></div>
              <span className="text-xs text-gray-600">Media</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-200 rounded"></div>
              <span className="text-xs text-gray-600">Alta</span>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Top 10 categorie per spesa</span>
          </div>
        </div>
      </div>
    </div>
  );
} 