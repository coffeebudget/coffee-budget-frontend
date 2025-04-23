"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertCircle, Loader2, ChevronDown, Tags } from "lucide-react";
import TransactionLearningPrompt from "./TransactionLearningPrompt";
import BulkToolbar from "./BulkToolbar";
import BulkCategorizeSheet from "./BulkCategorizeSheet";
import BulkTagSheet from "./BulkTagSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  tags: Tag[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  onDeleteTransaction: (id: number) => Promise<void>;
  onEditTransaction: (transaction: Transaction) => void;
  onBulkCategorize?: (transactionIds: number[], categoryId: number) => void;
  onBulkTag?: (transactionIds: number[], tagIds: number[]) => void;
  onBulkDelete?: (transactionIds: number[]) => Promise<void>;
}

export default function TransactionList({ 
  transactions, 
  categories,
  tags,
  bankAccounts,
  creditCards,
  onDeleteTransaction, 
  onEditTransaction,
  onBulkCategorize,
  onBulkTag,
  onBulkDelete 
}: TransactionListProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [recentlyCategorized, setRecentlyCategorized] = useState<{
    transaction: Transaction;
    category: Category;
  } | null>(null);
  const [isCategorizeSheetOpen, setIsCategorizeSheetOpen] = useState(false);
  const [isTagSheetOpen, setIsTagSheetOpen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+A: Select all transactions
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        if (transactions.length > 0) {
          // If all are already selected, deselect all
          if (selectedIds.length === transactions.length) {
            setSelectedIds([]);
          } else {
            // Otherwise, select all
            setSelectedIds(transactions.map(t => t.id as number));
          }
        }
      }
      
      // Escape: Clear selection
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds, transactions]);

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

  // Toggle selection for a single transaction
  const toggleSelectTransaction = useCallback((id: number, index: number, isShiftKey = false) => {
    setSelectedIds(currentSelectedIds => {
      // Handle range selection with shift key
      if (isShiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const rangeIds = transactions
          .slice(start, end + 1)
          .map(t => t.id as number);
        
        // Create a new array with existing selections plus range selections
        const newSelections = [...currentSelectedIds];
        rangeIds.forEach(id => {
          if (!newSelections.includes(id)) {
            newSelections.push(id);
          }
        });
        
        return newSelections;
      }
      
      // Normal toggle behavior
      return currentSelectedIds.includes(id)
        ? currentSelectedIds.filter(selectedId => selectedId !== id)
        : [...currentSelectedIds, id];
    });
    
    // Update the last selected index
    setLastSelectedIndex(index);
  }, [lastSelectedIndex, transactions]);

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id as number));
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    
    setIsBulkDeleting(true);
    setError(null);
    try {
      await onBulkDelete(selectedIds);
      toast.success(`${selectedIds.length} transactions deleted successfully`);
      setSelectedIds([]);
    } catch (err) {
      setError("Error deleting transactions");
      toast.error("Failed to delete transactions");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkCategorize = () => {
    setIsCategorizeSheetOpen(true);
  };

  const handleBulkTag = () => {
    setIsTagSheetOpen(true);
  };

  const handleApplyCategory = async (categoryId: number) => {
    if (!onBulkCategorize || selectedIds.length === 0) return;
    
    try {
      await onBulkCategorize(selectedIds, categoryId);
      toast.success(`${selectedIds.length} transactions categorized successfully`);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to categorize transactions");
      console.error(err);
    }
  };

  const handleApplyTags = async (tagIds: number[]) => {
    if (!onBulkTag || selectedIds.length === 0) return;
    
    try {
      await onBulkTag(selectedIds, tagIds);
      toast.success(`Tags added to ${selectedIds.length} transactions`);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to add tags to transactions");
      console.error(err);
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Transactions</CardTitle>
            {selectedIds.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Select transactions to perform bulk actions
              </p>
            )}
          </div>
        </CardHeader>
        {selectedIds.length > 0 && (
          <BulkToolbar
            selectedIds={selectedIds}
            onCategorize={handleBulkCategorize}
            onTag={handleBulkTag}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedIds([])}
            isDeleting={isBulkDeleting}
          />
        )}
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
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={transactions.length > 0 && selectedIds.length === transactions.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all transactions"
                    />
                  </TableHead>
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
                {transactions.map((transaction, index) => (
                  <TableRow 
                    key={`transaction-${Number(transaction.id)}`}
                    className={selectedIds.includes(transaction.id as number) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(transaction.id as number)}
                        onCheckedChange={(checked) => {
                          toggleSelectTransaction(
                            transaction.id as number, 
                            index,
                            window.event && (window.event as MouseEvent).shiftKey
                          );
                        }}
                        aria-label={`Select transaction ${transaction.id}`}
                      />
                    </TableCell>
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
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditTransaction(transaction)}
                          title="Edit Transaction"
                          disabled={loadingId === transaction.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={confirmDelete === transaction.id ? "destructive" : "ghost"}
                          size="icon"
                          onClick={() => handleDeleteClick(transaction.id!)}
                          title={confirmDelete === transaction.id ? "Confirm Delete" : "Delete Transaction"}
                          disabled={loadingId === transaction.id}
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
            <div className="bg-red-50 text-red-600 p-3 rounded-md mt-4">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <BulkCategorizeSheet
        open={isCategorizeSheetOpen}
        onOpenChange={setIsCategorizeSheetOpen}
        categories={categories}
        transactionCount={selectedIds.length}
        onSubmit={handleApplyCategory}
      />

      <BulkTagSheet
        open={isTagSheetOpen}
        onOpenChange={setIsTagSheetOpen}
        tags={tags}
        transactionCount={selectedIds.length}
        onSubmit={handleApplyTags}
      />
    </>
  );
}