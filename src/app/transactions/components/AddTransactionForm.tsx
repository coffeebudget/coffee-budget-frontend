"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Transaction, BankAccount, CreditCard, Category, Tag } from "@/utils/types";
import { createTag, previewKeywordImpact, applyKeywordToCategory } from "@/utils/api";
import TagSelector from "@/components/TagSelector";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, Save, Tag as TagIcon, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";  
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";

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

  // Add new state for keyword management
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [showKeywordImpactPreview, setShowKeywordImpactPreview] = useState(false);
  const [keywordImpact, setKeywordImpact] = useState<any>(null);
  const [loadingKeywordImpact, setLoadingKeywordImpact] = useState(false);
  const [applyOption, setApplyOption] = useState<"none" | "uncategorized" | "all" | number[]>("none");
  const [candidateKeywords, setCandidateKeywords] = useState<string[]>([]);
  const [showKeywordInput, setShowKeywordInput] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const keywordInputRef = useRef<HTMLInputElement>(null);

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

  // Extract potential keywords from description
  useEffect(() => {
    if (description) {
      // Simple keyword extraction algorithm - split by spaces and filter out common words and short words
      const commonWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const words = description.toLowerCase().split(/\s+|\/|,|\||-/);
      const potentialKeywords = words
        .filter(word => word.length > 3) // Only words longer than 3 characters
        .filter(word => !commonWords.includes(word.toLowerCase()))
        .filter(word => !word.match(/^\d+$/)) // Filter out numbers
        .map(word => word.replace(/[^\w\s]/gi, '')) // Remove special characters
        .filter(word => word.length > 3); // Check length again after removing special chars
      
      // Keep only unique keywords
      setCandidateKeywords([...new Set(potentialKeywords)]);
    } else {
      setCandidateKeywords([]);
    }
  }, [description]);

  // Function to load keyword impact preview
  const loadKeywordImpact = async (selectedCategoryId: number, keyword: string) => {
    if (!selectedCategoryId || !keyword || !token) return;
    
    console.log("Loading keyword impact for:", keyword, "category:", selectedCategoryId);
    setLoadingKeywordImpact(true);
    setKeywordImpact(null);
    
    try {
      const impact = await previewKeywordImpact(token, selectedCategoryId, keyword, false);
      console.log("Keyword impact data received:", impact);
      console.log("Type of categoryCounts:", typeof impact?.categoryCounts, impact?.categoryCounts);
      
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
      
      console.log("Mapped impact data:", safeImpact);
      setKeywordImpact(safeImpact);
      setShowKeywordImpactPreview(true);
    } catch (err) {
      console.error("Error loading keyword impact:", err);
      showErrorToast("Failed to load keyword impact");
    } finally {
      setLoadingKeywordImpact(false);
    }
  };

  // Function to handle applying a keyword to a category
  const handleApplyKeyword = async () => {
    if (!category || !selectedKeyword || !token) return;
    
    setLoading(true);
    console.log("Applying keyword:", selectedKeyword, "to category:", category, "with option:", applyOption);
    
    try {
      // First apply the keyword to the category
      await applyKeywordToCategory(token, category, selectedKeyword, applyOption);
      
      // Then save the transaction
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
      
      console.log("Saving transaction after applying keyword:", transactionData);
      await onAddTransaction(transactionData);
      
      showSuccessToast(`Transaction saved and keyword "${selectedKeyword}" applied successfully`);
      setShowKeywordImpactPreview(false);
      setSelectedKeyword("");
      
      // Reset form if this is a new transaction
      if (!initialData) {
        resetForm();
      } else {
        // If it's an edit and we have a cancel function, call it to close the form
        if (onCancel) {
          onCancel();
        }
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to apply keyword or save transaction");
    } finally {
      setLoading(false);
    }
  };

  // Modified submit handler to handle keywords
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
      
      // If we have a category and a keyword, show the impact preview before saving
      if (category && selectedKeyword) {
        console.log("Form submitted with keyword selected, showing preview");
        await loadKeywordImpact(category, selectedKeyword);
        return; // Don't save the transaction yet - we'll do that after handling the keyword
      }
      
      // If no keyword is selected, just save the transaction directly
      console.log("No keyword selected, saving transaction directly");
      await onAddTransaction(transactionData);
      
      if (!initialData) {
        resetForm();
      } else {
        // If it's an existing transaction, close the form
        if (onCancel) {
          onCancel();
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save transaction");
      showErrorToast("Failed to save transaction");
    } finally {
      if (!showKeywordImpactPreview) { // Only set loading to false if we're not showing the preview
        setLoading(false);
      }
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

  // Function to format date for display
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString));
  };

  // Function to format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
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
              <div className="space-y-2">
                <Select 
                  value={(() => {
                    // First check if the category ID exists in the categories array
                    if (category !== null && category !== undefined) {
                      const categoryExists = categories.some(c => c.id.toString() === category.toString());
                      return categoryExists ? category.toString() : 'none';
                    }
                    return 'none';
                  })()} 
                  onValueChange={(value) => {
                    setCategory(value === 'none' ? null : parseInt(value));
                    // Reset keyword when category changes
                    setSelectedKeyword("");
                  }}
                >
                  <SelectTrigger id="category" className="bg-background text-foreground">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Keyword suggestion section - only show if category is selected */}
                {category && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Label className="text-sm mr-2">Extract keyword from description:</Label>
                      <div className="flex flex-wrap gap-2">
                        {candidateKeywords.slice(0, 5).map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant={selectedKeyword === keyword ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedKeyword(keyword)}
                          >
                            {keyword}
                          </Badge>
                        ))}
                        
                        {/* Toggle for custom keyword input */}
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer"
                          onClick={() => {
                            setShowKeywordInput(!showKeywordInput);
                            if (!showKeywordInput) {
                              setTimeout(() => keywordInputRef.current?.focus(), 100);
                            }
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Custom
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Custom keyword input */}
                    {showKeywordInput && (
                      <div className="flex items-center gap-2">
                        <Input 
                          ref={keywordInputRef}
                          placeholder="Enter custom keyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newKeyword.trim()) {
                                setSelectedKeyword(newKeyword.trim());
                                setNewKeyword("");
                                setShowKeywordInput(false);
                              }
                            }
                          }}
                          className="w-full max-w-xs"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (newKeyword.trim()) {
                              setSelectedKeyword(newKeyword.trim());
                              setNewKeyword("");
                              setShowKeywordInput(false);
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    )}
                    
                    {/* Selected keyword display */}
                    {selectedKeyword && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm">Selected keyword:</p>
                        <Badge>{selectedKeyword}</Badge>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedKeyword("")}
                        >
                          <span className="sr-only">Remove</span>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
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
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          form="transaction-form"
          disabled={loading || !description || !amount}
          className="ml-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {initialData ? "Update Transaction" : "Add Transaction"}
        </Button>
      </CardFooter>

      {/* Keyword Impact Preview Dialog - Always render it */}
      <Dialog open={showKeywordImpactPreview} onOpenChange={setShowKeywordImpactPreview}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Impact of adding "{selectedKeyword}" to {categories.find(c => c.id === category)?.name || "selected category"}
            </DialogTitle>
          </DialogHeader>

          {loadingKeywordImpact ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : keywordImpact ? (
            <>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    This keyword will affect <strong>
                      {keywordImpact.totalImpactedCount}
                    </strong> transactions
                    {keywordImpact.uncategorizedCount > 0 && ` (${keywordImpact.uncategorizedCount} uncategorized)`}.
                  </p>
                </div>

                {keywordImpact.affectedCategories && 
                  keywordImpact.affectedCategories
                    .filter((category: any) => 
                      category.name !== "Uncategorized" && 
                      !category.name.includes("Category Uncategorized") && 
                      category.count > 0
                    ).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Current categories of affected transactions:</p>
                    <div className="flex flex-wrap gap-2">
                      {keywordImpact.affectedCategories
                        .filter((category: any) => 
                          category.name !== "Uncategorized" && 
                          !category.name.includes("Category Uncategorized") && 
                          category.count > 0
                        )
                        .map((category: any) => (
                          <Badge key={category.id} variant="outline">
                            {category.name} <span className="font-semibold ml-1">({category.count} transactions)</span>
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}

                {keywordImpact.sampleTransactions && keywordImpact.sampleTransactions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Sample transactions that will be affected:</p>
                    <ScrollArea className="h-[200px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Current Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keywordImpact.sampleTransactions.map((transaction: any) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.executionDate)}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                                {transaction.description}
                              </TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>
                                {transaction.category ? transaction.category.name : "Uncategorized"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium">What transactions would you like to recategorize?</p>
                  <RadioGroup
                    value={typeof applyOption === 'string' ? applyOption : JSON.stringify(applyOption)}
                    onValueChange={(value: string) => {
                      if (value === "uncategorized" || value === "all" || value === "none") {
                        setApplyOption(value);
                      } else {
                        setApplyOption(JSON.parse(value));
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">Add keyword only, don't recategorize any transactions</Label>
                    </div>
                    
                    {keywordImpact.uncategorizedCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="uncategorized" id="uncategorized" />
                        <Label htmlFor="uncategorized">
                          Recategorize only uncategorized transactions ({keywordImpact.uncategorizedCount})
                        </Label>
                      </div>
                    )}
                    
                    {keywordImpact.totalImpactedCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">
                          Recategorize all matching transactions ({keywordImpact.totalImpactedCount})
                        </Label>
                      </div>
                    )}
                    
                    {keywordImpact.affectedCategories && 
                      keywordImpact.affectedCategories
                        .filter((category: any) => 
                          category.name !== "Uncategorized" && 
                          !category.name.includes("Category Uncategorized") && 
                          category.count > 0
                        ).length > 0 && (
                      <div className="pl-6 space-y-2">
                        <p className="text-sm text-muted-foreground">Select which transactions to move by current category:</p>
                        {keywordImpact.affectedCategories
                          .filter((category: any) => 
                            category.name !== "Uncategorized" && 
                            !category.name.includes("Category Uncategorized") && 
                            category.count > 0
                          )
                          .map((category: any) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={JSON.stringify([category.id])} 
                                id={`category-${category.id}`} 
                              />
                              <Label htmlFor={`category-${category.id}`}>
                                Move {category.count} transactions from "{category.name}"
                              </Label>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </RadioGroup>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <p>No impact data available</p>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowKeywordImpactPreview(false);
                setSelectedKeyword("");
                if (!initialData) {
                  resetForm();
                }
                setLoading(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyKeyword} 
              disabled={loading || applyOption === "none" || loadingKeywordImpact || !keywordImpact}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {applyOption === "none" ? "Skip Recategorization & Save" : "Apply Changes & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}