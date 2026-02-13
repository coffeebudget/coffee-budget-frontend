'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';

interface ForecastData {
  month: string;
  income: number;
  expenses: number;
  projectedBalance: number;
}

interface CashFlowForecastProps {
  className?: string;
}

export default function CashFlowForecast({ className = '' }: CashFlowForecastProps) {
  const { data: session } = useSession();
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Controls
  const [mode, setMode] = useState<'historical' | 'expense-plans'>('historical');
  const [months, setMonths] = useState(12);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadForecastData();
  }, [session, mode, months]);

  const loadForecastData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/cash-flow-forecast?mode=${mode}&months=${months}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const data = await response.json();
      setForecastData(data);

    } catch (err) {
      console.error('Error loading forecast data:', err);
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateSummaryStats = () => {
    if (forecastData.length === 0) return null;

    const totalIncome = forecastData.reduce((sum, month) => sum + month.income, 0);
    const totalExpenses = forecastData.reduce((sum, month) => sum + month.expenses, 0);
    const netFlow = totalIncome - totalExpenses;
    const finalBalance = forecastData[forecastData.length - 1]?.projectedBalance || 0;
    const currentBalance = forecastData[0]?.projectedBalance - (forecastData[0]?.income - forecastData[0]?.expenses) || 0;

    return {
      totalIncome,
      totalExpenses,
      netFlow,
      finalBalance,
      currentBalance,
      balanceChange: finalBalance - currentBalance
    };
  };

  const summaryStats = calculateSummaryStats();

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Caricamento previsioni...</span>
        </div>
      </div>
    );
  }

  if (error || !forecastData.length) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-700">{error || 'Nessun dato disponibile per le previsioni'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Previsioni Flusso di Cassa</h3>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Modalità:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'historical' | 'expense-plans')}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="historical">📊 Storico</option>
              <option value="expense-plans">📋 Piani di Spesa</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Periodo:</label>
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 mesi</option>
              <option value={12}>12 mesi</option>
              <option value={18}>18 mesi</option>
              <option value={24}>24 mesi</option>
            </select>
          </div>
          
          <button
            onClick={loadForecastData}
            className="p-1 hover:bg-gray-100 rounded"
            title="Aggiorna previsioni"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summaryStats.totalIncome)}
              </div>
              <div className="text-sm text-green-700">Entrate Previste</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summaryStats.totalExpenses)}
              </div>
              <div className="text-sm text-red-700">Spese Previste</div>
            </div>
            
            <div className={`rounded-lg p-4 text-center ${
              summaryStats.netFlow >= 0 ? 'bg-blue-50' : 'bg-yellow-50'
            }`}>
              <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
                summaryStats.netFlow >= 0 ? 'text-blue-600' : 'text-yellow-600'
              }`} />
              <div className={`text-2xl font-bold ${
                summaryStats.netFlow >= 0 ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {summaryStats.netFlow >= 0 ? '+' : ''}{formatCurrency(summaryStats.netFlow)}
              </div>
              <div className={`text-sm ${
                summaryStats.netFlow >= 0 ? 'text-blue-700' : 'text-yellow-700'
              }`}>
                Flusso Netto
              </div>
            </div>
            
            <div className={`rounded-lg p-4 text-center ${
              summaryStats.balanceChange >= 0 ? 'bg-purple-50' : 'bg-orange-50'
            }`}>
              <Target className={`w-8 h-8 mx-auto mb-2 ${
                summaryStats.balanceChange >= 0 ? 'text-purple-600' : 'text-orange-600'
              }`} />
              <div className={`text-2xl font-bold ${
                summaryStats.balanceChange >= 0 ? 'text-purple-600' : 'text-orange-600'
              }`}>
                {formatCurrency(summaryStats.finalBalance)}
              </div>
              <div className={`text-sm ${
                summaryStats.balanceChange >= 0 ? 'text-purple-700' : 'text-orange-700'
              }`}>
                Saldo Finale
              </div>
            </div>
          </div>
        )}

        {/* Forecast Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'income' ? 'Entrate' : 
                  name === 'expenses' ? 'Spese' : 'Saldo Proiettato'
                ]}
                labelFormatter={(label) => `Mese: ${label}`}
              />
              <Legend 
                formatter={(value) => 
                  value === 'income' ? 'Entrate' : 
                  value === 'expenses' ? 'Spese' : 'Saldo Proiettato'
                }
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                strokeWidth={3}
                name="income"
                dot={{ fill: '#10B981' }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                strokeWidth={3}
                name="expenses"
                dot={{ fill: '#EF4444' }}
              />
              <Line 
                type="monotone" 
                dataKey="projectedBalance" 
                stroke="#3B82F6" 
                strokeWidth={4}
                name="projectedBalance"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mode Description */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">
              {mode === 'historical' ? (
                <span>
                  <strong>Modalità Storico:</strong> Le previsioni sono basate sulla media delle tue transazioni passate,
                  considerando la stagionalità (stesso mese degli anni precedenti).
                </span>
              ) : (
                <span>
                  <strong>Modalità Piani di Spesa:</strong> Le entrate provengono dai piani di entrata attivi (garantiti e previsti).
                  Le spese utilizzano i piani di spesa per le categorie pianificate e la media storica per quelle non pianificate.
                  Le spese non mensili vengono mostrate nel mese di scadenza effettivo.
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 