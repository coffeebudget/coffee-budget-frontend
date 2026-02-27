"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from "@/utils/format";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";
import { usePaymentActivities } from "@/hooks/usePaymentActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { toast } from "react-hot-toast";
import { PaymentActivity } from "@/types/payment-types";
import { Transaction } from "@/utils/types";

export default function PaymentReconciliationPage() {
  const { data: session } = useSession();
  const { paymentAccounts, isLoading: accountsLoading, fetchPaymentAccounts } = usePaymentAccounts();
  const {
    paymentActivities,
    isLoading: activitiesLoading,
    fetchPaymentActivities,
    fetchReconciliationStats,
  } = usePaymentActivities();

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<PaymentActivity | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    fetchPaymentAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchPaymentActivities(selectedAccountId);
      fetchReconciliationStats(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Filter payment activities to show only failed and pending
  const unreconciledActivities = paymentActivities.filter(
    (activity) =>
      activity.reconciliationStatus === "failed" ||
      activity.reconciliationStatus === "pending"
  );

  // Fetch transactions when an activity is selected
  useEffect(() => {
    if (selectedActivity) {
      fetchTransactions();
    }
  }, [selectedActivity]);

  // Filter transactions based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(term) ||
        t.amount?.toString().includes(term)
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions]);

  const fetchTransactions = async () => {
    if (!session?.user?.accessToken || !selectedActivity) return;

    setTransactionsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      // Filter transactions to show only those around the activity date (±7 days)
      // and similar amounts (±10%)
      const activityDate = new Date(selectedActivity.executionDate);
      const minDate = new Date(activityDate);
      minDate.setDate(minDate.getDate() - 7);
      const maxDate = new Date(activityDate);
      maxDate.setDate(maxDate.getDate() + 7);

      const activityAmount = Math.abs(selectedActivity.amount);
      const minAmount = activityAmount * 0.9;
      const maxAmount = activityAmount * 1.1;

      const filtered = data.filter((t: Transaction) => {
        const tDate = new Date(t.executionDate);
        const tAmount = Math.abs(t.amount);
        return (
          tDate >= minDate &&
          tDate <= maxDate &&
          tAmount >= minAmount &&
          tAmount <= maxAmount
        );
      });

      setTransactions(filtered);
      setFilteredTransactions(filtered);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleMatch = async (transactionId: number) => {
    if (!selectedActivity || !session?.user?.accessToken) return;

    setMatching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment-activities/${selectedActivity.id}/reconciliation`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reconciledTransactionId: transactionId,
            reconciliationStatus: "manual",
            reconciliationConfidence: 100,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reconcile activity");
      }

      toast.success("Activity reconciled successfully");

      // Refresh data
      if (selectedAccountId) {
        await fetchPaymentActivities(selectedAccountId);
        await fetchReconciliationStats(selectedAccountId);
      }

      // Clear selection
      setSelectedActivity(null);
      setTransactions([]);
      setFilteredTransactions([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Error reconciling activity:", error);
      toast.error("Failed to reconcile activity");
    } finally {
      setMatching(false);
    }
  };

  const handleUnmatch = async (activityId: number) => {
    if (!session?.user?.accessToken) return;

    setMatching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment-activities/${activityId}/reconciliation`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reconciledTransactionId: null,
            reconciliationStatus: "pending",
            reconciliationConfidence: 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unmatch activity");
      }

      toast.success("Activity unmatched successfully");

      // Refresh data
      if (selectedAccountId) {
        await fetchPaymentActivities(selectedAccountId);
        await fetchReconciliationStats(selectedAccountId);
      }
    } catch (error) {
      console.error("Error unmatching activity:", error);
      toast.error("Failed to unmatch activity");
    } finally {
      setMatching(false);
    }
  };

  const formatCurrency = (amount: number) => formatCurrencyUtil(Math.abs(amount));

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case "reconciled":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Reconciled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to view payment reconciliation.</p>
      </div>
    );
  }

  return (
    <PageLayout
      title="Payment Reconciliation"
      description="Manually match payment activities with bank transactions to reconcile unclear or failed automatic matches."
      icon={ArrowLeftRight}
    >
      {/* Payment Account Selector */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Payment Account
            </Label>
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
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Layout */}
      {selectedAccountId && (
        <div>
          {unreconciledActivities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">
                  All payment activities for this account have been reconciled.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Payment Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Unreconciled Activities ({unreconciledActivities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {unreconciledActivities.map((activity) => (
                        <Card
                          key={activity.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedActivity?.id === activity.id
                              ? "ring-2 ring-blue-500 bg-blue-50"
                              : ""
                          }`}
                          onClick={() => setSelectedActivity(activity)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {activity.merchantName || activity.description}
                                </p>
                                <p className="text-sm text-gray-500">{formatDate(activity.executionDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-lg ${
                                  activity.amount < 0 ? "text-red-600" : "text-green-600"
                                }`}>
                                  {formatCurrency(activity.amount)}
                                </p>
                                {getStatusBadge(activity.reconciliationStatus)}
                              </div>
                            </div>
                            {activity.merchantCategory && (
                              <p className="text-xs text-gray-500 mt-1">
                                Category: {activity.merchantCategory}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: Matching Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    {selectedActivity ? "Find Matching Transaction" : "Select Activity"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedActivity ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Search className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600">
                        Select a payment activity from the left to find matching transactions
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Search Filter */}
                      <div className="mb-4">
                        <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                          Search Transactions
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="search"
                            type="text"
                            placeholder="Search by description or amount..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Showing transactions ±7 days and ±10% amount
                        </p>
                      </div>

                      {/* Transactions List */}
                      {transactionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-8">
                          <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600">
                            {searchTerm
                              ? "No transactions match your search"
                              : "No similar transactions found"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[480px] overflow-y-auto">
                          {filteredTransactions.map((transaction) => (
                            <Card
                              key={transaction.id}
                              className="hover:shadow-md transition-all"
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {transaction.description}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(transaction.executionDate)}
                                    </p>
                                    {transaction.bankAccount && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        {transaction.bankAccount.name}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold text-lg ${
                                      transaction.amount < 0 ? "text-red-600" : "text-green-600"
                                    }`}>
                                      {formatCurrency(transaction.amount)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => transaction.id && handleMatch(transaction.id)}
                                  disabled={matching || !transaction.id}
                                  className="w-full"
                                  size="sm"
                                >
                                  {matching ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Matching...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Match This Transaction
                                    </>
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}
