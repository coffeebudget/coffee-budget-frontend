'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Download, ExternalLink, CheckCircle, CreditCard, Building2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

interface ConnectedAccount {
  type: 'bank_account' | 'credit_card';
  localId: number;
  localName: string;
  gocardlessAccountId: string;
  details: {
    account: {
      iban: string;
      name: string;
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

interface BankAccount {
  id: number;
  name: string;
  balance: number;
  currency: string;
  type: string;
  gocardlessAccountId?: string;
}

interface CreditCard {
  id: number;
  name: string;
  currentBalance: number;
  creditLimit: number;
  gocardlessAccountId?: string;
}

interface PopupMessage {
  type: 'GOCARDLESS_SUCCESS' | 'GOCARDLESS_ERROR' | 'GOCARDLESS_CANCELLED';
  data?: {
    requisitionId?: string;
    error?: string;
  };
}

export default function GocardlessIntegration() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const [selectedGocardlessAccount, setSelectedGocardlessAccount] = useState<string>('');
  const [associationType, setAssociationType] = useState<'bank_account' | 'credit_card'>('bank_account');
  const [selectedLocalAccount, setSelectedLocalAccount] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState('');
  const [createNewAccount, setCreateNewAccount] = useState(false);
  
  // Popup management state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupProcessing, setPopupProcessing] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    
    // Set up message listener for popup communication
    const handleMessage = (event: MessageEvent<PopupMessage>) => {
      // Verify origin for security (adjust this to your domain in production)
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'GOCARDLESS_SUCCESS':
          handlePopupSuccess();
          break;
        case 'GOCARDLESS_ERROR':
          handlePopupError(data?.error || 'Unknown error occurred');
          break;
        case 'GOCARDLESS_CANCELLED':
          handlePopupCancelled();
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadInstitutions(),
        loadConnectedAccounts(),
        loadBankAccounts(),
        loadCreditCards(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      const response = await fetch('/api/gocardless/institutions/italian-banks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      }
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  const loadConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/gocardless/connected-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.connectedAccounts || []);
      }
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const loadCreditCards = async () => {
    try {
      const response = await fetch('/api/credit-cards', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCreditCards(data);
      }
    } catch (error) {
      console.error('Error loading credit cards:', error);
    }
  };

  const startBankConnection = async () => {
    if (!selectedInstitution) {
      toast.error('Please select a bank');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/gocardless/flow/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          institutionId: selectedInstitution,
          redirectUrl: `${window.location.origin}/gocardless/callback`,
          reference: `user-connection-${Date.now()}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        openAuthorizationPopup(data.authUrl);
        setShowConnectionDialog(false);
      } else {
        throw new Error('Failed to start bank connection');
      }
    } catch (error) {
      console.error('Error starting bank connection:', error);
      toast.error('Failed to start bank connection');
    } finally {
      setLoading(false);
    }
  };

  const openAuthorizationPopup = (authUrl: string) => {
    // Close any existing popup
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    // Calculate popup position (centered on screen)
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Open popup with specific features
    popupRef.current = window.open(
      authUrl,
      'gocardless-auth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes`
    );

    if (!popupRef.current) {
      toast.error('Popup blocked. Please allow popups for this site and try again.');
      return;
    }

    setIsPopupOpen(true);
    setPopupProcessing(false);

    // Monitor popup status
    popupCheckInterval.current = setInterval(() => {
      if (popupRef.current?.closed) {
        handlePopupClosed();
      }
    }, 1000);

    toast.success('Authorization window opened. Complete the bank connection in the popup.');
  };

  const handlePopupClosed = () => {
    setIsPopupOpen(false);
    setPopupProcessing(false);
    
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
      popupCheckInterval.current = null;
    }

    // If popup was closed without success message, assume it was cancelled
    if (!popupProcessing) {
      toast('Bank connection cancelled');
    }
  };

  const handlePopupSuccess = async () => {
    setPopupProcessing(true);
    
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    toast.success('Bank connection successful! Refreshing your accounts...');
    
    // Refresh data to show new connected accounts
    await loadData();
    
    setIsPopupOpen(false);
    setPopupProcessing(false);
  };

  const handlePopupError = (error: string) => {
    setPopupProcessing(true);
    
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    toast.error(`Bank connection failed: ${error}`);
    
    setIsPopupOpen(false);
    setPopupProcessing(false);
  };

  const handlePopupCancelled = () => {
    setPopupProcessing(true);
    
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    toast('Bank connection cancelled');
    
    setIsPopupOpen(false);
    setPopupProcessing(false);
  };

  const closePopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    handlePopupClosed();
  };

  const importAllTransactions = async () => {
    try {
      setImportLoading(true);
      const response = await fetch('/api/gocardless/import/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Enhanced success message with better visibility
        toast.success(
          `🎉 Import Successful! ${data.summary.totalNewTransactions} new transactions imported, ${data.summary.totalDuplicates} duplicates skipped.`,
          {
            duration: 10000, // Longer duration
            position: 'top-center', // More prominent position
            style: {
              background: '#10b981',
              color: '#ffffff',
              border: '2px solid #059669',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              padding: '20px 24px',
              maxWidth: '600px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 10000,
            },
            icon: '✅',
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          }
        );
        // Refresh connected accounts to show updated data
        await loadConnectedAccounts();
      } else {
        throw new Error('Failed to import transactions');
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error('Failed to import transactions');
    } finally {
      setImportLoading(false);
    }
  };

  const associateAccount = async () => {
    if (!selectedGocardlessAccount || (!selectedLocalAccount && !createNewAccount)) {
      toast.error('Please select accounts to associate');
      return;
    }

    try {
      setLoading(true);
      
      if (createNewAccount) {
        // Create new account with GoCardless association
        const endpoint = associationType === 'bank_account' ? '/api/bank-accounts' : '/api/credit-cards';
        const accountData = associationType === 'bank_account' 
          ? {
              name: newAccountName,
              balance: 0,
              currency: 'EUR',
              type: 'Checking',
              gocardlessAccountId: selectedGocardlessAccount,
            }
          : {
              name: newAccountName,
              creditLimit: 1000,
              availableCredit: 1000,
              currentBalance: 0,
              billingDay: 1,
              interestRate: 0,
              gocardlessAccountId: selectedGocardlessAccount,
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(accountData),
        });

        if (response.ok) {
          toast.success(`New ${associationType.replace('_', ' ')} created and associated with GoCardless`);
          await loadData();
        } else {
          throw new Error(`Failed to create ${associationType}`);
        }
      } else {
        // Update existing account with GoCardless association
        const endpoint = associationType === 'bank_account' 
          ? `/api/bank-accounts/${selectedLocalAccount}`
          : `/api/credit-cards/${selectedLocalAccount}`;

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            gocardlessAccountId: selectedGocardlessAccount,
          }),
        });

