// src/app/categories/components/KeywordSuggestions.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { getSuggestedKeywordsForCategory, addKeywordToCategory } from "@/utils/api";
import { Category } from "@/utils/types";

interface KeywordSuggestionsProps {
  category: Category;
  onKeywordAdded: (updatedCategory: Category) => void;
}

export default function KeywordSuggestions({ category, onKeywordAdded }: KeywordSuggestionsProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !category) return;
    
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const keywords = await getSuggestedKeywordsForCategory(token, category.id);
        // Filter out keywords that are already in the category
        const filteredKeywords = keywords.filter(
          (keyword: string) => !category.keywords.includes(keyword)
        );
        setSuggestedKeywords(filteredKeywords);
      } catch (err) {
        console.error(err);
        setError("Failed to load keyword suggestions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [token, category]);

  const handleAddKeyword = async (keyword: string) => {
    if (!token) return;
    
    setAddingKeyword(keyword);
    try {
      const updatedCategory = await addKeywordToCategory(token, category.id, keyword);
      onKeywordAdded(updatedCategory);
      
      // Remove the added keyword from suggestions
      setSuggestedKeywords(prev => prev.filter(k => k !== keyword));
    } catch (err) {
      console.error(err);
      setError(`Failed to add keyword "${keyword}"`);
    } finally {
      setAddingKeyword(null);
    }
  };

  if (!category) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Suggested Keywords for {category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : suggestedKeywords.length === 0 ? (
          <p className="text-gray-500 text-sm">No keyword suggestions available for this category.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestedKeywords.map(keyword => (
              <Badge 
                key={keyword} 
                variant="outline" 
                className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100"
              >
                {keyword}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => handleAddKeyword(keyword)}
                  disabled={addingKeyword === keyword}
                >
                  {addingKeyword === keyword ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}