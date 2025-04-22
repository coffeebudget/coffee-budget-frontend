"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Transaction, Category } from "@/utils/types";
import { fetchUncategorizedTransactions, suggestCategoryForDescription, bulkCategorizeByKeyword } from "@/utils/api";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";

interface UncategorizedTransactionsListProps {
  categories: Category[];
  onUpdateCategories?: () => void;
}

export default function UncategorizedTransactionsList({ 
  categories,
  onUpdateCategories
}: UncategorizedTransactionsListProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingGroup, setProcessingGroup] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUncategorizedData();
  }, [token]);
  
  const fetchUncategorizedData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const transactions = await fetchUncategorizedTransactions(token);
      
      // Enrich with suggested category data if not already present
      const transactionsWithSuggestions = await Promise.all(
        transactions.map(async (transaction: Transaction) => {
          if (!transaction.suggestedCategory) {
            try {
              // Get suggestion from API
              const suggestion = await suggestCategoryForDescription(token, transaction.description);
              return {
                ...transaction,
                suggestedCategory: suggestion.categoryId,
                suggestedCategoryName: suggestion.categoryName
              };
            } catch (err) {
              console.error("Error getting category suggestion:", err);
              return transaction;
            }
          }
          return transaction;
        })
      );
      
      setUncategorizedTransactions(transactionsWithSuggestions);
    } catch (err) {
      console.error(err);
      setError("Failed to load uncategorized transactions");
    } finally {
      setLoading(false);
    }
  };
  
  // Group transactions by suggested category
  const groupedBySuggestion = uncategorizedTransactions.reduce((acc, transaction) => {
    const key = transaction.suggestedCategory 
      ? `${transaction.suggestedCategory}:${transaction.suggestedCategoryName || 'Unknown'}`
      : 'no-suggestion';
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);
  
  const handleCategorizeAll = async (categoryKey: string, transactions: Transaction[]) => {
    if (!token || !transactions.length) return;
    
    setProcessingGroup(categoryKey);
    
    try {
      const [categoryId, categoryName] = categoryKey.split(':');
      
      if (categoryId === 'no-suggestion') {
        throw new Error("No category suggestion available");
      }
      
      // Extract common words from transactions to use as keyword
      const words = transactions.flatMap(t => 
        t.description.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      );
      
      // Find the most common word
      const wordFrequency: Record<string, number> = {};
      words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
      
      // Sort by frequency
      const commonWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
      
      if (commonWords.length) {
        // Use the most common word as a keyword for bulk categorization
        await bulkCategorizeByKeyword(token, commonWords[0], parseInt(categoryId));
        
        // Refresh data
        await fetchUncategorizedData();
        
        // Notify parent component to update if needed
        if (onUpdateCategories) {
          onUpdateCategories();
        }
        
        const count = transactions.length;
        showSuccessToast(
          `Categorized ${count} transaction${count !== 1 ? 's' : ''} as "${categoryName}"`
        );
      } else {
        throw new Error("No common words found in transactions");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to categorize transactions");
    } finally {
      setProcessingGroup(null);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => fetchUncategorizedData()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!uncategorizedTransactions.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Check className="h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">All your transactions are categorized.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uncategorized Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Group with no suggestions */}
          {groupedBySuggestion['no-suggestion'] && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-medium">No Suggestions Available</h3>
                  <p className="text-sm text-muted-foreground">
                    {groupedBySuggestion['no-suggestion'].length} transaction(s)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groupedBySuggestion['no-suggestion'].slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="border-b pb-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{transaction.description}</span>
                      <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'}>
                        ${parseFloat(transaction.amount.toString()).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.executionDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {groupedBySuggestion['no-suggestion'].length > 5 && (
                  <div className="text-xs text-center text-muted-foreground pt-2">
                    + {groupedBySuggestion['no-suggestion'].length - 5} more transactions
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Groups with suggestions */}
          {Object.entries(groupedBySuggestion)
            .filter(([key]) => key !== 'no-suggestion')
            .map(([key, transactions]) => {
              const [categoryId, categoryName] = key.split(':');
              const isProcessing = processingGroup === key;
              
              return (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-medium">Suggested: {categoryName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {transactions.length} transaction(s)
                      </p>
                    </div>
                    <Button
                      onClick={() => handleCategorizeAll(key, transactions)}
                      disabled={isProcessing}
                      className="ml-4"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Categorize All
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="border-b pb-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{transaction.description}</span>
                          <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'}>
                            ${parseFloat(transaction.amount.toString()).toFixed(2)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.executionDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    
                    {transactions.length > 5 && (
                      <div className="text-xs text-center text-muted-foreground pt-2">
                        + {transactions.length - 5} more transactions
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
} 