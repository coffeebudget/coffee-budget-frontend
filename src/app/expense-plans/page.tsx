"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useExpensePlansWithStatus,
  useMonthlyDepositSummary,
  useDeleteExpensePlan,
  useCoverageSummary,
} from "@/hooks/useExpensePlans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  LayoutGrid,
  Layers,
  Building2,
} from "lucide-react";
import {
  ExpensePlan,
  ExpensePlanStatus,
  AccountCoverage,
  getExpensePlanStatusLabel,
  getExpensePlanPurposeIcon,
  getPriorityColor,
  getStatusColor,
  formatCurrency,
} from "@/types/expense-plan-types";
import ExpensePlanCard from "./components/ExpensePlanCard";
import ExpensePlanFormDialog from "./components/ExpensePlanFormDialog";
import AdjustmentSuggestionModal from "./components/AdjustmentSuggestionModal";
import ExpensePlansByAccount from "./components/ExpensePlansByAccount";
import PageLayout from "@/components/layout/PageLayout";

export default function ExpensePlansPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: plans, isLoading, error, refetch } = useExpensePlansWithStatus();
  const { data: summary, isLoading: summaryLoading } = useMonthlyDepositSummary();
  const { data: coverageSummary } = useCoverageSummary();
  const deleteMutation = useDeleteExpensePlan();

  // Create lookup map: accountId -> AccountCoverage (only for accounts with shortfall)
  const accountCoverageMap = useMemo(() => {
    const map = new Map<number, AccountCoverage>();
    if (coverageSummary?.accounts) {
      for (const account of coverageSummary.accounts) {
        if (account.hasShortfall) {
          map.set(account.accountId, account);
        }
      }
    }
    return map;
  }, [coverageSummary]);

  const [activeTab, setActiveTab] = useState<ExpensePlanStatus | "all">("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ExpensePlan | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentPlan, setAdjustmentPlan] = useState<ExpensePlan | null>(null);

  // View modes: "flat" | "purpose" | "account"
  const [viewMode, setViewMode] = useState<"flat" | "purpose" | "account">("purpose");

  const filteredPlans = plans?.filter((plan) => {
    if (activeTab === "all") return true;
    return plan.status === activeTab;
  }) || [];

  // Group plans by purpose
  const sinkingFunds = filteredPlans.filter((p) => p.purpose === "sinking_fund");
  const spendingBudgets = filteredPlans.filter((p) => p.purpose === "spending_budget");

  // Calculate totals for each group
  const sinkingFundsTotal = sinkingFunds.reduce((sum, p) => sum + Number(p.monthlyContribution), 0);
  const spendingBudgetsTotal = spendingBudgets.reduce((sum, p) => sum + Number(p.monthlyContribution), 0);

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

  const handleFormComplete = () => {
    setFormDialogOpen(false);
    setEditingPlan(null);
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
    <>
      <PageLayout
        title="Expense Plans"
        description="Virtual envelopes for tracking and saving towards future expenses."
        icon={PiggyBank}
      >
        {/* Summary Cards */}
        <div className="mb-6">
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
        <div className="mb-6 flex flex-wrap gap-2">
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
          <div className="flex-1" />
          <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
            <Button
              variant={viewMode === "flat" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("flat")}
              className="gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "purpose" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("purpose")}
              className="gap-1.5"
            >
              <Layers className="h-4 w-4" />
              By Type
            </Button>
            <Button
              variant={viewMode === "account" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("account")}
              className="gap-1.5"
            >
              <Building2 className="h-4 w-4" />
              By Account
            </Button>
          </div>
        </div>

        {/* Tabs & Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ExpensePlanStatus | "all")}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

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
            ) : viewMode === "account" ? (
              <ExpensePlansByAccount
                plans={filteredPlans}
                onEdit={handleEditPlan}
                onDelete={handleDeletePlan}
                onReviewAdjustment={handleReviewAdjustment}
                accountCoverageMap={accountCoverageMap}
              />
            ) : viewMode === "purpose" ? (
              <div className="space-y-8">
                {/* Sinking Funds Section */}
                {sinkingFunds.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getExpensePlanPurposeIcon("sinking_fund")}</span>
                        <h2 className="text-xl font-semibold text-gray-900">Sinking Funds</h2>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {sinkingFunds.length} plan{sinkingFunds.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: <span className="font-medium text-blue-600">{formatCurrency(sinkingFundsTotal)}/mo</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Accumulating money for predictable future expenses
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sinkingFunds.map((plan) => (
                        <ExpensePlanCard
                          key={plan.id}
                          plan={plan}
                          onEdit={handleEditPlan}
                          onDelete={handleDeletePlan}
                          onReviewAdjustment={handleReviewAdjustment}
                          accountCoverage={plan.paymentAccountId ? accountCoverageMap.get(plan.paymentAccountId) : null}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Spending Budgets Section */}
                {spendingBudgets.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getExpensePlanPurposeIcon("spending_budget")}</span>
                        <h2 className="text-xl font-semibold text-gray-900">Spending Budgets</h2>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {spendingBudgets.length} plan{spendingBudgets.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: <span className="font-medium text-purple-600">{formatCurrency(spendingBudgetsTotal)}/mo</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Tracking and limiting spending per category
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {spendingBudgets.map((plan) => (
                        <ExpensePlanCard
                          key={plan.id}
                          plan={plan}
                          onEdit={handleEditPlan}
                          onDelete={handleDeletePlan}
                          onReviewAdjustment={handleReviewAdjustment}
                          accountCoverage={plan.paymentAccountId ? accountCoverageMap.get(plan.paymentAccountId) : null}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlans.map((plan) => (
                  <ExpensePlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={handleEditPlan}
                    onDelete={handleDeletePlan}
                    onReviewAdjustment={handleReviewAdjustment}
                    accountCoverage={plan.paymentAccountId ? accountCoverageMap.get(plan.paymentAccountId) : null}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageLayout>

      {/* Form Dialog */}
      <ExpensePlanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        plan={editingPlan}
        onComplete={handleFormComplete}
      />

      {/* Adjustment Suggestion Modal */}
      <AdjustmentSuggestionModal
        open={adjustmentModalOpen}
        onOpenChange={setAdjustmentModalOpen}
        plan={adjustmentPlan}
        onComplete={handleAdjustmentComplete}
      />
    </>
  );
}
