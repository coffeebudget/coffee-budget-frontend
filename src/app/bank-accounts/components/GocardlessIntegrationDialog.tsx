'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BankAccount } from '@/utils/types';

interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

interface GocardlessAccount {
  id: string;
  iban: string;
  name: string;
  currency: string;
}

interface PopupMessage {
  type: 'GOCARDLESS_SUCCESS' | 'GOCARDLESS_ERROR' | 'GOCARDLESS_CANCELLED';
  data?: {
    requisitionId?: string;
    error?: string;
    accounts?: GocardlessAccount[];
  };
}

interface AccountMapping {
  gocardlessAccount: GocardlessAccount;
  action: 'associate' | 'create';
  localAccountId?: number;
  newAccountName?: string;
}

interface GocardlessIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: BankAccount[];
  onAccountsUpdated: () => void;
}

export default function GocardlessIntegrationDialog({
  open,
  onOpenChange,
  bankAccounts,
  onAccountsUpdated
}: GocardlessIntegrationDialogProps) {
  const [step, setStep] = useState<'select-bank' | 'mapping'>('select-bank');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Popup management
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupProcessing, setPopupProcessing] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Mapping state
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);

  // Store requisition info for creating connection record
  const [requisitionInfo, setRequisitionInfo] = useState<{
    requisitionId: string;
    institutionId: string;
  } | null>(null);

  // Load institutions when dialog opens
  useEffect(() => {
    if (open) {
      loadInstitutions();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('select-bank');
      setSelectedInstitution('');
      setSearchTerm('');
      setFilteredInstitutions([]);
      setAccountMappings([]);
      setRequisitionInfo(null);
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

      if (event.data.type === 'GOCARDLESS_SUCCESS') {
        console.log('✅ GoCardless authorization successful:', event.data);
        setPopupProcessing(false);
        setIsPopupOpen(false);
        closePopup();

        if (event.data.data?.accounts) {
          // Store requisition info for creating connection record later
          if (event.data.data.requisitionId) {
            setRequisitionInfo({
              requisitionId: event.data.data.requisitionId,
              institutionId: selectedInstitution, // Use the institution user selected
            });
          }
          initializeAccountMappings(event.data.data.accounts);
          setStep('mapping');
        }
        
      } else if (event.data.type === 'GOCARDLESS_ERROR') {
        console.error('❌ GoCardless authorization failed:', event.data.data?.error);
        setError(event.data.data?.error || 'Authorization failed');
        setPopupProcessing(false);
        setIsPopupOpen(false);
        closePopup();
        
      } else if (event.data.type === 'GOCARDLESS_CANCELLED') {
        console.log('⚠️ GoCardless authorization cancelled');
        setPopupProcessing(false);
        setIsPopupOpen(false);
        closePopup();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadInstitutions = async () => {
    setInstitutionsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gocardless/institutions/italian-banks');
      if (!response.ok) {
        throw new Error('Failed to load institutions');
      }
      
      const data = await response.json();
      setInstitutions(data);
      setFilteredInstitutions(data);
    } catch (err) {
      console.error('Error loading institutions:', err);
      setError('Failed to load banks. Please try again.');
    } finally {
      setInstitutionsLoading(false);
    }
  };

  const initializeAccountMappings = (accounts: GocardlessAccount[]) => {
    const mappings: AccountMapping[] = accounts.map(account => {
      // Check if this GoCardless account already has a linked bank account (reconnection scenario)
      const existingBankAccount = bankAccounts.find(
        ba => ba.gocardlessAccountId === account.id
      );

      if (existingBankAccount) {
        // Reconnection: default to associate with the existing account
        return {
          gocardlessAccount: account,
          action: 'associate' as const,
          localAccountId: existingBankAccount.id,
          newAccountName: account.name
        };
      } else {
        // New connection: default to create
        return {
          gocardlessAccount: account,
          action: 'create' as const,
          newAccountName: account.name
        };
      }
    });
    setAccountMappings(mappings);
  };

  const closePopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
    }
    popupRef.current = null;
    popupCheckInterval.current = null;
  };

  const handleConnectBank = async () => {
    if (!selectedInstitution) {
      setError('Please select a bank first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gocardless/flow/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionId: selectedInstitution,
          redirectUrl: `${window.location.origin}/bank-accounts/gocardless-callback`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start connection flow');
      }

      const data = await response.json();
      
      // Open popup for authorization
      const popup = window.open(
        data.authUrl,
        'gocardless-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes,left=' + 
        (window.screen.width / 2 - 300) + ',top=' + 
        (window.screen.height / 2 - 350)
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      popupRef.current = popup;
      setIsPopupOpen(true);
      setPopupProcessing(true);

      // Monitor popup
      popupCheckInterval.current = setInterval(() => {
        if (popup.closed) {
          setIsPopupOpen(false);
          setPopupProcessing(false);
          closePopup();
        }
      }, 1000);

    } catch (err) {
      console.error('Error connecting bank:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect bank');
    } finally {
      setLoading(false);
    }
  };

  const updateAccountMapping = (index: number, updates: Partial<AccountMapping>) => {
    setAccountMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    ));
  };

  const handleSaveMappings = async () => {
    setLoading(true);
    try {
      // Collect all account IDs that will be linked
      const linkedAccountIds: string[] = [];

      for (const mapping of accountMappings) {
        // Get current balance from GoCardless
        const balanceResponse = await fetch(`/api/gocardless/accounts/${mapping.gocardlessAccount.id}/balances`);
        let currentBalance = 0;

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          // Find the current balance (usually "expected" or "interimAvailable")
          const balance = balanceData.balances?.find(
            (b: { balanceType: string; balanceAmount: { amount: string } }) =>
              b.balanceType === 'expected' || b.balanceType === 'interimAvailable'
          ) || balanceData.balances?.[0];

          if (balance) {
            currentBalance = parseFloat(balance.balanceAmount.amount);
          }
        }

        if (mapping.action === 'associate' && mapping.localAccountId) {
          // Associate with existing account and update balance
          await fetch(`/api/bank-accounts/${mapping.localAccountId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gocardlessAccountId: mapping.gocardlessAccount.id,
              balance: currentBalance
            })
          });
        } else if (mapping.action === 'create') {
          // Create new account with current balance
          await fetch('/api/bank-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: mapping.newAccountName || mapping.gocardlessAccount.name,
              balance: currentBalance,
              currency: mapping.gocardlessAccount.currency,
              type: 'Checking',
              gocardlessAccountId: mapping.gocardlessAccount.id
            })
          });
        }

        // Track linked account IDs
        linkedAccountIds.push(mapping.gocardlessAccount.id);
      }

      // Create GocardlessConnection record for tracking expiration
      if (requisitionInfo && linkedAccountIds.length > 0) {
        try {
          const connectionResponse = await fetch('/api/gocardless/connections/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requisitionId: requisitionInfo.requisitionId,
              institutionId: requisitionInfo.institutionId,
              linkedAccountIds,
            })
          });

          if (!connectionResponse.ok) {
            console.error('Failed to create connection record:', await connectionResponse.text());
            // Don't fail the whole operation - connection tracking is secondary
          } else {
            console.log('✅ Created GocardlessConnection record for expiration tracking');
          }
        } catch (connectionError) {
          console.error('Error creating connection record:', connectionError);
          // Don't fail the whole operation - connection tracking is secondary
        }
      }

      toast.success('GoCardless accounts successfully connected and balances synchronized!');
      onAccountsUpdated();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save account mappings');
      console.error('Error saving mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            GoCardless Integration
          </DialogTitle>
          <DialogDescription>
            Connect your bank accounts through GoCardless to automatically import transactions
          </DialogDescription>
        </DialogHeader>

        {step === 'select-bank' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Select Your Bank</h3>
              
              {institutionsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading banks...</span>
                </div>
              ) : institutions.length > 0 ? (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for your bank..."
                      value={searchTerm}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        const term = e.target.value;
                        setSearchTerm(term);
                        
                        if (term.trim() === '') {
                          setFilteredInstitutions(institutions);
                        } else {
                          const filtered = institutions.filter(institution => 
                            institution.name.toLowerCase().includes(term.toLowerCase()) ||
                            institution.bic.toLowerCase().includes(term.toLowerCase())
                          );
                          setFilteredInstitutions(filtered);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Bank Selection Dropdown */}
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Choose your bank from the list..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {filteredInstitutions.map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          <div className="flex items-center gap-3 w-full">
                            <img 
                              src={institution.logo} 
                              alt={institution.name}
                              className="w-6 h-6 object-contain flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{institution.name}</div>
                              <div className="text-sm text-gray-500">BIC: {institution.bic}</div>
                            </div>
                            <Badge variant="outline" className="ml-2 flex-shrink-0">
                              {institution.transaction_total_days}d
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected Bank Preview */}
                  {selectedInstitution && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={institutions.find(i => i.id === selectedInstitution)?.logo} 
                          alt="Selected bank"
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <h4 className="font-medium text-blue-900">
                            {institutions.find(i => i.id === selectedInstitution)?.name}
                          </h4>
                          <p className="text-sm text-blue-700">
                            BIC: {institutions.find(i => i.id === selectedInstitution)?.bic} • 
                            {institutions.find(i => i.id === selectedInstitution)?.transaction_total_days} days history
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No banks available. Please try again later.</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConnectBank}
                disabled={!selectedInstitution || loading || popupProcessing}
              >
                {loading || popupProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {popupProcessing ? 'Authorizing...' : 'Connecting...'}
                  </>
                ) : (
                  'Connect Bank Account'
                )}
              </Button>
            </div>

            {isPopupOpen && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-blue-700">
                    Please complete the authorization in the popup window...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Map Your Accounts</h3>
              <p className="text-gray-600 mb-4">
                Choose how to handle each connected GoCardless account. Local account balances will be automatically synchronized with GoCardless.
              </p>
              
              <div className="space-y-4">
                {accountMappings.map((mapping, index) => (
                  <Card key={mapping.gocardlessAccount.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{mapping.gocardlessAccount.name}</CardTitle>
                          <CardDescription>
                            IBAN: {mapping.gocardlessAccount.iban} • {mapping.gocardlessAccount.currency}
                          </CardDescription>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          variant={mapping.action === 'associate' ? 'default' : 'outline'}
                          onClick={() => updateAccountMapping(index, { action: 'associate' })}
                          className="justify-start"
                        >
                          Associate with existing account
                        </Button>
                        <Button 
                          variant={mapping.action === 'create' ? 'default' : 'outline'}
                          onClick={() => updateAccountMapping(index, { action: 'create' })}
                          className="justify-start"
                        >
                          Create new account
                        </Button>
                      </div>
                      
                      {mapping.action === 'associate' && (
                        <div className="mt-4">
                          <Select 
                            value={mapping.localAccountId?.toString()} 
                            onValueChange={(value) => updateAccountMapping(index, { localAccountId: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an existing account" />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccounts
                                .filter(acc =>
                                  // Show accounts not connected OR accounts being reconnected (same gocardlessAccountId)
                                  !acc.gocardlessAccountId ||
                                  acc.gocardlessAccountId === mapping.gocardlessAccount.id
                                )
                                .map(account => (
                                  <SelectItem key={account.id} value={account.id!.toString()}>
                                    {account.name}
                                    {account.gocardlessAccountId === mapping.gocardlessAccount.id && (
                                      <span className="ml-2 text-xs text-blue-600">(reconnect)</span>
                                    )}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {mapping.action === 'create' && (
                        <div className="mt-4">
                          <input 
                            type="text"
                            value={mapping.newAccountName || ''}
                            onChange={(e) => updateAccountMapping(index, { newAccountName: e.target.value })}
                            placeholder="Account name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('select-bank')}>
                Back
              </Button>
              <Button onClick={handleSaveMappings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting & Syncing Balances...
                  </>
                ) : (
                  'Connect & Sync Balances'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 