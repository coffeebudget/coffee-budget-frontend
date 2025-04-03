"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Transaction, BankAccount, CreditCard, Category, Tag } from "@/utils/types";
import { fetchBankAccounts, fetchCreditCards, fetchCategories, fetchTags } from "@/utils/api";
import TagSelector from "@/components/TagSelector";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
  const [executionDate, setExecutionDate] = useState(initialData?.executionDate ? new Date(initialData.executionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<number | null>(initialData?.categoryId || null);
  const [selectedTags, setSelectedTags] = useState<number[]>(initialData?.tags?.map(t => t.id) || []);
  const [selectedBankAccount, setSelectedBankAccount] = useState<number | null>(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState<number | null>(null);
  const [selectionType, setSelectionType] = useState<"bank" | "card" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type || 'expense');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(initialData?.status || 'pending');

  useEffect(() => {
    if (!token) return;

    async function loadData() {
      try {
        const [bankAccountsData, creditCardsData, categoriesData, tagsData] = await Promise.all([
          fetchBankAccounts(token),
          fetchCreditCards(token),
          fetchCategories(token),
          fetchTags(token),
        ]);
        setSelectedBankAccount(bankAccountsData);
        setSelectedCreditCard(creditCardsData);
        setCategory(categoriesData);
        setSelectedTags(tagsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      }
    }
    loadData();
  }, [token]);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setExecutionDate(initialData.executionDate ? new Date(initialData.executionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setCategory(initialData.categoryId);
      setSelectedTags(initialData.tags?.map(t => t.id) || []);
      setSelectedBankAccount(initialData.bankAccountId || null);
      setSelectedCreditCard(initialData.creditCardId || null);
      setSelectionType(initialData.bankAccountId ? "bank" : initialData.creditCardId ? "card" : null);
      setType(initialData.type);
      setStatus(initialData.status || 'pending');
    } else {
      resetForm();
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData: Transaction = {
      description: description,
      amount: parseFloat(amount),
      type: type,
      status: status,
      executionDate: executionDate,
      categoryId: category ? Number(category) : null,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      bankAccountId: selectedBankAccount ? Number(selectedBankAccount) : null,
      creditCardId: selectedCreditCard ? Number(selectedCreditCard) : null,
      ...(initialData?.id ? { id: initialData.id } : {})
    };
    
    setLoading(true);
    onAddTransaction(transactionData);
    if (!initialData) {
      resetForm();
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

  return (
    <form onSubmit={handleSubmit} className="mb-4 w-full max-w-xl bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">{initialData ? "Edit Transaction" : "Add Transaction"}</h2>

      <div className="space-y-4">
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
          <label className="block text-gray-700 mb-2" htmlFor="executionDate">Execution Date</label>
          <input
            type="date"
            id="executionDate"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="category">Category</label>
          <select
            value={category !== null ? category.toString() : ""}
            onChange={(e) => setCategory(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tags</label>
          <TagSelector
            tags={tags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'expense' | 'income')}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'pending' | 'executed')}
            className="w-full p-2 border rounded"
          >
            <option value="pending">Pending</option>
            <option value="executed">Executed</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Payment Method</label>
          <div className="flex gap-4 mb-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="bank"
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
                value="card"
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
              value={selectedBankAccount !== null ? selectedBankAccount.toString() : ""}
              onChange={(e) => setSelectedBankAccount(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Bank Account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id?.toString() || ""}>
                  {account.name}
                </option>
              ))}
            </select>
          )}

          {selectionType === "card" && (
            <select
              value={selectedCreditCard !== null ? selectedCreditCard.toString() : ""}
              onChange={(e) => setSelectedCreditCard(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Credit Card</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id.toString()}>
                  {card.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </CardFooter>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </form>
  );
}