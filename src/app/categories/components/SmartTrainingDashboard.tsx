"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Trash2, AlertCircle } from "lucide-react";
import { Category } from "@/utils/types";
import { fetchCommonKeywords, removeKeywordFromCategory } from "@/utils/api";
import toast from "react-hot-toast";

interface SmartTrainingDashboardProps {
  categories: Category[];
  onUpdateCategories?: () => void;
}

export default function SmartTrainingDashboard({ 
  categories,
  onUpdateCategories
}: SmartTrainingDashboardProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywordStats, setKeywordStats] = useState<Array<{
    keyword: string;
    categoryId: number;
    categoryName: string;
    count: number;
    lastUsed: number;
  }>>([]);
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);

  useEffect(() => {
    fetchKeywordData();
  }, [token, categories]);
  
  const fetchKeywordData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const stats = await fetchCommonKeywords(token);
      setKeywordStats(stats);
    } catch (err) {
      console.error(err);
      setError("Failed to load keyword statistics");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveKeyword = async (keyword: string, categoryId: number) => {
    if (!token) return;
    
    setRemovingKeyword(keyword);
    
    try {
      await removeKeywordFromCategory(token, categoryId, keyword);
      setKeywordStats(prevStats => prevStats.filter(stat => 
        !(stat.keyword === keyword && stat.categoryId === categoryId)
      ));
      toast.success(`Removed "${keyword}" from category`);
      
      // Refresh categories if needed
      if (onUpdateCategories) {
        onUpdateCategories();
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to remove "${keyword}"`);
    } finally {
      setRemovingKeyword(null);
    }
  };
  
  const removeDuplicateKeywords = async () => {
    if (!token || !categories.length) return;
    
    setRemovingDuplicates(true);
    setError(null);
    
    try {
      // Find duplicate keywords across categories
      const keywordMap = new Map<string, { count: number, categories: Set<number> }>();
      
      // Build a map of keywords to their categories
      categories.forEach(category => {
        if (!category.keywords) return;
        
        category.keywords.forEach(keyword => {
          const lowerKeyword = keyword.toLowerCase();
          if (!keywordMap.has(lowerKeyword)) {
            keywordMap.set(lowerKeyword, { count: 0, categories: new Set() });
          }
          
          const entry = keywordMap.get(lowerKeyword)!;
          entry.count++;
          entry.categories.add(category.id);
        });
      });
      
      // Find duplicates (same keyword in multiple categories)
      const duplicates = Array.from(keywordMap.entries())
        .filter(([, data]) => data.categories.size > 1);
      
      // Remove duplicates
      let removedCount = 0;
      
      for (const [keyword, data] of duplicates) {
        // Get all categories except the one with the most transactions for this keyword
        const categoryWithMostTransactions = keywordStats
          .filter(stat => stat.keyword.toLowerCase() === keyword)
          .reduce((max, stat) => stat.count > max.count ? stat : max, { count: 0, categoryId: 0 });
        
        // If we found a category with transactions, keep it and remove from others
        if (categoryWithMostTransactions.categoryId) {
          for (const categoryId of data.categories) {
            if (categoryId !== categoryWithMostTransactions.categoryId) {
              // Find the exact case-sensitive keyword in this category
              const category = categories.find(c => c.id === categoryId);
              const exactKeyword = category?.keywords?.find(k => k.toLowerCase() === keyword);
              
              if (exactKeyword) {
                await removeKeywordFromCategory(token, categoryId, exactKeyword);
                removedCount++;
              }
            }
          }
        }
      }
      
      // Refresh data
      await fetchKeywordData();
      if (onUpdateCategories) {
        onUpdateCategories();
      }
      
      toast.success(`Removed ${removedCount} duplicate keywords`);
    } catch (err) {
      console.error(err);
      setError("Failed to remove duplicate keywords");
      toast.error("Failed to remove duplicate keywords");
    } finally {
      setRemovingDuplicates(false);
    }
  };

  const getHeatColor = (count: number) => {
    // Calculate color based on count (higher = more intense)
    const maxCount = Math.max(...keywordStats.map(stat => stat.count), 1);
    const intensity = Math.min(Math.round((count / maxCount) * 100), 100);
    
    return `rgba(59, 130, 246, ${intensity / 100})`; // blue color with varying opacity
  };
  
  const sortedKeywords = [...keywordStats].sort((a, b) => b.lastUsed - a.lastUsed);
  const recentKeywords = sortedKeywords.slice(0, 10);
  const topKeywords = [...keywordStats].sort((a, b) => b.count - a.count).slice(0, 15);
  
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
              onClick={() => fetchKeywordData()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Smart Training Dashboard</h2>
        <Button
          variant="outline"
          onClick={removeDuplicateKeywords}
          disabled={removingDuplicates}
        >
          {removingDuplicates ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Duplicate Keywords
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recently Added Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Added Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            {recentKeywords.length > 0 ? (
              <div className="space-y-4">
                {recentKeywords.map((stat) => {
                  const category = categories.find(c => c.id === stat.categoryId);
                  
                  return (
                    <div key={`${stat.keyword}-${stat.categoryId}`} className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <Badge className="mb-1">{stat.keyword}</Badge>
                        <div className="text-sm text-muted-foreground">
                          {category?.name || 'Unknown category'}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">
                          {stat.count} transactions
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={removingKeyword === stat.keyword}
                          onClick={() => handleRemoveKeyword(stat.keyword, stat.categoryId)}
                        >
                          {removingKeyword === stat.keyword ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No keywords have been recently added
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recategorization Heat Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keyword Impact Heat-map</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topKeywords.map((stat) => (
                  <div 
                    key={`${stat.keyword}-${stat.categoryId}`} 
                    className="p-2 rounded-md flex flex-col justify-between"
                    style={{ 
                      backgroundColor: getHeatColor(stat.count),
                      minHeight: '80px'
                    }}
                  >
                    <Badge 
                      variant="outline" 
                      className="self-start bg-white text-xs mb-2"
                    >
                      {stat.keyword}
                    </Badge>
                    <div className="text-xs flex justify-between items-end">
                      <span className="font-semibold text-black">
                        {stat.count} transactions
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-white/80 hover:bg-white"
                        disabled={removingKeyword === stat.keyword}
                        onClick={() => handleRemoveKeyword(stat.keyword, stat.categoryId)}
                      >
                        {removingKeyword === stat.keyword ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No keywords have been used for categorization yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 