'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Search, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PaymentActivity } from '@/types/payment-types';
import { fetchTransactions } from '@/utils/api-client';
import { updatePaymentActivityReconciliation } from '@/utils/payment-api-client';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  executionDate: string;
  type: 'income' | 'expense';
  bankAccount?: { id: number; accountName: string };
  category?: { id: number; name: string };
}

interface ReconciliationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentActivity: PaymentActivity | null;
  onReconciled: () => void;
}

export default function ReconciliationDialog({
  open,
  onOpenChange,
  paymentActivity,
  onReconciled
}: ReconciliationDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions when dialog opens
  useEffect(() => {
    if (open && paymentActivity) {
      loadTransactions();
    }
  }, [open, paymentActivity]);

  // Filter transactions by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransactions(filtered);
    }
  }, [searchTerm, transactions]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedTransactionId(null);
      setError(null);
    }
  }, [open]);

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allTransactions = await fetchTransactions();
      
      // Filter transactions to show relevant matches
      // (similar amount, within date range, same type)
      if (paymentActivity) {
        const activityDate = new Date(paymentActivity.executionDate);
        const startDate = new Date(activityDate);
        startDate.setDate(startDate.getDate() - 7); // 7 days before
        const endDate = new Date(activityDate);
        endDate.setDate(endDate.getDate() + 7); // 7 days after

        const relevant = allTransactions.filter((t: Transaction) => {
          const transactionDate = new Date(t.executionDate);
          const inDateRange = transactionDate >= startDate && transactionDate <= endDate;

          // Calculate ±10% amount tolerance
          const activityAmount = Math.abs(paymentActivity.amount);
          const transactionAmount = Math.abs(t.amount);
          const tolerance = activityAmount * 0.10; // 10% tolerance
          const amountDiff = Math.abs(transactionAmount - activityAmount);
          const similarAmount = amountDiff <= tolerance;

          return inDateRange && similarAmount; // Both conditions must be true
        });

        setTransactions(relevant.length > 0 ? relevant : allTransactions);
        setFilteredTransactions(relevant.length > 0 ? relevant : allTransactions);
      } else {
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions. Please try again.');
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!selectedTransactionId || !paymentActivity) {
      toast.error('Please select a transaction');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updatePaymentActivityReconciliation(paymentActivity.id, {
        reconciledTransactionId: selectedTransactionId,
        reconciliationStatus: 'manual',
        reconciliationConfidence: undefined, // Manual reconciliation doesn't have auto-confidence
      });

      toast.success('Payment activity reconciled successfully');
      onReconciled();
      onOpenChange(false);
    } catch (err) {
      console.error('Error reconciling activity:', err);
      setError('Failed to reconcile activity. Please try again.');
      toast.error('Failed to reconcile activity');
    } finally {
      setIsSaving(false);
    }
  };

  const getMatchScore = (transaction: Transaction): number => {
    if (!paymentActivity) return 0;

    let score = 0;
    
    // Amount match (50 points)
    const amountDiff = Math.abs(Math.abs(transaction.amount) - Math.abs(paymentActivity.amount));
    if (amountDiff < 0.01) score += 50;
    else if (amountDiff < 1) score += 30;
    else if (amountDiff < 5) score += 10;

    // Date match (30 points)
    const activityDate = new Date(paymentActivity.executionDate);
    const transactionDate = new Date(transaction.executionDate);
    const daysDiff = Math.abs((activityDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1) score += 30;
    else if (daysDiff < 3) score += 20;
    else if (daysDiff < 7) score += 10;

    // Description match (20 points)
    const merchantName = paymentActivity.merchantName?.toLowerCase() || '';
    const description = transaction.description.toLowerCase();
    if (merchantName && description.includes(merchantName)) score += 20;
    else if (merchantName && description.includes(merchantName.split(' ')[0])) score += 10;

    return score;
  };

  if (!paymentActivity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Reconcile Payment Activity
          </DialogTitle>
          <DialogDescription>
            Match this payment activity with a bank transaction
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Activity Details */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Activity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Merchant:</span>
                <p className="text-gray-900">{paymentActivity.merchantName || 'Unknown'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Amount:</span>
                <p className={`text-lg font-bold ${paymentActivity.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {paymentActivity.amount < 0 ? '-' : '+'}€{Math.abs(paymentActivity.amount).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <p className="text-gray-900">{new Date(paymentActivity.executionDate).toLocaleDateString()}</p>
              </div>
              {paymentActivity.merchantCategory && (
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="text-gray-900">{paymentActivity.merchantCategory}</p>
                </div>
              )}
            </div>
            {paymentActivity.description && (
              <div className="mt-2">
                <span className="font-medium text-gray-700 text-sm">Description:</span>
                <p className="text-sm text-gray-600">{paymentActivity.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Search */}
        <div className="space-y-3">
          <Label htmlFor="search">Search Transactions</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          <Label>Select Matching Transaction ({filteredTransactions.length} results)</Label>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <p className="text-sm text-gray-500">
                {searchTerm ? 'No transactions found matching your search' : 'No transactions available'}
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
              {filteredTransactions.map((transaction) => {
                const matchScore = getMatchScore(transaction);
                const isSelected = selectedTransactionId === transaction.id;

                return (
                  <Card
                    key={transaction.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                        : matchScore >= 70
                        ? 'border-green-300 bg-green-50'
                        : ''
                    }`}
                    onClick={() => setSelectedTransactionId(transaction.id)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">{transaction.description}</CardTitle>
                            {matchScore >= 70 && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                {matchScore}% match
                              </span>
                            )}
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <CardDescription className="text-xs mt-1">
                            {new Date(transaction.executionDate).toLocaleDateString()}
                            {transaction.bankAccount && ` • ${transaction.bankAccount.accountName}`}
                            {transaction.category && ` • ${transaction.category.name}`}
                          </CardDescription>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {transaction.amount < 0 ? '-' : '+'}€{Math.abs(transaction.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReconcile}
            disabled={!selectedTransactionId || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reconciling...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Reconcile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
