"use client";

import { useState, useEffect } from "react";
import { PaymentAccount, CreatePaymentAccountDto, PAYMENT_PROVIDERS, PaymentProvider } from "@/types/payment-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";

type PaymentAccountFormProps = {
  onSubmit: (account: Omit<PaymentAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | CreatePaymentAccountDto) => void;
  initialData?: PaymentAccount | null;
  isEditMode?: boolean;
  onCancel?: () => void;
};

export default function PaymentAccountForm({
  onSubmit,
  initialData = null,
  isEditMode = false,
  onCancel
}: PaymentAccountFormProps) {
  const [displayName, setDisplayName] = useState(initialData?.displayName || "");
  const [provider, setProvider] = useState<PaymentProvider>(initialData?.provider || PAYMENT_PROVIDERS.PAYPAL);
  const [linkedBankAccountId, setLinkedBankAccountId] = useState<number | undefined>(initialData?.linkedBankAccountId);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  // Fetch bank accounts for the dropdown
  const { bankAccounts, fetchBankAccounts } = useBankAccounts();

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (initialData) {
      setDisplayName(initialData.displayName);
      setProvider(initialData.provider);
      setLinkedBankAccountId(initialData.linkedBankAccountId);
      setIsActive(initialData.isActive);
    } else {
      setDisplayName("");
      setProvider(PAYMENT_PROVIDERS.PAYPAL);
      setLinkedBankAccountId(undefined);
      setIsActive(true);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accountData: any = {
        displayName,
        provider,
        linkedBankAccountId: linkedBankAccountId || undefined,
        isActive,
        providerConfig: {}, // Empty config for now, will be populated by GoCardless integration
      };

      if (isEditMode && initialData) {
        accountData.id = initialData.id;
      }

      await onSubmit(accountData);

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
    setDisplayName("");
    setProvider(PAYMENT_PROVIDERS.PAYPAL);
    setLinkedBankAccountId(undefined);
    setIsActive(true);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Payment Account" : "Add New Payment Account"}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <form id="payment-account-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g., My PayPal Account"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              A friendly name to identify this payment account
            </p>
          </div>

          {/* Provider Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="provider">Payment Provider</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value as PaymentProvider)}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PAYMENT_PROVIDERS.PAYPAL}>PayPal</SelectItem>
                <SelectItem value={PAYMENT_PROVIDERS.KLARNA}>Klarna</SelectItem>
                <SelectItem value={PAYMENT_PROVIDERS.STRIPE}>Stripe</SelectItem>
                <SelectItem value={PAYMENT_PROVIDERS.SQUARE}>Square</SelectItem>
                <SelectItem value={PAYMENT_PROVIDERS.REVOLUT}>Revolut</SelectItem>
                <SelectItem value={PAYMENT_PROVIDERS.WISE}>Wise (TransferWise)</SelectItem>
                <SelectItem value={PAYMENT_PROVIDERS.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              The payment service provider for this account
            </p>
          </div>

          {/* Linked Bank Account */}
          <div className="space-y-2">
            <Label htmlFor="linkedBankAccount">Linked Bank Account (Optional)</Label>
            <Select
              value={linkedBankAccountId?.toString() || "none"}
              onValueChange={(value) => setLinkedBankAccountId(value === "none" ? undefined : parseInt(value))}
            >
              <SelectTrigger id="linkedBankAccount">
                <SelectValue placeholder="Select a bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked bank account</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id!.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Link this payment account to a bank account for easier reconciliation
            </p>
          </div>

          {/* Is Active Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Active
            </Label>
            <p className="text-xs text-gray-500 ml-2">
              Inactive accounts won't appear in reconciliation workflows
            </p>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          form="payment-account-form"
          disabled={loading}
          className="ml-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? "Update Account" : "Create Account"}
            </>
          )}
        </Button>
      </CardFooter>
    </>
  );
}
