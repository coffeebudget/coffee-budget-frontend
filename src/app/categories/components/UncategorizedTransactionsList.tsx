"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Transaction, Category } from "@/utils/types";
import { fetchUncategorizedTransactions } from "@/utils/api";


interface UncategorizedTransactionsListProps {
  categories: Category[];
  onUpdateCategories?: () => void;
}

export default function UncategorizedTransactionsList({ 
}: UncategorizedTransactionsListProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUncategorizedData();
  }, [token]);
  
  const fetchUncategorizedData = async () => {
    if (!token) return;
    
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
        <p className="text-sm text-muted-foreground">
          {uncategorizedTransactions.length} transaction(s) need categorization
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {uncategorizedTransactions.map((transaction) => (
            <div key={transaction.id} className="border rounded p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium">{transaction.description}</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(transaction.executionDate).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'}>
                  €{parseFloat(transaction.amount.toString()).toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {uncategorizedTransactions.length > 10 && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Use the transactions page to categorize these manually
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 