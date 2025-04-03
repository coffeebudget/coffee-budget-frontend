'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchUnconfirmedPatterns, getLinkedTransactions, confirmPattern, unlinkFromRecurringTransaction, adjustPattern } from '@/utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReviewPatternsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || '';
  const router = useRouter();

  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPatternId, setExpandedPatternId] = useState<number | null>(null);
  const [linkedTransactions, setLinkedTransactions] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (!token) return;
    loadPatterns();
  }, [token]);

  const loadPatterns = async () => {
    setLoading(true);
    try {
      const data = await fetchUnconfirmedPatterns(token);
      setPatterns(data);
    } catch (err) {
      setError('Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (patternId: number) => {
    setExpandedPatternId(patternId);
    if (!linkedTransactions[patternId]) {
      const transactions = await getLinkedTransactions(token, patternId);
      setLinkedTransactions(prev => ({ ...prev, [patternId]: transactions }));
    }
  };

  const handleConfirm = async (patternId: number) => {
    await confirmPattern(token, patternId);
    setPatterns(prev => prev.filter(p => p.id !== patternId));
  };

  const handleRemoveTx = async (txId: number, patternId: number) => {
    await unlinkFromRecurringTransaction(token, txId, patternId);
    setLinkedTransactions(prev => ({
      ...prev,
      [patternId]: prev[patternId].filter(tx => tx.id !== txId)
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Review Recurring Patterns</h1>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="text-red-500">{error}</p> : null}

      {patterns.length === 0 && !loading && <p>No patterns to review 🎉</p>}

      <div className="space-y-4">
        {patterns.map(pattern => (
          <div key={pattern.id} className="border rounded-lg p-4 shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">{pattern.name}</h2>
                <p className="text-sm text-gray-500">
                  Amount: €{Number(pattern.amount).toFixed(2)} — Every {pattern.frequencyEveryN} {pattern.frequencyType}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleExpand(pattern.id)}
                  className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
                >
                  {expandedPatternId === pattern.id ? 'Hide' : 'View'}
                </button>
                <Link
                  href={`/recurring-transactions/${pattern.id}/edit`}
                  className="text-sm px-3 py-1 border rounded text-blue-600 hover:bg-gray-100"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleConfirm(pattern.id)}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>

            {expandedPatternId === pattern.id && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Linked Transactions</h3>
                <ul className="divide-y divide-gray-200">
                  {(linkedTransactions[pattern.id] || []).map(tx => (
                    <li key={tx.id} className="py-2 flex justify-between text-sm">
                      <div>
                        <p>{tx.description}</p>
                        <p className="text-gray-500">{new Date(tx.executionDate).toLocaleDateString()} — €{Number(tx.amount).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveTx(tx.id, pattern.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
