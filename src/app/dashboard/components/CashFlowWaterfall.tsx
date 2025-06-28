'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BarChart, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface WaterfallData {
  label: string;
  value: number;
  type: 'start' | 'positive' | 'negative' | 'end';
  cumulative: number;
  category?: string;
}

export default function CashFlowWaterfall({ className = '' }: { className?: string }) {
  const { data: session } = useSession();
  const [waterfallData, setWaterfallData] = useState<WaterfallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().split('T')[0].substring(0, 7)
  );

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadCashFlowData();
  }, [session, selectedMonth]);

  const loadCashFlowData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current balance and monthly statistics
      const [balanceResponse, statsResponse] = await Promise.all([
        fetch('/api/dashboard/current-balance'),
        fetch(`/api/dashboard/monthly-statistics?month=${selectedMonth}`)
      ]);

      if (!balanceResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch cash flow data');
      }

      const balanceData = await balanceResponse.json();
      const statsData = await statsResponse.json();

      // Create waterfall data
      const data = createWaterfallData(balanceData, statsData);
      setWaterfallData(data);

    } catch (err) {
      console.error('Error loading cash flow data:', err);
      setError('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  const createWaterfallData = (balanceData: any, statsData: any): WaterfallData[] => {
    const startingBalance = balanceData.currentBalance - (statsData.totalIncome - statsData.totalExpenses);
    const data: WaterfallData[] = [];
    
    // Starting balance
    data.push({
      label: 'Saldo Iniziale',
      value: startingBalance,
      type: 'start',
      cumulative: startingBalance
    });

    let cumulative = startingBalance;

    // Add income (positive)
    if (statsData.totalIncome > 0) {
      cumulative += statsData.totalIncome;
      data.push({
        label: 'Entrate',
        value: statsData.totalIncome,
        type: 'positive',
        cumulative,
        category: 'income'
      });
    }

    // Add top expense category if available
    if (statsData.topExpenseCategory) {
      cumulative -= statsData.topExpenseCategory.amount;
      data.push({
        label: statsData.topExpenseCategory.name,
        value: -statsData.topExpenseCategory.amount,
        type: 'negative',
        cumulative,
        category: 'expense'
      });
    }

    // Add remaining expenses as "Other"
    const topExpenseAmount = statsData.topExpenseCategory ? statsData.topExpenseCategory.amount : 0;
    const otherExpenses = statsData.totalExpenses - topExpenseAmount;
    
    if (otherExpenses > 0) {
      cumulative -= otherExpenses;
      data.push({
        label: 'Altre Spese',
        value: -otherExpenses,
        type: 'negative',
        cumulative,
        category: 'expense'
      });
    }

    // Final balance
    data.push({
      label: 'Saldo Finale',
      value: balanceData.currentBalance,
      type: 'end',
      cumulative: balanceData.currentBalance
    });

    return data;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getBarColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-blue-500';
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'end': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getBarHeight = (value: number, maxValue: number) => {
    const minHeight = 20; // Minimum height in pixels
    const maxHeight = 200; // Maximum height in pixels
    const ratio = Math.abs(value) / maxValue;
    return Math.max(minHeight, ratio * maxHeight);
  };

  const WaterfallBar = ({ item, maxValue, index }: { 
    item: WaterfallData; 
    maxValue: number; 
    index: number;
  }) => {
    const height = getBarHeight(item.value, maxValue);
    const isStart = item.type === 'start';
    const isEnd = item.type === 'end';
    const isPositive = item.type === 'positive';
    const isNegative = item.type === 'negative';
    
    // Calculate position for floating bars
    const prevItem = index > 0 ? waterfallData[index - 1] : null;
    const basePosition = isStart || isEnd ? 0 : 
      isPositive ? (prevItem ? prevItem.cumulative - item.value : 0) :
      (prevItem ? prevItem.cumulative : 0);
    
    const bottomOffset = Math.max(0, (200 - Math.abs(basePosition) / maxValue * 200));

    return (
      <div className="flex flex-col items-center space-y-3 px-2">
        {/* Category Label */}
        <div className="text-center min-h-[2rem] flex items-center">
          <span className="text-sm font-medium text-gray-700 px-2 py-1 rounded-md bg-gray-100 whitespace-nowrap">
            {item.label}
          </span>
        </div>
        
        <div className="relative h-72 flex items-end justify-center">
          {/* Connector line to previous bar */}
          {index > 0 && !isStart && !isEnd && (
            <div 
              className="absolute border-t-2 border-dashed border-gray-300 z-0"
              style={{
                width: '60px',
                left: '-30px',
                top: `${220 - (prevItem ? Math.abs(prevItem.cumulative) / maxValue * 220 : 0)}px`
              }}
            />
          )}
          
          {/* Main bar */}
          <div
            className={`w-20 ${getBarColor(item.type)} rounded-t-lg relative transition-all duration-500 hover:opacity-80 shadow-lg z-10`}
            style={{ 
              height: `${height}px`,
              bottom: isStart || isEnd ? '0px' : `${bottomOffset}px`
            }}
          >
            {/* Value label on top of bar */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-800 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border">
              {item.type === 'positive' ? '+' : item.type === 'negative' ? '-' : ''}{formatCurrency(item.value)}
            </div>
            
            {/* Cumulative value */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap bg-gray-50 px-2 py-1 rounded border">
              Totale: {formatCurrency(item.cumulative)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Caricamento waterfall chart...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <BarChart className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (waterfallData.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun Dato Disponibile</h3>
          <p className="text-gray-600">Seleziona un mese per visualizzare il flusso di cassa.</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...waterfallData.map(d => Math.abs(d.value)));
  const netFlow = waterfallData[waterfallData.length - 1].cumulative - waterfallData[0].cumulative;

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <BarChart className="w-6 h-6 text-blue-600 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Flusso di Cassa</h3>
            <p className="text-sm text-gray-600">Analisi dettagliata entrate e uscite</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            max={new Date().toISOString().split('T')[0].substring(0, 7)}
          />
          <button
            onClick={loadCashFlowData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(waterfallData.find(d => d.category === 'income')?.value || 0)}
            </div>
            <div className="text-sm text-green-700">Entrate Totali</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(waterfallData.filter(d => d.category === 'expense').reduce((sum, d) => sum + Math.abs(d.value), 0))}
            </div>
            <div className="text-sm text-red-700">Spese Totali</div>
          </div>
          <div className={`rounded-lg p-4 text-center ${
            netFlow >= 0 ? 'bg-blue-50' : 'bg-yellow-50'
          }`}>
            <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
              netFlow >= 0 ? 'text-blue-600' : 'text-yellow-600'
            }`} />
            <div className={`text-2xl font-bold ${
              netFlow >= 0 ? 'text-blue-600' : 'text-yellow-600'
            }`}>
              {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
            </div>
            <div className={`text-sm ${
              netFlow >= 0 ? 'text-blue-700' : 'text-yellow-700'
            }`}>
              Flusso Netto
            </div>
          </div>
        </div>

        {/* Waterfall Chart */}
        <div className="overflow-x-auto">
          <div className="flex items-end justify-center space-x-12 min-w-max px-8 py-12" style={{ minHeight: '450px' }}>
            {waterfallData.map((item, index) => (
              <WaterfallBar 
                key={`${item.label}-${index}`}
                item={item} 
                maxValue={maxValue} 
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Saldo Iniziale</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Entrate</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Spese</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
            <span>Saldo Finale</span>
          </div>
        </div>
      </div>
    </div>
  );
} 