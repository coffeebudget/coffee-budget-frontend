// src/app/transactions/components/ImportSummary.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Tag } from "lucide-react";
import { Transaction, Category } from "@/utils/types";
import { fetchUncategorizedTransactions, updateTransaction } from "@/utils/api";

interface ImportSummaryProps {
  importedCount: number;
  categories: Category[];
  onClose: () => void;
  onViewTransactions?: () => void;
}

export default function ImportSummary({ 
  importedCount, 
  categories, 
  onClose,
  onViewTransactions 
}: ImportSummaryProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categorizing, setCategorizing] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const transactions = await fetchUncategorizedTransactions(token);
        setUncategorizedTransactions(transactions);
      } catch (err) {
        console.error(err);
        setError("Failed to load uncategorized transactions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handleCategorize = async (transactionId: number, categoryId: number) => {
    if (!token) return;
    
    setCategorizing(transactionId);
    setError(null);
    setSuccess(null);
    
    try {
      // Get the transaction
      const transaction = uncategorizedTransactions.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      
      // Update the specific transaction directly rather than using bulk categorize
      await updateTransaction(token, transactionId, {
        ...transaction,
        categoryId
      });
      
      // Remove the categorized transaction from the view
      setUncategorizedTransactions(prev => 
        prev.filter(t => t.id !== transactionId)
      );
      
      const category = categories.find(c => c.id === categoryId);
      setSuccess(`Categorized transaction as "${category?.name || 'Unknown'}"`);
    } catch (err) {
      console.error(err);
      setError("Failed to categorize transaction");
    } finally {
      setCategorizing(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Import Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 font-medium">Successfully imported {importedCount} transactions</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Analyzing uncategorized transactions...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Uncategorized Transactions ({uncategorizedTransactions.length})
                </h3>
                
                {uncategorizedTransactions.length === 0 ? (
                  <p className="text-gray-500">All transactions are categorized. Great job!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {uncategorizedTransactions.map(transaction => (
                          <tr key={`uncategorized-${transaction.id || Math.random()}-${transaction.executionDate}`} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              {new Date(transaction.executionDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm">{transaction.description}</td>
                            <td className="px-4 py-2 text-sm font-medium" 
                                style={{ color: transaction.type === 'expense' ? '#ef4444' : '#10b981' }}>
                              ${parseFloat(transaction.amount.toString()).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <div className="relative group">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={categorizing === transaction.id}
                                >
                                  {categorizing === transaction.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : null}
                                  Choose category
                                </Button>
                                <div className="absolute z-10 left-0 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 hidden group-hover:block">
                                  <div className="p-2 max-h-48 overflow-y-auto">
                                    {categories.map(category => (
                                      <Button
                                        key={category.id}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs"
                                        onClick={() => handleCategorize(transaction.id!, category.id)}
                                        disabled={categorizing === transaction.id}
                                      >
                                        {category.name}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onViewTransactions && (
          <Button onClick={onViewTransactions} variant="outline">
            View Transactions
          </Button>
        )}
        <Button onClick={onClose}>
          Close Summary
        </Button>
      </CardFooter>
    </Card>
  );
}