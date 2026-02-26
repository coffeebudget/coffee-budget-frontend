'use client';

import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Wallet,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  Clock,
  Link2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fetchLongTermStatus } from '@/lib/api/expense-plans';
import {
  usePendingLinkSuggestions,
  useApproveLinkSuggestion,
  useRejectLinkSuggestion,
} from '@/hooks/useTransactionLinkSuggestions';
import type { TransactionLinkSuggestion } from '@/types/transaction-link-suggestion-types';
import {
  formatSuggestionAmount,
  formatSuggestionDate,
} from '@/types/transaction-link-suggestion-types';
import type {
  ConnectionStatusSummary,
  ConnectionAlert,
} from '@/types/gocardless-types';
import { formatExpirationMessage } from '@/types/gocardless-types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: string;
  source: 'smart' | 'bank' | 'link';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  icon: LucideIcon;
  iconColor: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  timestamp?: string;
}

interface DismissedEntry {
  id: string;
  dismissedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCALSTORAGE DISMISSAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'dismissed-notifications';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const entries: DismissedEntry[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out entries older than 7 days
    const valid = entries.filter((e) => now - e.dismissedAt < EXPIRY_MS);
    // Persist cleaned list if any were removed
    if (valid.length !== entries.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return new Set(valid.map((e) => e.id));
  } catch {
    return new Set();
  }
}

function persistDismissedId(id: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  next.add(id);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const entries: DismissedEntry[] = raw ? JSON.parse(raw) : [];
    if (!entries.some((e) => e.id === id)) {
      entries.push({ id, dismissedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full or unavailable
  }
  return next;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT DATA FETCHER
// ═══════════════════════════════════════════════════════════════════════════

interface RawAlertData {
  dashboardData: any[];
  duplicatesData: any[];
  expensePlansData: any;
  bankStatus: ConnectionStatusSummary | null;
}

async function fetchAllAlertData(token: string): Promise<RawAlertData> {
  const [dashboardRes, duplicatesRes, expensePlansData, bankRes] =
    await Promise.all([
      fetch('/api/dashboard/monthly-summary?months=3').catch(() => null),
      fetch('/api/pending-duplicates').catch(() => null),
      fetchLongTermStatus(token).catch(() => null),
      fetch('/api/gocardless/connection-status').catch(() => null),
    ]);

  const dashboardData =
    dashboardRes?.ok ? await dashboardRes.json() : [];
  const duplicatesData =
    duplicatesRes?.ok ? await duplicatesRes.json() : [];
  const bankStatus: ConnectionStatusSummary | null =
    bankRes?.ok ? await bankRes.json() : null;

  return { dashboardData, duplicatesData, expensePlansData, bankStatus };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFORM: Smart Alerts
// ═══════════════════════════════════════════════════════════════════════════

function buildSmartNotifications(raw: RawAlertData): Notification[] {
  const notifications: Notification[] = [];
  const { dashboardData, duplicatesData, expensePlansData } = raw;

  // 1. Expense Plan Alerts
  if (expensePlansData?.plansNeedingAttention) {
    expensePlansData.plansNeedingAttention.forEach((plan: any) => {
      if (plan.status === 'behind') {
        notifications.push({
          id: `smart-plan_behind-${plan.id}`,
          source: 'smart',
          severity: 'high',
          title: plan.name,
          message: `Plan behind schedule: \u20AC${plan.amountNeeded?.toFixed(2) || '0'} short with ${plan.monthsUntilDue || '?'} months until due`,
          icon: Wallet,
          iconColor: 'text-red-500',
          action: {
            label: 'Manage expense plans',
            href: '/expense-plans',
          },
        });
      } else if (plan.status === 'almost_ready') {
        notifications.push({
          id: `smart-plan_at_risk-${plan.id}`,
          source: 'smart',
          severity: 'medium',
          title: plan.name,
          message: `Plan almost ready but needs \u20AC${plan.amountNeeded?.toFixed(2) || '0'} more`,
          icon: Wallet,
          iconColor: 'text-yellow-500',
          action: {
            label: 'Manage expense plans',
            href: '/expense-plans',
          },
        });
      }
    });
  }

  // Shortfall summary
  if (expensePlansData?.totalAmountNeeded > 0) {
    const behindCount =
      expensePlansData.plansNeedingAttention?.filter(
        (p: any) => p.status === 'behind'
      ).length || 0;
    if (behindCount > 2) {
      notifications.push({
        id: 'smart-shortfall-0',
        source: 'smart',
        severity: 'high',
        title: 'Summary',
        message: `${behindCount} plans behind schedule - Total amount needed: \u20AC${expensePlansData.totalAmountNeeded.toFixed(2)}`,
        icon: Wallet,
        iconColor: 'text-red-500',
        action: {
          label: 'Manage expense plans',
          href: '/expense-plans',
        },
      });
    }
  }

  // 2. Cash Flow Alerts
  if (Array.isArray(dashboardData) && dashboardData.length >= 2) {
    const currentMonth = dashboardData[dashboardData.length - 1];
    const previousMonth = dashboardData[dashboardData.length - 2];

    const currentNet = currentMonth.income - currentMonth.expenses;
    const previousNet = previousMonth.income - previousMonth.expenses;

    if (currentNet < previousNet && previousNet - currentNet > 200) {
      notifications.push({
        id: 'smart-negative_trend-0',
        source: 'smart',
        severity: 'medium',
        title: 'Negative trend',
        message: `Cash flow worsened by \u20AC${(previousNet - currentNet).toFixed(2)} compared to last month`,
        icon: TrendingDown,
        iconColor: 'text-red-500',
        action: {
          label: 'View transactions',
          href: '/transactions',
        },
      });
    }

    if (currentNet < 0) {
      notifications.push({
        id: 'smart-low_balance-0',
        source: 'smart',
        severity: currentNet < -500 ? 'high' : 'medium',
        title: 'Negative cash flow',
        message: `Negative cash flow: \u20AC${Math.abs(currentNet).toFixed(2)}`,
        icon: TrendingDown,
        iconColor: 'text-red-500',
        action: {
          label: 'View transactions',
          href: '/transactions',
        },
      });
    }

    const expenseIncrease =
      ((currentMonth.expenses - previousMonth.expenses) /
        previousMonth.expenses) *
      100;
    if (expenseIncrease > 30) {
      notifications.push({
        id: 'smart-unusual_spending-0',
        source: 'smart',
        severity: 'medium',
        title: 'Rising expenses',
        message: `Expenses increased by ${expenseIncrease.toFixed(0)}% compared to last month`,
        icon: CreditCard,
        iconColor: 'text-orange-500',
        action: {
          label: 'View transactions',
          href: '/transactions',
        },
      });
    }
  }

  // 3. Duplicate Alerts
  if (Array.isArray(duplicatesData) && duplicatesData.length > 0) {
    notifications.push({
      id: `smart-pending_duplicates-${duplicatesData.length}`,
      source: 'smart',
      severity: duplicatesData.length > 10 ? 'medium' : 'low',
      title: 'Duplicates to review',
      message: `${duplicatesData.length} duplicate transactions to review`,
      icon: AlertTriangle,
      iconColor: 'text-purple-500',
      action: {
        label: 'Manage duplicates',
        href: '/pending-duplicates',
      },
    });
  }

  return notifications;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFORM: Bank Connection Alerts
// ═══════════════════════════════════════════════════════════════════════════

function buildBankNotifications(raw: RawAlertData): Notification[] {
  const { bankStatus } = raw;
  if (!bankStatus?.alerts?.length) return [];

  return bankStatus.alerts.map((alert: ConnectionAlert) => ({
    id: `bank-${alert.status}-${alert.connectionId}`,
    source: 'bank' as const,
    severity: alert.status === 'expired' ? ('high' as const) : ('medium' as const),
    title: alert.institutionName || 'Bank Connection',
    message: formatExpirationMessage(alert.daysUntilExpiration),
    icon: alert.status === 'expired' ? AlertTriangle : Clock,
    iconColor:
      alert.status === 'expired' ? 'text-red-500' : 'text-yellow-500',
    action: {
      label: 'Reconnect bank',
      href: `/bank-accounts?reconnect=${alert.connectionId}`,
    },
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFORM: Link Suggestion Alerts
// ═══════════════════════════════════════════════════════════════════════════

function buildLinkNotifications(
  suggestions: TransactionLinkSuggestion[],
  onApprove: (suggestion: TransactionLinkSuggestion) => void,
  onReject: (suggestion: TransactionLinkSuggestion, neverAsk: boolean) => void
): Notification[] {
  return suggestions.map((s) => ({
    id: `link-suggestion-${s.id}`,
    source: 'link' as const,
    severity: 'low' as const,
    title: `"${s.transactionDescription}" ${formatSuggestionAmount(s.transactionAmount)}`,
    message: `${formatSuggestionDate(s.transactionDate)} \u2192 Link to: ${s.expensePlanIcon ? s.expensePlanIcon + ' ' : ''}${s.expensePlanName}`,
    icon: Link2,
    iconColor: 'text-purple-500',
    action: {
      label: 'Link',
      onClick: () => onApprove(s),
    },
    secondaryAction: {
      label: 'Don\'t ask again',
      onClick: () => onReject(s, true),
    },
    timestamp: s.createdAt,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// SEVERITY SORT ORDER
// ═══════════════════════════════════════════════════════════════════════════

const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useNotifications() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string;

  // Dismissed IDs (localStorage-persisted)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissedIds(loadDismissedIds());
  }, []);

  // Core alert data (smart + bank)
  const {
    data: rawAlertData,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchAllAlertData(token),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  // Link suggestions (own React Query cache)
  const {
    data: linkSuggestions,
    isLoading: linksLoading,
    refetch: refetchLinks,
  } = usePendingLinkSuggestions();

  const approveMutation = useApproveLinkSuggestion();
  const rejectMutation = useRejectLinkSuggestion();

  const handleApprove = useCallback(
    (suggestion: TransactionLinkSuggestion) => {
      approveMutation.mutate({ id: suggestion.id });
    },
    [approveMutation]
  );

  const handleReject = useCallback(
    (suggestion: TransactionLinkSuggestion, neverAsk: boolean) => {
      rejectMutation.mutate({
        id: suggestion.id,
        data: { neverAskForPlan: neverAsk },
      });
    },
    [rejectMutation]
  );

  // Build unified notification list
  const notifications: Notification[] = [];

  if (rawAlertData) {
    notifications.push(...buildSmartNotifications(rawAlertData));
    notifications.push(...buildBankNotifications(rawAlertData));
  }

  if (linkSuggestions?.length) {
    notifications.push(
      ...buildLinkNotifications(linkSuggestions, handleApprove, handleReject)
    );
  }

  // Filter out dismissed (link suggestions use backend dismissal, not localStorage)
  const filtered = notifications.filter((n) => {
    if (n.source === 'link') return true; // managed by backend mutations
    return !dismissedIds.has(n.id);
  });

  // Sort by severity
  filtered.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2)
  );

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => persistDismissedId(id, prev));
  }, []);

  const refresh = useCallback(() => {
    refetchAlerts();
    refetchLinks();
  }, [refetchAlerts, refetchLinks]);

  return {
    notifications: filtered,
    count: filtered.length,
    isLoading: alertsLoading || linksLoading,
    dismiss,
    refresh,
  };
}
