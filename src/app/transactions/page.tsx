"use client";

import { useEffect, useState } from "react";
import { fetchTransactions, deleteTransaction, updateTransaction, fetchCategories, fetchTags, fetchBankAccounts, fetchCreditCards, createTransaction } from "@/utils/api";
import { useSession } from "next-auth/react";
import AddTransactionForm from "@/app/transactions/components/AddTransactionForm";
import TransactionList from "@/app/transactions/components/TransactionList";
import { Transaction, Category, Tag, BankAccount, CreditCard } from "@/utils/types";
import ImportTransactionsForm from "@/app/transactions/components/ImportTransactionsForm";
import { Loader2, ReceiptIcon, PlusCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeTab, setActiveTab] = useState("transactions");

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const [transactionsData, categoriesData, tagsData, bankAccountsData, creditCardsData] = await Promise.all([
        fetchTransactions(token),
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

  const handleAddOrUpdateTransaction = async (transaction: Transaction) => {
    try {
      if (currentTransaction) {
        // Update existing transaction
        const updatedTransaction = await updateTransaction(token, currentTransaction.id!, transaction);
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
      } else {
        // Create new transaction
        const newTransaction = await createTransaction(transaction as any, token);
        setTransactions(prev => [...prev, newTransaction]);
      }
      setCurrentTransaction(null);
      setActiveTab("transactions"); // Switch back to transactions tab after adding/editing
    } catch (err) {
      console.error(err);
      setError("Failed to save transaction");
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id, token);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete transaction");
      throw err;
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleImportComplete = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
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
              <ImportTransactionsForm onImportComplete={handleImportComplete} />
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
