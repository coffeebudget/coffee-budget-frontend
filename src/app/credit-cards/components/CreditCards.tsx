"use client";

import { useState } from "react";
import { CreditCard } from "@/utils/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CreditCardsProps {
  creditCards: CreditCard[];
  onEdit: (card: CreditCard) => void;
  onDelete: (id: number) => void;
}

export default function CreditCards({ creditCards, onEdit, onDelete }: CreditCardsProps) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  if (creditCards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Credit Cards</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t added any credit cards yet.</p>
            <p className="text-sm text-gray-500">
              Click &quot;Add Card&quot; to create your first credit card.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card Name</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Available Credit</TableHead>
              <TableHead className="text-center">Billing Day</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditCards.map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-medium">{card.name}</TableCell>
                <TableCell className="text-right">
                  ${typeof card.creditLimit === 'number' 
                      ? card.creditLimit.toFixed(2) 
                      : parseFloat(String(card.creditLimit)).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${typeof card.availableCredit === 'number' 
                      ? card.availableCredit.toFixed(2) 
                      : parseFloat(String(card.availableCredit)).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">{card.billingDay}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(card)} 
                      title="Edit Card"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={confirmDelete === card.id ? "destructive" : "ghost"} 
                      size="icon" 
                      onClick={() => handleDeleteClick(card.id)}
                      title={confirmDelete === card.id ? "Confirm Delete" : "Delete Card"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}