"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Check, X } from "lucide-react";
import { Transaction, Category } from "@/utils/types";
import { learnFromTransaction } from "@/utils/api";

interface TransactionLearningPromptProps {
  transaction: Transaction;
  category: Category;
  onDismiss: () => void;
  onLearned: (updatedCategory: Category) => void;
}

export default function TransactionLearningPrompt({ 
  transaction, 
  category, 
  onDismiss,
  onLearned
}: TransactionLearningPromptProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract potential keywords from the transaction description
  const potentialKeywords = transaction.description
    .split(/\s+/)
    .filter(word => word.length > 3) // Only consider words longer than 3 characters
    .slice(0, 3); // Take up to 3 keywords
  
  const handleLearn = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedCategory = await learnFromTransaction(token, category.id, transaction.id!);
      onLearned(updatedCategory);
    } catch (err) {
      console.error(err);
      setError("Failed to learn from transaction");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="bg-blue-50 border-blue-200 mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-blue-700 font-medium mb-2">
              Would you like to improve categorization for "{category.name}"?
            </p>
            <p className="text-blue-600 text-sm mb-3">
              I can learn from this transaction to better categorize similar ones in the future.
            </p>
            
            <div className="mb-3">
              <p className="text-sm text-blue-700 mb-1">Potential keywords from this transaction:</p>
              <div className="flex flex-wrap gap-1.5">
                {potentialKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="bg-white text-blue-700 border-blue-200">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                className="text-blue-700"
              >
                <X className="h-4 w-4 mr-1" />
                No thanks
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleLearn}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Learn from this transaction
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
