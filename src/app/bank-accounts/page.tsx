"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import BankAccountForm from "./components/BankAccountForm";
import BankAccounts from "./components/BankAccounts";
import GocardlessIntegrationDialog from "./components/GocardlessIntegrationDialog";
import { BankAccount } from "@/utils/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, WalletIcon, PlusCircle, X, Link, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import GocardlessImportOptions from "./components/GocardlessImportOptions";

export default function BankAccountsPage() {
  const { data: session } = useSession();
  const { 
    bankAccounts, 
    isLoading, 
    error: apiError, 
    fetchBankAccounts, 
    createBankAccount, 
    updateBankAccount, 
    deleteBankAccount 
  } = useBankAccounts();

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [currentAccountData, setCurrentAccountData] = useState<BankAccount | null>(null);
  const [showGocardlessDialog, setShowGocardlessDialog] = useState(false);
  const [syncingBalances, setSyncingBalances] = useState(false);

  const [importingTransactions, setImportingTransactions] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (apiError) {
      setError(apiError);
    }
  }, [apiError]);

  const handleAddAccount = async (newAccount: BankAccount) => {
    try {
      await createBankAccount(newAccount);
      setActiveTab("list"); // Switch back to list tab after adding
    } catch {
      setError("Error adding bank account");
    }
  };

  const handleUpdateAccount = async (updatedAccount: BankAccount) => {
    try {
      await updateBankAccount(updatedAccount.id!, updatedAccount);
      setCurrentAccountData(null);
      setActiveTab("list"); // Switch back to list tab after updating
    } catch {
      setError("Error updating bank account");
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setCurrentAccountData(account);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleCancelEdit = () => {
    setCurrentAccountData(null);
    setActiveTab("list");
  };

  const handleSyncBalances = async () => {
    setSyncingBalances(true);
    try {
      const response = await fetch('/api/gocardless/sync-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync balances');
      }

      const data = await response.json();
      
      toast.success(
        `Synchronized ${data.summary.successfulSyncs} of ${data.summary.totalAccounts} account balances`
      );
      
      // Refresh the bank accounts list
      await fetchBankAccounts();
    } catch (error) {
      console.error('Error syncing balances:', error);
      toast.error('Failed to synchronize balances');
    } finally {
      setSyncingBalances(false);
    }
  };

  const handleImportTransactions = async (options = {}) => {
    setImportingTransactions(true);
    try {
      const response = await fetch('/api/gocardless/import/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('No GoCardless accounts connected!\n\nPlease connect your bank accounts first using the "GoCardless Integration" button.');
          return null;
        }
        throw new Error('Failed to import transactions');
      }

      const data = await response.json();
      
      // Display comprehensive import results
      const { summary } = data;
      
      if (summary.totalNewTransactions > 0 || summary.totalPendingDuplicates > 0) {
        // Create a detailed success toast with better formatting and enhanced visibility
        toast.success(
          () => (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <span className="font-bold text-xl">GoCardless Import Completed!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <span>📊</span>
                  <span>{summary.totalAccounts} accounts processed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span>{summary.successfulImports} successful imports</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📈</span>
                  <span>{summary.totalNewTransactions} new transactions</span>
                </div>
                {summary.totalPendingDuplicates > 0 && (
                  <div className="flex items-center gap-1">
                    <span>⏳</span>
                    <span>{summary.totalPendingDuplicates} pending duplicates</span>
                  </div>
                )}
                {summary.totalDuplicates > 0 && (
                  <div className="flex items-center gap-1">
                    <span>🔄</span>
                    <span>{summary.totalDuplicates} duplicates handled</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  <span>{summary.balancesSynchronized} balances synced</span>
                </div>
              </div>
              {summary.totalPendingDuplicates > 0 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                  💡 Visit the Pending Duplicates page to review and resolve potential duplicates
                </div>
              )}
            </div>
          ),
          {
            duration: 15000, // Longer duration for better visibility
            position: 'top-center', // More prominent position
            style: {
              maxWidth: '700px',
              padding: '24px',
              background: '#10b981',
              color: '#ffffff',
              border: '2px solid #059669',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 10000,
            },
            icon: '✅',
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          }
        );
        
        // If there are pending duplicates, show a follow-up toast
        if (summary.totalPendingDuplicates > 0) {
          setTimeout(() => {
            toast(
              (toastInstance) => (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👀</span>
                  <div>
                    <div className="font-medium">Review Pending Duplicates</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {summary.totalPendingDuplicates} potential duplicates need your attention
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = '/pending-duplicates';
                      toast.dismiss(toastInstance.id);
                    }}
                    className="ml-auto px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Review Now
                  </button>
                </div>
              ),
              {
                duration: 10000,
                style: {
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                },
              }
            );
          }, 3000);
        }
      } else if (summary.totalDuplicates > 0) {
        toast('ℹ️ Import completed - no new transactions found\n\n' +
          `🔄 ${summary.totalDuplicates} transactions were already imported\n` +
          `💰 ${summary.balancesSynchronized} balances synchronized`,
          { 
            duration: 6000,
            icon: '📋',
          }
        );
      } else {
        toast('📭 No transactions found\n\nAll connected accounts are up to date!', {
          duration: 4000,
          icon: '✨',
        });
      }

      // Refresh the bank accounts data
      await fetchBankAccounts();
      
      // Return the data for the progress dialog
      return data;
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error('Failed to import transactions. Please try again.');
      throw error; // Re-throw to let the progress dialog handle it
    } finally {
      setImportingTransactions(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage bank accounts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <WalletIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Bank Accounts</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Manage your bank accounts and track your balances.
        </p>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <WalletIcon className="h-4 w-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                {currentAccountData ? "Edit Account" : "Add Account"}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* GoCardless Operations */}
              <div className="flex items-center gap-1 border-r pr-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncBalances}
                  disabled={syncingBalances}
                  className="flex items-center gap-1"
                >
                  {syncingBalances ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Balances
                </Button>

                <GocardlessImportOptions
                  onImport={handleImportTransactions}
                  isImporting={importingTransactions}
                />
              </div>


              
              {/* Integration Setup */}
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowGocardlessDialog(true)}
                className="flex items-center gap-1"
              >
                <Link className="h-4 w-4" />
                GoCardless Integration
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
                <span className="ml-2 text-gray-600">Loading bank accounts...</span>
              </div>
            ) : (
              <BankAccounts 
                bankAccounts={bankAccounts} 
                onEdit={handleEditAccount}
                onDelete={async (id) => {
                  try {
                    await deleteBankAccount(id);
                  } catch {
                    setError("Error deleting bank account");
                  }
                }}
                onAccountUpdated={fetchBankAccounts}
              />
            )}
          </TabsContent>
          
          <TabsContent value="add" className="mt-0">
            <Card className="w-full max-w-3xl mx-auto">
              <BankAccountForm 
                onSubmit={currentAccountData ? handleUpdateAccount : handleAddAccount}
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
        
        {/* GoCardless Integration Dialog */}
        <GocardlessIntegrationDialog 
          open={showGocardlessDialog}
          onOpenChange={setShowGocardlessDialog}
          bankAccounts={bankAccounts}
          onAccountsUpdated={fetchBankAccounts}
        />
      </div>
    </div>
  );
}