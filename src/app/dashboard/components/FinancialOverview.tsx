'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw 
} from 'lucide-react';

interface FinancialOverviewData {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netFlow: number;
  previousMonthNetFlow: number;
  budgetUtilization: number;
  savingsRate: number;
  topExpenseCategory: {
    name: string;
    amount: number;
    percentage: number;
  } | null;
}

interface FinancialOverviewProps {
  className?: string;
}

export default function FinancialOverview({ className = '' }: FinancialOverviewProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<FinancialOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadFinancialOverview();
  }, [session]);

  const loadFinancialOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chiamate multiple per ottenere i dati
      const [balanceRes, statsRes, summaryRes] = await Promise.all([
        fetch('/api/dashboard/current-balance'),
        fetch('/api/dashboard/monthly-statistics'),
        fetch('/api/dashboard/monthly-summary?months=2'), // Ultimi 2 mesi per confronto
      ]);

      if (!balanceRes.ok || !statsRes.ok || !summaryRes.ok) {
        throw new Error('Failed to fetch financial overview data');
      }

      const balanceData = await balanceRes.json();
      const statsData = await statsRes.json();
      const summaryData = await summaryRes.json();

      // Calcola i KPI
      const currentMonth = summaryData[summaryData.length - 1] || { income: 0, expenses: 0 };
      const previousMonth = summaryData[summaryData.length - 2] || { income: 0, expenses: 0 };
      
      const netFlow = currentMonth.income - currentMonth.expenses;
      const previousNetFlow = previousMonth.income - previousMonth.expenses;
      const savingsRate = currentMonth.income > 0 ? (netFlow / currentMonth.income) * 100 : 0;

      setData({
        currentBalance: balanceData.currentBalance,
        monthlyIncome: currentMonth.income,
        monthlyExpenses: currentMonth.expenses,
        netFlow,
        previousMonthNetFlow: previousNetFlow,
        budgetUtilization: 0, // TODO: Implementare quando avremo i budget
        savingsRate,
        topExpenseCategory: statsData.topExpenseCategory ? {
          name: statsData.topExpenseCategory.name,
          amount: statsData.topExpenseCategory.amount,
          percentage: (statsData.topExpenseCategory.amount / currentMonth.expenses) * 100
        } : null
      });

    } catch (err) {
      console.error('Error loading financial overview:', err);
      setError('Failed to load financial overview');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getNetFlowTrend = () => {
    if (!data) return 'neutral';
    const change = data.netFlow - data.previousMonthNetFlow;
    if (change > 50) return 'positive';
    if (change < -50) return 'negative';
    return 'neutral';
  };

  const getFinancialHealthStatus = () => {
    if (!data) return 'unknown';
    
    if (data.netFlow > 0 && data.savingsRate > 20) return 'excellent';
    if (data.netFlow > 0 && data.savingsRate > 10) return 'good';
    if (data.netFlow > 0) return 'fair';
    return 'warning';
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Caricamento panoramica finanziaria...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`bg-red-500 text-white rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>{error || 'Errore nel caricamento dei dati'}</span>
        </div>
      </div>
    );
  }

  const healthStatus = getFinancialHealthStatus();
  const netFlowTrend = getNetFlowTrend();

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-lg ${className}`}>
      {/* Header con Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Panoramica Finanziaria</h2>
          <div className="flex items-center mt-2">
            {healthStatus === 'excellent' && <CheckCircle className="w-5 h-5 text-green-300 mr-2" />}
            {healthStatus === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-300 mr-2" />}
            <span className="text-blue-100">
              {healthStatus === 'excellent' && 'Situazione eccellente'}
              {healthStatus === 'good' && 'Buona gestione'}
              {healthStatus === 'fair' && 'Situazione stabile'}
              {healthStatus === 'warning' && 'Richiede attenzione'}
            </span>
          </div>
        </div>
        <button 
          onClick={loadFinancialOverview}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title="Aggiorna dati"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Saldo Corrente */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-blue-200" />
            <span className="text-xs text-blue-200">SALDO ATTUALE</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(data.currentBalance)}</div>
        </div>

        {/* Entrate Mensili */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-green-300" />
            <span className="text-xs text-blue-200">ENTRATE MESE</span>
          </div>
          <div className="text-2xl font-bold text-green-300">{formatCurrency(data.monthlyIncome)}</div>
        </div>

        {/* Uscite Mensili */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-6 h-6 text-red-300" />
            <span className="text-xs text-blue-200">USCITE MESE</span>
          </div>
          <div className="text-2xl font-bold text-red-300">{formatCurrency(data.monthlyExpenses)}</div>
        </div>

        {/* Flusso Netto */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-yellow-300" />
            <span className="text-xs text-blue-200">FLUSSO NETTO</span>
          </div>
          <div className={`text-2xl font-bold ${data.netFlow >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatCurrency(data.netFlow)}
          </div>
          <div className="text-xs mt-1 flex items-center">
            {netFlowTrend === 'positive' && <TrendingUp className="w-3 h-3 mr-1 text-green-300" />}
            {netFlowTrend === 'negative' && <TrendingDown className="w-3 h-3 mr-1 text-red-300" />}
            <span className="text-blue-200">vs mese scorso</span>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tasso di Risparmio */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm text-blue-200 mb-1">Tasso di Risparmio</div>
          <div className="text-xl font-bold">{formatPercentage(data.savingsRate)}</div>
          <div className="text-xs text-blue-200 mt-1">
            {data.savingsRate > 20 ? 'Eccellente!' : data.savingsRate > 10 ? 'Buono' : 'Da migliorare'}
          </div>
        </div>

        {/* Categoria Top Spesa */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-sm text-blue-200 mb-1">Categoria Principale</div>
          {data.topExpenseCategory ? (
            <>
              <div className="text-lg font-bold truncate">{data.topExpenseCategory.name}</div>
              <div className="text-xs text-blue-200 mt-1">
                {formatCurrency(data.topExpenseCategory.amount)} ({data.topExpenseCategory.percentage.toFixed(0)}%)
              </div>
            </>
          ) : (
            <div className="text-sm text-blue-200">Nessun dato</div>
          )}
        </div>

        {/* Quick Action */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-blue-200 mb-2">Azione Suggerita</div>
            {data.netFlow < 0 ? (
              <div className="text-sm">
                <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-yellow-300" />
                <span>Rivedi il budget</span>
              </div>
            ) : data.savingsRate < 10 ? (
              <div className="text-sm">
                <Target className="w-4 h-4 mx-auto mb-1 text-blue-300" />
                <span>Aumenta risparmi</span>
              </div>
            ) : (
              <div className="text-sm">
                <CheckCircle className="w-4 h-4 mx-auto mb-1 text-green-300" />
                <span>Ottimo lavoro!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 