"use client";

import { useEffect, useState } from "react";
import { fetchCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from "@/utils/api";
import { useSession } from "next-auth/react";
import CreditCardForm from "./components/CreditCardForm";
import CreditCards from "./components/CreditCards";
import { CreditCard } from "@/utils/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCardIcon, PlusCircle, X } from "lucide-react";

export default function CreditCardsPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeTab, setActiveTab] = useState("list");
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
      setActiveTab("list"); // Switch back to list tab after adding
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
      setCurrentCardData(null);
      setActiveTab("list"); // Switch back to list tab after updating
    } catch (err) {
      setError("Error updating credit card");
      console.error(err);
    }
  };

  const handleEditCard = (card: CreditCard) => {
    setCurrentCardData(card);
    setActiveTab("add"); // Switch to add/edit tab
  };

  const handleCancelEdit = () => {
    setCurrentCardData(null);
    setActiveTab("list");
  };

  const handleDeleteCard = async (id: number) => {
    try {
      await deleteCreditCard(token, id);
      setCreditCards(creditCards.filter((card) => card.id !== id));
    } catch (err) {
      setError("Error deleting credit card");
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage credit cards.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CreditCardIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Credit Cards</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Manage your credit cards and track your credit limits and balances.
        </p>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <CreditCardIcon className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                {currentCardData ? "Edit Card" : "Add Card"}
              </TabsTrigger>
            </TabsList>
            
            {currentCardData && (
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
                <span className="ml-2 text-gray-600">Loading credit cards...</span>
              </div>
            ) : (
              <CreditCards 
                creditCards={creditCards} 
                setCreditCards={setCreditCards}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
              />
            )}
          </TabsContent>
          
          <TabsContent value="add" className="mt-0">
            <Card className="w-full max-w-3xl mx-auto">
              <CreditCardForm 
                onSubmit={currentCardData ? handleUpdateCard : handleAddCard}
                initialData={currentCardData}
                isEditMode={!!currentCardData}
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