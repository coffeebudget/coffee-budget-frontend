"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";
import PaymentAccountForm from "./components/PaymentAccountForm";
import PaymentAccountList from "./components/PaymentAccountList";
import PaymentGocardlessIntegrationDialog from "./components/PaymentGocardlessIntegrationDialog";
import { PaymentAccount, CreatePaymentAccountDto } from "@/types/payment-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, PlusCircle, X, Link } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PaymentAccountsPage() {
  const { data: session } = useSession();
  const {
    paymentAccounts,
    isLoading,
    error: apiError,
    fetchPaymentAccounts,
    createPaymentAccount,
    updatePaymentAccount,
    deletePaymentAccount
  } = usePaymentAccounts();

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [currentAccountData, setCurrentAccountData] = useState<PaymentAccount | null>(null);
  const [showGocardlessDialog, setShowGocardlessDialog] = useState(false);

  useEffect(() => {
    fetchPaymentAccounts();
  }, []);

  useEffect(() => {
    if (apiError) {
      setError(apiError);
    }
  }, [apiError]);

  const handleAddAccount = async (newAccount: Omit<PaymentAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createPaymentAccount(newAccount);
      toast.success('Payment account created successfully');
      setActiveTab("list"); // Switch back to list tab after adding
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error adding payment account";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateAccount = async (updatedAccount: Omit<PaymentAccount, 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await updatePaymentAccount(updatedAccount.id, updatedAccount);
      toast.success('Payment account updated successfully');
      setCurrentAccountData(null);
      setActiveTab("list"); // Switch back to list tab after updating
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error updating payment account";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSubmitAccount = async (account: Omit<PaymentAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | CreatePaymentAccountDto) => {
    if (currentAccountData) {
      // Update existing account
      await handleUpdateAccount({ ...account, id: currentAccountData.id } as Omit<PaymentAccount, 'userId' | 'createdAt' | 'updatedAt'>);
    } else {
      // Create new account
      await handleAddAccount(account as Omit<PaymentAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleEditAccount = (account: PaymentAccount) => {
    setCurrentAccountData(account);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleCancelEdit = () => {
    setCurrentAccountData(null);
    setActiveTab("list");
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await deletePaymentAccount(id);
      toast.success('Payment account deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error deleting payment account";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage payment accounts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Payment Accounts</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Manage your payment service accounts (PayPal, Klarna, etc.) and reconcile payment activities with transactions.
        </p>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                {currentAccountData ? "Edit Account" : "Add Account"}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGocardlessDialog(true)}
                className="flex items-center gap-1"
                disabled={paymentAccounts.length === 0}
              >
                <Link className="h-4 w-4" />
                Connect to GoCardless
              </Button>
              {currentAccountData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="list" className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading payment accounts...</span>
              </div>
            ) : (
              <PaymentAccountList
                paymentAccounts={paymentAccounts}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
                onAccountUpdated={fetchPaymentAccounts}
                onReconnect={() => {
                  // Open GoCardless dialog for reconnection
                  setShowGocardlessDialog(true);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <Card className="w-full max-w-3xl mx-auto">
              <PaymentAccountForm
                onSubmit={handleSubmitAccount}
                initialData={currentAccountData}
                isEditMode={!!currentAccountData}
                onCancel={handleCancelEdit}
              />
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* GoCardless Integration Dialog */}
      <PaymentGocardlessIntegrationDialog
        open={showGocardlessDialog}
        onOpenChange={setShowGocardlessDialog}
        paymentAccounts={paymentAccounts}
        onAccountsUpdated={fetchPaymentAccounts}
      />
    </div>
  );
}
