"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchPendingDuplicates, resolvePendingDuplicate } from "@/utils/api";
import { PendingDuplicate, DuplicateTransactionChoice } from "@/utils/types";

export default function PendingDuplicatesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [pendingDuplicates, setPendingDuplicates] = useState<PendingDuplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    loadPendingDuplicates();
  }, [token]);

  async function loadPendingDuplicates() {
    setLoading(true);
    try {
      const data = await fetchPendingDuplicates(token);
      setPendingDuplicates(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load pending duplicates");
    } finally {
      setLoading(false);
    }
  }

  const handleResolveDuplicate = async (duplicateId: number, choice: DuplicateTransactionChoice) => {
    setResolvingId(duplicateId);
    try {
      await resolvePendingDuplicate(token, duplicateId, choice);
      await loadPendingDuplicates();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">Pending Duplicates</h1>
      {loading ? (
        <p className="text-gray-600 text-center py-8">Loading pending duplicates...</p>
      ) : error ? (
        <div className="text-red-500 text-center py-8">
          <p>{error}</p>
          <button 
            onClick={loadPendingDuplicates} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : pendingDuplicates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">No pending duplicates found</p>
          <p className="text-sm text-gray-500">
            Duplicate transactions will appear here when the system detects potential matches from:
          </p>
          <ul className="text-sm text-gray-500 mt-2">
            <li>• Recurring transactions</li>
            <li>• CSV imports</li>
            <li>• APIs (Open Banking, Plaid, etc.)</li>
          </ul>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
          {pendingDuplicates.map((duplicate) => (
            <div key={duplicate.id} className="bg-white shadow rounded-lg mb-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r pr-4">
                  <h3 className="font-semibold mb-2">Existing Transaction</h3>
                  <p>Description: {duplicate.existingTransaction.description}</p>
                  <p>Amount: {formatAmount(duplicate.existingTransaction.amount)}</p>
                  <p>Date: {formatDate(duplicate.existingTransaction.executionDate)}</p>
                  <p className="text-sm text-gray-500">Source: {duplicate.existingTransaction.source}</p>
                </div>
                <div className="pl-4">
                  <h3 className="font-semibold mb-2">New Transaction</h3>
                  <p>Description: {duplicate.newTransactionData.description}</p>
                  <p>Amount: {formatAmount(duplicate.newTransactionData.amount)}</p>
                  <p>Date: {duplicate.newTransactionData.executionDate && formatDate(duplicate.newTransactionData.executionDate)}</p>
                  <p className="text-sm text-gray-500">Source: {duplicate.source}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                {resolvingId === duplicate.id ? (
                  <p className="text-gray-500">Processing...</p>
                ) : (
                  <>
                    <button
                      onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.MERGE)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      disabled={loading}
                    >
                      Merge
                    </button>
                    <button
                      onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.REPLACE)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                      disabled={loading}
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.IGNORE)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      disabled={loading}
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleResolveDuplicate(duplicate.id, DuplicateTransactionChoice.MAINTAIN_BOTH)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      disabled={loading}
                    >
                      Keep Both
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
