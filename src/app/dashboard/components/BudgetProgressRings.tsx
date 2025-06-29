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
  // Rolling 12M data
  rolling12MSpent: number;
  rolling12MBudget: number;
  rolling12MPercentage: number;
  rolling12MStatus: 'under' | 'warning' | 'over' | 'no_budget';
}

interface CategoryData {
  categoryName: string;
  budgetLevel: 'primary' | 'secondary' | 'optional';
  currentMonthSpent: number;
  monthlyBudget: number | null;
  maxThreshold: number | null;
  budgetStatus: 'under' | 'warning' | 'over' | 'no_budget';
  averageMonthlySpending: number;
  averageMonthlyNetFlow: number;
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
        .filter((c: CategoryData) => (c.averageMonthlyNetFlow || 0) <= 0) // Solo categorie di spesa
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
          
          // Calculate Rolling 12M data
          const monthlyNetSpending = Math.abs(category.averageMonthlyNetFlow || 0);
          const rolling12MSpent = monthlyNetSpending * 12;
          
          // Calculate 12M budget based on level
          let rolling12MBudget = 0;
          if (category.budgetLevel === 'primary') {
            rolling12MBudget = (category.monthlyBudget || monthlyNetSpending) * 12;
          } else if (category.budgetLevel === 'secondary') {
            rolling12MBudget = (category.maxThreshold || category.monthlyBudget || monthlyNetSpending * 1.2) * 12;
          } else if (category.budgetLevel === 'optional') {
            rolling12MBudget = (category.monthlyBudget || monthlyNetSpending * 1.5) * 12;
          }
          
          const rolling12MPercentage = rolling12MBudget > 0 ? (rolling12MSpent / rolling12MBudget) * 100 : 0;
          
          // Determine 12M status
          let rolling12MStatus: 'under' | 'warning' | 'over' | 'no_budget' = 'no_budget';
          if (rolling12MBudget > 0) {
            if (rolling12MPercentage > 100) rolling12MStatus = 'over';
            else if (rolling12MPercentage > 85) rolling12MStatus = 'warning';
            else rolling12MStatus = 'under';
          }
          
          return {
            categoryName: category.categoryName,
            budgetLevel: category.budgetLevel,
            currentSpent: category.currentMonthSpent,
            budgetAmount,
            percentage: Math.min(100, percentage),
            status: category.budgetStatus,
            daysRemaining,
            projectedSpend,
            rolling12MSpent,
            rolling12MBudget,
            rolling12MPercentage: Math.min(100, rolling12MPercentage),
            rolling12MStatus
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
          <p className="text-sm text-gray-600">Monitoraggio mensile e Rolling 12M</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgetData.slice(0, 9).map((budget, index) => {
            const colors = getStatusColor(budget.status, budget.percentage);
            const projectedPercentage = (budget.projectedSpend / budget.budgetAmount) * 100;
            
            // Determine budget level styling
            const levelConfig = {
              primary: { 
                bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', 
                border: 'border-blue-200',
                badge: 'bg-blue-100 text-blue-700'
              },
              secondary: { 
                bg: 'bg-gradient-to-br from-green-50 to-emerald-50', 
                border: 'border-green-200',
                badge: 'bg-green-100 text-green-700'
              },
              optional: { 
                bg: 'bg-gradient-to-br from-amber-50 to-orange-50', 
                border: 'border-amber-200',
                badge: 'bg-amber-100 text-amber-700'
              }
            };
            
            const levelStyle = levelConfig[budget.budgetLevel];
            
            return (
              <div 
                key={budget.categoryName} 
                className={`${levelStyle.bg} ${levelStyle.border} border-2 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-base leading-tight truncate">{budget.categoryName}</h4>
                    <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelStyle.badge}`}>
                      {budget.budgetLevel.charAt(0).toUpperCase() + budget.budgetLevel.slice(1)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    {getStatusIcon(budget.status)}
                    <div className={`w-3 h-3 rounded-full ${colors.ring === 'stroke-red-500' ? 'bg-red-400' : colors.ring === 'stroke-yellow-500' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                  </div>
                </div>

                {/* Progress Ring with enhanced styling */}
                <div className="flex items-center justify-center mb-4 relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-sm scale-110"></div>
                  <CircularProgress 
                    percentage={budget.percentage} 
                    color={colors.ring}
                    size={90}
                    strokeWidth={8}
                  />
                </div>

                {/* Compact Stats */}
                <div className="space-y-3">
                  {/* Monthly Overview - Compact */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-700">Mese Corrente</span>
                      </div>
                      <span className="text-xs text-gray-500">{budget.daysRemaining}g rimasti</span>
                    </div>
                    
                                         <div className="space-y-2">
                       <div className="grid grid-cols-2 gap-2 text-xs">
                         <div>
                           <div className="text-gray-600">Speso</div>
                           <div className="font-semibold text-gray-900">{formatCurrency(budget.currentSpent)}</div>
                         </div>
                         <div>
                           <div className="text-gray-600">Budget</div>
                           <div className="font-semibold text-blue-600">{formatCurrency(budget.budgetAmount)}</div>
                         </div>
                       </div>
                       <div className="pt-1 border-t border-gray-100">
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-600">Rimanente</span>
                           <span className={`font-semibold ${
                             budget.budgetAmount - budget.currentSpent >= 0 ? 'text-green-600' : 'text-red-600'
                           }`}>
                             {formatCurrency(budget.budgetAmount - budget.currentSpent)}
                           </span>
                         </div>
                       </div>
                     </div>

                    {/* Projection bar */}
                    {budget.daysRemaining > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Proiezione</span>
                          <span className={`font-medium ${
                            projectedPercentage > 100 ? 'text-red-600' : 
                            projectedPercentage > 90 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {Math.round(projectedPercentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              projectedPercentage > 100 ? 'bg-red-400' : 
                              projectedPercentage > 90 ? 'bg-amber-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min(100, projectedPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rolling 12M - Compact */}
                  {budget.rolling12MBudget > 0 && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-xs font-semibold text-blue-800">Rolling 12M</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          budget.rolling12MStatus === 'over' ? 'bg-red-100 text-red-700' : 
                          budget.rolling12MStatus === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {Math.round(budget.rolling12MPercentage)}%
                        </span>
                      </div>
                      
                                             <div className="space-y-2">
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div>
                             <div className="text-blue-600">Spesa Annua</div>
                             <div className="font-semibold text-blue-900">{formatCurrency(budget.rolling12MSpent)}</div>
                           </div>
                           <div>
                             <div className="text-blue-600">Budget Annuo</div>
                             <div className="font-semibold text-blue-700">{formatCurrency(budget.rolling12MBudget)}</div>
                           </div>
                         </div>
                         <div className="pt-1 border-t border-blue-100">
                           <div className="flex justify-between items-center text-xs">
                             <span className="text-blue-600">Delta</span>
                             <span className={`font-semibold ${
                               budget.rolling12MBudget - budget.rolling12MSpent >= 0 ? 'text-green-600' : 'text-red-600'
                             }`}>
                               {budget.rolling12MBudget - budget.rolling12MSpent >= 0 ? '+' : ''}{formatCurrency(budget.rolling12MBudget - budget.rolling12MSpent)}
                             </span>
                           </div>
                         </div>
                       </div>

                      {/* Rolling 12M progress bar */}
                      <div className="mt-2 pt-2 border-t border-blue-100">
                        <div className="w-full bg-blue-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              budget.rolling12MStatus === 'over' ? 'bg-red-500' : 
                              budget.rolling12MStatus === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, budget.rolling12MPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
} 