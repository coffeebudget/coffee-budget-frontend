"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchRecurringTransactions, createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } from "@/utils/api";
import { RecurringTransaction } from "@/utils/types";
import AddRecurringTransactionForm from "./components/AddRecurringTransactionForm";
import RecurringTransactionList from "./components/RecurringTransactionList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, RepeatIcon, PlusCircle, X, ClipboardCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RecurringTransactionsPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken || "";
  const router = useRouter();

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<RecurringTransaction | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setError("Please log in to access this page");
      return;
    }
    if (!token) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const transactionsData = await fetchRecurringTransactions(token);
        setRecurringTransactions(transactionsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError("Failed to load data. Please check your connection and try again.");
      }
      setLoading(false);
    }
    loadData();
  }, [token, session, status]);

  const handleAddOrUpdateRecurringTransaction = async (transaction: RecurringTransaction, applyToPast: boolean = false) => {
    if (!token) {
      setError("You must be logged in to perform this action");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (transaction.id) {
        const updatedTransaction = await updateRecurringTransaction(token, transaction.id, transaction, applyToPast);
        setRecurringTransactions(transactions => 
          transactions.map(t => t.id === transaction.id ? updatedTransaction : t)
        );
        setCurrentTransaction(null);
        setActiveTab("list"); // Switch back to list tab after updating
      } else {
        const newTransaction = await createRecurringTransaction(token, transaction);
        setRecurringTransactions(transactions => [...transactions, newTransaction]);
        setActiveTab("list"); // Switch back to list tab after creating
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(transaction.id ? "Failed to update transaction" : "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecurringTransaction = async (id: number) => {
    if (!token) {
      setError("You must be logged in to perform this action");
      return;
    }

    const deleteOption = prompt("Choose an option: 'all', 'pending', or 'none'");
    if (!['all', 'pending', 'none'].includes(deleteOption || '')) {
      alert("Invalid option. Please choose 'all', 'pending', or 'none'.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await deleteRecurringTransaction(token, id, deleteOption || '');
      setRecurringTransactions(transactions => transactions.filter(t => t.id !== id));
      setCurrentTransaction(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError("Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction: RecurringTransaction) => {
    setCurrentTransaction(transaction);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleCancelEdit = () => {
    setCurrentTransaction(null);
    setActiveTab("list");
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage recurring transactions.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <RepeatIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Recurring Transactions</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Manage your recurring transactions and payment schedules.
        </p>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <RepeatIcon className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                {currentTransaction ? "Edit Transaction" : "Add Transaction"}
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-1" onClick={() => router.push('/recurring-transactions/review-patterns')}>
                <ClipboardCheckIcon className="h-4 w-4" />
                Review Patterns
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
          
          <TabsContent value="list" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading recurring transactions...</span>
              </div>
            ) : (
              <RecurringTransactionList
                transactions={recurringTransactions}
                onDeleteTransaction={handleDeleteRecurringTransaction}
                onEditTransaction={handleEditTransaction}
              />
            )}
          </TabsContent>
          
          <TabsContent value="add" className="mt-0">
            <Card className="w-full max-w-3xl mx-auto">
              <AddRecurringTransactionForm 
                onAddTransaction={handleAddOrUpdateRecurringTransaction}
                initialData={currentTransaction}
                onCancel={handleCancelEdit}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="review" className="mt-0">
            {/* This content will not be displayed as we're redirecting to the review-patterns page */}
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