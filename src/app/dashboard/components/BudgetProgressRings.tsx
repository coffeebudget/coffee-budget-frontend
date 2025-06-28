'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Target, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface BudgetProgressData {
  categoryName: string;
  budgetLevel: 'primary' | 'secondary' | 'optional';
  currentSpent: number;
  budgetAmount: number;
  percentage: number;
  status: 'under' | 'warning' | 'over' | 'no_budget';
  daysRemaining: number;
  projectedSpend: number;
}

interface CategoryData {
  categoryName: string;
  budgetLevel: 'primary' | 'secondary' | 'optional';
  currentMonthSpent: number;
  monthlyBudget: number | null;
  maxThreshold: number | null;
  budgetStatus: 'under' | 'warning' | 'over' | 'no_budget';
}

export default function BudgetProgressRings({ className = '' }: { className?: string }) {
  const { data: session } = useSession();
  const [budgetData, setBudgetData] = useState<BudgetProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadBudgetProgress();
  }, [session]);

  const loadBudgetProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/categories/budget-categories');
      if (!response.ok) throw new Error('Failed to fetch budget progress');
      
      const categoriesData = await response.json();
      
      // Process data and add time-based projections
      const processedData = categoriesData
        .filter((c: CategoryData) => c.monthlyBudget || c.maxThreshold)
        .map((category: CategoryData) => {
          const budgetAmount = category.monthlyBudget || category.maxThreshold || 0;
          const percentage = budgetAmount > 0 ? (category.currentMonthSpent / budgetAmount) * 100 : 0;
          
          // Calculate days remaining in month
          const now = new Date();
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const daysRemaining = lastDay.getDate() - now.getDate();
          const daysInMonth = lastDay.getDate();
          const daysElapsed = daysInMonth - daysRemaining;
          
          // Project spending based on current pace
          const dailySpend = category.currentMonthSpent / Math.max(1, daysElapsed);
          const projectedSpend = dailySpend * daysInMonth;
          
          return {
            categoryName: category.categoryName,
            budgetLevel: category.budgetLevel,
            currentSpent: category.currentMonthSpent,
            budgetAmount,
            percentage: Math.min(100, percentage),
            status: category.budgetStatus,
            daysRemaining,
            projectedSpend
          };
        })
        .sort((a: BudgetProgressData, b: BudgetProgressData) => b.percentage - a.percentage); // Most critical first

      setBudgetData(processedData);

    } catch (err) {
      console.error('Error loading budget progress:', err);
      setError('Failed to load budget progress');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, percentage: number) => {
    switch (status) {
      case 'over': return { ring: 'stroke-red-500', bg: 'text-red-600' };
      case 'warning': return { ring: 'stroke-yellow-500', bg: 'text-yellow-600' };
      case 'under': 
        if (percentage > 80) return { ring: 'stroke-yellow-500', bg: 'text-yellow-600' };
        return { ring: 'stroke-green-500', bg: 'text-green-600' };
      default: return { ring: 'stroke-gray-300', bg: 'text-gray-500' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'under': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
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

  const CircularProgress = ({ 
    percentage, 
    size = 120, 
    strokeWidth = 8, 
    color = 'stroke-blue-500' 
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${color}`}
            strokeLinecap="round"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {Math.round(percentage)}%
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
          <span>Caricamento progressi budget...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <Target className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (budgetData.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun Budget Configurato</h3>
          <p className="text-gray-600">Configura i budget per le tue categorie per vedere i progressi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Target className="w-6 h-6 text-blue-600 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progressi Budget</h3>
            <p className="text-sm text-gray-600">Monitoraggio spese vs budget mensili</p>
          </div>
        </div>
        <button
          onClick={loadBudgetProgress}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetData.slice(0, 9).map((budget, index) => {
            const colors = getStatusColor(budget.status, budget.percentage);
            const projectedPercentage = (budget.projectedSpend / budget.budgetAmount) * 100;
            
            return (
              <div key={budget.categoryName} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 truncate">{budget.categoryName}</h4>
                  {getStatusIcon(budget.status)}
                </div>

                <div className="flex items-center justify-center mb-4">
                  <CircularProgress 
                    percentage={budget.percentage} 
                    color={colors.ring}
                    size={100}
                    strokeWidth={6}
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speso:</span>
                    <span className="font-medium">{formatCurrency(budget.currentSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">{formatCurrency(budget.budgetAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rimanente:</span>
                    <span className={`font-medium ${
                      budget.budgetAmount - budget.currentSpent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(budget.budgetAmount - budget.currentSpent)}
                    </span>
                  </div>
                  
                  {/* Projection */}
                  {budget.daysRemaining > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Proiezione:</span>
                        <span className={`text-xs font-medium ${
                          projectedPercentage > 100 ? 'text-red-600' : 
                          projectedPercentage > 90 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(budget.projectedSpend)} ({Math.round(projectedPercentage)}%)
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {budget.daysRemaining} giorni rimanenti
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {budgetData.filter(b => b.status === 'under').length}
            </div>
            <div className="text-sm text-green-700">Sotto Budget</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {budgetData.filter(b => b.status === 'warning').length}
            </div>
            <div className="text-sm text-yellow-700">In Warning</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {budgetData.filter(b => b.status === 'over').length}
            </div>
            <div className="text-sm text-red-700">Superato</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(budgetData.reduce((sum, b) => sum + b.percentage, 0) / budgetData.length)}%
            </div>
            <div className="text-sm text-blue-700">Utilizzo Medio</div>
          </div>
        </div>
      </div>
    </div>
  );
} 