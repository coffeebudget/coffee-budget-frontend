"use client";

import { useState, useEffect } from "react";
import { BankAccount } from "@/utils/types"; // Ensure this import is correct

type BankAccountFormProps = {
  onSubmit: (account: BankAccount) => void;
  initialData?: BankAccount | null;
  isEditMode?: boolean;
};

export default function BankAccountForm({ onSubmit, initialData = null, isEditMode = false }: BankAccountFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [balance, setBalance] = useState(initialData?.balance || 0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBalance(initialData.balance);
    } else {
      setName("");
      setBalance(0);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: initialData?.id, name, balance });
    if (!isEditMode) {
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setBalance(0);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 w-full max-w-xl bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">{isEditMode ? "Edit Bank Account" : "Add Bank Account"}</h2>
      <label className="block text-gray-700 mb-2" htmlFor="name">Account Name</label>
      <input
        type="text"
        placeholder="Account Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        required
      />
      <label className="block text-gray-700 mb-2" htmlFor="balance">Balance</label>
      <input
        type="number"
        placeholder="Balance"
        value={balance}
        onChange={(e) => setBalance(parseFloat(e.target.value))}
        className="w-full p-2 border rounded mb-2"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        {isEditMode ? "Update Account" : "Add Account"}
      </button>
    </form>
  );
}
