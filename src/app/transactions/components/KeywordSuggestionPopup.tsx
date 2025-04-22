"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Save, Lightbulb } from "lucide-react";
import { Category, Transaction } from "@/utils/types";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";
import { addKeywordToCategory, bulkCategorizeByKeyword } from "@/utils/api";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface KeywordSuggestionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  category: Category;
  suggestedKeywords: string[];
}

export default function KeywordSuggestionPopup({ 
  isOpen, 
  onClose, 
  transaction, 
  category,
  suggestedKeywords
}: KeywordSuggestionPopupProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword) 
        : [...prev, keyword]
    );
  };
  
  const handleSubmit = async () => {
    if (!selectedKeywords.length || !category?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Process each selected keyword
      for (const keyword of selectedKeywords) {
        // First add keywords to category
        await addKeywordToCategory(token, category.id, keyword);
        
        // Then trigger bulk categorization
        await bulkCategorizeByKeyword(token, keyword, category.id);
      }
      
      const count = selectedKeywords.length;
      showSuccessToast(
        count === 1 
          ? `Added 1 keyword and recategorized similar transactions` 
          : `Added ${count} keywords and recategorized similar transactions`
      );
      
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to add keywords");
      showErrorToast("Failed to add keywords");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Suggested Keywords
          </SheetTitle>
          <SheetDescription>
            Add keywords to improve categorization for "{category?.name}"
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Transaction</h3>
            <p className="text-sm text-muted-foreground mb-1">{transaction.description}</p>
            <Badge variant="outline" className="text-xs">
              ${parseFloat(transaction.amount.toString()).toFixed(2)}
            </Badge>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Select keywords to add</h3>
            <div className="space-y-3">
              {suggestedKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`keyword-${index}`} 
                    checked={selectedKeywords.includes(keyword)}
                    onCheckedChange={() => toggleKeyword(keyword)}
                  />
                  <Label 
                    htmlFor={`keyword-${index}`}
                    className="text-sm cursor-pointer"
                  >
                    {keyword}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
        
        <SheetFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleSubmit}
            disabled={loading || selectedKeywords.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Add & Recategorize
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 