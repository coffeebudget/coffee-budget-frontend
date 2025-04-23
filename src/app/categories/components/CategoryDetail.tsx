// src/app/categories/components/CategoryDetail.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Trash2 } from "lucide-react";
import { Category } from "@/utils/types";
import { removeKeywordFromCategory } from "@/utils/api";
import KeywordSuggestions from "./KeywordSuggestions";
import KeywordRefinementPrompt from "./KeywordRefinementPrompt";
import { getSuggestedKeywordsForCategory } from "@/utils/api";
import { previewKeywordImpact, applyKeywordToCategory } from "@/utils/api";
import KeywordImpactPreview from "./KeywordImpactPreview";

interface CategoryDetailProps {
  category: Category;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: number) => void;
  onCategoryUpdated: (category: Category) => void;
}

export default function CategoryDetail({ 
  category, 
  onEditCategory, 
  onDeleteCategory,
  onCategoryUpdated
}: CategoryDetailProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [showRefinementPrompt, setShowRefinementPrompt] = useState(false);
  
  // Add state for preview functionality
  const [showPreview, setShowPreview] = useState(false);
  const [previewKeyword, setPreviewKeyword] = useState("");
  const [keywordImpact, setKeywordImpact] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!token || !category) return;
    
    const fetchSuggestions = async () => {
      try {
        const keywords = await getSuggestedKeywordsForCategory(token, category.id);
        // Filter out keywords that are already in the category
        const newSuggestions = keywords.filter(
          (keyword: string) => !category.keywords.includes(keyword)
        );
        
        if (newSuggestions.length > 0) {
          setSuggestedKeywords(newSuggestions);
          setShowRefinementPrompt(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchSuggestions();
    
    // Check for new suggestions periodically (every 5 minutes)
    const intervalId = setInterval(fetchSuggestions, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [token, category]);

  const handleRemoveKeyword = async (keyword: string) => {
    if (!token) return;
    
    setRemovingKeyword(keyword);
    setError(null);
    try {
      const updatedCategory = await removeKeywordFromCategory(token, category.id, keyword);
      onCategoryUpdated(updatedCategory);
    } catch (err) {
      console.error(err);
      setError(`Failed to remove keyword "${keyword}"`);
    } finally {
      setRemovingKeyword(null);
    }
  };

  const loadKeywordImpact = async (keyword: string) => {
    if (!category?.id || !token) return;
    
    setLoadingPreview(true);
    setError(null);
    setKeywordImpact(null); // Reset the keywordImpact first
    
    try {
      const impact = await previewKeywordImpact(token, category.id, keyword, false);
      console.log("Keyword impact data received:", impact);
      
      // Map backend response to our expected structure
      const totalImpactedCount = impact?.totalAffected || 0;
      
      // Handle various possible structures for categoryCounts
      let uncategorizedCount = 0;
      let affectedCategories = [];
      
      if (impact?.categoryCounts) {
        // If categoryCounts is an object with category IDs as keys
        if (typeof impact.categoryCounts === 'object' && !Array.isArray(impact.categoryCounts)) {
          // Check for null key (uncategorized) or category with name "Uncategorized"
          Object.entries(impact.categoryCounts).forEach(([key, value]: [string, any]) => {
            if (key === 'null' || key === 'undefined' || value?.name === 'Uncategorized') {
              uncategorizedCount = value.count || 0;
            } else if (key !== 'null' && key !== 'undefined') {
              affectedCategories.push({
                id: parseInt(key),
                name: value.name || `Category ${key}`,
                count: value.count || 0
              });
            }
          });
        } 
        // If categoryCounts is an array
        else if (Array.isArray(impact.categoryCounts)) {
          const uncatItem = impact.categoryCounts.find(
            (c: any) => c.name === 'Uncategorized' || c.id === null || c.categoryId === null
          );
          uncategorizedCount = uncatItem?.count || 0;
          
          affectedCategories = impact.categoryCounts
            .filter((c: any) => c.id !== null && c.name !== 'Uncategorized')
            .map((c: any) => ({
              id: c.id || c.categoryId,
              name: c.name || `Category ${c.id || c.categoryId}`,
              count: c.count || 0
            }));
        }
      }
      
      // Calculate categorized count
      const categorizedCount = totalImpactedCount - uncategorizedCount;
      
      // Ensure impact has the expected structure
      const safeImpact = {
        totalImpactedCount: totalImpactedCount,
        uncategorizedCount: uncategorizedCount,
        categorizedCount: categorizedCount,
        affectedCategories: affectedCategories,
        sampleTransactions: impact?.sampleTransactions || []
      };
      
      setKeywordImpact(safeImpact);
      setShowPreview(true);
    } catch (err) {
      console.error("Error loading keyword impact:", err);
      setError("Failed to load keyword impact");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApplyKeyword = async (applyTo: "none" | "uncategorized" | "all" | number[]) => {
    if (!category?.id || !token || !previewKeyword) return;
    
    try {
      const updatedCategory = await applyKeywordToCategory(token, category.id, previewKeyword, applyTo);
      
      // Update the category via parent component
      onCategoryUpdated(updatedCategory);
      
      // Remove the keyword from suggestions
      setSuggestedKeywords(prev => 
        prev.filter(keyword => keyword !== previewKeyword)
      );
      
      setShowPreview(false);
      setPreviewKeyword("");
      setKeywordImpact(null);
      
      if (suggestedKeywords.length <= 1) {
        setShowRefinementPrompt(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to apply keyword changes");
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewKeyword("");
    setKeywordImpact(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{category.name}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditCategory(category)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onDeleteCategory(category.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Keywords</h3>
              {category.keywords && category.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {category.keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {keyword}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 ml-1"
                        onClick={() => handleRemoveKeyword(keyword)}
                        disabled={removingKeyword === keyword}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No keywords defined for this category</p>
              )}
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </CardContent>
      </Card>
      
      <KeywordSuggestions 
        category={category} 
        onKeywordSelected={(keyword) => {
          // Set the keyword for preview
          setPreviewKeyword(keyword);
          // Load the impact for preview
          loadKeywordImpact(keyword);
        }} 
      />

      {showRefinementPrompt && suggestedKeywords.length > 0 && (
        <KeywordRefinementPrompt
          category={category}
          suggestedKeywords={suggestedKeywords}
          onDismiss={() => setShowRefinementPrompt(false)}
          onKeywordSelected={(keyword) => {
            // Set the keyword for preview
            setPreviewKeyword(keyword);
            // Load the impact for preview
            loadKeywordImpact(keyword);
          }}
        />
      )}
      
      {/* Keyword impact preview dialog */}
      <KeywordImpactPreview
        isOpen={showPreview}
        onClose={handleClosePreview}
        keyword={previewKeyword}
        categoryName={category.name || ""}
        categoryId={category.id}
        keywordImpact={keywordImpact}
        isLoading={loadingPreview}
        onApply={handleApplyKeyword}
      />
    </div>
  );
}