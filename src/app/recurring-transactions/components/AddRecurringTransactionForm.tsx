"use client";

import { useState, useEffect } from "react";
import { RecurringTransaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import { fetchCategories, fetchTags, fetchBankAccounts, fetchCreditCards } from "@/utils/api";
import { useSession } from "next-auth/react";
import TagSelector from '@/components/TagSelector';

type AddRecurringTransactionFormProps = {
  onAddTransaction: (transaction: RecurringTransaction, applyToPast: boolean) => void;
  initialData?: RecurringTransaction | null;
};

export default function AddRecurringTransactionForm({ 
  onAddTransaction, 
  initialData = null,
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

  useEffect(() => {
    console.log('Initial Data:', initialData);
  }, [initialData]);

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
          fetchBankAccounts(token),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    onAddTransaction(transaction, applyToPast);
    if (!initialData) {
      resetForm();
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
    <form onSubmit={handleSubmit} className="mb-4 w-full max-w-xl bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">
        {initialData ? "Edit Recurring Transaction" : "Add Recurring Transaction"}
      </h2>
      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="status">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED')}
            className="w-full p-2 border rounded"
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="type">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'expense' | 'income' | 'credit')}
            className="w-full p-2 border rounded"
        >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        <div className="flex gap-2">
          <label className="block text-gray-700 mb-2" htmlFor="frequencyEveryN">Frequency</label>
          <input
            type="number"
            min="1"
            value={frequencyEveryN}
            onChange={(e) => setFrequencyEveryN(parseInt(e.target.value))}
            className="w-1/3 p-2 border rounded"
            required
          />
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
            className="w-2/3 p-2 border rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="occurrences">Number of occurrences (optional)</label>
          <input
            type="number"
            id="occurrences"
            value={occurrences}
            onChange={(e) => setOccurrences(e.target.value)}
            className="w-full p-2 border rounded"
            min="1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="categoryId">Category</label>
          <select
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border rounded"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-gray-700 mb-2" htmlFor="tags">Tags</label>
          <TagSelector
            tags={tags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="paymentMethod">Payment Method</label>
          <div className="flex gap-4 mb-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={selectionType === "bank"}
                onChange={() => {
                  setSelectionType("bank");
                  setSelectedCreditCard(null);
                }}
                className="form-radio"
              />
              <span className="ml-2">Bank Account</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={selectionType === "card"}
                onChange={() => {
                  setSelectionType("card");
                  setSelectedBankAccount(null);
                }}
                className="form-radio"
              />
              <span className="ml-2">Credit Card</span>
            </label>
          </div>

          {selectionType === "bank" && (
            <select
              value={selectedBankAccount || ''}
              onChange={(e) => setSelectedBankAccount(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Bank Account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          )}

          {selectionType === "card" && (
            <select
              value={selectedCreditCard || ''}
              onChange={(e) => setSelectedCreditCard(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Credit Card</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {initialData && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={applyToPast}
                onChange={(e) => setApplyToPast(e.target.checked)}
                className="form-checkbox"
              />
              <span>Apply changes to past transactions</span>
            </label>
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          {initialData ? "Update Recurring Transaction" : "Add Recurring Transaction"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
} 