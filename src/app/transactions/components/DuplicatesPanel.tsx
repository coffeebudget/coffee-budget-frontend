"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchPendingDuplicates, resolvePendingDuplicate, fetchCategories, fetchTags, triggerDuplicateDetection, bulkResolvePendingDuplicates, bulkDeletePendingDuplicates, cleanupActualDuplicates } from "@/utils/api";
import { fetchBankAccounts, fetchCreditCards } from "@/utils/api-client";
import { PendingDuplicate, DuplicateTransactionChoice, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { Loader2, AlertTriangleIcon, CheckCircle2, CreditCard as CardIcon, CalendarIcon, BanknoteIcon, TagIcon, PercentIcon, InfoIcon, SearchIcon, Trash2, Check, CheckSquare, Filter, Recycle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Extended types to match actual API response
interface ExtendedBankAccount extends BankAccount {
  currency?: string;
  type?: string;
}

interface ExtendedCreditCard extends CreditCard {
  extraField?: string;
}

// Represents the API response format
interface ApiPendingDuplicate extends Omit<PendingDuplicate, 'newTransactionData'> {
  newTransactionData: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    executionDate?: string | Date;
    bankAccount?: ExtendedBankAccount;
    category?: Category;
    creditCard?: ExtendedCreditCard;
    bankAccountId?: number;
    categoryId?: number;
    creditCardId?: number;
    tagIds?: number[];
    status?: 'pending' | 'executed';
    source?: string;
  };
  existingTransactionData?: string; // Raw JSON string
}

export default function DuplicatesPanel() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [pendingDuplicates, setPendingDuplicates] = useState<ApiPendingDuplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [cleaningUpDuplicates, setCleaningUpDuplicates] = useState(false);
  
  // Bulk action states
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [similarityFilter, setSimilarityFilter] = useState<number>(0); // 0 = all, 60, 80, etc.

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  async function loadData() {
    setLoading(true);
    try {
      // First, fetch the pending duplicates
      const duplicatesData = await fetchPendingDuplicates(token);
      
      // Then fetch the other related data for reference
      const [categoriesData, tagsData, bankAccountsData, creditCardsData] = await Promise.all([
        fetchCategories(token),
        fetchTags(token),
        fetchBankAccounts(),
        fetchCreditCards()
      ]);
      
      setPendingDuplicates(duplicatesData);
      setCategories(categoriesData);
      setTags(tagsData);
      setBankAccounts(bankAccountsData);
      setCreditCards(creditCardsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const handleResolveDuplicate = async (duplicateId: number, choice: DuplicateTransactionChoice) => {
    setResolvingId(duplicateId);
    try {
      await resolvePendingDuplicate(token, duplicateId, choice);
      await loadData();
      // Remove from selected if it was selected
      setSelectedDuplicates(prev => {
        const newSet = new Set(prev);
        newSet.delete(duplicateId);
        return newSet;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to resolve duplicate");
    } finally {
      setResolvingId(null);
    }
  };

  const handleDetectDuplicates = async () => {
    if (!token) return;
    
    setDetectingDuplicates(true);
    try {
      const result = await triggerDuplicateDetection(token);
      
      toast.success(`Found ${result.potentialDuplicatesFound} potential duplicates, created ${result.pendingDuplicatesCreated} new pending duplicates in ${result.executionTime}`);
      
      // Reload the pending duplicates list
      await loadData();
    } catch (err) {
      console.error("Duplicate detection failed:", err);
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!token) return;
    
    setCleaningUpDuplicates(true);
    try {
      const result = await cleanupActualDuplicates(token);
      
      toast.success(`Cleanup completed! Removed ${result.duplicatesRemoved} duplicate transactions, kept ${result.transactionsKept} unique transactions. Processing time: ${result.executionTime}`);
      
      // Reload the pending duplicates list
      await loadData();
    } catch (err) {
      console.error("Cleanup failed:", err);
      toast.error(err instanceof Error ? err.message : "Cleanup failed");
    } finally {
      setCleaningUpDuplicates(false);
    }
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const filtered = getFilteredDuplicates();
    if (selectedDuplicates.size === filtered.length) {
      setSelectedDuplicates(new Set());
    } else {
      setSelectedDuplicates(new Set(filtered.map(d => d.id)));
    }
  };

  const handleSelectDuplicate = (duplicateId: number, checked: boolean) => {
    setSelectedDuplicates(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(duplicateId);
      } else {
        newSet.delete(duplicateId);
      }
      return newSet;
    });
  };

  const handleBulkResolve = async (choice: DuplicateTransactionChoice) => {
    if (selectedDuplicates.size === 0) return;
    
    setBulkProcessing(true);
    try {
      const result = await bulkResolvePendingDuplicates(token, Array.from(selectedDuplicates), choice);
      
      if (result.errors > 0) {
        toast.error(`${result.resolved} resolved successfully, ${result.errors} failed`);
      } else {
        toast.success(`${result.resolved} duplicates resolved successfully`);
      }
      
      setSelectedDuplicates(new Set());
      await loadData();
    } catch (err) {
      console.error("Bulk resolve failed:", err);
      toast.error(err instanceof Error ? err.message : "Bulk operation failed");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDuplicates.size === 0) return;
    
    setBulkProcessing(true);
    try {
      const result = await bulkDeletePendingDuplicates(token, Array.from(selectedDuplicates));
      
      if (result.errors > 0) {
        toast.error(`${result.deleted} deleted successfully, ${result.errors} failed`);
      } else {
        toast.success(`${result.deleted} duplicates deleted successfully`);
      }
      
      setSelectedDuplicates(new Set());
      await loadData();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setBulkProcessing(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get category name from either a direct category object or ID
  const getCategoryName = (categoryInput: number | null | Category | undefined) => {
    if (!categoryInput) return "Uncategorized";
    
    // If we have a direct category object
    if (typeof categoryInput === 'object' && 'name' in categoryInput) {
      return categoryInput.name;
    }
    
    // Otherwise look it up by ID
    const categoryId = typeof categoryInput === 'number' ? categoryInput : null;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  const getTagNames = (tagIds: number[] | undefined) => {
    if (!tagIds || tagIds.length === 0) return [];
    return tagIds.map(id => {
      const tag = tags.find(t => t.id === id);
      return tag ? tag.name : `Tag-${id}`;
    });
  };

  // Handle both direct bank account objects or IDs
  const getBankAccountInfo = (accountInput: ExtendedBankAccount | number | undefined) => {
    if (!accountInput) return null;
    
    // If we have a direct bank account object
    if (typeof accountInput === 'object') {
      return accountInput;
    }
    
    // Otherwise look it up by ID
    const account = bankAccounts.find(a => a.id === accountInput);
    return account || null;
  };

  // Handle both direct credit card objects or IDs
  const getCreditCardInfo = (cardInput: ExtendedCreditCard | number | undefined) => {
    if (!cardInput) return null;
    
    // If we have a direct credit card object
    if (typeof cardInput === 'object') {
      return cardInput;
    }
    
    // Otherwise look it up by ID
    const card = creditCards.find(c => c.id === cardInput);
    return card || null;
  };

  const calculateSimilarity = (existing: any, newData: any) => {
    let score = 0;
    let total = 0;
    
    // Handle case where existing transaction is null
    if (!existing || !newData) {
      return 0; // No similarity if either is null
    }
    
    if (existing.description && newData.description) {
      total += 3;
      const desc1 = existing.description.toLowerCase();
      const desc2 = newData.description.toLowerCase();
      
      if (desc1 === desc2) score += 3;
      else if (desc1.includes(desc2) || desc2.includes(desc1)) score += 2;
      else if (calculateLevenshteinDistance(desc1, desc2) / Math.max(desc1.length, desc2.length) < 0.3) score += 1;
    }
    
    if (existing.amount && newData.amount) {
      total += 2;
      const amount1 = normalizeAmount(existing.amount);
      const amount2 = normalizeAmount(newData.amount);
      
      if (Math.abs(amount1 - amount2) < 0.01) score += 2;
      else if (Math.abs(amount1 - amount2) < amount1 * 0.1) score += 1;
    }
    
    if (existing.executionDate && newData.executionDate) {
      total += 1;
      const date1 = new Date(existing.executionDate).getTime();
      const date2 = new Date(newData.executionDate).getTime();
      const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === 0) score += 1;
      else if (daysDiff <= 1) score += 0.7;
      else if (daysDiff <= 7) score += 0.3;
    }
    
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const calculateLevenshteinDistance = (a: string, b: string) => {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  };

  const normalizeAmount = (amount: number | string): number => {
    if (typeof amount === 'string') {
      return parseFloat(amount.replace(/[^-\d.]/g, ''));
    }
    return Math.abs(amount);
  };

  const getSourceDescription = (source: string, reference?: string) => {
    switch (source) {
      case 'csv_import':
        return `Detected during CSV import${reference ? ` (${reference})` : ''}`;
      case 'api':
        return `Detected during API sync${reference ? ` (${reference})` : ''}`;
      case 'duplicate_detection':
        return 'Found by manual duplicate detection';
      default:
        return `Source: ${source}${reference ? ` (${reference})` : ''}`;
    }
  };

  // Filter duplicates by similarity
  const getFilteredDuplicates = () => {
    let filtered = pendingDuplicates;
    
    if (similarityFilter > 0) {
      filtered = filtered.filter(duplicate => {
        const similarity = calculateSimilarity(duplicate.existingTransaction, duplicate.newTransactionData);
        return similarity >= similarityFilter;
      });
    }
    
    return filtered.sort((a, b) => {
      const similarityA = calculateSimilarity(a.existingTransaction, a.newTransactionData);
      const similarityB = calculateSimilarity(b.existingTransaction, b.newTransactionData);
      return similarityB - similarityA; // Sort by similarity percentage descending (highest first)
    });
  };

  const filteredDuplicates = getFilteredDuplicates();
  const isAllSelected = selectedDuplicates.size > 0 && selectedDuplicates.size === filteredDuplicates.length;
  const isPartiallySelected = selectedDuplicates.size > 0 && selectedDuplicates.size < filteredDuplicates.length;

  return (
    <div>
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {pendingDuplicates.length > 0 && (
            <Badge variant="outline" className="text-sm px-2 py-0.5">
              {pendingDuplicates.length} {pendingDuplicates.length === 1 ? 'duplicate' : 'duplicates'}
            </Badge>
          )}
          {pendingDuplicates.length > 0 && (
            <span className="text-sm text-gray-500">
              Sorted by match confidence
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDetectDuplicates}
            disabled={detectingDuplicates || loading || cleaningUpDuplicates}
            size="sm"
            className="flex items-center gap-2"
          >
            {detectingDuplicates ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                Detect Duplicates
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={cleaningUpDuplicates || loading || detectingDuplicates}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-orange-500 text-orange-700 hover:bg-orange-50"
              >
                {cleaningUpDuplicates ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Recycle className="h-4 w-4" />
                    Cleanup Actual Duplicates
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cleanup Actual Duplicates</AlertDialogTitle>
                <AlertDialogDescription>
                  This will automatically find and remove 100% identical duplicate transactions from your database.
                  The system will keep the oldest transaction for each duplicate group and remove the newer ones.
                  <br /><br />
                  <strong>This action cannot be undone.</strong>
                  <br /><br />
                  Transactions that are already referenced by pending duplicates will be protected and not removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupDuplicates} className="bg-orange-600 hover:bg-orange-700">
                  Cleanup Duplicates
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading pending duplicates...</span>
          </div>
        ) : error ? (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="text-red-500 text-center">
              <p>{error}</p>
              <Button 
                onClick={loadData}
                className="mt-4"
                variant="default"
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : pendingDuplicates.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-8">
              <AlertTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No pending duplicates found</h3>
              <p className="text-gray-600 mb-2 max-w-md mx-auto">
                Duplicate transactions will appear here when the system detects potential matches.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Sources of potential duplicates:
              </p>
              <ul className="text-sm text-gray-500 mt-2 flex flex-col gap-1">
                <li className="flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <span>Recurring transactions</span>
                </li>
                <li className="flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <span>CSV imports</span>
                </li>
                <li className="flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <span>APIs (Open Banking, Plaid, etc.)</span>
                </li>
              </ul>
            </div>
          </Card>
        ) : (
          <TooltipProvider>
            {/* Bulk Actions Header */}
            {filteredDuplicates.length > 0 && (
              <Card className="mb-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                                             <Checkbox
                         checked={isAllSelected}
                         ref={(el: any) => {
                           if (el) el.indeterminate = isPartiallySelected;
                         }}
                         onCheckedChange={handleSelectAll}
                       />
                      <span className="text-sm font-medium">
                        Select All ({selectedDuplicates.size} selected)
                      </span>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          Filter by Similarity
                          {similarityFilter > 0 && (
                            <Badge variant="secondary" className="ml-1">
                              {similarityFilter}%+
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Minimum Similarity</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSimilarityFilter(0)}>
                          All Duplicates
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSimilarityFilter(60)}>
                          60%+ (Good matches)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSimilarityFilter(80)}>
                          80%+ (High confidence)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSimilarityFilter(90)}>
                          90%+ (Very likely duplicates)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {selectedDuplicates.size > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-500 text-green-700 hover:bg-green-50"
                            disabled={bulkProcessing}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Keep Existing ({selectedDuplicates.size})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Keep Existing Transactions?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will keep the existing transactions and discard the new ones for {selectedDuplicates.size} selected duplicates. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleBulkResolve(DuplicateTransactionChoice.KEEP_EXISTING)}>
                              Keep Existing
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-blue-500 text-blue-700 hover:bg-blue-50"
                            disabled={bulkProcessing}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Use New ({selectedDuplicates.size})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Use New Transactions?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will keep the new transactions and remove the existing ones for {selectedDuplicates.size} selected duplicates. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleBulkResolve(DuplicateTransactionChoice.USE_NEW)}>
                              Use New
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button 
                        onClick={() => handleBulkResolve(DuplicateTransactionChoice.MAINTAIN_BOTH)}
                        variant="outline" 
                        size="sm" 
                        className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                        disabled={bulkProcessing}
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Keep Both ({selectedDuplicates.size})
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-500 text-red-700 hover:bg-red-50"
                            disabled={bulkProcessing}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete ({selectedDuplicates.size})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Pending Duplicates?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete the {selectedDuplicates.size} selected pending duplicates without resolving them. The original transactions will remain unchanged. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {bulkProcessing && (
                        <div className="flex items-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="space-y-4">
              {filteredDuplicates.map((duplicate) => {
                const similarity = calculateSimilarity(duplicate.existingTransaction, duplicate.newTransactionData);
                const existingTagNames = duplicate.existingTransaction ? getTagNames(duplicate.existingTransaction.tagIds) : [];
                const newTagNames = getTagNames(duplicate.newTransactionData.tagIds);
                
                // Get bank account and credit card info
                const existingBankAccount = duplicate.existingTransaction ? getBankAccountInfo(
                  duplicate.existingTransaction.bankAccountId || 
                  (duplicate.existingTransaction as any).bankAccount
                ) : null;
                const newBankAccount = getBankAccountInfo(
                  duplicate.newTransactionData.bankAccountId || 
                  duplicate.newTransactionData.bankAccount
                );
                const existingCreditCard = duplicate.existingTransaction ? getCreditCardInfo(
                  duplicate.existingTransaction.creditCardId || 
                  (duplicate.existingTransaction as any).creditCard
                ) : null;
                const newCreditCard = getCreditCardInfo(
                  duplicate.newTransactionData.creditCardId || 
                  duplicate.newTransactionData.creditCard
                );
                
                // Get category info
                const existingCategory = duplicate.existingTransaction ? ((duplicate.existingTransaction as any).category || duplicate.existingTransaction.categoryId) : null;
                const newCategory = duplicate.newTransactionData.category || duplicate.newTransactionData.categoryId;
                
                // Normalize amounts
                const existingAmount = duplicate.existingTransaction ? normalizeAmount(duplicate.existingTransaction.amount) : 0;
                const newAmount = normalizeAmount(duplicate.newTransactionData.amount);
                
                const isSelected = selectedDuplicates.has(duplicate.id);
                
                return (
                  <Card key={duplicate.id} className={`overflow-hidden hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectDuplicate(duplicate.id, checked as boolean)}
                        />
                        <h3 className="font-medium text-gray-800">Potential Duplicate</h3>
                        <Badge variant={similarity > 80 ? "destructive" : similarity > 60 ? "outline" : "outline"} className="ml-2">
                          {similarity}% Match
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <InfoIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getSourceDescription(duplicate.source, duplicate.sourceReference)}</p>
                            <p className="text-xs">Created: {formatDate(duplicate.createdAt)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-0">
                      <CardContent className="border-b md:border-b-0 md:border-r border-gray-200 p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-800">Existing Transaction</h3>
                          {duplicate.existingTransaction ? (
                            <Badge variant={duplicate.existingTransaction.status === "executed" ? "secondary" : "outline"}>
                              {duplicate.existingTransaction.status || "executed"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Found</Badge>
                          )}
                        </div>
                        
                        {duplicate.existingTransaction ? (
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium">{duplicate.existingTransaction.description}</p>
                              <p className={`text-lg font-bold ${duplicate.existingTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {duplicate.existingTransaction.type === 'income' ? '+' : ''}{formatAmount(existingAmount)}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1 text-gray-600">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span>{formatDate(duplicate.existingTransaction.executionDate)}</span>
                              </div>
                              
                              <div className="flex items-center gap-1 text-gray-600">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                  {getCategoryName(existingCategory)}
                                </span>
                              </div>
                            
                            {existingBankAccount && (
                              <div className="flex items-center gap-1 text-gray-600 col-span-2">
                                <BanknoteIcon className="h-3.5 w-3.5" />
                                <span className="font-medium">{existingBankAccount.name}</span>
                                {existingBankAccount.balance && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Balance: {typeof existingBankAccount.balance === 'string' 
                                      ? parseFloat(existingBankAccount.balance).toLocaleString() 
                                      : existingBankAccount.balance.toLocaleString()})
                                  </span>
                                )}
                                {(existingBankAccount as ExtendedBankAccount).type && (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded ml-1">
                                    {(existingBankAccount as ExtendedBankAccount).type}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {existingCreditCard && (
                              <div className="flex items-center gap-1 text-gray-600 col-span-2">
                                <CardIcon className="h-3.5 w-3.5" />
                                <span className="font-medium">{existingCreditCard.name}</span>
                                {'availableCredit' in existingCreditCard && existingCreditCard.availableCredit && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Avail: {formatAmount(existingCreditCard.availableCredit)})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {existingTagNames.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 col-span-2 mt-1">
                                <TagIcon className="h-3.5 w-3.5 text-gray-400" />
                                {existingTagNames.map((tag, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-sm text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-center py-8">
                              <p className="text-gray-500">Original transaction no longer exists</p>
                              <p className="text-sm text-gray-400 mt-2">The referenced transaction may have been deleted</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-gray-800">New Transaction</h3>
                          <Badge variant={duplicate.newTransactionData.status === "executed" ? "secondary" : "outline"}>
                            {duplicate.newTransactionData.status || "pending"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium">{duplicate.newTransactionData.description}</p>
                            <p className={`text-lg font-bold ${duplicate.newTransactionData.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {duplicate.newTransactionData.type === 'income' ? '+' : ''}{formatAmount(newAmount)}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {duplicate.newTransactionData.executionDate && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span>{formatDate(duplicate.newTransactionData.executionDate)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 text-gray-600">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                {getCategoryName(newCategory)}
                              </span>
                            </div>
                            
                            {newBankAccount && (
                              <div className="flex items-center gap-1 text-gray-600 col-span-2">
                                <BanknoteIcon className="h-3.5 w-3.5" />
                                <span className="font-medium">{newBankAccount.name}</span>
                                {newBankAccount.balance && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Balance: {typeof newBankAccount.balance === 'string' 
                                      ? parseFloat(newBankAccount.balance).toLocaleString() 
                                      : newBankAccount.balance.toLocaleString()})
                                  </span>
                                )}
                                {(newBankAccount as ExtendedBankAccount).currency && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    {(newBankAccount as ExtendedBankAccount).currency}
                                  </span>
                                )}
                                {(newBankAccount as ExtendedBankAccount).type && (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded ml-1">
                                    {(newBankAccount as ExtendedBankAccount).type}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {newCreditCard && (
                              <div className="flex items-center gap-1 text-gray-600 col-span-2">
                                <CardIcon className="h-3.5 w-3.5" />
                                <span className="font-medium">{newCreditCard.name}</span>
                                {'availableCredit' in newCreditCard && newCreditCard.availableCredit && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Avail: {formatAmount(newCreditCard.availableCredit)})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {newTagNames.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 col-span-2 mt-1">
                                <TagIcon className="h-3.5 w-3.5 text-gray-400" />
                                {newTagNames.map((tag, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-sm text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                    
                    <div className="p-4 border-t bg-gray-50">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <PercentIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            Similarity: <span className="font-medium">{similarity}%</span>
                          </span>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-blue-500 cursor-help underline">Why?</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Similarity is calculated based on matching description, amount, and date.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 ml-auto">
                          {resolvingId === duplicate.id ? (
                            <div className="flex items-center text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Processing...
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.USE_NEW)}
                                variant="default"
                                size="sm"
                                disabled={loading}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Use New
                              </Button>
                              <Button
                                onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.KEEP_EXISTING)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                Keep Existing
                              </Button>
                              <Button
                                onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.MAINTAIN_BOTH)}
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-700 hover:bg-green-50"
                                disabled={loading}
                              >
                                Keep Both
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
