"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Transaction } from "@/utils/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TransactionCategorizationSuggesterProps {
  sourceTransaction: Transaction;
  onBulkCategorize: (transactionIds: number[], categoryId: number) => Promise<void>;
  onClose: () => void;
}

export default function TransactionCategorizationSuggester({
  sourceTransaction,
  onBulkCategorize,
  onClose
}: TransactionCategorizationSuggesterProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [similarTransactions, setSimilarTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<number[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !sourceTransaction) return;
    
    const fetchSimilarTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // This would be implemented in your API
        const response = await fetch(`/api/transactions/similar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            transactionId: sourceTransaction.id,
            description: sourceTransaction.description,
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch similar transactions');
        }
        
        const data = await response.json();
        setSimilarTransactions(data.transactions || []);
        
        // Pre-select all transactions
        setSelectedTransactionIds(
          data.transactions.filter((t: Transaction) => t.id !== undefined)
            .map((t: Transaction) => t.id as number)
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load similar transactions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSimilarTransactions();
  }, [token, sourceTransaction]);

  const handleToggleTransaction = (transactionId: number) => {
    setSelectedTransactionIds(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    // Filter out undefined IDs
    const validIds = similarTransactions
      .filter(t => t.id !== undefined)
      .map(t => t.id as number);
    setSelectedTransactionIds(validIds);
  };

  const handleUnselectAll = () => {
    setSelectedTransactionIds([]);
  };

  const handleApplyCategory = async () => {
    if (!sourceTransaction.categoryId || selectedTransactionIds.length === 0) return;
    
    setIsApplying(true);
    setError(null);
    
    try {
      await onBulkCategorize(selectedTransactionIds, sourceTransaction.categoryId);
      setSuccess(true);
      
      // Auto-close after successful categorization
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to categorize transactions");
    } finally {
      setIsApplying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString));
  };

  const getCategoryName = () => {
    return sourceTransaction.category?.name || 'Selected Category';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            Similar Uncategorized Transactions
          </DialogTitle>
          <DialogDescription>
            We found {similarTransactions.length} transactions similar to 
            &quot;{sourceTransaction.description}&quot; that could be categorized as &quot;{getCategoryName()}&quot;
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : success ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Successfully categorized {selectedTransactionIds.length} transactions
            </AlertDescription>
          </Alert>
        ) : similarTransactions.length === 0 ? (
          <div className="text-center p-6">
            <p>No similar uncategorized transactions found</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-2">
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="mr-2"
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUnselectAll}
                >
                  Unselect All
                </Button>
              </div>
              <Badge variant="outline">
                {selectedTransactionIds.length} selected
              </Badge>
            </div>
            
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {similarTransactions
                    .filter(transaction => transaction.id !== undefined)
                    .map((transaction) => (
                    <TableRow key={transaction.id} className={
                      selectedTransactionIds.includes(transaction.id as number) 
                        ? "bg-muted/50" 
                        : ""
                    }>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTransactionIds.includes(transaction.id as number)}
                          onChange={() => handleToggleTransaction(transaction.id as number)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>{formatDate(transaction.executionDate)}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={transaction.description}>
                        {transaction.description}
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            {success ? "Close" : "Cancel"}
          </Button>
          {!success && (
            <Button 
              onClick={handleApplyCategory} 
              disabled={isApplying || selectedTransactionIds.length === 0}
            >
              {isApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Categorize {selectedTransactionIds.length} transactions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 