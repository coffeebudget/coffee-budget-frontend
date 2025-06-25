'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Loader2, AlertCircle, Unlink, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GocardlessConnectionDetails {
  gocardlessAccountId: string;
  details: {
    account: {
      iban: string;
      name: string;
      institution_id: string;
      currency: string;
    };
  };
  balances: {
    balances: Array<{
      balanceAmount: {
        amount: string;
        currency: string;
      };
      balanceType: string;
    }>;
  };
}

interface GocardlessConnectionManagerProps {
  accountId: number;
  gocardlessAccountId?: string;
  onConnectionChange: (gocardlessAccountId: string | null) => void;
  disabled?: boolean;
}

export default function GocardlessConnectionManager({
  accountId,
  gocardlessAccountId,
  onConnectionChange,
  disabled = false
}: GocardlessConnectionManagerProps) {
  const [connectionDetails, setConnectionDetails] = useState<GocardlessConnectionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load connection details when component mounts or gocardlessAccountId changes
  useEffect(() => {
    if (gocardlessAccountId) {
      loadConnectionDetails();
    } else {
      setConnectionDetails(null);
    }
  }, [gocardlessAccountId]);

  const loadConnectionDetails = async () => {
    if (!gocardlessAccountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get account details from GoCardless
      const detailsResponse = await fetch(`/api/gocardless/accounts/${gocardlessAccountId}/details`);
      const balancesResponse = await fetch(`/api/gocardless/accounts/${gocardlessAccountId}/balances`);
      
      if (!detailsResponse.ok || !balancesResponse.ok) {
        throw new Error('Failed to load connection details');
      }
      
      const details = await detailsResponse.json();
      const balances = await balancesResponse.json();
      
      setConnectionDetails({
        gocardlessAccountId,
        details,
        balances
      });
    } catch (err) {
      console.error('Error loading connection details:', err);
      setError('Failed to load connection details');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect this account from GoCardless? ' +
      'You won\'t be able to automatically import transactions anymore, but existing transactions will remain.'
    );
    
    if (!confirmed) return;
    
    setDisconnecting(true);
    setError(null);
    
    try {
      // Update the bank account to remove GoCardless association
      const response = await fetch(`/api/bank-accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gocardlessAccountId: null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      setConnectionDetails(null);
      onConnectionChange(null);
      toast.success('Account disconnected from GoCardless');
    } catch (err) {
      console.error('Error disconnecting account:', err);
      setError('Failed to disconnect account');
      toast.error('Failed to disconnect account');
    } finally {
      setDisconnecting(false);
    }
  };

  const getCurrentBalance = () => {
    if (!connectionDetails?.balances?.balances?.length) return null;
    
    // Find the current balance (usually balanceType === "expected")
    const currentBalance = connectionDetails.balances.balances.find(
      balance => balance.balanceType === 'expected' || balance.balanceType === 'interimAvailable'
    ) || connectionDetails.balances.balances[0];
    
    return currentBalance;
  };

  if (!gocardlessAccountId) {
    return (
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <X className="h-4 w-4 text-gray-400" />
            GoCardless Connection
          </CardTitle>
          <CardDescription>
            This account is not connected to GoCardless
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              Use the global &ldquo;GoCardless Integration&rdquo; button to connect accounts
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          GoCardless Connection
        </CardTitle>
        <CardDescription>
          This account is connected to GoCardless for automatic transaction import
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading connection details...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {connectionDetails && (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-900">Connected Account</h4>
              <p className="text-sm font-medium">{connectionDetails.details.account.name}</p>
              <p className="text-xs text-gray-600">IBAN: {connectionDetails.details.account.iban}</p>
              <p className="text-xs text-gray-600">Currency: {connectionDetails.details.account.currency}</p>
            </div>

            {getCurrentBalance() && (
              <div>
                <h4 className="font-medium text-sm text-gray-900">Current Balance</h4>
                <p className="text-sm">
                  {getCurrentBalance()?.balanceAmount.amount} {getCurrentBalance()?.balanceAmount.currency}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {getCurrentBalance()?.balanceType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-sm text-gray-900">Connection Status</h4>
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            </div>
          </div>
        )}

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600">
              Account ID: {gocardlessAccountId.slice(-8)}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              disabled={disabled || disconnecting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 