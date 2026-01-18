"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useExpensePlans,
  useMonthlyDepositSummary,
  useDeleteExpensePlan,
  useQuickFundExpensePlan,
  useBulkQuickFundExpensePlans,
} from "@/hooks/useExpensePlans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PiggyBank,
  Plus,
  Zap,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import {
  ExpensePlan,
  ExpensePlanStatus,
  calculateProgress,
  getProgressColor,
  getExpensePlanStatusLabel,
  getExpensePlanPriorityLabel,
  getExpensePlanTypeLabel,
  getPriorityColor,
  getStatusColor,
  formatCurrency,
} from "@/types/expense-plan-types";
import ExpensePlanCard from "./components/ExpensePlanCard";
import ExpensePlanFormDialog from "./components/ExpensePlanFormDialog";
import ContributeWithdrawDialog from "./components/ContributeWithdrawDialog";
import AdjustmentSuggestionModal from "./components/AdjustmentSuggestionModal";
import IncomeDistributionSetup from "./components/IncomeDistributionSetup";

export default function ExpensePlansPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: plans, isLoading, error, refetch } = useExpensePlans();
  const { data: summary, isLoading: summaryLoading } = useMonthlyDepositSummary();
  const deleteMutation = useDeleteExpensePlan();
  const quickFundMutation = useQuickFundExpensePlan();
  const bulkQuickFundMutation = useBulkQuickFundExpensePlans();

  const [activeTab, setActiveTab] = useState<ExpensePlanStatus | "all" | "distribution">("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ExpensePlan | null>(null);
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [contributePlan, setContributePlan] = useState<ExpensePlan | null>(null);
  const [contributeMode, setContributeMode] = useState<"contribute" | "withdraw">("contribute");
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentPlan, setAdjustmentPlan] = useState<ExpensePlan | null>(null);

  const filteredPlans = plans?.filter((plan) => {
    if (activeTab === "all") return true;
    return plan.status === activeTab;
  }) || [];

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormDialogOpen(true);
  };

  const handleEditPlan = (plan: ExpensePlan) => {
    setEditingPlan(plan);
    setFormDialogOpen(true);
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm("Are you sure you want to delete this expense plan?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleQuickFund = async (id: number) => {
    await quickFundMutation.mutateAsync(id);
  };

  const handleBulkQuickFund = async () => {
    await bulkQuickFundMutation.mutateAsync();
  };

  const handleContribute = (plan: ExpensePlan) => {
    setContributePlan(plan);
    setContributeMode("contribute");
    setContributeDialogOpen(true);
  };

  const handleWithdraw = (plan: ExpensePlan) => {
    setContributePlan(plan);
    setContributeMode("withdraw");
    setContributeDialogOpen(true);
  };

  const handleFormComplete = () => {
    setFormDialogOpen(false);
    setEditingPlan(null);
    refetch();
  };

  const handleContributeComplete = () => {
    setContributeDialogOpen(false);
    setContributePlan(null);
    refetch();
  };

  const handleReviewAdjustment = (plan: ExpensePlan) => {
    setAdjustmentPlan(plan);
    setAdjustmentModalOpen(true);
  };

  const handleAdjustmentComplete = () => {
    setAdjustmentModalOpen(false);
    setAdjustmentPlan(null);
    refetch();
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to view expense plans.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <PiggyBank className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Expense Plans</h1>
        </div>
        <p className="text-gray-600">
          Virtual envelopes for tracking and saving towards future expenses
        </p>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Deposit Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Monthly Deposits Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.totalMonthlyDeposit || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Plans Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary?.planCount || 0}
              </div>
            </CardContent>
          </Card>

          {/* Fully Funded Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Fully Funded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary?.fullyFundedCount || 0}
              </div>
            </CardContent>
          </Card>

          {/* Behind Schedule Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Behind Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary?.behindScheduleCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
        <Button onClick={handleCreatePlan} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/expense-plans/wizard")}
          className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
        >
          <Wand2 className="h-4 w-4" />
          Create with Wizard
        </Button>
        <Button
          variant="outline"
          onClick={handleBulkQuickFund}
          disabled={bulkQuickFundMutation.isPending || !plans?.length}
          className="gap-2"
        >
          {bulkQuickFundMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Fund All Plans
        </Button>
      </div>

      {/* Tabs & Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ExpensePlanStatus | "all" | "distribution")}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="distribution">Income Distribution</TabsTrigger>
          </TabsList>

          {/* Plans Tabs */}
          {activeTab !== "distribution" && (
            <TabsContent value={activeTab} forceMount>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <Card className="p-6 text-center text-red-500">
                  Failed to load expense plans. Please try again.
                </Card>
              ) : filteredPlans.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  <PiggyBank className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No expense plans found.</p>
                  <Button onClick={handleCreatePlan} variant="outline">
                    Create your first plan
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlans.map((plan) => (
                    <ExpensePlanCard
                      key={plan.id}
                      plan={plan}
                      onEdit={handleEditPlan}
                      onDelete={handleDeletePlan}
                      onQuickFund={handleQuickFund}
                      onContribute={handleContribute}
                      onWithdraw={handleWithdraw}
                      onReviewAdjustment={handleReviewAdjustment}
                      isQuickFunding={quickFundMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Income Distribution Tab */}
          <TabsContent value="distribution">
            <IncomeDistributionSetup />
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialog */}
      <ExpensePlanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        plan={editingPlan}
        onComplete={handleFormComplete}
      />

      {/* Contribute/Withdraw Dialog */}
      <ContributeWithdrawDialog
        open={contributeDialogOpen}
        onOpenChange={setContributeDialogOpen}
        plan={contributePlan}
        mode={contributeMode}
        onComplete={handleContributeComplete}
      />

      {/* Adjustment Suggestion Modal */}
      <AdjustmentSuggestionModal
        open={adjustmentModalOpen}
        onOpenChange={setAdjustmentModalOpen}
        plan={adjustmentPlan}
        onComplete={handleAdjustmentComplete}
      />
    </div>
  );
}
