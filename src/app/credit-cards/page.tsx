"use client";

import { useEffect, useState } from "react";
import { fetchCreditCards, createCreditCard, updateCreditCard } from "@/utils/api";
import { useSession } from "next-auth/react";
import CreditCardForm from "./components/CreditCardForm";
import CreditCards from "./components/CreditCards";
import { CreditCard } from "@/utils/types";

export default function CreditCardsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [currentCardData, setCurrentCardData] = useState<CreditCard | null>(null);

  useEffect(() => {
    const loadCreditCards = async () => {
      setLoading(true);
      try {
        const cards = await fetchCreditCards(token);
        setCreditCards(cards);
      } catch (err) {
        setError("Failed to load credit cards");
      }
      setLoading(false);
    };
    loadCreditCards();
  }, [token]);

  const handleAddCard = async (newCard: CreditCard) => {
    try {
      const card = await createCreditCard(token, newCard);
      setCreditCards([...creditCards, card]);
    } catch (err) {
      setError("Error adding credit card");
    }
  };

  const handleUpdateCard = async (updatedCard: CreditCard) => {
    if (!updatedCard.id) {
      setError("Invalid card ID");
      return;
    }

    try {
      const card = await updateCreditCard(token, Number(updatedCard.id), updatedCard);
      setCreditCards(creditCards.map(c => c.id === updatedCard.id ? card : c));
      setEditMode(false);
      setCurrentCardData(null);
    } catch (err) {
      setError("Error updating credit card");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">Manage Credit Cards</h1>
      <CreditCardForm 
        onSubmit={editMode ? handleUpdateCard : handleAddCard}
        initialData={currentCardData}
        isEditMode={editMode}
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <CreditCards 
          creditCards={creditCards} 
          setCreditCards={setCreditCards}
          onEdit={(card) => {
            setCurrentCardData(card);
            setEditMode(true);
          }}
        />
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}