        if (response.ok) {
          toast.success(`${associationType.replace('_', ' ')} associated with GoCardless`);
          await loadData();
        } else {
          throw new Error(`Failed to update ${associationType}`);
        }
      }

      setShowAssociationDialog(false);
      setSelectedGocardlessAccount('');
      setSelectedLocalAccount('');
      setNewAccountName('');
      setCreateNewAccount(false);
    } catch (error) {
      console.error('Error associating account:', error);
      toast.error('Failed to associate account');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableGocardlessAccounts = (): Array<{id: string; name: string}> => {
    // This would come from a requisition callback or manual account selection
    // For now, we'll show a placeholder
    return [];
  };

  if (loading && institutions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GoCardless Integration</h2>
          <p className="text-muted-foreground">
            Connect your bank accounts and automatically import transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Bank Account</DialogTitle>
                <DialogDescription>
                  Select your bank to start the connection process
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="institution">Select Bank</Label>
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startBankConnection} disabled={!selectedInstitution || loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {connectedAccounts.length > 0 && (
            <Button onClick={importAllTransactions} disabled={importLoading}>
              {importLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Download className="h-4 w-4 mr-2" />
              Import All Transactions
            </Button>
          )}
        </div>
      </div>

      {/* Popup Status Indicator */}
      {isPopupOpen && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {popupProcessing 
                ? 'Processing bank connection...' 
                : 'Complete the bank authorization in the popup window'
              }
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={closePopup}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connected" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connected">Connected Accounts</TabsTrigger>
          <TabsTrigger value="banks">Available Banks</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          {connectedAccounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Connected Accounts</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Connect your bank accounts to automatically import transactions
                </p>
                <Button onClick={() => setShowConnectionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Bank
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectedAccounts.map((account) => (
                <Card key={account.gocardlessAccountId}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {account.localName}
                    </CardTitle>
                    <Badge variant={account.type === 'bank_account' ? 'default' : 'secondary'}>
                      {account.type === 'bank_account' ? (
                        <Building2 className="h-3 w-3 mr-1" />
                      ) : (
                        <CreditCard className="h-3 w-3 mr-1" />
                      )}
                      {account.type.replace('_', ' ')}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IBAN:</span>
                        <span className="font-mono">
                          {account.details.account.iban.slice(-4).padStart(account.details.account.iban.length, '*')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Currency:</span>
                        <span>{account.details.account.currency}</span>
                      </div>
                      {account.balances.balances.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-semibold">
                            {account.balances.balances[0].balanceAmount.amount} {account.balances.balances[0].balanceAmount.currency}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="banks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {institutions.slice(0, 12).map((institution) => (
              <Card key={institution.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm">{institution.name}</CardTitle>
                  <CardDescription className="text-xs">
                    BIC: {institution.bic}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {institution.transaction_total_days} days history
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInstitution(institution.id);
                        setShowConnectionDialog(true);
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Association Dialog */}
      <Dialog open={showAssociationDialog} onOpenChange={setShowAssociationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associate GoCardless Account</DialogTitle>
            <DialogDescription>
              Associate a GoCardless account with your local accounts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Type</Label>
              <Select value={associationType} onValueChange={(value: 'bank_account' | 'credit_card') => setAssociationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>GoCardless Account</Label>
              <Select value={selectedGocardlessAccount} onValueChange={setSelectedGocardlessAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GoCardless account" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableGocardlessAccounts().map((account: {id: string; name: string}) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="existing"
                  name="accountChoice"
                  checked={!createNewAccount}
                  onChange={() => setCreateNewAccount(false)}
                />
                <Label htmlFor="existing">Associate with existing account</Label>
              </div>
              
              {!createNewAccount && (
                <Select value={selectedLocalAccount} onValueChange={setSelectedLocalAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${associationType.replace('_', ' ')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(associationType === 'bank_account' ? bankAccounts : creditCards)
                      .filter(account => !account.gocardlessAccountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new"
                  name="accountChoice"
                  checked={createNewAccount}
                  onChange={() => setCreateNewAccount(true)}
                />
                <Label htmlFor="new">Create new account</Label>
              </div>
              
              {createNewAccount && (
                <Input
                  placeholder={`New ${associationType.replace('_', ' ')} name`}
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssociationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={associateAccount} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Associate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 