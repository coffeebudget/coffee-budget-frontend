"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CreditCard, BankAccount } from "@/utils/types";
import { fetchBankAccounts } from "@/utils/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreditCardFormProps = {
  onSubmit: (card: CreditCard) => void;
  initialData?: CreditCard | null;
  isEditMode?: boolean;
  onCancel?: () => void;
};

export default function CreditCardForm({ 
  onSubmit, 
  initialData = null, 
  isEditMode = false,
  onCancel
}: CreditCardFormProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [name, setName] = useState(initialData?.name || "");
  const [billingDay, setBillingDay] = useState(initialData?.billingDay || 1);
  const [creditLimit, setCreditLimit] = useState(initialData?.creditLimit || 0);
  const [availableCredit, setAvailableCredit] = useState(initialData?.availableCredit || 0);
  const [bankAccountId, setBankAccountId] = useState<number | null>(initialData?.bankAccountId || null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const accounts = await fetchBankAccounts();
        setBankAccounts(accounts);
      } catch (err) {
        setError("Failed to load bank accounts");
      }
    };
    loadBankAccounts();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({ 
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
    } catch (err) {
      console.error(err);
      setError("Failed to save credit card");
    } finally {
      setLoading(false);
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
    <>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Credit Card" : "Add New Credit Card"}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <form id="card-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Card Name</Label>
            <Input
              id="name"
              placeholder="Enter card name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="billingDay">Billing Day (1-31)</Label>
            <Input
              id="billingDay"
              type="number"
              min="1"
              max="31"
              placeholder="Enter billing day"
              value={billingDay}
              onChange={(e) => setBillingDay(parseInt(e.target.value))}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is the day of the month when your credit card statement is generated.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Credit Limit</Label>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={creditLimit}
              onChange={(e) => setCreditLimit(parseFloat(e.target.value))}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is the maximum amount of money you can spend on your credit card.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="availableCredit">Available Credit</Label>
            <Input
              id="availableCredit"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={availableCredit}
              onChange={(e) => setAvailableCredit(parseFloat(e.target.value))}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is the amount of money you have left to spend on your credit card.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankAccountId">Bank Account</Label>
            <Select 
              value={bankAccountId?.toString() || "none"} 
              onValueChange={(value) => setBankAccountId(value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bank Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id?.toString() || `account-${account.name}`}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The bank account that this credit card is linked to (optional).
            </p>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
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
          form="card-form"
          disabled={loading || !name.trim()}
          className="ml-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditMode ? "Update Card" : "Add Card"}
        </Button>
      </CardFooter>
    </>
  );
}