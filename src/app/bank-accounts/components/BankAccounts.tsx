"use client";

import { useEffect, useState } from "react";
import { fetchBankAccounts, updateBankAccount, deleteBankAccount } from "@/utils/api";
import { useSession } from "next-auth/react";
import { BankAccount } from "@/utils/types";

interface BankAccountsProps {
  bankAccounts: BankAccount[];
  setBankAccounts: (accounts: BankAccount[]) => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (id: number) => void;
}

export default function BankAccounts({ 
  bankAccounts, 
  setBankAccounts,
  onEdit,
  onDelete 
}: BankAccountsProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const accounts = await fetchBankAccounts(token);
        setBankAccounts(accounts);
      } catch (err) {
        setError("Failed to load bank accounts");
      }
    };
    loadBankAccounts();
  }, [token]);

  return (
    <div className="w-full max-w-2xl mt-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bankAccounts.map((account) => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap">{account.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">${account.balance}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(account)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(account.id ?? 0)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}