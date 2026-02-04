'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  AlertTriangle,
  TrendingDown,
  CreditCard,
  X,
  RefreshCw,
  Bell,
  CheckCircle,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { fetchLongTermStatus } from '@/lib/api/expense-plans';

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

interface ExpensePlanAlert {
  type: 'plan_behind' | 'plan_at_risk' | 'shortfall';
  severity: 'high' | 'medium' | 'low';
  planName: string;
  planId: number;
  message: string;
  amount?: number;
}

interface SmartAlertsData {
  expensePlanAlerts: ExpensePlanAlert[];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.accessToken]);

  const loadSmartAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = session?.user?.accessToken as string;

      const [dashboardRes, duplicatesRes, expensePlansData] = await Promise.all([
        fetch('/api/dashboard/monthly-summary?months=3'),
        fetch('/api/pending-duplicates'),
        fetchLongTermStatus(token).catch(() => null),
      ]);

      if (!dashboardRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await dashboardRes.json();
      const duplicatesData = duplicatesRes.ok ? await duplicatesRes.json() : [];

      const processedAlerts = processAlerts(dashboardData, duplicatesData, expensePlansData);
      setAlerts(processedAlerts);

    } catch (err) {
      console.error('Error loading smart alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const processAlerts = (dashboardData: any[], duplicatesData: any[], expensePlansData: any): SmartAlertsData => {
    const expensePlanAlerts: ExpensePlanAlert[] = [];
    const cashFlowAlerts: CashFlowAlert[] = [];
    const duplicateAlerts: DuplicateAlert[] = [];

    // 1. EXPENSE PLAN ALERTS
    if (expensePlansData?.plansNeedingAttention) {
      expensePlansData.plansNeedingAttention.forEach((plan: any) => {
        if (plan.status === 'behind') {
          expensePlanAlerts.push({
            type: 'plan_behind',
            severity: 'high',
            planName: plan.name,
            planId: plan.id,
            message: `Piano in ritardo: mancano €${plan.amountNeeded?.toFixed(2) || '0'} con ${plan.monthsUntilDue || '?'} mesi alla scadenza`,
            amount: plan.amountNeeded
          });
        } else if (plan.status === 'almost_ready') {
          expensePlanAlerts.push({
            type: 'plan_at_risk',
            severity: 'medium',
            planName: plan.name,
            planId: plan.id,
            message: `Piano quasi pronto ma necessita di €${plan.amountNeeded?.toFixed(2) || '0'} aggiuntivi`,
            amount: plan.amountNeeded
          });
        }
      });
    }

    // Check for overall shortfall
    if (expensePlansData?.totalAmountNeeded > 0) {
      const behindCount = expensePlansData.plansNeedingAttention?.filter((p: any) => p.status === 'behind').length || 0;
      if (behindCount > 2) {
        expensePlanAlerts.push({
          type: 'shortfall',
          severity: 'high',
          planName: 'Riepilogo',
          planId: 0,
          message: `${behindCount} piani in ritardo - Importo totale necessario: €${expensePlansData.totalAmountNeeded.toFixed(2)}`,
          amount: expensePlansData.totalAmountNeeded
        });
      }
    }

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
          suggestion: 'Controlla le spese recenti'
        });
      }

      if (currentNet < 0) {
        cashFlowAlerts.push({
          type: 'low_balance',
          severity: currentNet < -500 ? 'high' : 'medium',
          message: `Flusso di cassa negativo: €${Math.abs(currentNet).toFixed(2)}`,
          amount: Math.abs(currentNet),
          suggestion: 'Rivedi i piani di spesa e riduci le spese non essenziali'
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

    const totalAlerts = expensePlanAlerts.length + cashFlowAlerts.length + duplicateAlerts.length;
    const criticalAlerts = expensePlanAlerts.filter(a => a.severity === 'high').length +
                          cashFlowAlerts.filter(a => a.severity === 'high').length;

    return {
      expensePlanAlerts,
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
      case 'plan_behind':
      case 'plan_at_risk':
      case 'shortfall':
        return <Wallet className={`w-5 h-5 ${severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />;
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
    ...alerts.expensePlanAlerts,
    ...alerts.cashFlowAlerts,
    ...alerts.duplicateAlerts
  ].filter(alert => {
    const alertId = `${alert.type}-${('planId' in alert) ? alert.planId : ('count' in alert) ? alert.count : 'general'}`;
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
          {/* Expense Plan Alerts */}
          {alerts.expensePlanAlerts.map((alert, index) => {
            const alertId = `${alert.type}-${alert.planId}`;
            if (dismissedAlerts.has(alertId)) return null;

            return (
              <div key={alertId} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{alert.planName}</span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {alert.type === 'plan_behind' ? 'In ritardo' :
                           alert.type === 'plan_at_risk' ? 'A rischio' : 'Shortfall'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.amount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Importo necessario: {formatCurrency(alert.amount)}
                        </p>
                      )}
                      <Link
                        href="/expense-plans"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center"
                      >
                        Gestisci piani spesa <ArrowRight className="w-3 h-3 ml-1" />
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

          {/* Cash Flow Alerts */}
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
