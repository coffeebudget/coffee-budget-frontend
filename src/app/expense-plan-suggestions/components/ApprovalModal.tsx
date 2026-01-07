'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ExpensePlanSuggestion,
  ApproveSuggestionDto,
  RejectSuggestionDto,
  getExpenseTypeLabel,
  getExpenseTypeIcon,
  getFrequencyLabel,
  formatCurrency,
} from '@/types/expense-plan-suggestion-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, X, Star, Calendar, PiggyBank } from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { HistoricalOccurrences } from './HistoricalOccurrences';
import { MonthlyBreakdown } from './MonthlyBreakdown';

interface Category {
  id: number;
  name: string;
}

interface ApprovalModalProps {
  suggestion: ExpensePlanSuggestion | null;
  categories?: Category[];
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: number, options?: ApproveSuggestionDto) => void;
  onReject: (id: number, options?: RejectSuggestionDto) => void;
  isLoading?: boolean;
}

export function ApprovalModal({
  suggestion,
  categories = [],
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<'approve' | 'reject'>('approve');
  const [customName, setCustomName] = useState('');
  const [customContribution, setCustomContribution] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Reset form when suggestion changes
  useEffect(() => {
    if (suggestion) {
      setCustomName(suggestion.suggestedName || suggestion.merchantName || '');
      setCustomContribution(suggestion.monthlyContribution.toFixed(2));
      setSelectedCategoryId(suggestion.categoryId?.toString() || '');
      setRejectionReason('');
      setActiveTab('approve');
    }
  }, [suggestion]);

  if (!suggestion) return null;

  const handleApprove = () => {
    const options: ApproveSuggestionDto = {};

    const displayName = suggestion.suggestedName || suggestion.merchantName || '';
    if (customName && customName !== displayName) {
      options.customName = customName;
    }

    const parsedContribution = parseFloat(customContribution);
    if (!isNaN(parsedContribution) && parsedContribution !== suggestion.monthlyContribution) {
      options.customMonthlyContribution = parsedContribution;
    }

    const parsedCategoryId = parseInt(selectedCategoryId, 10);
    if (!isNaN(parsedCategoryId) && parsedCategoryId !== suggestion.categoryId) {
      options.categoryId = parsedCategoryId;
    }

    onApprove(suggestion.id, Object.keys(options).length > 0 ? options : undefined);
  };

  const handleReject = () => {
    const options: RejectSuggestionDto = {};
    if (rejectionReason.trim()) {
      options.reason = rejectionReason.trim();
    }
    onReject(suggestion.id, Object.keys(options).length > 0 ? options : undefined);
  };

  const displayName = suggestion.suggestedName || suggestion.merchantName || suggestion.representativeDescription;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{getExpenseTypeIcon(suggestion.expenseType)}</span>
            Review Suggestion
          </DialogTitle>
          <DialogDescription>
            Review and customize this expense plan suggestion before creating it.
          </DialogDescription>
        </DialogHeader>

        {/* Suggestion summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-500">
                  {getExpenseTypeLabel(suggestion.expenseType)} • {getFrequencyLabel(suggestion.frequencyType)}
                </p>
              </div>
              {suggestion.isEssential && (
                <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  <Star className="h-3 w-3" />
                  Essential
                </span>
              )}
            </div>

            <ConfidenceIndicator confidence={suggestion.overallConfidence} size="sm" />

            <HistoricalOccurrences
              occurrenceCount={suggestion.occurrenceCount}
              firstOccurrence={suggestion.firstOccurrence}
              lastOccurrence={suggestion.lastOccurrence}
              nextExpectedDate={suggestion.nextExpectedDate}
              averageAmount={suggestion.averageAmount}
              amountRange={suggestion.metadata?.amountRange}
            />

            <MonthlyBreakdown
              averageAmount={suggestion.averageAmount}
              monthlyContribution={suggestion.monthlyContribution}
              yearlyTotal={suggestion.yearlyTotal}
              frequencyType={suggestion.frequencyType}
            />
          </div>

          {/* Approve/Reject tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'approve' | 'reject')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="approve" className="gap-1">
                <Check className="h-4 w-4" />
                Approve
              </TabsTrigger>
              <TabsTrigger value="reject" className="gap-1">
                <X className="h-4 w-4" />
                Reject
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approve" className="space-y-4 mt-4">
              {/* Customization form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customName">Expense Plan Name</Label>
                  <Input
                    id="customName"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter a name for this expense plan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customContribution">Monthly Contribution (EUR)</Label>
                  <div className="relative">
                    <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="customContribution"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customContribution}
                      onChange={(e) => setCustomContribution(e.target.value)}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Suggested: {formatCurrency(suggestion.monthlyContribution)}
                  </p>
                </div>

                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {suggestion.categoryName && (
                      <p className="text-xs text-gray-500">
                        Suggested: {suggestion.categoryName}
                      </p>
                    )}
                  </div>
                )}

                {/* Preview */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Expense Plan Preview</h4>
                      <p className="text-sm text-green-700">
                        {customName || displayName} - {formatCurrency(parseFloat(customContribution) || suggestion.monthlyContribution)}/month
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This will create a new expense plan that helps you budget for this recurring expense.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reject" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Reason for Rejection (optional)</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Why are you rejecting this suggestion?"
                  rows={3}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">What happens when you reject?</h4>
                    <p className="text-sm text-amber-700">
                      This suggestion will be marked as rejected and won&apos;t appear again.
                      You can still manually create an expense plan for this pattern later.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {activeTab === 'approve' ? (
            <Button
              onClick={handleApprove}
              disabled={isLoading || !customName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create Expense Plan
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleReject}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Reject Suggestion
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple confirmation dialog for quick actions
interface QuickActionDialogProps {
  type: 'approve' | 'reject';
  suggestion: ExpensePlanSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function QuickActionDialog({
  type,
  suggestion,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: QuickActionDialogProps) {
  if (!suggestion) return null;

  const isApprove = type === 'approve';
  const displayName = suggestion.suggestedName || suggestion.merchantName || suggestion.representativeDescription;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isApprove ? 'Create Expense Plan?' : 'Reject Suggestion?'}
          </DialogTitle>
          <DialogDescription>
            {isApprove ? (
              <>
                This will create an expense plan for <strong>{displayName}</strong> with
                a monthly contribution of <strong>{formatCurrency(suggestion.monthlyContribution)}</strong>.
              </>
            ) : (
              <>
                Are you sure you want to reject the suggestion for <strong>{displayName}</strong>?
                This action can be undone from the rejected suggestions list.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={isApprove ? 'bg-green-600 hover:bg-green-700' : ''}
            variant={isApprove ? 'default' : 'destructive'}
          >
            {isLoading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : isApprove ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <X className="h-4 w-4 mr-1" />
            )}
            {isApprove ? 'Create Plan' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
