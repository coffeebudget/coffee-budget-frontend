"use client";

import { useState } from "react";
import { Transaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import TransactionLearningPrompt from "./TransactionLearningPrompt";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  tags: Tag[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  onDeleteTransaction: (id: number) => Promise<void>;
  onEditTransaction: (transaction: Transaction) => void;
}

export default function TransactionList({ 
  transactions, 
  categories,
  tags,
  bankAccounts,
  creditCards,
  onDeleteTransaction, 
  onEditTransaction 
}: TransactionListProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [recentlyCategorized, setRecentlyCategorized] = useState<{
    transaction: Transaction;
    category: Category;
  } | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    setLoadingId(id);
    setError(null);
    try {
      await onDeleteTransaction(id);
    } catch (err) {
      setError("Error deleting transaction");
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const getTagsForTransaction = (tagIds: number[] = []) => {
    return tags.filter(tag => tagIds.includes(tag.id));
  };

  const handleCategoryChange = async (transactionId: number, categoryId: number) => {
    // Your existing code to update the category
    
    // After successful categorization:
    const updatedTransaction = transactions.find(t => t.id === transactionId);
    const selectedCategory = categories.find(c => c.id === categoryId);
    
    if (updatedTransaction && selectedCategory) {
      setRecentlyCategorized({
        transaction: updatedTransaction,
        category: selectedCategory
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {recentlyCategorized && (
          <TransactionLearningPrompt
            transaction={recentlyCategorized.transaction}
            category={recentlyCategorized.category}
            onDismiss={() => setRecentlyCategorized(null)}
            onLearned={(updatedCategory) => {
              // Update the category in your categories list if needed
              setRecentlyCategorized(null);
            }}
          />
        )}
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions found. Add your first transaction using the form.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '25%' }}>Description</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '10%' }}>Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '10%' }}>Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Category</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Tags</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase" style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={`transaction-${transaction.id}-${transaction.executionDate}`} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium">
                      {transaction.executionDate ? formatDate(transaction.executionDate) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="break-words">
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium" style={{ color: transaction.type === 'expense' ? '#ef4444' : '#10b981' }}>
                      ${formatAmount(transaction.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Badge variant={
                        transaction.status === 'executed' ? 'default' :
                        transaction.status === 'pending' ? 'secondary' :
                        transaction.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {transaction.status || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {transaction.categoryId ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                          {categories.find(c => c.id === transaction.categoryId)?.name || 'Unknown'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {transaction.tagIds && transaction.tagIds.length > 0 ? (
                          getTagsForTransaction(transaction.tagIds).map(tag => (
                            <Badge key={tag.id} variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditTransaction(transaction)}
                          disabled={loadingId === transaction.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDelete(typeof transaction.id === 'string' ? parseInt(transaction.id) : transaction.id || 0)}
                          disabled={loadingId === transaction.id}
                        >
                          {loadingId === transaction.id ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}