"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Transaction, Category, Tag as TagType, BankAccount, CreditCard as CreditCardType } from "@/utils/types";
import AddTransactionForm from "./AddTransactionForm";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";
import { addKeywordToCategory, bulkCategorizeByKeyword } from "@/utils/api";

interface TransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: Category[];
  tags: TagType[];
  bankAccounts: BankAccount[];
  creditCards: CreditCardType[];
  onUpdateTransaction: (transaction: Transaction) => Promise<void>;
}

export default function TransactionDrawer({
  isOpen,
  onClose,
  transaction,
  categories,
  tags,
  bankAccounts,
  creditCards,
  onUpdateTransaction
}: TransactionDrawerProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  
  const [activeTab, setActiveTab] = useState("details");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const category = transaction?.categoryId 
    ? categories.find(c => c.id === transaction.categoryId) 
    : null;
  
  // Extract potential keywords from the transaction description
  const potentialKeywords = transaction?.description
    ? transaction.description
        .split(/\s+/)
        .filter(word => word.length > 3) // Only consider words longer than 3 characters
        .slice(0, 5) // Take up to 5 keywords
    : [];
  
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword) 
        : [...prev, keyword]
    );
  };
  
  const handleAddKeywords = async () => {
    if (!selectedKeywords.length || !category?.id || !transaction) return;
    
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
      
      setSelectedKeywords([]);
    } catch (err) {
      console.error(err);
      setError("Failed to add keywords");
      showErrorToast("Failed to add keywords");
    } finally {
      setLoading(false);
    }
  };
  
  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        {transaction && (
          <>
            <SheetHeader>
              <SheetTitle>Transaction</SheetTitle>
              <SheetDescription>
                {transaction.description}
              </SheetDescription>
            </SheetHeader>
            
            <Tabs defaultValue="details" className="mt-6" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="category">Category & Keywords</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 py-4">
                <AddTransactionForm
                  onAddTransaction={onUpdateTransaction}
                  initialData={transaction}
                  categories={categories}
                  tags={tags}
                  bankAccounts={bankAccounts}
                  creditCards={creditCards}
                  onCancel={onClose}
                />
              </TabsContent>
              
              <TabsContent value="category" className="space-y-6 py-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Category</h3>
                  <div className="border rounded-md p-3">
                    {category ? (
                      <div className="space-y-2">
                        <div className="font-medium">{category.name}</div>
                        <div className="flex flex-wrap gap-1 text-sm">
                          {category.keywords && category.keywords.length > 0 ? (
                            category.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No keywords</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Uncategorized</div>
                    )}
                  </div>
                </div>
                
                {category && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Add Keywords from this Transaction</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Keywords help automatically categorize similar transactions in the future.
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      {potentialKeywords.map((keyword, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`keyword-${index}`} 
                            checked={selectedKeywords.includes(keyword)}
                            onCheckedChange={() => toggleKeyword(keyword)}
                            disabled={category.keywords?.includes(keyword)}
                          />
                          <Label 
                            htmlFor={`keyword-${index}`}
                            className={`text-sm cursor-pointer ${category.keywords?.includes(keyword) ? 'text-muted-foreground line-through' : ''}`}
                          >
                            {keyword}
                            {category.keywords?.includes(keyword) && " (already added)"}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {potentialKeywords.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No potential keywords found in this transaction's description.
                      </div>
                    )}
                    
                    {error && (
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                    
                    <Button 
                      className="w-full mt-2"
                      disabled={loading || selectedKeywords.length === 0}
                      onClick={handleAddKeywords}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Add Keywords & Recategorize Similar Transactions
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
} 