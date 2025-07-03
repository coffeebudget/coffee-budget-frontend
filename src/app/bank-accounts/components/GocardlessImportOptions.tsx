"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Download,
  Settings,
  Info,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Users,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import React from "react";

interface ImportOptions {
  skipDuplicateCheck?: boolean;
  createPendingForDuplicates?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

interface ImportProgress {
  isImporting: boolean;
  currentStep: string;
  progress: number;
  accountsProcessed: number;
  totalAccounts: number;
  newTransactions: number;
  duplicatesHandled: number;
  pendingDuplicates: number;
  logs: string[];
}

interface ImportResult {
  summary?: {
    totalAccounts?: number;
    totalNewTransactions?: number;
    totalDuplicates?: number;
    totalPendingDuplicates?: number;
    balancesSynchronized?: number;
  };
}

interface GocardlessImportOptionsProps {
  onImport: (options: ImportOptions) => Promise<ImportResult>;
  isImporting?: boolean;
}

export default function GocardlessImportOptions({ onImport, isImporting = false }: GocardlessImportOptionsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [options, setOptions] = useState<ImportOptions>({
    skipDuplicateCheck: false,
    createPendingForDuplicates: true,
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  
  const [progress, setProgress] = useState<ImportProgress>({
    isImporting: false,
    currentStep: '',
    progress: 0,
    accountsProcessed: 0,
    totalAccounts: 0,
    newTransactions: 0,
    duplicatesHandled: 0,
    pendingDuplicates: 0,
    logs: []
  });

  // Update progress state when parent isImporting changes
  useEffect(() => {
    if (isImporting && !progress.isImporting) {
      // Import started
      setProgress(prev => ({
        ...prev,
        isImporting: true,
        currentStep: 'Starting import...',
        progress: 10,
        logs: ['🚀 Import started...']
      }));
      setIsProgressOpen(true);
    } else if (!isImporting && progress.isImporting) {
      // Import finished
      setProgress(prev => ({
        ...prev,
        isImporting: false,
        currentStep: 'Import completed!',
        progress: 100,
        logs: [...prev.logs, '✅ Import completed!']
      }));
    }
  }, [isImporting, progress.isImporting]);

  // Block navigation during import
  const blockNavigation = (e: BeforeUnloadEvent) => {
    if (progress.isImporting) {
      e.preventDefault();
      e.returnValue = 'Import in progress. Are you sure you want to leave?';
    }
  };

  const handleQuickImport = async () => {
    await handleImport({ 
      skipDuplicateCheck: false, 
      createPendingForDuplicates: true,
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    });
  };

  const handleAdvancedImport = async () => {
    setIsAdvancedOpen(false);
    await handleImport(options);
  };

  const handleImport = async (importOptions: ImportOptions) => {
    // Initialize progress
    setProgress({
      isImporting: true,
      currentStep: 'Initializing import...',
      progress: 15,
      accountsProcessed: 0,
      totalAccounts: 0,
      newTransactions: 0,
      duplicatesHandled: 0,
      pendingDuplicates: 0,
      logs: ['🚀 Starting GoCardless import...']
    });
    
    setIsProgressOpen(true);
    
    // Add navigation block
    window.addEventListener('beforeunload', blockNavigation);
    
    try {
      // Update progress for different stages
      setProgress(prev => ({
        ...prev,
        currentStep: 'Fetching connected accounts...',
        progress: 30,
        logs: [...prev.logs, '🔍 Fetching connected accounts...']
      }));

      // Perform actual import
      const startTime = Date.now();
      
      setProgress(prev => ({
        ...prev,
        currentStep: 'Processing transactions...',
        progress: 60,
        logs: [...prev.logs, '📊 Processing transactions and checking duplicates...']
      }));

      const result = await onImport(importOptions);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Update progress with real data from the import result
      setProgress(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'Import completed successfully!',
        isImporting: false,
        accountsProcessed: result?.summary?.totalAccounts || 0,
        totalAccounts: result?.summary?.totalAccounts || 0,
        newTransactions: result?.summary?.totalNewTransactions || 0,
        duplicatesHandled: result?.summary?.totalDuplicates || 0,
        pendingDuplicates: result?.summary?.totalPendingDuplicates || 0,
        logs: [
          ...prev.logs, 
          `✅ Import completed in ${duration}s`,
          `📊 Processed ${result?.summary?.totalAccounts || 0} accounts`,
          `📈 Imported ${result?.summary?.totalNewTransactions || 0} new transactions`,
          ...((result?.summary?.totalPendingDuplicates || 0) > 0 ? [`⏳ Created ${result?.summary?.totalPendingDuplicates} pending duplicates for review`] : []),
          ...((result?.summary?.totalDuplicates || 0) > 0 ? [`🔄 Handled ${result?.summary?.totalDuplicates} duplicates`] : []),
          `💰 Synchronized ${result?.summary?.balancesSynchronized || 0} account balances`
        ]
      }));
      
      // Auto-close after 4 seconds to allow user to see results
      setTimeout(() => {
        setIsProgressOpen(false);
      }, 4000);
      
    } catch (error) {
      console.error('Import failed:', error);
      setProgress(prev => ({
        ...prev,
        isImporting: false,
        currentStep: 'Import failed',
        progress: 0,
        logs: [...prev.logs, `❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
      
      toast.error('Import failed. Please try again.');
    } finally {
      // Remove navigation block
      window.removeEventListener('beforeunload', blockNavigation);
    }
  };

  return (
    <>
      {/* Quick Import Button */}
      <Button 
        onClick={handleQuickImport} 
        className="mr-2"
        disabled={progress.isImporting}
      >
        {progress.isImporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Import Transactions
      </Button>

      {/* Advanced Options Dialog */}
      <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={progress.isImporting}>
            <Settings className="mr-2 h-4 w-4" />
            Advanced Options
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Options</DialogTitle>
            <DialogDescription>
              Configure how duplicates should be handled during import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Date Range Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Periodo di Import</Label>
              <p className="text-sm text-muted-foreground">
                Seleziona il periodo per l&apos;import delle transazioni
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={!options.dateFrom && !options.dateTo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))}
                >
                  Tutto disponibile
                </Button>
                <Button
                  variant={options.dateFrom === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const dateTo = new Date().toISOString().split('T')[0];
                    setOptions(prev => ({ ...prev, dateFrom, dateTo }));
                  }}
                >
                  Ultimi 7 giorni
                </Button>
                <Button
                  variant={options.dateFrom === new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const dateFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const dateTo = new Date().toISOString().split('T')[0];
                    setOptions(prev => ({ ...prev, dateFrom, dateTo }));
                  }}
                >
                  Ultimi 14 giorni
                </Button>
                <Button
                  variant={options.dateFrom === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const dateTo = new Date().toISOString().split('T')[0];
                    setOptions(prev => ({ ...prev, dateFrom, dateTo }));
                  }}
                >
                  Ultimi 30 giorni
                </Button>
                <Button
                  variant={options.dateFrom === new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const dateTo = new Date().toISOString().split('T')[0];
                    setOptions(prev => ({ ...prev, dateFrom, dateTo }));
                  }}
                >
                  Ultimi 90 giorni
                </Button>
              </div>
              
              {options.dateFrom && options.dateTo && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Import dal {options.dateFrom} al {options.dateTo}
                  </p>
                </div>
              )}
            </div>

            {/* Duplicate Handling Options */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-medium">Gestione Duplicati</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="skip-duplicates">Skip Duplicate Check</Label>
                  <p className="text-sm text-muted-foreground">
                    Import all transactions without checking for duplicates
                  </p>
                </div>
                <Switch
                  id="skip-duplicates"
                  checked={options.skipDuplicateCheck}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, skipDuplicateCheck: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="create-pending">Create Pending Duplicates</Label>
                  <p className="text-sm text-muted-foreground">
                    Create pending duplicates for manual review instead of skipping
                  </p>
                </div>
                <Switch
                  id="create-pending"
                  checked={options.createPendingForDuplicates}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, createPendingForDuplicates: checked }))
                  }
                  disabled={options.skipDuplicateCheck}
                />
              </div>
              
              {options.skipDuplicateCheck && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Warning: This will import all transactions, including exact duplicates.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsAdvancedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdvancedImport}>
              <Download className="mr-2 h-4 w-4" />
              Start Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={isProgressOpen} onOpenChange={(open) => {
        // Prevent closing during import
        if (!progress.isImporting) {
          setIsProgressOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {progress.isImporting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-500" />
              ) : progress.progress === 100 ? (
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="mr-2 h-5 w-5 text-red-500" />
              )}
              GoCardless Import
            </DialogTitle>
            <DialogDescription>
              {progress.currentStep}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{progress.accountsProcessed}/{progress.totalAccounts}</p>
                  <p className="text-xs text-muted-foreground">Accounts</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{progress.newTransactions}</p>
                  <p className="text-xs text-muted-foreground">New Transactions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{progress.duplicatesHandled}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">{progress.pendingDuplicates}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </div>
            
            {/* Activity Log */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Activity Log</Label>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {progress.logs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-600 py-0.5">
                    {log}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            {!progress.isImporting && (
              <div className="flex justify-end space-x-2 pt-4">
                {progress.pendingDuplicates > 0 && (
                  <Button variant="outline" onClick={() => {
                    setIsProgressOpen(false);
                    // Navigate to pending duplicates page
                    window.location.href = '/pending-duplicates';
                  }}>
                    Review Duplicates
                  </Button>
                )}
                <Button onClick={() => setIsProgressOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 