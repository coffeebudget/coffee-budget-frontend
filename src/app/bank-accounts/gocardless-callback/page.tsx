'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RequisitionData {
  id: string;
  status: string;
  accounts: string[];
  institution_id: string;
  reference: string;
}

interface AccountDetails {
  account: {
    iban: string;
    name: string;
    currency: string;
  };
}

interface PopupMessage {
  type: 'GOCARDLESS_SUCCESS' | 'GOCARDLESS_ERROR' | 'GOCARDLESS_CANCELLED';
  data?: {
    requisitionId?: string;
    error?: string;
    accounts?: Array<{
      id: string;
      iban: string;
      name: string;
      currency: string;
    }>;
  };
}

function GocardlessCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requisitionData, setRequisitionData] = useState<RequisitionData | null>(null);

  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    // Check if this is running in a popup window
    setIsPopup(window.opener !== null);

    if (!searchParams) {
      const errorMsg = 'No search parameters found';
      setError(errorMsg);
      setLoading(false);
      sendMessageToParent('GOCARDLESS_ERROR', { error: errorMsg });
      return;
    }

    // GoCardless can use different parameter names, try common ones
    const requisitionId = searchParams.get('ref') || searchParams.get('requisition_id') || searchParams.get('id');
    const errorParam = searchParams.get('error');

    const allParams = Object.fromEntries(searchParams.entries());
    console.log('🔍 Callback URL parameters:', allParams);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Extracted reference:', requisitionId);

    if (errorParam) {
      const errorMsg = 'Authorization was cancelled or failed';
      console.error('❌ Error parameter found:', errorParam);
      setError(errorMsg);
      setLoading(false);
      sendMessageToParent('GOCARDLESS_ERROR', { error: errorMsg });
      return;
    }

    if (!requisitionId) {
      const errorMsg = `No requisition ID found in callback. Available parameters: ${JSON.stringify(allParams)}`;
      console.error('❌ No requisition ID found:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      sendMessageToParent('GOCARDLESS_ERROR', { error: errorMsg });
      return;
    }

    processCallback(requisitionId);
  }, [searchParams]);

  const sendMessageToParent = (type: PopupMessage['type'], data?: PopupMessage['data']) => {
    if (window.opener) {
      const message: PopupMessage = { type, data };
      window.opener.postMessage(message, window.location.origin);
    }
  };

  const processCallback = async (requisitionId: string) => {
    try {
      setLoading(true);
      
      // Get requisition details by reference (GoCardless sends reference, not requisition ID)
      console.log('Fetching requisition details for reference:', requisitionId);
      const requisitionResponse = await fetch(`/api/gocardless/requisitions/by-reference/${requisitionId}`);

      if (!requisitionResponse.ok) {
        const errorText = await requisitionResponse.text();
        console.error('Requisition fetch failed:', {
          status: requisitionResponse.status,
          statusText: requisitionResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch requisition details (${requisitionResponse.status}): ${errorText}`);
      }

      const requisition: RequisitionData = await requisitionResponse.json();
      setRequisitionData(requisition);

      if (requisition.status !== 'LN') {
        throw new Error(`Requisition status is ${requisition.status}, expected LN (linked)`);
      }

      // Get details for each connected account
      const accountsDetailsMap: Record<string, AccountDetails> = {};
      
      for (const accountId of requisition.accounts) {
        try {
          const accountResponse = await fetch(`/api/gocardless/accounts/${accountId}/details`);

          if (accountResponse.ok) {
            const accountDetails: AccountDetails = await accountResponse.json();
            accountsDetailsMap[accountId] = accountDetails;
          }
        } catch (error) {
          console.error(`Failed to fetch details for account ${accountId}:`, error);
        }
      }

      // Convert accounts details to the format expected by the dialog
      const accounts = requisition.accounts.map(accountId => {
        const details = accountsDetailsMap[accountId]; // Use the local variable, not state
        return {
          id: accountId,
          iban: details?.account?.iban || '',
          name: details?.account?.name || `Account ${accountId.slice(-4)}`,
          currency: details?.account?.currency || 'EUR'
        };
      });

      // Send success message with account details to parent window
      sendMessageToParent('GOCARDLESS_SUCCESS', { 
        requisitionId,
        accounts 
      });
      
      // If this is a popup, close it immediately
      if (isPopup) {
        window.close();
      } else {
        toast.success('Bank accounts connected successfully');
      }
      
    } catch (error) {
      console.error('Error processing callback:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process callback';
      setError(errorMsg);
      sendMessageToParent('GOCARDLESS_ERROR', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };



  const goBack = () => {
    if (isPopup) {
      window.close();
    } else {
      router.push('/bank-accounts');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Connection</h3>
            <p className="text-muted-foreground text-center">
              Please wait while we complete your bank account connection...
            </p>
            {isPopup && (
              <p className="text-xs text-muted-foreground mt-2">
                This window will close automatically when complete
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Connection Failed
            </CardTitle>
            <CardDescription>
              There was an issue connecting your bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={goBack} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="default" 
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requisitionData && requisitionData.accounts.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Authorization Successful
            </CardTitle>
            <CardDescription>
              Bank accounts connected successfully. This window will close automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Found {requisitionData.accounts.length} account{requisitionData.accounts.length > 1 ? 's' : ''}
              </p>
              <Button onClick={goBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Accounts Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            No bank accounts were found in this connection.
          </p>
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bank Accounts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GocardlessCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading...</h3>
            <p className="text-muted-foreground text-center">
              Please wait while we process your request...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <GocardlessCallbackContent />
    </Suspense>
  );
} 