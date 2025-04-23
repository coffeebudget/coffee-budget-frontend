"use client";

import { useEffect, useState } from "react";
import { fetchCategories, fetchTags, fetchBankAccounts, fetchCreditCards } from "@/utils/api";
import { fetchFilteredTransactions, createTransaction, deleteTransaction, updateTransaction } from "@/utils/api-client";
import { useSession } from "next-auth/react";
import AddTransactionForm from "@/app/transactions/components/AddTransactionForm";
import TransactionList from "@/app/transactions/components/TransactionList";
import TransactionFilters from "@/components/common/TransactionFilters";
import { Transaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import ImportTransactionsForm from "@/app/transactions/components/ImportTransactionsForm";
import { Loader2, ReceiptIcon, PlusCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccessToast, showErrorToast } from "@/utils/toast-utils";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  // Get date for 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeTab, setActiveTab] = useState("transactions");
  
  // Filters state
  const [filters, setFilters] = useState({
    startDate: thirtyDaysAgo.toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
    categoryIds: [] as number[],
    tagIds: [] as number[],
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
    type: undefined as 'expense' | 'income' | undefined,
    searchTerm: '',
    orderBy: 'executionDate' as 'executionDate' | 'amount' | 'description',
    orderDirection: 'desc' as 'asc' | 'desc',
    uncategorizedOnly: false,
  });

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const [transactionsData, categoriesData, tagsData, bankAccountsData, creditCardsData] = await Promise.all([
        fetchFilteredTransactions(filters),
        fetchCategories(token),
        fetchTags(token),
        fetchBankAccounts(token),
        fetchCreditCards(token)
      ]);
      setTransactions(transactionsData);
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
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyFilters = () => {
    loadData();
  };

  const handleAddOrUpdateTransaction = async (transaction: Transaction) => {
    try {
      if (currentTransaction) {
        // Update existing transaction
        const updatedTransaction = await updateTransaction(currentTransaction.id!, transaction);
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        showSuccessToast("Transaction updated successfully");
      } else {
        // Create new transaction
        const newTransaction = await createTransaction(transaction as any);
        setTransactions(prev => [...prev, newTransaction]);
        showSuccessToast("Transaction created successfully");
      }
      setCurrentTransaction(null);
      setActiveTab("transactions"); // Switch back to transactions tab after adding/editing
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save transaction";
      setError(errorMessage);
      showErrorToast(errorMessage);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      showSuccessToast("Transaction deleted successfully");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete transaction";
      setError(errorMessage);
      showErrorToast(errorMessage);
      throw err;
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleImportComplete = (newTransactions: Transaction[] | any) => {
    if (Array.isArray(newTransactions)) {
      setTransactions(prev => [...prev, ...newTransactions]);
    } else {
      console.error('Expected array of transactions but received:', newTransactions);
      // If you have access to the transactions inside a different property:
      // For example, if the API returns { transactions: Transaction[] }
      if (newTransactions && newTransactions.transactions && Array.isArray(newTransactions.transactions)) {
        setTransactions(prev => [...prev, ...newTransactions.transactions]);
      }
    }
    setActiveTab("transactions"); // Switch back to transactions tab after import
  };

  const handleCancelEdit = () => {
    setCurrentTransaction(null);
    setActiveTab("transactions");
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage transactions.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ReceiptIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Manage your financial transactions, categorize them, and keep track of your spending.
        </p>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="transactions" className="flex items-center gap-1">
                <ReceiptIcon className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                {currentTransaction ? "Edit Transaction" : "Add Transaction"}
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Import
              </TabsTrigger>
            </TabsList>
            
            {currentTransaction && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel Edit
              </Button>
            )}
          </div>
          
          <TabsContent value="transactions" className="mt-0">
            {/* Transaction Filters */}
            <TransactionFilters
              filters={filters}
              categories={categories}
              tags={tags}
              onFilterChange={handleFilterChange}
              onApplyFilters={applyFilters}
              showOrderOptions={true}
            />
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading transactions...</span>
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                categories={categories}
                tags={tags}
                bankAccounts={bankAccounts}
                creditCards={creditCards}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}
          </TabsContent>
          
          <TabsContent value="add" className="mt-0">
            <Card className="w-full max-w-3xl mx-auto">
              <AddTransactionForm 
                onAddTransaction={handleAddOrUpdateTransaction} 
                initialData={currentTransaction}
                categories={categories}
                tags={tags}
                bankAccounts={bankAccounts}
                creditCards={creditCards}
                onCancel={handleCancelEdit}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="import" className="mt-0">
            <Card className="w-full max-w-3xl mx-auto">
              <ImportTransactionsForm 
                onImportComplete={handleImportComplete} 
                categories={categories}
              />
            </Card>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
