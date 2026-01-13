"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { BankAccount } from "@/utils/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertCircle, CheckCircle, X, Download, Loader2, Clock, Link as LinkIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import {
  ConnectionStatusSummary,
  ConnectionAlert,
  formatExpirationMessage,
} from "@/types/gocardless-types";

interface BankAccountsProps {
  bankAccounts: BankAccount[];
  onEdit: (account: BankAccount) => void;
  onDelete: (id: number) => void;
  onAccountUpdated?: () => void;
  onReconnect?: (account: BankAccount) => void;
}

export default function BankAccounts({
  bankAccounts,
  onEdit,
  onDelete,
  onAccountUpdated,
  onReconnect
}: BankAccountsProps) {
  const { data: session } = useSession();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [importingAccounts, setImportingAccounts] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusSummary | null>(null);

  // Fetch connection status
  useEffect(() => {
    if (!session?.user?.accessToken) return;

    const fetchConnectionStatus = async () => {
      try {
        const response = await fetch('/api/gocardless/connection-status');
        if (response.ok) {
          const data = await response.json();
          setConnectionStatus(data);
        }
      } catch (error) {
        console.error('Error fetching connection status:', error);
      }
    };

    fetchConnectionStatus();
  }, [session]);

  // Create a map of gocardlessAccountId -> alert for quick lookup
  const alertMap = useMemo(() => {
    const map = new Map<string, ConnectionAlert>();
    if (connectionStatus?.alerts) {
      connectionStatus.alerts.forEach(alert => {
        alert.linkedAccountIds.forEach(id => map.set(id, alert));
      });
    }
    return map;
  }, [connectionStatus]);

  // Get connection alert for an account
  const getAccountAlert = (account: BankAccount): ConnectionAlert | undefined => {
    if (!account.gocardlessAccountId) return undefined;
    return alertMap.get(account.gocardlessAccountId);
  };

  const handleDeleteClick = (id: number) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  const handleImportSingleAccount = async (account: BankAccount) => {
    if (!account.gocardlessAccountId) {
      toast.error('Account is not connected to GoCardless');
      return;
    }

    setImportingAccounts(prev => new Set(prev).add(account.id!));

    try {
      const response = await fetch('/api/gocardless/import-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: account.gocardlessAccountId,
          bankAccountId: account.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import transactions');
      }

      const data = await response.json();
      
      if (data.newTransactionsCount > 0) {
        toast.success(
          `🎉 Import completed for ${account.name}!\n\n` +
          `📈 ${data.newTransactionsCount} new transactions imported\n` +
          `🔄 ${data.duplicatesCount} duplicates skipped`,
          { 
            duration: 6000,
            style: {
              maxWidth: '400px',
            }
          }
        );
      } else if (data.duplicatesCount > 0) {
        toast('ℹ️ Import completed - no new transactions\n\n' +
          `🔄 ${data.duplicatesCount} transactions were already imported`,
          { 
            duration: 4000,
            icon: '📋',
          }
        );
      } else {
        toast('📭 No transactions found\n\nAccount is up to date!', {
          duration: 3000,
          icon: '✨',
        });
      }

      // Refresh account data if callback provided
      if (onAccountUpdated) {
        onAccountUpdated();
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error(`Failed to import transactions from ${account.name}`);
    } finally {
      setImportingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(account.id!);
        return newSet;
      });
    }
  };

  if (bankAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Bank Accounts</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t added any bank accounts yet.</p>
            <p className="text-sm text-gray-500">
              Click &ldquo;Add Account&rdquo; to create your first bank account.
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
              <TableHead className="text-center">GoCardless</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell className="text-right">
                  ${typeof account.balance === 'number' 
                      ? account.balance.toFixed(2) 
                      : parseFloat(String(account.balance)).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  {account.gocardlessAccountId ? (
                    (() => {
                      const alert = getAccountAlert(account);
                      if (alert?.status === 'expired') {
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertCircle className="h-3 w-3" />
                              Expired
                            </Badge>
                            {onReconnect && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => onReconnect(account)}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Reconnect
                              </Button>
                            )}
                          </div>
                        );
                      } else if (alert?.status === 'expiring_soon') {
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              <Clock className="h-3 w-3" />
                              {formatExpirationMessage(alert.daysUntilExpiration)}
                            </Badge>
                            {onReconnect && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => onReconnect(account)}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Renew
                              </Button>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                        );
                      }
                    })()
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit mx-auto">
                      <X className="h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {account.gocardlessAccountId && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleImportSingleAccount(account)}
                        disabled={importingAccounts.has(account.id!)}
                        title="Import Transactions"
                      >
                        {importingAccounts.has(account.id!) ? (
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