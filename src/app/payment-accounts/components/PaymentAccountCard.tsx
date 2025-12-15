"use client";

import { PaymentAccount } from "@/types/payment-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Download, CheckCircle, X } from "lucide-react";

interface PaymentAccountCardProps {
  account: PaymentAccount;
  onEdit: (account: PaymentAccount) => void;
  onDelete: (id: number) => void;
  onImport?: (account: PaymentAccount) => void;
  isImporting?: boolean;
}

export default function PaymentAccountCard({
  account,
  onEdit,
  onDelete,
  onImport,
  isImporting = false
}: PaymentAccountCardProps) {
  const getProviderDisplayName = (provider: string): string => {
    const providerMap: Record<string, string> = {
      'paypal': 'PayPal',
      'klarna': 'Klarna',
      'stripe': 'Stripe',
      'square': 'Square',
      'revolut': 'Revolut',
      'wise': 'Wise',
      'other': 'Other',
    };
    return providerMap[provider] || provider;
  };

  const hasGoCardlessConnection = (): boolean => {
    return !!(account.providerConfig?.gocardlessAccountId);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{account.displayName}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {getProviderDisplayName(account.provider)}
            </p>
          </div>
          <div className="flex gap-2">
            {account.isActive ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <X className="h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* GoCardless Connection Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">GoCardless:</span>
            {hasGoCardlessConnection() ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <X className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>

          {/* Linked Bank Account */}
          {account.linkedBankAccount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Linked Account:</span>
              <span className="font-medium">{account.linkedBankAccount.name}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {hasGoCardlessConnection() && onImport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImport(account)}
                disabled={isImporting}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Import
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(account)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(account.id)}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
