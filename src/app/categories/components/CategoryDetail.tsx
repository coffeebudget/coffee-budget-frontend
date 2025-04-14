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
        onKeywordAdded={onCategoryUpdated} 
      />

      {showRefinementPrompt && suggestedKeywords.length > 0 && (
        <KeywordRefinementPrompt
          category={category}
          suggestedKeywords={suggestedKeywords}
          onDismiss={() => setShowRefinementPrompt(false)}
          onKeywordAdded={(updatedCategory) => {
            onCategoryUpdated(updatedCategory);
            // Remove the added keyword from suggestions
            setSuggestedKeywords(prev => 
              prev.filter(keyword => !updatedCategory.keywords.includes(keyword))
            );
            
            if (suggestedKeywords.length <= 1) {
              setShowRefinementPrompt(false);
            }
          }}
        />
      )}
    </div>
  );
}