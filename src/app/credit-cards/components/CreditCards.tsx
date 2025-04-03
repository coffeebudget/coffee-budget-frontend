"use client";

import { useEffect, useState } from "react";
import { fetchCreditCards, deleteCreditCard } from "@/utils/api";
import { useSession } from "next-auth/react";
import { CreditCard } from "@/utils/types";

type CreditCardsProps = {
  creditCards: CreditCard[];
  setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
  onEdit: (card: CreditCard) => void;
};

export default function CreditCards({ creditCards, setCreditCards, onEdit }: CreditCardsProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";
  const [error, setError] = useState<string | null>(null);

  const handleDeleteCard = async (id: number) => {
    try {
      await deleteCreditCard(token, id);
      setCreditCards(creditCards.filter((card) => card.id !== id));
    } catch (err) {
      setError("Error deleting credit card");
    }
  };

  return (
    <div className="w-full max-w-2xl mt-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {creditCards.map((card) => (
              <tr key={card.id}>
                <td className="px-6 py-4 whitespace-nowrap">{card.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">${card.creditLimit}</td>
                <td className="px-6 py-4 whitespace-nowrap">${card.availableCredit}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(card)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
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