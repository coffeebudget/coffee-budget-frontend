"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  useIncomePlans,
  useMonthlySummary,
  useAnnualSummary,
  useDeleteIncomePlan,
} from "@/hooks/useIncomePlans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import {
  IncomePlan,
  IncomePlanStatus,
  formatCurrency,
  MONTH_LABELS,
  MONTH_NAMES,
  MonthName,
} from "@/types/income-plan-types";
import IncomePlanCard from "./components/IncomePlanCard";
import IncomePlanFormDialog from "./components/IncomePlanFormDialog";

export default function IncomePlansPage() {
  const { data: session } = useSession();
  const { data: plans, isLoading, error, refetch } = useIncomePlans();
  const { data: monthlySummary, isLoading: monthlyLoading } = useMonthlySummary();
  const { data: annualSummary, isLoading: annualLoading } = useAnnualSummary();
  const deleteMutation = useDeleteIncomePlan();

  const [activeTab, setActiveTab] = useState<IncomePlanStatus | "all">("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IncomePlan | null>(null);

  const filteredPlans =
    plans?.filter((plan) => {
      if (activeTab === "all") return true;
      return plan.status === activeTab;
    }) || [];

  // Group plans by reliability
  const guaranteedPlans = filteredPlans.filter((p) => p.reliability === "guaranteed");
  const expectedPlans = filteredPlans.filter((p) => p.reliability === "expected");
  const uncertainPlans = filteredPlans.filter((p) => p.reliability === "uncertain");

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormDialogOpen(true);
  };

  const handleEditPlan = (plan: IncomePlan) => {
    setEditingPlan(plan);
    setFormDialogOpen(true);
  };

  const handleDeletePlan = async (id: number) => {
    if (confirm("Are you sure you want to delete this income plan?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormComplete = () => {
    setFormDialogOpen(false);
    setEditingPlan(null);
    refetch();
  };

  // Get current month name for display
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIndex];

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to view income plans.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Income Plans</h1>
          </div>
          <p className="text-gray-600">
            Track your expected income sources and plan your budget accordingly
          </p>
        </div>

        {/* Summary Cards */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* This Month Income Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {MONTH_LABELS[currentMonthName]} Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(monthlySummary?.totalIncome || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Budget Safe: {formatCurrency(monthlySummary?.budgetSafeIncome || 0)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Guaranteed Income Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Guaranteed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(monthlySummary?.guaranteedTotal || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expected/Uncertain Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Expected
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(monthlySummary?.expectedTotal || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Uncertain/Bonus Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                  Uncertain (Bonus)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-gray-500">
                    {formatCurrency(monthlySummary?.uncertainTotal || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Annual Overview */}
        {!annualLoading && annualSummary && (
          <div className="max-w-7xl mx-auto mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {annualSummary.year} Annual Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Annual</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(annualSummary.totalAnnualIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Average</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(annualSummary.monthlyAverage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> Minimum Month
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(annualSummary.minimumMonth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Maximum Month
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(annualSummary.maximumMonth)}
                    </p>
                  </div>
                </div>

                {/* Monthly Breakdown Bar */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Monthly Breakdown</p>
                  <div className="grid grid-cols-12 gap-1">
                    {MONTH_NAMES.map((month, index) => {
                      const amount = annualSummary.monthlyBreakdown[month as MonthName] || 0;
                      const maxAmount = annualSummary.maximumMonth || 1;
                      const heightPercent = (amount / maxAmount) * 100;
                      const isCurrentMonth = index === currentMonthIndex;

                      return (
                        <div key={month} className="flex flex-col items-center">
                          <div
                            className="w-full bg-gray-100 rounded-t relative"
                            style={{ height: "60px" }}
                          >
                            <div
                              className={`absolute bottom-0 w-full rounded-t transition-all ${
                                isCurrentMonth ? "bg-green-500" : "bg-blue-400"
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs mt-1 ${
                              isCurrentMonth ? "font-bold text-green-600" : "text-gray-500"
                            }`}
                          >
                            {MONTH_LABELS[month]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="max-w-7xl mx-auto mb-6">
          <Button onClick={handleCreatePlan} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Income Plan
          </Button>
        </div>

        {/* Tabs & Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as IncomePlanStatus | "all")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} forceMount>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <Card className="p-6 text-center text-red-500">
                  Failed to load income plans. Please try again.
                </Card>
              ) : filteredPlans.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No income plans found.</p>
                  <Button onClick={handleCreatePlan} variant="outline">
                    Create your first income plan
                  </Button>
                </Card>
              ) : (
                <div className="space-y-8">
                  {/* Guaranteed Income Section */}
                  {guaranteedPlans.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          Guaranteed Income
                        </h2>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {guaranteedPlans.length} plan
                          {guaranteedPlans.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Always included in budget calculations
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {guaranteedPlans.map((plan) => (
                          <IncomePlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={handleEditPlan}
                            onDelete={handleDeletePlan}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected Income Section */}
                  {expectedPlans.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          Expected Income
                        </h2>
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800"
                        >
                          {expectedPlans.length} plan
                          {expectedPlans.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Included with a warning indicator
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {expectedPlans.map((plan) => (
                          <IncomePlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={handleEditPlan}
                            onDelete={handleDeletePlan}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uncertain Income Section */}
                  {uncertainPlans.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <HelpCircle className="h-5 w-5 text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          Uncertain Income
                        </h2>
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-800"
                        >
                          {uncertainPlans.length} plan
                          {uncertainPlans.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Excluded from budget (bonus if received)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uncertainPlans.map((plan) => (
                          <IncomePlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={handleEditPlan}
                            onDelete={handleDeletePlan}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Form Dialog */}
      <IncomePlanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        plan={editingPlan}
        onComplete={handleFormComplete}
      />
    </div>
  );
}
