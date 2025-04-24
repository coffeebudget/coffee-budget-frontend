"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchPendingDuplicates, resolvePendingDuplicate, fetchCategories, fetchTags, fetchCreditCards } from "@/utils/api";
import { fetchBankAccounts } from "@/utils/api-client";
import { PendingDuplicate, DuplicateTransactionChoice, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { Loader2, AlertTriangleIcon, CheckCircle2, CreditCard as CardIcon, CalendarIcon, BanknoteIcon, TagIcon, PercentIcon, InfoIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Extended types to match actual API response
interface ExtendedBankAccount extends BankAccount {
  currency?: string;
  type?: string;
}

interface ExtendedCreditCard extends CreditCard {
  // Add additional fields if needed
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

export default function PendingDuplicatesPage() {
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
        fetchCreditCards(token)
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
    } catch (err) {
      console.error(err);
      setError("Failed to resolve duplicate");
    } finally {
      setResolvingId(null);
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
      if (existing.amount === newData.amount) score += 2;
    }
    
    if (existing.executionDate && newData.executionDate) {
      total += 1;
      const date1 = new Date(existing.executionDate).toDateString();
      const date2 = new Date(newData.executionDate).toDateString();
      if (date1 === date2) score += 1;
    }
    
    return total > 0 ? Math.round((score / total) * 100) : 50;
  };

  const calculateLevenshteinDistance = (a: string, b: string) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i += 1) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= b.length; j += 1) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[b.length][a.length];
  };

  const normalizeAmount = (amount: number | string): number => {
    if (typeof amount === 'string') {
      return parseFloat(amount);
    }
    return amount;
  };

  const getSourceDescription = (source: string, reference?: string) => {
    switch (source) {
      case 'recurring':
        return "Created from a recurring transaction pattern";
      case 'csv_import':
        return "Imported from a CSV file";
      case 'api':
        return "Imported via API integration";
      default:
        return reference || "Unknown source";
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage pending duplicates.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-800">Pending Duplicates</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Review and resolve potential duplicate transactions detected in your account.
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto">
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
            <div className="space-y-4">
              {pendingDuplicates.map((duplicate) => {
                const similarity = calculateSimilarity(duplicate.existingTransaction, duplicate.newTransactionData);
                const existingTagNames = getTagNames(duplicate.existingTransaction.tagIds);
                const newTagNames = getTagNames(duplicate.newTransactionData.tagIds);
                
                // Get bank account and credit card info
                const existingBankAccount = getBankAccountInfo(
                  duplicate.existingTransaction.bankAccountId || 
                  (duplicate.existingTransaction as any).bankAccount
                );
                const newBankAccount = getBankAccountInfo(
                  duplicate.newTransactionData.bankAccountId || 
                  duplicate.newTransactionData.bankAccount
                );
                const existingCreditCard = getCreditCardInfo(
                  duplicate.existingTransaction.creditCardId || 
                  (duplicate.existingTransaction as any).creditCard
                );
                const newCreditCard = getCreditCardInfo(
                  duplicate.newTransactionData.creditCardId || 
                  duplicate.newTransactionData.creditCard
                );
                
                // Get category info
                const existingCategory = (duplicate.existingTransaction as any).category || duplicate.existingTransaction.categoryId;
                const newCategory = duplicate.newTransactionData.category || duplicate.newTransactionData.categoryId;
                
                // Normalize amounts
                const existingAmount = normalizeAmount(duplicate.existingTransaction.amount);
                const newAmount = normalizeAmount(duplicate.newTransactionData.amount);
                
                return (
                  <Card key={duplicate.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
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
                          <Badge variant={duplicate.existingTransaction.status === "executed" ? "secondary" : "outline"}>
                            {duplicate.existingTransaction.status || "executed"}
                          </Badge>
                        </div>
                        
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
                                onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.MERGE)}
                                variant="default"
                                size="sm"
                                disabled={loading}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Merge
                              </Button>
                              <Button
                                onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.REPLACE)}
                                variant="outline"
                                size="sm"
                                className="border-amber-500 text-amber-700 hover:bg-amber-50"
                                disabled={loading}
                              >
                                Replace
                              </Button>
                              <Button
                                onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.IGNORE)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                Ignore
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
