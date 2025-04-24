"use client";

import { useState, useEffect } from "react";
import { RecurringTransaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { fetchCategories, fetchTags, fetchCreditCards } from "@/utils/api";
import { fetchBankAccounts } from "@/utils/api-client";
import { useSession } from "next-auth/react";
import TagSelector from '@/components/TagSelector';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type AddRecurringTransactionFormProps = {
  onAddTransaction: (transaction: RecurringTransaction, applyToPast: boolean) => void;
  initialData?: RecurringTransaction | null;
  onCancel?: () => void;
};

export default function AddRecurringTransactionForm({ 
  onAddTransaction, 
  initialData = null,
  onCancel,
}: AddRecurringTransactionFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
  const [status, setStatus] = useState<'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'>(
    initialData?.status || 'SCHEDULED'
  );
  const [type, setType] = useState<'expense' | 'income' | 'credit'>(initialData?.type || 'expense');
  const [frequencyEveryN, setFrequencyEveryN] = useState<number>(initialData?.frequencyEveryN || 1);
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    initialData?.frequencyType || 'monthly'
  );
  const [occurrences, setOccurrences] = useState<string>(initialData?.occurrences?.toString() || '');
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(initialData?.category?.id || null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>(initialData?.tags?.map(t => t.id) || []);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<number | null>(
    initialData?.bankAccount?.id || null
  );
  const [selectedCreditCard, setSelectedCreditCard] = useState<number | null>(
    initialData?.creditCard?.id || null
  );
  const [selectionType, setSelectionType] = useState<"bank" | "card" | null>(
    initialData?.bankAccount ? "bank" : initialData?.creditCard ? "card" : null
  );
  const [applyToPast, setApplyToPast] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setAmount(initialData.amount.toString());
      setStatus(initialData.status);
      setType(initialData.type);
      setFrequencyEveryN(initialData.frequencyEveryN);
      setFrequencyType(initialData.frequencyType);
      setOccurrences(initialData.occurrences?.toString() || "");
      setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "");
      setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "");
      setCategoryId(initialData.category?.id || null);
      setSelectedTags(initialData.tags?.map(t => t.id) || []);
      setSelectedBankAccount(initialData.bankAccount?.id || null);
      setSelectedCreditCard(initialData.creditCard?.id || null);
      setSelectionType(initialData.bankAccount ? "bank" : initialData.creditCard ? "card" : null);
      setApplyToPast(initialData.applyToPast || false);
    } else {
      resetForm();
    }
  }, [initialData]);

  useEffect(() => {
    if (!token) return;

    async function loadData() {
      try {
        const [categoriesData, tagsData, bankAccountsData, creditCardsData] = await Promise.all([
          fetchCategories(token),
          fetchTags(token),
          fetchBankAccounts(),
          fetchCreditCards(token)
        ]);
        setCategories(categoriesData);
        setTags(tagsData);
        setBankAccounts(bankAccountsData);
        setCreditCards(creditCardsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError("Failed to load data");
      }
    }
    loadData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const transaction: RecurringTransaction = {
        id: initialData?.id,
        name,
        description,
        amount: parseFloat(amount),
        status,
        type,
        frequencyEveryN,
        frequencyType,
        occurrences: occurrences ? parseInt(occurrences) : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        categoryId: categoryId || undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        bankAccountId: selectionType === "bank" ? selectedBankAccount || undefined : undefined,
        creditCardId: selectionType === "card" ? selectedCreditCard || undefined : undefined,
      };
  
      await onAddTransaction(transaction, applyToPast);
      if (!initialData) {
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError("An error occurred while saving the transaction");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setAmount("");
    setStatus('SCHEDULED');
    setType('expense');
    setFrequencyEveryN(1);
    setFrequencyType('monthly');
    setOccurrences('');
    setStartDate('');
    setEndDate('');
    setCategoryId(null);
    setSelectedTags([]);
    setSelectedBankAccount(null);
    setSelectedCreditCard(null);
    setSelectionType(null);
    setApplyToPast(false);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Recurring Transaction" : "Add New Recurring Transaction"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <form id="recurring-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter transaction name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
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
                onValueChange={(value) => setType(value as 'expense' | 'income' | 'credit')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value) => setStatus(value as 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select 
                value={categoryId?.toString() || 'none'} 
                onValueChange={(value) => setCategoryId(value === 'none' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id?.toString() || `category-${category.name}`}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Frequency</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={frequencyEveryN}
                  onChange={(e) => setFrequencyEveryN(parseInt(e.target.value))}
                  className="w-1/3"
                  required
                />
                <div className="w-2/3">
                  <Select 
                    value={frequencyType} 
                    onValueChange={(value: string) => setFrequencyType(value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="occurrences">Occurrences (optional)</Label>
              <Input
                id="occurrences"
                type="number"
                min="1"
                placeholder="No. of times to repeat"
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <TagSelector
                tags={tags}
                selectedTags={selectedTags}
                onChange={setSelectedTags}
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
                    value={selectedBankAccount?.toString() || 'none'} 
                    onValueChange={(value) => setSelectedBankAccount(value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id?.toString() || `account-${account.name}`}>
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
                    value={selectedCreditCard?.toString() || 'none'} 
                    onValueChange={(value) => setSelectedCreditCard(value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit card" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id?.toString() || `card-${card.name}`}>
                          {card.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {initialData && (
              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox 
                  id="applyToPast" 
                  checked={applyToPast}
                  onCheckedChange={(checked) => setApplyToPast(checked === true)} 
                />
                <Label htmlFor="applyToPast" className="text-sm font-normal">
                  Apply changes to past transactions
                </Label>
              </div>
            )}
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
          form="recurring-form"
          disabled={loading || !name.trim() || !amount || !startDate}
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