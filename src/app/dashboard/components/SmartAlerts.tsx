'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  TrendingDown, 
  CreditCard, 
  PiggyBank,
  X,
  RefreshCw,
  Bell,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface BudgetAlert {
  type: 'budget_exceeded' | 'budget_warning' | 'savings_target';
  severity: 'high' | 'medium' | 'low';
  categoryName: string;
  categoryId: number;
  currentAmount: number;
  budgetAmount: number;
  percentage: number;
  message: string;
}

interface CashFlowAlert {
  type: 'negative_trend' | 'low_balance' | 'unusual_spending';
  severity: 'high' | 'medium' | 'low';
  message: string;
  amount?: number;
  suggestion: string;
}

interface DuplicateAlert {
  type: 'pending_duplicates';
  severity: 'medium' | 'low';
  count: number;
  message: string;
  actionUrl: string;
}

interface SmartAlertsData {
  budgetAlerts: BudgetAlert[];
  cashFlowAlerts: CashFlowAlert[];
  duplicateAlerts: DuplicateAlert[];
  totalAlerts: number;
  criticalAlerts: number;
}

export default function SmartAlerts({ className = '' }: { className?: string }) {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<SmartAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    loadSmartAlerts();
  }, [session]);

  const loadSmartAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetRes, dashboardRes, duplicatesRes] = await Promise.all([
        fetch('/api/categories/budget-categories'),
        fetch('/api/dashboard/monthly-summary?months=3'),
        fetch('/api/pending-duplicates'),
      ]);

      if (!budgetRes.ok || !dashboardRes.ok) {
        throw new Error('Failed to fetch alerts data');
      }

      const budgetData = await budgetRes.json();
      const dashboardData = await dashboardRes.json();
      const duplicatesData = duplicatesRes.ok ? await duplicatesRes.json() : [];

      const processedAlerts = processAlerts(budgetData, dashboardData, duplicatesData);
      setAlerts(processedAlerts);

    } catch (err) {
      console.error('Error loading smart alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const processAlerts = (budgetData: any[], dashboardData: any[], duplicatesData: any[]): SmartAlertsData => {
    const budgetAlerts: BudgetAlert[] = [];
    const cashFlowAlerts: CashFlowAlert[] = [];
    const duplicateAlerts: DuplicateAlert[] = [];

    // 1. BUDGET ALERTS
    budgetData.forEach(category => {
      if (category.budgetStatus === 'over') {
        budgetAlerts.push({
          type: 'budget_exceeded',
          severity: 'high',
          categoryName: category.categoryName,
          categoryId: category.categoryId,
          currentAmount: category.currentMonthSpent,
          budgetAmount: category.monthlyBudget || category.maxThreshold,
          percentage: Math.round((category.currentMonthSpent / (category.monthlyBudget || category.maxThreshold)) * 100),
          message: `Budget superato del ${Math.round(((category.currentMonthSpent / (category.monthlyBudget || category.maxThreshold)) - 1) * 100)}%`
        });
      } else if (category.budgetStatus === 'warning') {
        budgetAlerts.push({
          type: 'budget_warning',
          severity: 'medium',
          categoryName: category.categoryName,
          categoryId: category.categoryId,
          currentAmount: category.currentMonthSpent,
          budgetAmount: category.monthlyBudget || category.maxThreshold,
          percentage: Math.round((category.currentMonthSpent / (category.monthlyBudget || category.maxThreshold)) * 100),
          message: `Utilizzato ${Math.round((category.currentMonthSpent / (category.monthlyBudget || category.maxThreshold)) * 100)}% del budget`
        });
      }

      // 🎯 NUOVO ALERT: Categorie Primary che superano la spesa media storica
      if (category.budgetLevel === 'primary' && category.averageMonthlySpending && category.averageMonthlySpending > 0) {
        const spendingVsAverage = category.currentMonthSpent / category.averageMonthlySpending;
        
        if (spendingVsAverage > 1.2) { // Più di 20% sopra la media
          budgetAlerts.push({
            type: 'savings_target',
            severity: spendingVsAverage > 1.5 ? 'medium' : 'low',
            categoryName: category.categoryName,
            categoryId: category.categoryId,
            currentAmount: category.currentMonthSpent,
            budgetAmount: category.averageMonthlySpending,
            percentage: Math.round(spendingVsAverage * 100),
            message: `Spesa ${Math.round((spendingVsAverage - 1) * 100)}% sopra la media storica`
          });
        } else if (category.currentMonthSpent > 0 && spendingVsAverage < 0.8) {
          // Alert positivo per le categorie primary con spesa sotto la media
          budgetAlerts.push({
            type: 'savings_target',
            severity: 'low',
            categoryName: category.categoryName,
            categoryId: category.categoryId,
            currentAmount: category.currentMonthSpent,
            budgetAmount: category.averageMonthlySpending,
            percentage: Math.round(spendingVsAverage * 100),
            message: `Spesa ${Math.round((1 - spendingVsAverage) * 100)}% sotto la media - Ottimo controllo!`
          });
        }
      }
    });

    // 2. CASH FLOW ALERTS
    if (dashboardData.length >= 2) {
      const currentMonth = dashboardData[dashboardData.length - 1];
      const previousMonth = dashboardData[dashboardData.length - 2];
      
      const currentNet = currentMonth.income - currentMonth.expenses;
      const previousNet = previousMonth.income - previousMonth.expenses;
      
      if (currentNet < previousNet && (previousNet - currentNet) > 200) {
        cashFlowAlerts.push({
          type: 'negative_trend',
          severity: 'medium',
          message: `Il flusso di cassa è peggiorato di €${(previousNet - currentNet).toFixed(2)} rispetto al mese scorso`,
          amount: previousNet - currentNet,
          suggestion: 'Controlla le spese delle categorie secondarie'
        });
      }

      if (currentNet < 0) {
        cashFlowAlerts.push({
          type: 'low_balance',
          severity: currentNet < -500 ? 'high' : 'medium',
          message: `Flusso di cassa negativo: €${Math.abs(currentNet).toFixed(2)}`,
          amount: Math.abs(currentNet),
          suggestion: 'Rivedi il budget e riduci le spese non essenziali'
        });
      }

      const expenseIncrease = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
      if (expenseIncrease > 30) {
        cashFlowAlerts.push({
          type: 'unusual_spending',
          severity: 'medium',
          message: `Spese aumentate del ${expenseIncrease.toFixed(0)}% rispetto al mese scorso`,
          amount: currentMonth.expenses - previousMonth.expenses,
          suggestion: 'Verifica le transazioni recenti per spese insolite'
        });
      }
    }

    // 3. PENDING DUPLICATES ALERTS
    if (duplicatesData.length > 0) {
      duplicateAlerts.push({
        type: 'pending_duplicates',
        severity: duplicatesData.length > 10 ? 'medium' : 'low',
        count: duplicatesData.length,
        message: `${duplicatesData.length} transazioni duplicate da rivedere`,
        actionUrl: '/pending-duplicates'
      });
    }

    const totalAlerts = budgetAlerts.length + cashFlowAlerts.length + duplicateAlerts.length;
    const criticalAlerts = budgetAlerts.filter(a => a.severity === 'high').length + 
                          cashFlowAlerts.filter(a => a.severity === 'high').length;

    return {
      budgetAlerts,
      cashFlowAlerts,
      duplicateAlerts,
      totalAlerts,
      criticalAlerts
    };
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'budget_exceeded':
      case 'budget_warning':
        return <AlertTriangle className={`w-5 h-5 ${severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />;
      case 'savings_target':
        return severity === 'medium' ? 
          <AlertTriangle className="w-5 h-5 text-orange-500" /> : 
          <PiggyBank className="w-5 h-5 text-blue-500" />;
      case 'negative_trend':
      case 'low_balance':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'unusual_spending':
        return <CreditCard className="w-5 h-5 text-orange-500" />;
      case 'pending_duplicates':
        return <AlertTriangle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Caricamento alert...</span>
        </div>
      </div>
    );
  }

  if (error || !alerts) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error || 'Errore nel caricamento alert'}</span>
        </div>
      </div>
    );
  }

  if (alerts.totalAlerts === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-700 font-medium">Tutto sotto controllo!</span>
          <span className="text-green-600 ml-2">Nessun alert attivo.</span>
        </div>
      </div>
    );
  }

  const visibleAlerts = [
    ...alerts.budgetAlerts,
    ...alerts.cashFlowAlerts,
    ...alerts.duplicateAlerts
  ].filter(alert => {
    const alertId = `${alert.type}-${('categoryId' in alert) ? alert.categoryId : ('count' in alert) ? alert.count : 'general'}`;
    return !dismissedAlerts.has(alertId);
  });

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Bell className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Alert Intelligenti</h3>
          {alerts.criticalAlerts > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {alerts.criticalAlerts} critici
            </span>
          )}
          <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
            {visibleAlerts.length} totali
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadSmartAlerts}
            className="p-1 hover:bg-gray-100 rounded"
            title="Aggiorna alert"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded"
            title={collapsed ? "Espandi" : "Comprimi"}
          >
            <ArrowRight className={`w-4 h-4 text-gray-500 transform transition-transform ${collapsed ? 'rotate-90' : 'rotate-0'}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {alerts.budgetAlerts.map((alert, index) => {
            const alertId = `${alert.type}-${alert.categoryId}`;
            if (dismissedAlerts.has(alertId)) return null;
            
            return (
              <div key={alertId} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{alert.categoryName}</span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {alert.percentage}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(alert.currentAmount)} / {formatCurrency(alert.budgetAmount)}
                      </p>
                      {alert.type !== 'savings_target' && (
                        <Link 
                          href="/budget-management" 
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                        >
                          Gestisci budget <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alertId)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {alerts.cashFlowAlerts.map((alert, index) => {
            const alertId = `${alert.type}-${index}`;
            if (dismissedAlerts.has(alertId)) return null;
            
            return (
              <div key={alertId} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.suggestion}</p>
                      {alert.amount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Importo: {formatCurrency(alert.amount)}
                        </p>
                      )}
                      <Link 
                        href="/transactions" 
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                      >
                        Vedi transazioni <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alertId)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Duplicate Alerts */}
          {alerts.duplicateAlerts.map((alert, index) => {
            const alertId = `${alert.type}-${alert.count}`;
            if (dismissedAlerts.has(alertId)) return null;
            
            return (
              <div key={alertId} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Rivedi e risolvi i duplicati per mantenere pulito il database delle transazioni
                      </p>
                      <Link 
                        href={alert.actionUrl} 
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                      >
                        Gestisci duplicati <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alertId)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 