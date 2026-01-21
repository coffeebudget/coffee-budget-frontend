'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  SuggestionStatus,
  ExpensePlanSuggestion,
  getStatusLabel,
  formatCurrency,
} from '@/types/expense-plan-suggestion-types';
import {
  usePendingSuggestions,
  useSuggestions,
  useGenerateSuggestions,
  useApproveSuggestion,
  useRejectSuggestion,
  useBulkApproveSuggestions,
  useBulkRejectSuggestions,
  useDeleteSuggestion,
} from '@/hooks/useExpensePlanSuggestions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { SuggestionCard } from './components/SuggestionCard';
import { ApprovalModal, QuickActionDialog } from './components/ApprovalModal';

export default function ExpensePlanSuggestionsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SuggestionStatus | 'all'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [modalSuggestion, setModalSuggestion] = useState<ExpensePlanSuggestion | null>(null);
  const [quickAction, setQuickAction] = useState<{
    type: 'approve' | 'reject';
    suggestion: ExpensePlanSuggestion;
  } | null>(null);

  // Queries
  const pendingQuery = usePendingSuggestions();
  const allQuery = useSuggestions(activeTab === 'all' ? undefined : activeTab as SuggestionStatus);

  // Mutations
  const generateMutation = useGenerateSuggestions();
  const approveMutation = useApproveSuggestion();
  const rejectMutation = useRejectSuggestion();
  const bulkApproveMutation = useBulkApproveSuggestions();
  const bulkRejectMutation = useBulkRejectSuggestions();
  const deleteMutation = useDeleteSuggestion();

  // Get the right data based on active tab
  const { data, isLoading, error, refetch } = activeTab === 'pending' ? pendingQuery : allQuery;

  // Filter suggestions based on tab
  const suggestions = useMemo(() => {
    if (!data?.suggestions) return [];
    if (activeTab === 'all') return data.suggestions;
    return data.suggestions.filter((s) => s.status === activeTab);
  }, [data?.suggestions, activeTab]);

  // Selection handlers
  const handleSelectSuggestion = (id: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const pendingIds = suggestions.filter((s) => s.status === 'pending').map((s) => s.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  // Action handlers
  const handleQuickApprove = (id: number) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) {
      setQuickAction({ type: 'approve', suggestion });
    }
  };

  const handleQuickReject = (id: number) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) {
      setQuickAction({ type: 'reject', suggestion });
    }
  };

  const handleOpenModal = (suggestion: ExpensePlanSuggestion) => {
    setModalSuggestion(suggestion);
  };

  const handleApprove = (id: number, options?: Parameters<typeof approveMutation.mutate>[0]['options']) => {
    approveMutation.mutate(
      { id, options },
      {
        onSuccess: () => {
          setModalSuggestion(null);
          setQuickAction(null);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      }
    );
  };

  const handleReject = (id: number, options?: Parameters<typeof rejectMutation.mutate>[0]['options']) => {
    rejectMutation.mutate(
      { id, options },
      {
        onSuccess: () => {
          setModalSuggestion(null);
          setQuickAction(null);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      }
    );
  };

  const handleBulkApprove = () => {
    bulkApproveMutation.mutate(
      { suggestionIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
        },
      }
    );
  };

  const handleBulkReject = () => {
    bulkRejectMutation.mutate(
      { suggestionIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
        },
      }
    );
  };

  const handleGenerate = () => {
    generateMutation.mutate({});
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this suggestion? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // Loading state
  if (!session) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const pendingCount = data?.pending ?? 0;
  const approvedCount = data?.approved ?? 0;
  const rejectedCount = data?.rejected ?? 0;
  const totalCount = data?.total ?? 0;

  const isAnyMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    bulkApproveMutation.isPending ||
    bulkRejectMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Expense Plan Suggestions
          </h1>
          <p className="text-gray-600 mt-1">
            AI-detected recurring expenses that can become expense plans
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Analyze Transactions
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Pending"
          count={pendingCount}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          color="blue"
        />
        <SummaryCard
          label="Approved"
          count={approvedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          color="green"
        />
        <SummaryCard
          label="Rejected"
          count={rejectedCount}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          color="red"
        />
        <SummaryCard
          label="Total"
          count={totalCount}
          icon={<Sparkles className="h-5 w-5 text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Tabs and bulk actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-4 w-4" />
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1">
              <Check className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1">
              <X className="h-4 w-4" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk actions */}
        {activeTab === 'pending' && pendingCount > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedIds.size === suggestions.filter((s) => s.status === 'pending').length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-500">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={isAnyMutating}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isAnyMutating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Error loading suggestions</h4>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && suggestions.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'pending'
              ? 'No pending suggestions'
              : `No ${activeTab} suggestions`}
          </h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'pending'
              ? 'Click "Analyze Transactions" to detect recurring expense patterns.'
              : 'Suggestions will appear here after you take action on them.'}
          </p>
          {activeTab === 'pending' && (
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Analyze Transactions
            </Button>
          )}
        </div>
      )}

      {/* Suggestions grid */}
      {!isLoading && !error && suggestions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApprove={handleQuickApprove}
              onReject={handleQuickReject}
              onDelete={handleDelete}
              onSelect={handleSelectSuggestion}
              isSelected={selectedIds.has(suggestion.id)}
              isLoading={isAnyMutating}
            />
          ))}
        </div>
      )}

      {/* Monthly total for pending */}
      {activeTab === 'pending' && pendingCount > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800">
                Total Monthly Contribution if Approved
              </h4>
              <p className="text-sm text-blue-600">
                This is how much you would budget monthly for all pending suggestions
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(
                suggestions
                  .filter((s) => s.status === 'pending')
                  .reduce((sum, s) => sum + s.monthlyContribution, 0)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ApprovalModal
        suggestion={modalSuggestion}
        isOpen={!!modalSuggestion}
        onClose={() => setModalSuggestion(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />

      <QuickActionDialog
        type={quickAction?.type || 'approve'}
        suggestion={quickAction?.suggestion || null}
        isOpen={!!quickAction}
        onClose={() => setQuickAction(null)}
        onConfirm={() => {
          if (quickAction) {
            if (quickAction.type === 'approve') {
              handleApprove(quickAction.suggestion.id);
            } else {
              handleReject(quickAction.suggestion.id);
            }
          }
        }}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
}

// Summary card component
function SummaryCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={cn('rounded-lg border p-4', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
    </div>
  );
}
