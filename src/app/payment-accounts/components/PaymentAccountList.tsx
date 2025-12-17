"use client";

import { useState } from "react";
import { PaymentAccount } from "@/types/payment-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertCircle, CheckCircle, X, Download, Loader2, Link } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { importPaymentActivities } from "@/utils/payment-api-client";

interface PaymentAccountListProps {
  paymentAccounts: PaymentAccount[];
  onEdit: (account: PaymentAccount) => void;
  onDelete: (id: number) => void;
  onAccountUpdated?: () => void;
}

export default function PaymentAccountList({
  paymentAccounts,
  onEdit,
  onDelete,
  onAccountUpdated
}: PaymentAccountListProps) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [importingAccounts, setImportingAccounts] = useState<Set<number>>(new Set());

  const handleDeleteClick = (id: number) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  const handleImportActivities = async (account: PaymentAccount) => {
    setImportingAccounts(prev => new Set(prev).add(account.id));

    try {
      // Import last 90 days by default
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const result = await importPaymentActivities({
        paymentAccountId: account.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (result.imported > 0) {
        toast.success(
          `🎉 Import completed for ${account.displayName}!\n\n` +
          `📈 ${result.imported} new activities imported\n` +
          `🔄 ${result.skipped || 0} duplicates skipped`,
          {
            duration: 6000,
            style: {
              maxWidth: '400px',
            }
          }
        );
      } else if (result.skipped && result.skipped > 0) {
        toast('ℹ️ Import completed - no new activities\n\n' +
          `🔄 ${result.skipped} activities were already imported`,
          {
            duration: 4000,
            icon: '📋',
          }
        );
      } else {
        toast('📭 No activities found\n\nAccount is up to date!', {
          duration: 3000,
          icon: '✨',
        });
      }

      // Refresh account data if callback provided
      if (onAccountUpdated) {
        onAccountUpdated();
      }
    } catch (error) {
      console.error('Error importing activities:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to import activities: ${errorMessage}`);
    } finally {
      setImportingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(account.id);
        return newSet;
      });
    }
  };

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

  const hasGoCardlessConnection = (account: PaymentAccount): boolean => {
    return !!(account.providerConfig?.gocardlessAccountId);
  };

  if (paymentAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Payment Accounts</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t added any payment accounts yet.</p>
            <p className="text-sm text-gray-500">
              Click &ldquo;Add Account&rdquo; to create your first payment account.
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
              <TableHead>Display Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">GoCardless</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.displayName}</TableCell>
                <TableCell>{getProviderDisplayName(account.provider)}</TableCell>
                <TableCell className="text-center">
                  {account.isActive ? (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit mx-auto">
                      <X className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {hasGoCardlessConnection(account) ? (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit mx-auto">
                      <X className="h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {hasGoCardlessConnection(account) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleImportActivities(account)}
                        disabled={importingAccounts.has(account.id)}
                        title="Import Activities"
                      >
                        {importingAccounts.has(account.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    )}
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
                      onClick={() => handleDeleteClick(account.id)}
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
