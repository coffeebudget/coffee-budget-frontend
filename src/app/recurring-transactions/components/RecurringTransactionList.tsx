"use client";

import { useState } from "react";
import { RecurringTransaction } from "@/utils/types";

interface RecurringTransactionListProps {
  transactions: RecurringTransaction[];
  onDeleteTransaction: (id: number) => void;
  onEditTransaction: (transaction: RecurringTransaction) => void;
}

export default function RecurringTransactionList({ 
  transactions, 
  onDeleteTransaction, 
  onEditTransaction 
}: RecurringTransactionListProps) {
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;
    
    setLoadingId(id);
    setError(null);
    try {
      await onDeleteTransaction(id);
    } catch (err) {
      setError("Error deleting recurring transaction");
    } finally {
      setLoadingId(null);
    }
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setError(null);
    onEditTransaction(transaction);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatFrequency = (n: number, type: string) => {
    return `Every ${n} ${type}${n > 1 ? 's' : ''}`;
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  return (
    <div className="w-full mt-8 px-4">
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="w-2/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="w-2/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occurrences</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="w-1/12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-3 py-4 text-sm">{transaction.name}</td>
                <td className="px-3 py-4 text-sm">{transaction.description}</td>
                <td className="px-3 py-4 text-sm">${formatAmount(transaction.amount)}</td>
                <td className="px-3 py-4 text-sm capitalize">{transaction.type}</td>
                <td className="px-3 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    transaction.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    transaction.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-3 py-4 text-sm">{transaction.category?.name || 'N/A'}</td>
                <td className="px-3 py-4 text-sm">
                  {formatFrequency(transaction.frequencyEveryN, transaction.frequencyType)}
                </td>
                <td className="px-3 py-4 text-sm">{formatDate(transaction.startDate)}</td>
                <td className="px-3 py-4 text-sm">{transaction.endDate ? formatDate(transaction.endDate) : '-'}</td>
                <td className="px-3 py-4 text-sm">{transaction.occurrences || '-'}</td>
                <td className="px-3 py-4 text-sm">{transaction.tags?.map(tag => tag.name).join(", ") || "None"}</td>
                <td className="px-3 py-4 text-sm">
                  <button
                    onClick={() => handleEdit(transaction)}
                    disabled={loadingId === transaction.id}
                    className="text-indigo-600 hover:text-indigo-900 mr-2 disabled:opacity-50"
                  >
                    {loadingId === transaction.id ? 'Loading...' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id!)}
                    disabled={loadingId === transaction.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {loadingId === transaction.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
} 