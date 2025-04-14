"use client";

import { useEffect, useState } from "react";
import { fetchBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "@/utils/api";
import { useSession } from "next-auth/react";
import BankAccountForm from "./components/BankAccountForm";
import BankAccounts from "./components/BankAccounts";
import { BankAccount } from "@/utils/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, WalletIcon, PlusCircle, X } from "lucide-react";

export default function BankAccountsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [activeTab, setActiveTab] = useState("list");
  const [currentAccountData, setCurrentAccountData] = useState<BankAccount | null>(null);

  useEffect(() => {
    const loadBankAccounts = async () => {
      setLoading(true);
      try {
        const accounts = await fetchBankAccounts(token);
        setBankAccounts(accounts);
      } catch (err) {
        setError("Failed to load bank accounts");
      }
      setLoading(false);
    };
    loadBankAccounts();
  }, [token]);

  const handleAddAccount = async (newAccount: BankAccount) => {
    try {
      const account = await createBankAccount(token, newAccount);
      setBankAccounts([...bankAccounts, account]);
      setActiveTab("list"); // Switch back to list tab after adding
    } catch (err) {
      setError("Error adding bank account");
    }
  };

  const handleUpdateAccount = async (updatedAccount: BankAccount) => {
    try {
      const account = await updateBankAccount(token, updatedAccount.id!, updatedAccount);
      setBankAccounts(bankAccounts.map(ba => ba.id === updatedAccount.id ? account : ba));
      setCurrentAccountData(null);
      setActiveTab("list"); // Switch back to list tab after updating
    } catch (err) {
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
          
          <TabsContent value="list" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading bank accounts...</span>
              </div>
            ) : (
              <BankAccounts 
                bankAccounts={bankAccounts} 
                setBankAccounts={setBankAccounts}
                onEdit={handleEditAccount}
                onDelete={async (id) => {
                  try {
                    await deleteBankAccount(token, id);
                    setBankAccounts(bankAccounts.filter(account => account.id !== id));
                  } catch (err) {
                    setError("Error deleting bank account");
                  }
                }}
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
      </div>
    </div>
  );
}