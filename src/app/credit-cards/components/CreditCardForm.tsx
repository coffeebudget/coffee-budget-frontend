"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CreditCard, BankAccount } from "@/utils/types";
import { fetchBankAccounts } from "@/utils/api";

type CreditCardFormProps = {
  onSubmit: (card: CreditCard) => void;
  initialData?: CreditCard | null;
  isEditMode?: boolean;
};

export default function CreditCardForm({ onSubmit, initialData = null, isEditMode = false }: CreditCardFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [name, setName] = useState(initialData?.name || "");
  const [billingDay, setBillingDay] = useState(initialData?.billingDay || 1);
  const [creditLimit, setCreditLimit] = useState(initialData?.creditLimit || 0);
  const [availableCredit, setAvailableCredit] = useState(initialData?.availableCredit || 0);
  const [bankAccountId, setBankAccountId] = useState<number | null>(initialData?.bankAccountId || null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
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

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBillingDay(initialData.billingDay);
      setCreditLimit(initialData.creditLimit);
      setAvailableCredit(initialData.availableCredit);
      setBankAccountId(initialData.bankAccountId || null);
    } else {
      setName("");
      setBillingDay(1);
      setCreditLimit(0);
      setAvailableCredit(0);
      setBankAccountId(null);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      id: initialData?.id ? Number(initialData.id) : 0,
      name, 
      billingDay,
      creditLimit,
      availableCredit,
      bankAccountId: bankAccountId ?? undefined
    });
    if (!isEditMode) {
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setBillingDay(1);
    setCreditLimit(0);
    setAvailableCredit(0);
    setBankAccountId(null);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 w-full max-w-xl bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">{isEditMode ? "Edit Credit Card" : "Add Credit Card"}</h2>
      <label className="block text-gray-700 mb-2" htmlFor="name">Card Name</label>
      <input
        type="text"
        placeholder="Card Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        required
      />
      <label className="block text-gray-700 mb-2" htmlFor="billingDay">Billing Day (1-31)</label>
      <p className="text-gray-500 mb-2">This is the day of the month when your credit card statement is generated.</p>
      <input
        type="number"
        placeholder="Billing Day"
        value={billingDay}
        onChange={(e) => setBillingDay(parseInt(e.target.value))}
        min="1"
        max="31"
        className="w-full p-2 border rounded mb-2"
        required
      />
      <label className="block text-gray-700 mb-2" htmlFor="creditLimit">Credit Limit</label>
      <p className="text-gray-500 mb-2">This is the maximum amount of money you can spend on your credit card.</p>
      <input
        type="number"
        placeholder="Credit Limit"
        value={creditLimit}
        onChange={(e) => setCreditLimit(parseFloat(e.target.value))}
        className="w-full p-2 border rounded mb-2"
        required
      />
      <label className="block text-gray-700 mb-2" htmlFor="availableCredit">Available Credit</label>
      <p className="text-gray-500 mb-2">This is the amount of money you have left to spend on your credit card.</p>
      <input
        type="number"
        placeholder="Available Credit"
        value={availableCredit}
        onChange={(e) => setAvailableCredit(parseFloat(e.target.value))}
        className="w-full p-2 border rounded mb-2"
        required
      />
      <label className="block text-gray-700 mb-2" htmlFor="bankAccountId">Bank Account</label>
      <select
        value={bankAccountId || ""}
        onChange={(e) => setBankAccountId(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">Select Bank Account</option>
        {bankAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        {isEditMode ? "Update Card" : "Add Card"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}