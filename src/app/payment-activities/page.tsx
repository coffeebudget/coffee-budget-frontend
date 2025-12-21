"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";
import { usePaymentActivities } from "@/hooks/usePaymentActivities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Download, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReconciliationDialog from "./components/ReconciliationDialog";
import { PaymentActivityFilters } from "./components/PaymentActivityFilters";
import { PaymentActivityList } from "./components/PaymentActivityList";
import { ReconciliationStatsCard } from "./components/ReconciliationStatsCard";
import type { PaymentActivity, PaymentActivityFilters as FiltersType } from "@/types/payment-types";

export default function PaymentActivitiesPage() {
  const { data: session } = useSession();
  const { paymentAccounts, isLoading: accountsLoading, fetchPaymentAccounts } = usePaymentAccounts();
  const {
    paymentActivities,
    stats,
    isLoading,
    error,
    fetchPaymentActivities,
    fetchReconciliationStats,
    importActivities,
  } = usePaymentActivities();

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<PaymentActivity | null>(null);
  const [filters, setFilters] = useState<FiltersType>({});

  useEffect(() => {
    fetchPaymentAccounts();
  }, []);

  const loadActivities = useCallback(() => {
    if (selectedAccountId) {
      fetchPaymentActivities(selectedAccountId, filters);
      fetchReconciliationStats(selectedAccountId);
    }
  }, [selectedAccountId, filters, fetchPaymentActivities, fetchReconciliationStats]);

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  const handleImport = async () => {
    if (!selectedAccountId) return;

    const result = await importActivities({ paymentAccountId: selectedAccountId });

    if (result) {
      await fetchReconciliationStats(selectedAccountId);
    }
  };

  const handleReconcile = (activity: PaymentActivity) => {
    setSelectedActivity(activity);
    setReconciliationDialogOpen(true);
  };

  const handleReconciliationComplete = async () => {
    setReconciliationDialogOpen(false);
    setSelectedActivity(null);

    // Refresh activities and stats after reconciliation
    if (selectedAccountId) {
      await fetchPaymentActivities(selectedAccountId);
      await fetchReconciliationStats(selectedAccountId);
    }

    toast.success('Payment activity reconciled successfully');
  };

  const handleApplyFilters = () => {
    loadActivities();
  };

  const handleClearFilters = () => {
    setFilters({});
    if (selectedAccountId) {
      fetchPaymentActivities(selectedAccountId, {});
    }
  };

  const filteredActivities = paymentActivities.filter((activity) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return activity.reconciliationStatus === "pending";
    if (activeTab === "reconciled") return activity.reconciliationStatus === "reconciled";
    if (activeTab === "failed") return activity.reconciliationStatus === "failed";
    return true;
  });

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to view payment activities.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Payment Activities</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          View and reconcile payment activities from your payment service accounts with bank transactions.
        </p>
      </div>

      {/* Payment Account Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Payment Account
              </label>
              <Select
                value={selectedAccountId?.toString() || ""}
                onValueChange={(value) => setSelectedAccountId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a payment account" />
                </SelectTrigger>
                <SelectContent>
                  {paymentAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.displayName} ({account.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccountId && (
              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="mt-6"
              >
                <Download className="h-4 w-4 mr-2" />
                Import Activities
              </Button>
            )}
          </div>

          {stats && <ReconciliationStatsCard stats={stats} />}
        </Card>
      </div>

      {/* Filters */}
      {selectedAccountId && (
        <div className="max-w-7xl mx-auto mb-6">
          <PaymentActivityFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </div>
      )}

      {/* Activities List with Tabs */}
      {selectedAccountId && (
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1">
                All Activities
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="reconciled" className="flex items-center gap-1">
                Reconciled
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center gap-1">
                Failed
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <PaymentActivityList
                activities={filteredActivities}
                isLoading={isLoading}
                onReconcile={handleReconcile}
                onImport={handleImport}
              />
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      )}

      {!selectedAccountId && !accountsLoading && (
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-gray-500">Please select a payment account to view activities.</p>
          </Card>
        </div>
      )}

      {/* Reconciliation Dialog */}
      <ReconciliationDialog
        open={reconciliationDialogOpen}
        onOpenChange={setReconciliationDialogOpen}
        paymentActivity={selectedActivity}
        onReconciled={handleReconciliationComplete}
      />
    </div>
  );
}
