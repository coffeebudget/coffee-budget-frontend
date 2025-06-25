"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { acceptSuggestedCategory, rejectSuggestedCategory } from "@/utils/api";
import { Transaction } from "@/utils/types";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";

interface SuggestedCategoryChipProps {
  transaction: Transaction;
  onAccepted?: (transaction: Transaction) => void;
  onRejected?: (transaction: Transaction) => void;
}

export default function SuggestedCategoryChip({ 
  transaction, 
  onAccepted, 
  onRejected 
}: SuggestedCategoryChipProps) {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Only show if transaction has a suggested category but no actual category
  if (!transaction.suggestedCategoryName || transaction.categoryId || transaction.category?.id) {
    return null;
  }

  const handleAccept = async () => {
    if (!session?.user?.accessToken || !transaction.id) return;
    
    setIsProcessing(true);
    try {
      await acceptSuggestedCategory(session.user.accessToken, transaction.id);
      showSuccessToast(`Category "${transaction.suggestedCategoryName}" applied!`);
      
      if (onAccepted) {
        onAccepted(transaction);
      }
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
      showErrorToast('Failed to accept suggested category');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!session?.user?.accessToken || !transaction.id) return;
    
    setIsProcessing(true);
    try {
      await rejectSuggestedCategory(session.user.accessToken, transaction.id);
      showSuccessToast('AI suggestion dismissed');
      
      if (onRejected) {
        onRejected(transaction);
      }
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      showErrorToast('Failed to dismiss suggested category');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <Badge 
        variant="outline" 
        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
      >
        <Sparkles className="h-3 w-3" />
        <span className="text-xs">AI suggests: {transaction.suggestedCategoryName}</span>
      </Badge>
      
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
          onClick={handleAccept}
          disabled={isProcessing}
          title="Accept suggestion"
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
          onClick={handleReject}
          disabled={isProcessing}
          title="Reject suggestion"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
} 