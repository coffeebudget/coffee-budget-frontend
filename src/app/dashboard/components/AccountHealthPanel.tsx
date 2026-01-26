'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useCoverageSummary, useAccountAllocationSummary } from '@/hooks/useExpensePlans';
import { useCreditCards } from '@/hooks/useCreditCards';
import {
  AccountCoverage,
  AccountAllocationSummary,
  getAccountHealthStatusLabel,
  getAccountHealthStatusColor,
} from '@/types/expense-plan-types';
import { CreditCard as CreditCardType } from '@/utils/types';

interface AccountHealthPanelProps {
  className?: string;
}

export default function AccountHealthPanel({ className = '' }: AccountHealthPanelProps) {
  const { data: coverageSummary, isLoading: coverageLoading } = useCoverageSummary();
  const { data: allocationSummary, isLoading: allocationLoading } = useAccountAllocationSummary();
  const { data: creditCards, isLoading: cardsLoading } = useCreditCards();

  const isLoading = coverageLoading || cardsLoading || allocationLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getHealthStatus = (account: AccountCoverage) => {
    if (account.hasShortfall) {
      return { status: 'danger', label: 'Scoperto', color: 'bg-red-100 text-red-800' };
    }
    if (account.projectedBalance < account.currentBalance * 0.2) {
      return { status: 'warning', label: 'Attenzione', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'healthy', label: 'OK', color: 'bg-green-100 text-green-800' };
  };

  const getCreditCardHealth = (card: CreditCardType) => {
    const usedPercent = ((card.creditLimit - card.availableCredit) / card.creditLimit) * 100;
    if (usedPercent > 80) {
      return { status: 'danger', label: 'Alto utilizzo', color: 'bg-red-100 text-red-800' };
    }
    if (usedPercent > 50) {
      return { status: 'warning', label: 'Moderato', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'healthy', label: 'OK', color: 'bg-green-100 text-green-800' };
  };

  // Get allocation data for an account
  const getAllocationForAccount = (accountId: number): AccountAllocationSummary | undefined => {
    return allocationSummary?.accounts.find(a => a.accountId === accountId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Salute Conti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const bankAccounts = coverageSummary?.accounts || [];
  const cards = creditCards || [];
  const hasAllocationShortfall = allocationSummary?.overallStatus === 'shortfall';
  const hasAnyIssue = bankAccounts.some(a => a.hasShortfall) ||
    cards.some(c => ((c.creditLimit - c.availableCredit) / c.creditLimit) > 0.8) ||
    hasAllocationShortfall;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Salute Conti
          </CardTitle>
          {hasAnyIssue ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Richiede attenzione
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3" />
              Tutto OK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Accounts */}
        {bankAccounts.length > 0 && (
          <div className="space-y-3">
            {bankAccounts.map((account) => {
              const health = getHealthStatus(account);
              const allocation = getAllocationForAccount(account.accountId);
              const margin = account.projectedBalance;

              return (
                <div
                  key={account.accountId}
                  className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900">{account.accountName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {allocation && (
                        <Badge className={getAccountHealthStatusColor(allocation.healthStatus)}>
                          {getAccountHealthStatusLabel(allocation.healthStatus)}
                        </Badge>
                      )}
                      {!allocation && <Badge className={health.color}>{health.label}</Badge>}
                    </div>
                  </div>

                  {/* Primary metrics: Balance and Required Today */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                    <div>
                      <div className="text-gray-500 text-xs">Saldo attuale</div>
                      <div className="font-medium text-lg">{formatCurrency(account.currentBalance)}</div>
                    </div>
                    {allocation && (
                      <div>
                        <div className="text-gray-500 text-xs flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Necessario oggi
                        </div>
                        <div className="font-medium text-lg">{formatCurrency(allocation.totalRequiredToday)}</div>
                      </div>
                    )}
                  </div>

                  {/* Shortfall/Surplus indicator */}
                  {allocation && (allocation.shortfall > 0 || allocation.surplus > 0) && (
                    <div className={`p-2 rounded-md mb-2 ${
                      allocation.shortfall > 0
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className={`text-sm font-medium flex items-center gap-1 ${
                        allocation.shortfall > 0 ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {allocation.shortfall > 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4" />
                            Scoperto: {formatCurrency(allocation.shortfall)}
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            Surplus: {formatCurrency(allocation.surplus)}
                          </>
                        )}
                      </div>
                      {allocation.suggestedCatchUp && allocation.suggestedCatchUp > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          Contributo mensile: {formatCurrency(allocation.monthlyContributionTotal)} + {formatCurrency(allocation.suggestedCatchUp)} recupero
                        </div>
                      )}
                    </div>
                  )}

                  {/* Secondary metrics: 30-day coverage */}
                  <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-200 pt-2">
                    <div>
                      <div className="text-gray-500 text-xs">Spese pross. 30gg</div>
                      <div className="font-medium text-red-600">
                        -{formatCurrency(account.upcomingPlansTotal)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Margine 30gg</div>
                      <div className={`font-medium flex items-center gap-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margin >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatCurrency(margin)}
                      </div>
                    </div>
                  </div>

                  {account.plansAtRisk.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {account.plansAtRisk.length} piano{account.plansAtRisk.length !== 1 ? 'i' : ''} a rischio
                      </div>
                    </div>
                  )}

                  {/* Link to detailed view */}
                  {allocation && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <Link
                        href="/expense-plans?view=accounts"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Vedi dettaglio allocazione
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Credit Cards */}
        {cards.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-500 pt-2">Carte di Credito</div>
            {cards.map((card) => {
              const health = getCreditCardHealth(card);
              const used = card.creditLimit - card.availableCredit;
              const usedPercent = (used / card.creditLimit) * 100;

              return (
                <div
                  key={card.id}
                  className="p-3 rounded-lg border bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-gray-900">{card.name}</span>
                    </div>
                    <Badge className={health.color}>{health.label}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Utilizzato</div>
                      <div className="font-medium text-purple-700">
                        {formatCurrency(used)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Limite</div>
                      <div className="font-medium">{formatCurrency(card.creditLimit)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Disponibile</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(card.availableCredit)}
                      </div>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          usedPercent > 80
                            ? 'bg-red-500'
                            : usedPercent > 50
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usedPercent, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {usedPercent.toFixed(0)}% utilizzato
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {bankAccounts.length === 0 && cards.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nessun conto configurato</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
