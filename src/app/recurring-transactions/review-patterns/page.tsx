'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchUnconfirmedPatterns, getLinkedTransactions, confirmPattern, unlinkFromRecurringTransaction } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Loader2, RepeatIcon, CheckCircle, XCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

export default function ReviewPatternsPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken || '';
  const router = useRouter();

  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPatternId, setExpandedPatternId] = useState<number | null>(null);
  const [linkedTransactions, setLinkedTransactions] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/recurring-transactions');
      return;
    }
    if (!token) return;
    
    loadPatterns();
  }, [token, session, status, router]);

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
    setExpandedPatternId(expandedPatternId === patternId ? null : patternId);
    if (!linkedTransactions[patternId]) {
      try {
        const transactions = await getLinkedTransactions(token, patternId);
        setLinkedTransactions(prev => ({ ...prev, [patternId]: transactions }));
      } catch (err) {
        setError('Failed to load linked transactions');
      }
    }
  };

  const handleConfirm = async (patternId: number) => {
    setLoading(true);
    try {
      await confirmPattern(token, patternId);
      setPatterns(prev => prev.filter(p => p.id !== patternId));
    } catch (err) {
      setError('Failed to confirm pattern');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTx = async (txId: number, patternId: number) => {
    try {
      await unlinkFromRecurringTransaction(token, txId, patternId);
      setLinkedTransactions(prev => ({
        ...prev,
        [patternId]: prev[patternId].filter(tx => tx.id !== txId)
      }));
    } catch (err) {
      setError('Failed to remove transaction from pattern');
    }
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
        <p className="text-gray-500">Please log in to review recurring patterns.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/recurring-transactions')}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Recurring Transactions
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <RepeatIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Review Recurring Patterns</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Review and confirm automatically detected recurring transaction patterns.
        </p>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading patterns...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {!loading && patterns.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Patterns to Review</h3>
                <p className="text-gray-500 mb-4">All recurring transaction patterns have been reviewed.</p>
                <Button 
                  onClick={() => router.push('/recurring-transactions')}
                  className="mt-2"
                >
                  Return to Recurring Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-4">
          {patterns.map(pattern => (
            <Card key={pattern.id}>
              <CardHeader className="pb-3">
                <CardTitle>{pattern.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Amount: ${Number(pattern.amount).toFixed(2)} — Every {pattern.frequencyEveryN} {pattern.frequencyType}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExpand(pattern.id)}
                  >
                    {expandedPatternId === pattern.id ? 'Hide Transactions' : 'View Transactions'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/recurring-transactions/${pattern.id}/edit`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Edit Pattern
                    </Link>
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleConfirm(pattern.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm Pattern
                  </Button>
                </div>
                
                {expandedPatternId === pattern.id && (
                  <div className="mt-4 border rounded-lg p-3">
                    <h3 className="font-medium mb-3">Linked Transactions</h3>
                    {!linkedTransactions[pattern.id] ? (
                      <div className="flex items-center justify-center h-16">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                        <span className="text-sm text-gray-500">Loading transactions...</span>
                      </div>
                    ) : linkedTransactions[pattern.id].length === 0 ? (
                      <p className="text-sm text-gray-500">No transactions linked to this pattern.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedTransactions[pattern.id].map(tx => (
                          <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {new Date(tx.executionDate).toLocaleDateString()}
                                </Badge>
                                <Badge variant={tx.type === 'expense' ? 'destructive' : 'default'}>
                                  ${Number(tx.amount).toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveTx(tx.id, pattern.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
