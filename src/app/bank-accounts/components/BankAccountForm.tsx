"use client";

import { useState, useEffect } from "react";
import { BankAccount } from "@/utils/types"; // Ensure this import is correct
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

type BankAccountFormProps = {
  onSubmit: (account: BankAccount) => void;
  initialData?: BankAccount | null;
  isEditMode?: boolean;
  onCancel?: () => void;
};

export default function BankAccountForm({ 
  onSubmit, 
  initialData = null, 
  isEditMode = false,
  onCancel
}: BankAccountFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [balance, setBalance] = useState(initialData?.balance || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBalance(initialData.balance);
    } else {
      setName("");
      setBalance(0);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({ id: initialData?.id, name, balance });
      if (!isEditMode) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setBalance(0);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Bank Account" : "Add New Bank Account"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <form id="account-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="Enter account name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value))}
              required
            />
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit"
          form="account-form"
          disabled={loading || !name.trim()}
          className="ml-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditMode ? "Update Account" : "Add Account"}
        </Button>
      </CardFooter>
    </>
  );
}
