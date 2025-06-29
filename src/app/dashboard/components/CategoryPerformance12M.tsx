'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  RefreshCw,
  Info,
  Eye
} from 'lucide-react';

interface CategoryPerformance {
  categoryId: number;
  categoryName: string;
  budgetLevel: 'primary' | 'secondary' | 'optional';
  spending12M: number;
  budget12M: number;
  difference: number;
  percentageUsed: number;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'no_budget';
  monthlyAverage: number;
  remainingMonths: number;
  projectedYearEnd: number;
}

interface CategoryPerformance12MProps {
  className?: string;
}

export default function CategoryPerformance12M({ className = '' }: CategoryPerformance12MProps) {
  const { data: session } = useSession();
  const [performanceData, setPerformanceData] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadPerformanceData();
  }, [session]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse] = await Promise.all([
        fetch('/api/categories/budget-categories'),
      ]);

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const categoriesData = await categoriesResponse.json();
      const processedData = processPerformanceData(categoriesData);
      setPerformanceData(processedData);

    } catch (err) {
      console.error('Error loading performance data:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const processPerformanceData = (categoriesData: any[]): CategoryPerformance[] => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const remainingMonths = 12 - currentMonth;

    return categoriesData
      .filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0) // Solo categorie di spesa
      .map(cat => {
        // Usa la spesa NETTA (considerando entrate ed uscite)
        const monthlyNetSpending = Math.abs(cat.averageMonthlyNetFlow || 0);
        const spending12M = monthlyNetSpending * 12; // Spesa netta annualizzata
        
        // Calcola budget annuale basato sul livello
        let budget12M = 0;
        if (cat.budgetLevel === 'primary') {
          budget12M = (cat.monthlyBudget || monthlyNetSpending) * 12;
        } else if (cat.budgetLevel === 'secondary') {
          budget12M = (cat.maxThreshold || cat.monthlyBudget || monthlyNetSpending * 1.2) * 12;
        } else if (cat.budgetLevel === 'optional') {
          budget12M = (cat.monthlyBudget || monthlyNetSpending * 1.5) * 12;
        }

        const difference = budget12M - spending12M;
        const percentageUsed = budget12M > 0 ? (spending12M / budget12M) * 100 : 0;
        const projectedYearEnd = monthlyNetSpending * 12; // Proiezione basata sulla spesa netta

        // Determina status
        let status: CategoryPerformance['status'] = 'no_budget';
        if (budget12M > 0) {
          if (percentageUsed <= 70) status = 'excellent';
          else if (percentageUsed <= 85) status = 'good';
          else if (percentageUsed <= 100) status = 'warning';
          else status = 'critical';
        }

        return {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          budgetLevel: cat.budgetLevel || 'optional',
          spending12M,
          budget12M,
          difference,
          percentageUsed,
          status,
          monthlyAverage: monthlyNetSpending,
          remainingMonths,
          projectedYearEnd
        };
      })
      .sort((a, b) => {
        // Ordina per priorità: critical > warning > good > excellent > no_budget
        const statusOrder = { critical: 1, warning: 2, good: 3, excellent: 4, no_budget: 5 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return b.spending12M - a.spending12M; // Poi per spesa decrescente
      });
  };

  const getStatusIcon = (status: CategoryPerformance['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'no_budget': return <Target className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: CategoryPerformance['status']) => {
    switch (status) {
      case 'excellent': return 'bg-green-50 text-green-800 border-green-200';
      case 'good': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-50 text-red-800 border-red-200';
      case 'no_budget': return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: CategoryPerformance['status']) => {
    switch (status) {
      case 'excellent': return 'Ottimo';
      case 'good': return 'Buono';
      case 'warning': return 'Attenzione';
      case 'critical': return 'Critico';
      case 'no_budget': return 'No Budget';
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getBudgetLevelColor = (level: string) => {
    switch (level) {
      case 'primary': return 'bg-red-100 text-red-800 border-red-200';
      case 'secondary': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'optional': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Caricamento performance categorie...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  const displayData = showAll ? performanceData : performanceData.slice(0, 8);
  const summaryStats = {
    critical: performanceData.filter(p => p.status === 'critical').length,
    warning: performanceData.filter(p => p.status === 'warning').length,
    good: performanceData.filter(p => p.status === 'good').length,
    excellent: performanceData.filter(p => p.status === 'excellent').length,
    totalBudget: performanceData.reduce((sum, p) => sum + p.budget12M, 0),
    totalSpending: performanceData.reduce((sum, p) => sum + p.spending12M, 0)
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-blue-600 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Categoria 12M</h3>
            <p className="text-sm text-gray-600">Monitoraggio spese annuali vs budget per categoria</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-500">
            {performanceData.length} categorie
          </div>
          <button
            onClick={loadPerformanceData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Aggiorna dati"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-600">{summaryStats.critical}</div>
            <div className="text-xs text-red-700">Critiche</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-600">{summaryStats.warning}</div>
            <div className="text-xs text-yellow-700">Attenzione</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{summaryStats.good}</div>
            <div className="text-xs text-blue-700">Buone</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{summaryStats.excellent}</div>
            <div className="text-xs text-green-700">Ottime</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">{formatCurrency(summaryStats.totalSpending)}</div>
            <div className="text-xs text-gray-600">Spesa Totale 12M</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">{formatCurrency(summaryStats.totalBudget)}</div>
            <div className="text-xs text-gray-600">Budget Totale 12M</div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-700">Categoria</th>
                <th className="text-center py-3 px-2 font-medium text-gray-700">Livello</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">Spesa 12M</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">Budget 12M</th>
                <th className="text-right py-3 px-2 font-medium text-gray-700">Differenza</th>
                <th className="text-center py-3 px-2 font-medium text-gray-700">Utilizzo</th>
                <th className="text-center py-3 px-2 font-medium text-gray-700">Stato</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((performance) => (
                <tr key={performance.categoryId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900">{performance.categoryName}</div>
                    <div className="text-xs text-gray-500">
                      Media: {formatCurrency(performance.monthlyAverage)}/mese
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBudgetLevelColor(performance.budgetLevel)}`}>
                      {performance.budgetLevel}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatCurrency(performance.spending12M)}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {performance.budget12M > 0 ? formatCurrency(performance.budget12M) : '-'}
                  </td>
                  <td className={`py-3 px-2 text-right font-medium ${
                    performance.difference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.budget12M > 0 ? (
                      <>
                        {performance.difference >= 0 ? '+' : ''}{formatCurrency(performance.difference)}
                      </>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {performance.budget12M > 0 ? (
                      <div className="flex flex-col items-center">
                        <div className={`text-sm font-medium ${
                          performance.percentageUsed > 100 ? 'text-red-600' : 
                          performance.percentageUsed > 85 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {formatPercentage(performance.percentageUsed)}
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              performance.percentageUsed > 100 ? 'bg-red-500' : 
                              performance.percentageUsed > 85 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(performance.percentageUsed, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(performance.status)}
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(performance.status)}`}>
                        {getStatusText(performance.status)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show More/Less Button */}
        {performanceData.length > 8 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {showAll ? (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Mostra meno
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Mostra tutte ({performanceData.length} categorie)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer with insights */}
      <div className="px-6 py-4 bg-blue-50 rounded-b-xl">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>💡 Come interpretare:</strong>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• <strong>Critici/Attenzione:</strong> Rivedi le spese o aumenta il budget</li>
              <li>• <strong>Buoni/Ottimi:</strong> Hai margine per spese impreviste o puoi risparmiare</li>
              <li>• <strong>Differenza positiva:</strong> Puoi permetterti spese extra nei prossimi mesi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 