"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";
import { usePaymentActivities } from "@/hooks/usePaymentActivities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Activity, Filter, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  useEffect(() => {
    fetchPaymentAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchPaymentActivities(selectedAccountId);
      fetchReconciliationStats(selectedAccountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  const handleImport = async () => {
    if (!selectedAccountId) return;

    const result = await importActivities({ paymentAccountId: selectedAccountId });

    if (result) {
      await fetchReconciliationStats(selectedAccountId);
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

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">Reconciled</p>
                <p className="text-2xl font-bold text-green-900">{stats.reconciled}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-700">Failed</p>
                <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

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
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading payment activities...</span>
                </div>
              ) : filteredActivities.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">No payment activities found.</p>
                  <Button onClick={handleImport} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Import Activities
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <Card key={activity.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {activity.merchantName || activity.description || 'Payment Activity'}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                activity.reconciliationStatus === 'reconciled'
                                  ? 'bg-green-100 text-green-800'
                                  : activity.reconciliationStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : activity.reconciliationStatus === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {activity.reconciliationStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Date:</span> {new Date(activity.executionDate).toLocaleDateString()}
                            </div>
                            {activity.merchantCategory && (
                              <div>
                                <span className="font-medium">Category:</span> {activity.merchantCategory}
                              </div>
                            )}
                            {activity.reconciliationConfidence && (
                              <div>
                                <span className="font-medium">Confidence:</span> {activity.reconciliationConfidence}%
                              </div>
                            )}
                          </div>

                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-2">{activity.description}</p>
                          )}
                        </div>

                        <div className="text-right ml-4">
                          <p className={`text-2xl font-bold ${activity.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {activity.amount < 0 ? '-' : '+'}€{Math.abs(activity.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
    </div>
  );
}
