'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchCategoryTransactions } from '@/utils/api-client';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Calendar, Hash } from 'lucide-react';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  source: string;
  account: string;
  isIncome: boolean;
}

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  averageMonthlyNetFlow: number;
}

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  months?: number;
}

export default function CategoryTransactionsModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  months = 12
}: CategoryTransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && categoryId) {
      loadTransactions();
    }
  }, [isOpen, categoryId, months]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategoryTransactions(categoryId, months);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Transazioni - {categoryName}</span>
            <Badge variant="outline">{months} mesi</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Caricamento transazioni...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Entrate Totali</span>
                </div>
                <p className="text-lg font-bold text-green-900">{formatCurrency(summary.totalIncome)}</p>
                <p className="text-xs text-green-700">Media: {formatCurrency(summary.averageMonthlyIncome)}/mese</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Uscite Totali</span>
                </div>
                <p className="text-lg font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</p>
                <p className="text-xs text-red-700">Media: {formatCurrency(summary.averageMonthlyExpenses)}/mese</p>
              </div>

              <div className={`border rounded-lg p-3 ${summary.netFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`h-4 w-4 ${summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  <span className={`text-sm font-medium ${summary.netFlow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Flusso Netto</span>
                </div>
                <p className={`text-lg font-bold ${summary.netFlow >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  {formatCurrency(summary.netFlow)}
                </p>
                <p className={`text-xs ${summary.netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  Media: {formatCurrency(summary.averageMonthlyNetFlow)}/mese
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">Transazioni</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{summary.transactionCount}</p>
                <p className="text-xs text-gray-700">Negli ultimi {months} mesi</p>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Transactions List */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nessuna transazione trovata per questa categoria</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={transaction.isIncome ? "default" : "secondary"}>
                            {transaction.isIncome ? 'Entrata' : 'Uscita'}
                          </Badge>
                          <span className="text-sm text-gray-500">{transaction.account}</span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                        {transaction.source && transaction.source !== 'manual' && (
                          <p className="text-sm text-gray-600 truncate">Source: {transaction.source}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-bold ${transaction.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose} variant="outline">
                Chiudi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 