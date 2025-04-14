"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, CheckCircle, ChevronDown } from "lucide-react";
import { Transaction, Category } from "@/utils/types";
import { fetchUncategorizedTransactions, fetchCommonKeywords } from "@/utils/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedCategories, setSelectedCategories] = useState<Record<string, number | null>>({});
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

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
        
        // Initialize selected categories
        const initialSelections: Record<string, number | null> = {};
        Object.keys(keywordsData).forEach(keyword => {
          initialSelections[keyword] = null;
        });
        setSelectedCategories(initialSelections);
      } catch (err) {
        console.error(err);
        setError("Failed to load categorization data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handleCategorySelect = (keyword: string, categoryId: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [keyword]: parseInt(categoryId)
    }));
  };

  const handleBulkCategorize = async (keyword: string) => {
    const categoryId = selectedCategories[keyword];
    
    if (categoryId === null) {
      setError(`Please select a category for keyword "${keyword}"`);
      return;
    }
    
    setCategorizing(keyword);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`Attempting to categorize keyword "${keyword}" with category ID ${categoryId}`);
      const count = await onCategorize(keyword, categoryId);
      console.log(`Successfully categorized ${count} transactions`);
      
      setSuccess({ keyword, count });
      
      // Only update UI if transactions were actually categorized
      if (count > 0) {
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
        
        // Remove from selected categories
        setSelectedCategories(prev => {
          const updated = { ...prev };
          delete updated[keyword];
          return updated;
        });
      }
    } catch (err) {
      console.error("Bulk categorize error:", err);
      setError(`Failed to categorize transactions with keyword "${keyword}": ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setCategorizing(null);
    }
  };

  // Inside the component, memoize expensive computations
  const sortedKeywords = useMemo(() => {
    return Object.entries(commonKeywords)
      .sort((a, b) => b[1] - a[1]);
  }, [commonKeywords]);

  // Calculate paginated keywords
  const paginatedKeywords = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedKeywords.slice(start, end);
  }, [sortedKeywords, page]);

  // Memoize the categories list for the select component
  const categoryOptions = useMemo(() => {
    return categories.map(category => (
      <SelectItem key={category.id} value={category.id.toString()}>
        {category.name}
      </SelectItem>
    ));
  }, [categories]);

  // Create a debounced version of the category select handler
  const debouncedCategorySelect = useCallback(
    debounce((keyword: string, categoryId: string) => {
      setSelectedCategories(prev => ({
        ...prev,
        [keyword]: parseInt(categoryId)
      }));
    }, 300),
    []
  );

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
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Common Keywords in Uncategorized Transactions</h3>
              
              {Object.keys(commonKeywords).length === 0 ? (
                <p className="text-gray-500">No common keywords found in uncategorized transactions.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedKeywords.map(([keyword, count]) => (
                    <div key={keyword} className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge variant="secondary" className="mb-1">
                            {count} transactions
                          </Badge>
                          <h4 className="font-medium">{keyword}</h4>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col space-y-2">
                          <label className="text-sm text-gray-600">Assign to category:</label>
                          <div className="flex gap-2">
                            <Select
                              value={selectedCategories[keyword]?.toString() || ""}
                              onValueChange={(value) => debouncedCategorySelect(keyword, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoryOptions}
                              </SelectContent>
                            </Select>
                            
                            <Button
                              onClick={() => handleBulkCategorize(keyword)}
                              disabled={categorizing === keyword || selectedCategories[keyword] === null}
                              className="whitespace-nowrap"
                            >
                              {categorizing === keyword ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : null}
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="mx-4 flex items-center">
                Page {page} of {Math.ceil(sortedKeywords.length / itemsPerPage)}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(sortedKeywords.length / itemsPerPage)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 