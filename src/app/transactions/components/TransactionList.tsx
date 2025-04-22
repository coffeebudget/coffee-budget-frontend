"use client";

import { useState } from "react";
import { Transaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertCircle, Loader2 } from "lucide-react";
import TransactionLearningPrompt from "./TransactionLearningPrompt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [recentlyCategorized, setRecentlyCategorized] = useState<{
    transaction: Transaction;
    category: Category;
  } | null>(null);

  const handleDeleteClick = (id: number) => {
    if (confirmDelete === id) {
      handleDelete(id);
    } else {
      setConfirmDelete(id);
    }
  };

  const handleDelete = async (id: number) => {
    setLoadingId(id);
    setError(null);
    try {
      await onDeleteTransaction(id);
      setConfirmDelete(null);
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

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Transactions</h3>
            <p className="text-gray-500 mb-4">You haven't added any transactions yet.</p>
            <p className="text-sm text-gray-500">
              Click "Add Transaction" to create your first transaction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={`transaction-${Number(transaction.id)}`}>
                  <TableCell className="font-medium">
                    {transaction.executionDate ? formatDate(transaction.executionDate) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="break-words">
                      {transaction.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'}>
                      ${formatAmount(transaction.amount)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      transaction.status === 'executed' ? 'default' :
                      transaction.status === 'pending' ? 'secondary' :
                      transaction.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
                      {transaction.status || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(transaction.categoryId || transaction.category?.id) ? (
                      <span className="text-sm">
                        {transaction.category?.name || 
                         categories.find(c => c.id === (transaction.categoryId || transaction.category?.id))?.name || 
                         'Unknown'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(transaction.tagIds && transaction.tagIds.length > 0) || (transaction.tags && transaction.tags.length > 0) ? (
                        transaction.tags ? 
                          transaction.tags.map(tag => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))
                        :
                          getTagsForTransaction(transaction.tagIds).map(tag => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No tags</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEditTransaction(transaction)}
                        disabled={loadingId === transaction.id}
                        title="Edit Transaction"
                      >
                        {loadingId === transaction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant={confirmDelete === transaction.id ? "destructive" : "ghost"} 
                        size="icon"
                        onClick={() => handleDeleteClick(Number(transaction.id))}
                        disabled={loadingId === transaction.id}
                        title={confirmDelete === transaction.id ? "Confirm Delete" : "Delete Transaction"}
                      >
                        {loadingId === transaction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}