"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  useExpensePlan,
  useDeleteExpensePlan,
  useUpdateExpensePlan,
} from "@/hooks/useExpensePlans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExpensePlanHeader } from "./ExpensePlanHeader";
import { PaymentAccountSection } from "./PaymentAccountSection";
import { FinancialSection } from "./FinancialSection";
import { TimingSection } from "./TimingSection";
import { StatusSection } from "./StatusSection";
import { OptionsSection } from "./OptionsSection";
import { AdjustmentAlert } from "./AdjustmentAlert";
import { PaymentsSection } from "./PaymentsSection";
import { LinkTransactionDialog } from "./LinkTransactionDialog";

interface ExpensePlanDetailViewProps {
  id: number;
}

export function ExpensePlanDetailView({ id }: ExpensePlanDetailViewProps) {
  const router = useRouter();
  const { data: plan, isLoading, error } = useExpensePlan(id);
  const deleteMutation = useDeleteExpensePlan();
  const updateMutation = useUpdateExpensePlan();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      router.push("/expense-plans");
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Individual sections handle their own updates
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load expense plan</p>
        <p className="text-gray-500 text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Expense plan not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <ExpensePlanHeader
        plan={plan}
        isEditing={isEditing}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteDialog(true)}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        isSaving={updateMutation.isPending}
      />

      {/* Adjustment Alert (if pending) */}
      {plan.suggestedMonthlyContribution && !plan.adjustmentDismissedAt && (
        <AdjustmentAlert plan={plan} />
      )}

      {/* Payment Account Section (prominent) */}
      <PaymentAccountSection
        plan={plan}
        isEditing={isEditing}
      />

      {/* Status Section (funding progress) */}
      <StatusSection plan={plan} />

      {/* Financial Section */}
      <FinancialSection
        plan={plan}
        isEditing={isEditing}
      />

      {/* Timing Section */}
      <TimingSection
        plan={plan}
        isEditing={isEditing}
      />

      {/* Options Section */}
      <OptionsSection
        plan={plan}
        isEditing={isEditing}
      />

      {/* Payments Section */}
      <PaymentsSection
        plan={plan}
        onLinkTransaction={() => setShowLinkDialog(true)}
      />

      {/* Link Transaction Dialog */}
      <LinkTransactionDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        plan={plan}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{plan.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
