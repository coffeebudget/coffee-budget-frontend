"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, CheckCircle } from "lucide-react";
import { Transaction, Category } from "@/utils/types";
import { fetchUncategorizedTransactions, fetchCommonKeywords } from "@/utils/api";

interface CategorizationDashboardProps {
  categories: Category[];
  onCategorize: (keyword: string, categoryId: number) => Promise<number>;
}

export default function CategorizationDashboard({ categories, onCategorize }: CategorizationDashboardProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState<Transaction[]>([]);
  const [commonKeywords, setCommonKeywords] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{keyword: string, count: number} | null>(null);

  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the api functions
        const transactionsData = await fetchUncategorizedTransactions(token);
        setUncategorizedTransactions(transactionsData);
        
        const keywordsData = await fetchCommonKeywords(token);
        setCommonKeywords(keywordsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load categorization data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handleBulkCategorize = async (keyword: string, categoryId: number) => {
    setCategorizing(keyword);
    setError(null);
    setSuccess(null);
    
    try {
      const count = await onCategorize(keyword, categoryId);
      setSuccess({ keyword, count });
      
      // Remove categorized transactions from the list
      setUncategorizedTransactions(prev => 
        prev.filter(t => !t.description.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      // Update keyword counts
      setCommonKeywords(prev => {
        const updated = { ...prev };
        delete updated[keyword];
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError(`Failed to categorize transactions with keyword "${keyword}"`);
    } finally {
      setCategorizing(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categorization Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading categorization data...</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Successfully categorized {success.count} transactions with keyword "{success.keyword}"
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Common Keywords in Uncategorized Transactions</h3>
                {Object.keys(commonKeywords).length === 0 ? (
                  <p className="text-gray-500">No common keywords found in uncategorized transactions.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(commonKeywords)
                      .sort((a, b) => b[1] - a[1])
                      .map(([keyword, count]) => (
                        <div key={keyword} className="border rounded-md p-3 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline" className="text-sm">
                              {keyword} ({count})
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Assign to category:</p>
                            <div className="flex flex-wrap gap-2">
                              {categories.map(category => (
                                <Button
                                  key={category.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBulkCategorize(keyword, category.id)}
                                  disabled={categorizing === keyword}
                                  className="text-xs"
                                >
                                  {categorizing === keyword ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : null}
                                  {category.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Uncategorized Transactions ({uncategorizedTransactions.length})</h3>
                {uncategorizedTransactions.length === 0 ? (
                  <p className="text-gray-500">No uncategorized transactions found. Great job!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {uncategorizedTransactions.slice(0, 10).map(transaction => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              {new Date(transaction.executionDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm">{transaction.description}</td>
                            <td className="px-4 py-2 text-sm font-medium" 
                                style={{ color: transaction.type === 'expense' ? '#ef4444' : '#10b981' }}>
                              ${parseFloat(transaction.amount.toString()).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {uncategorizedTransactions.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2 text-right">
                        Showing 10 of {uncategorizedTransactions.length} uncategorized transactions
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 