"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchRecurringTransactions, createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, runRecurringPatternDetection } from "@/utils/api";
import { RecurringTransaction } from "@/utils/types";
import AddRecurringTransactionForm from "./components/AddRecurringTransactionForm";
import RecurringTransactionList from "./components/RecurringTransactionList";

export default function RecurringTransactionsPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken || "";

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<RecurringTransaction | null>(null);

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
      } else {
        const newTransaction = await createRecurringTransaction(token, transaction);
        setRecurringTransactions(transactions => [...transactions, newTransaction]);
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

  const handleRunDetection = async () => {
    if (!token) return;
  
    setLoading(true);
    setError(null);
  
    try {
      await runRecurringPatternDetection(token);
      // Ricarica le transazioni aggiornate
      const updated = await fetchRecurringTransactions(token);
      setRecurringTransactions(updated);
    } catch (err) {
      console.error("Detection error:", err);
      setError("Failed to run recurring pattern detection");
    } finally {
      setLoading(false);
    }
  };
  

  if (status === 'loading') {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!session) {
    return <div className="text-center p-4">Please log in to access this page.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">Manage Recurring Transactions</h1>
      <button
        onClick={handleRunDetection}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
      >
        Detect Recurring Patterns
      </button>
      <AddRecurringTransactionForm 
        onAddTransaction={handleAddOrUpdateRecurringTransaction}
        initialData={currentTransaction}
      />
      {loading ? (
        <p className="text-gray-500">Loading transactions...</p>
      ) : (
        <RecurringTransactionList
          transactions={recurringTransactions}
          onDeleteTransaction={handleDeleteRecurringTransaction}
          onEditTransaction={setCurrentTransaction}
        />
      )}
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
} 