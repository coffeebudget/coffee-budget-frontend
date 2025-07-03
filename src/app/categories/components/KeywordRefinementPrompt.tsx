"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { Category } from "@/utils/types";

interface KeywordRefinementPromptProps {
  category: Category;
  suggestedKeywords: string[];
  onDismiss: () => void;
  onKeywordSelected: (keyword: string) => void;
}

export default function KeywordRefinementPrompt({ 
  category, 
  suggestedKeywords,
  onDismiss,
  onKeywordSelected
}: KeywordRefinementPromptProps) {

  
  const [error, setError] = useState<string | null>(null);
  const [selectingKeyword, setSelectingKeyword] = useState<string | null>(null);
  
  const handleSelectKeyword = async (keyword: string) => {
    setSelectingKeyword(keyword);
    setError(null);
    
    try {
      // Instead of directly adding, pass to parent for preview
      onKeywordSelected(keyword);
    } catch (err) {
      console.error(err);
      setError(`Failed to select keyword "${keyword}"`);
    } finally {
      setSelectingKeyword(null);
    }
  };
  
  return (
    <Card className="bg-purple-50 border-purple-200 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="text-purple-800">Improve &quot;{category.name}&quot; Category</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-purple-700 mb-3">
          Based on recent transactions, these keywords could improve categorization accuracy:
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedKeywords.map((keyword, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="flex items-center gap-1 px-2 py-1 bg-white text-purple-700 border-purple-200"
            >
              {keyword}
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 ml-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                onClick={() => handleSelectKeyword(keyword)}
                disabled={selectingKeyword === keyword}
              >
                {selectingKeyword === keyword ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </Badge>
          ))}
        </div>
        
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-end pt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="text-purple-700"
        >
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
}
