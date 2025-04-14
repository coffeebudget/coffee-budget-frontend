"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, Check } from "lucide-react";
import { Category } from "@/utils/types";
import { addKeywordToCategory } from "@/utils/api";

interface KeywordRefinementPromptProps {
  category: Category;
  suggestedKeywords: string[];
  onDismiss: () => void;
  onKeywordAdded: (updatedCategory: Category) => void;
}

export default function KeywordRefinementPrompt({ 
  category, 
  suggestedKeywords,
  onDismiss,
  onKeywordAdded
}: KeywordRefinementPromptProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);
  
  const handleAddKeyword = async (keyword: string) => {
    if (!token) return;
    
    setAddingKeyword(keyword);
    setError(null);
    
    try {
      const updatedCategory = await addKeywordToCategory(token, category.id, keyword);
      onKeywordAdded(updatedCategory);
    } catch (err) {
      console.error(err);
      setError(`Failed to add keyword "${keyword}"`);
    } finally {
      setAddingKeyword(null);
    }
  };
  
  return (
    <Card className="bg-purple-50 border-purple-200 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="text-purple-800">Improve "{category.name}" Category</span>
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
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => {
            suggestedKeywords.forEach(async keyword => {
              await handleAddKeyword(keyword);
            });
          }}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 ml-2"
        >
          <Check className="h-4 w-4 mr-1" />
          Add All Keywords
        </Button>
      </CardFooter>
    </Card>
  );
}
