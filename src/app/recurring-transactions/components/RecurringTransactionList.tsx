"use client";

import { useState } from "react";
import { RecurringTransaction } from "@/utils/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecurringTransactionListProps {
  transactions: RecurringTransaction[];
  onDeleteTransaction: (id: number) => void;
  onEditTransaction: (transaction: RecurringTransaction) => void;
}

export default function RecurringTransactionList({ 
  transactions, 
  onDeleteTransaction, 
  onEditTransaction 
}: RecurringTransactionListProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
      setError("Error deleting recurring transaction");
    } finally {
      setLoadingId(null);
    }
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setError(null);
    onEditTransaction(transaction);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatFrequency = (n: number, type: string) => {
    return `Every ${n} ${type}${n > 1 ? 's' : ''}`;
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return "default";
      case 'PAUSED': return "secondary";
      case 'COMPLETED': return "secondary";
      case 'CANCELLED': return "destructive";
      default: return "secondary";
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Recurring Transactions</h3>
            <p className="text-gray-500 mb-4">You haven't added any recurring transactions yet.</p>
            <p className="text-sm text-gray-500">
              Click "Add Transaction" to create your first recurring transaction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    <div>
                      {transaction.name}
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground">{transaction.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === "expense" ? "destructive" : "default"}>
                      ${formatAmount(transaction.amount)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatFrequency(transaction.frequencyEveryN, transaction.frequencyType)}
                  </TableCell>
                  <TableCell>{formatDate(transaction.startDate)}</TableCell>
                  <TableCell>
                    {transaction.category?.name || <span className="text-muted-foreground text-sm">None</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(transaction)} 
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
                        onClick={() => handleDeleteClick(transaction.id!)}
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