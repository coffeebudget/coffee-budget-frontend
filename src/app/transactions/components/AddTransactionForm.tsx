"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Transaction, BankAccount, CreditCard, Category, Tag } from "@/utils/types";
import { createTag, addKeywordToCategory, bulkCategorizeByKeyword } from "@/utils/api";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";
import TagSelector from "@/components/TagSelector";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddTransactionFormProps {
  onAddTransaction: (transaction: Transaction) => Promise<void>;
  initialData: Transaction | null;
  categories: Category[];
  tags: Tag[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  onCancel?: () => void;
}

export default function AddTransactionForm({ onAddTransaction, initialData = null, categories, tags, bankAccounts, creditCards, onCancel }: AddTransactionFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  // Explicitly determine the initial selection type based on initial bank account and credit card
  const determineInitialSelectionType = (): "bank" | "card" | null => {
    if (initialData?.bankAccount?.id !== undefined) return "bank";
    if (initialData?.creditCard?.id !== undefined) return "card";
    return null;
  };

  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
  const [executionDate, setExecutionDate] = useState(initialData?.executionDate ? new Date(initialData.executionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<number | null>(() => {
    if (initialData) {
      // Try to get categoryId directly
      if (initialData.categoryId !== undefined && initialData.categoryId !== null) {
        return initialData.categoryId;
      }
      // Fall back to category.id if available
      if (initialData.category?.id !== undefined && initialData.category?.id !== null) {
        return initialData.category.id;
      }
    }
    return null;
  });
  const [selectedTags, setSelectedTags] = useState<number[]>(initialData?.tags?.map(t => t.id) || []);
  const [selectedBankAccount, setSelectedBankAccount] = useState<number | null>(
    initialData?.bankAccount?.id !== undefined ? initialData.bankAccount.id : null
  );
  const [selectedCreditCard, setSelectedCreditCard] = useState<number | null>(
    initialData?.creditCard?.id !== undefined ? initialData.creditCard.id : null
  );
  const [selectionType, setSelectionType] = useState<"bank" | "card" | null>(determineInitialSelectionType());
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type || 'expense');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(initialData?.status || 'pending');
  const [useDescriptionAsKeyword, setUseDescriptionAsKeyword] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Update all form fields from initialData
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setExecutionDate(initialData.executionDate ? new Date(initialData.executionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      
      // Handle category data properly - check both categoryId and category.id
      const effectiveCategoryId = initialData.categoryId || (initialData.category?.id || null);
      setCategory(effectiveCategoryId);
      
      setSelectedTags(initialData.tags?.map(t => t.id) || initialData.tagIds || []);
      
      // Update payment method state based on nested objects
      if (initialData.bankAccount?.id) {
        setSelectionType("bank");
        setSelectedBankAccount(initialData.bankAccount.id);
        setSelectedCreditCard(null);
      } else if (initialData.creditCard?.id) {
        setSelectionType("card");
        setSelectedCreditCard(initialData.creditCard.id);
        setSelectedBankAccount(null);
      } else {
        setSelectionType(null);
        setSelectedBankAccount(null);
        setSelectedCreditCard(null);
      }
      
      setType(initialData.type);
      setStatus(initialData.status || 'pending');
    } else {
      resetForm();
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionData: Transaction = {
        description: description,
        amount: parseFloat(amount),
        type: type,
        status: status,
        executionDate: executionDate,
        categoryId: category !== undefined && category !== null ? Number(category) : null,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        bankAccountId: selectedBankAccount !== undefined && selectedBankAccount !== null ? Number(selectedBankAccount) : null,
        creditCardId: selectedCreditCard !== undefined && selectedCreditCard !== null ? Number(selectedCreditCard) : null,
        ...(initialData?.id ? { id: initialData.id } : {})
      };
      
      await onAddTransaction(transactionData);
      
      // Apply keyword if checkbox is selected
      if (useDescriptionAsKeyword && category !== null && description.trim().length > 0) {
        try {
          // Extract the main keyword from the description (first word or entire phrase)
          const keyword = description.split(' ')[0]; // Or any other logic to extract the keyword
          
          // Add the keyword to the category
          await addKeywordToCategory(token, Number(category), keyword);
          
          // Trigger bulk categorization
          await bulkCategorizeByKeyword(token, keyword, Number(category));
          
          showSuccessToast(`Added "${keyword}" as a keyword for this category and recategorized similar transactions`);
        } catch (keywordErr) {
          console.error('Error applying keyword:', keywordErr);
          showErrorToast('Failed to add keyword to category');
        }
      }
      
      showSuccessToast(initialData ? 'Transaction updated successfully' : 'Transaction added successfully');
      
      if (!initialData) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save transaction");
      showErrorToast("Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setExecutionDate(new Date().toISOString().split('T')[0]);
    setCategory(null);
    setSelectedTags([]);
    setSelectedBankAccount(null);
    setSelectedCreditCard(null);
    setSelectionType(null);
    setType('expense');
    setStatus('pending');
  };

  // Add this function to handle tag creation
  const handleCreateTag = async (tagName: string): Promise<Tag> => {
    try {
      const newTag = await createTag(token, { name: tagName });
      return newTag;
    } catch (error) {
      console.error("Error creating tag:", error);
      setError("Failed to create tag. Please try again.");
      throw error;
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Transaction" : "Add New Transaction"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <form id="transaction-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter transaction description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value as 'expense' | 'income')}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value) => setStatus(value as 'pending' | 'executed')}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="executionDate">Execution Date</Label>
              <div className="relative">
                <Input
                  id="executionDate"
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category?.toString() || ""}
                onValueChange={(value) => setCategory(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {category && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useDescriptionAsKeyword" 
                  checked={useDescriptionAsKeyword}
                  onCheckedChange={(checked) => setUseDescriptionAsKeyword(checked as boolean)}
                />
                <Label 
                  htmlFor="useDescriptionAsKeyword" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Use description as keyword for selected category
                </Label>
              </div>
            )}
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <TagSelector
                tags={tags}
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                onCreateTag={handleCreateTag}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Payment Method</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="bank"
                    name="paymentMethod"
                    value="bank"
                    checked={selectionType === "bank"}
                    onChange={() => {
                      setSelectionType("bank");
                      setSelectedCreditCard(null);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="bank" className="font-normal">Bank Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={selectionType === "card"}
                    onChange={() => {
                      setSelectionType("card");
                      setSelectedBankAccount(null);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="card" className="font-normal">Credit Card</Label>
                </div>
              </div>
              
              
              {selectionType === "bank" && (
                <div className="mt-2">
                  <Select 
                    value={selectedBankAccount !== null && selectedBankAccount !== undefined ? selectedBankAccount.toString() : 'none'} 
                    onValueChange={(value) => setSelectedBankAccount(value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {bankAccounts && bankAccounts.length > 0 && bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={(account.id || 0).toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectionType === "card" && (
                <div className="mt-2">
                  <Select 
                    value={selectedCreditCard !== null && selectedCreditCard !== undefined ? selectedCreditCard.toString() : 'none'} 
                    onValueChange={(value) => setSelectedCreditCard(value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue placeholder="Select credit card" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {creditCards && creditCards.length > 0 && creditCards.map((card) => (
                        <SelectItem key={card.id} value={(card.id || 0).toString()}>
                          {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          form="transaction-form"
          disabled={loading || !description.trim() || !amount}
          className={onCancel ? "ml-auto" : "w-full"}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {initialData ? "Update Transaction" : "Add Transaction"}
        </Button>
      </CardFooter>
    </>
  );
}