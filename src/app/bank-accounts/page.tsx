"use client";

import { useEffect, useState } from "react";
import { fetchBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "@/utils/api";
import { useSession } from "next-auth/react";
import BankAccountForm from "./components/BankAccountForm";
import BankAccounts from "./components/BankAccounts";
import { BankAccount } from "@/utils/types";

export default function BankAccountsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [editMode, setEditMode] = useState(false);
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
    } catch (err) {
      setError("Error adding bank account");
    }
  };

  const handleUpdateAccount = async (updatedAccount: BankAccount) => {
    try {
      const account = await updateBankAccount(token, updatedAccount.id!, updatedAccount);
      setBankAccounts(bankAccounts.map(ba => ba.id === updatedAccount.id ? account : ba));
      setEditMode(false);
      setCurrentAccountData(null);
    } catch (err) {
      setError("Error updating bank account");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">Manage Bank Accounts</h1>
      <BankAccountForm 
        onSubmit={editMode ? handleUpdateAccount : handleAddAccount}
        initialData={currentAccountData}
        isEditMode={editMode}
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <BankAccounts 
          bankAccounts={bankAccounts} 
          setBankAccounts={setBankAccounts}
          onEdit={(account) => {
            setCurrentAccountData(account);
            setEditMode(true);
          }}
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
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}