'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PaymentAccount } from '@/types/payment-types';

interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

interface PopupMessage {
  type: 'GOCARDLESS_SUCCESS' | 'GOCARDLESS_ERROR' | 'GOCARDLESS_CANCELLED';
  data?: {
    requisitionId?: string;
    error?: string;
  };
}

interface PaymentGocardlessIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentAccounts: PaymentAccount[];
  onAccountsUpdated: () => void;
}

export default function PaymentGocardlessIntegrationDialog({
  open,
  onOpenChange,
  paymentAccounts,
  onAccountsUpdated
}: PaymentGocardlessIntegrationDialogProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Popup management
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupProcessing, setPopupProcessing] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Payment provider IDs to filter for
  const PAYMENT_PROVIDERS = [
    'PAYPAL_PSEUDE',
    'KLARNA_KLRNSE22',
    'SATISPAY_SATISPAY',
    'STRIPE_STRIPE',
    'REVOLUT_REVOLT21',
  ];

  // Load institutions when dialog opens
  useEffect(() => {
    if (open) {
      loadInstitutions();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedInstitution('');
      setSelectedPaymentAccount(null);
      setSearchTerm('');
      setFilteredInstitutions([]);
      setError(null);
      closePopup();
    }
  }, [open]);

  // Popup message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent<PopupMessage>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const message = event.data;

      if (message.type === 'GOCARDLESS_SUCCESS' && message.data?.requisitionId) {
        setPopupProcessing(true);
        handleOAuthSuccess(message.data.requisitionId);
      } else if (message.type === 'GOCARDLESS_ERROR') {
        toast.error(message.data?.error || 'Connection failed');
        closePopup();
      } else if (message.type === 'GOCARDLESS_CANCELLED') {
        toast.error('Connection cancelled');
        closePopup();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedPaymentAccount]);

  // Check if popup is closed
  useEffect(() => {
    if (isPopupOpen && popupRef.current) {
      popupCheckInterval.current = setInterval(() => {
        if (popupRef.current?.closed) {
          setIsPopupOpen(false);
          setPopupProcessing(false);
          if (popupCheckInterval.current) {
            clearInterval(popupCheckInterval.current);
          }
        }
      }, 500);
    }

    return () => {
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
    };
  }, [isPopupOpen]);

  const loadInstitutions = async () => {
    setInstitutionsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gocardless/institutions');
      if (!response.ok) {
        throw new Error('Failed to load payment providers');
      }

      const data = await response.json();

      // Filter for payment service providers only
      const paymentProviders = data.filter((inst: Institution) =>
        PAYMENT_PROVIDERS.some(provider => inst.id.includes(provider.split('_')[0]))
      );

      setInstitutions(paymentProviders);
      setFilteredInstitutions(paymentProviders);
    } catch (err) {
      console.error('Error loading institutions:', err);
      setError('Failed to load payment providers. Please try again.');
      toast.error('Failed to load payment providers');
    } finally {
      setInstitutionsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setFilteredInstitutions(institutions);
    } else {
      const filtered = institutions.filter(inst =>
        inst.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredInstitutions(filtered);
    }
  };

  const handleConnect = async () => {
    if (!selectedInstitution || !selectedPaymentAccount) {
      toast.error('Please select a payment provider and payment account');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/payment-accounts/gocardless-callback`;

      const response = await fetch('/api/payment-accounts/gocardless/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentAccountId: selectedPaymentAccount,
          institutionId: selectedInstitution,
          redirectUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate connection');
      }

      const { authUrl, requisitionId } = await response.json();

      // Store requisitionId in sessionStorage for callback
      sessionStorage.setItem('gocardless_requisition_id', requisitionId);
      sessionStorage.setItem('gocardless_payment_account_id', selectedPaymentAccount.toString());

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popupRef.current = window.open(
        authUrl,
        'GoCardless Authorization',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      setIsPopupOpen(true);
    } catch (err) {
      console.error('Error connecting to GoCardless:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      toast.error('Failed to initiate connection');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = async (requisitionId: string) => {
    try {
      const response = await fetch('/api/payment-accounts/gocardless/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentAccountId: selectedPaymentAccount,
          requisitionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete connection');
      }

      toast.success('Payment account connected to GoCardless successfully!');
      onAccountsUpdated();
      closePopup();
      onOpenChange(false);
    } catch (err) {
      console.error('Error completing connection:', err);
      toast.error('Failed to complete connection');
      closePopup();
    }
  };

  const closePopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setIsPopupOpen(false);
    setPopupProcessing(false);
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Connect Payment Account to GoCardless
          </DialogTitle>
          <DialogDescription>
            Link your payment service provider (PayPal, Klarna, etc.) to automatically import activities
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {isPopupOpen && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-2">
            <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {popupProcessing ? 'Completing connection...' : 'Authorization in progress'}
              </p>
              <p className="text-sm text-blue-700">
                {popupProcessing
                  ? 'Please wait while we finalize your connection.'
                  : 'Please complete the authorization in the popup window.'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: Select Payment Account */}
          <div className="space-y-3">
            <Label htmlFor="payment-account">Select Payment Account</Label>
            <select
              id="payment-account"
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPaymentAccount || ''}
              onChange={(e) => setSelectedPaymentAccount(Number(e.target.value))}
              disabled={loading || isPopupOpen}
            >
              <option value="">Choose a payment account...</option>
              {paymentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName} ({account.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Search Payment Providers */}
          <div className="space-y-3">
            <Label htmlFor="search">Search Payment Provider</Label>
            <Input
              id="search"
              placeholder="Search for PayPal, Klarna, etc..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={loading || isPopupOpen || institutionsLoading}
            />
          </div>

          {/* Institution List */}
          <div className="space-y-2">
            <Label>Available Payment Providers</Label>
            {institutionsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading providers...</span>
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'No providers found matching your search' : 'No payment providers available'}
                </p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                {filteredInstitutions.map((institution) => (
                  <Card
                    key={institution.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInstitution === institution.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : ''
                    }`}
                    onClick={() => setSelectedInstitution(institution.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-4">
                        {institution.logo && (
                          <img
                            src={institution.logo}
                            alt={institution.name}
                            className="h-10 w-10 object-contain"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-base">{institution.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {institution.countries.join(', ')}
                          </CardDescription>
                        </div>
                        {selectedInstitution === institution.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Connect Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || isPopupOpen}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!selectedInstitution || !selectedPaymentAccount || loading || isPopupOpen}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Connect to GoCardless
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
