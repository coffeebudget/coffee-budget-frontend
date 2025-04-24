"use client";

import { useState } from "react";
import { BankAccount } from "@/utils/types";
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

interface BankAccountsProps {
  bankAccounts: BankAccount[];
  onEdit: (account: BankAccount) => void;
  onDelete: (id: number) => void;
}

export default function BankAccounts({ 
  bankAccounts, 
  onEdit,
  onDelete 
}: BankAccountsProps) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  if (bankAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Bank Accounts</h3>
            <p className="text-gray-500 mb-4">You haven't added any bank accounts yet.</p>
            <p className="text-sm text-gray-500">
              Click "Add Account" to create your first bank account.
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
              <TableHead>Account Name</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell className="text-right">
                  ${typeof account.balance === 'number' 
                      ? account.balance.toFixed(2) 
                      : parseFloat(account.balance as any).toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(account)} 
                      title="Edit Account"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={confirmDelete === account.id ? "destructive" : "ghost"} 
                      size="icon" 
                      onClick={() => handleDeleteClick(account.id ?? 0)}
                      title={confirmDelete === account.id ? "Confirm Delete" : "Delete Account"}
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