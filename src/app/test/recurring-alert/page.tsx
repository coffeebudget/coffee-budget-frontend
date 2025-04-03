'use client';

import React, { useEffect, useState } from 'react';
import RecurringTransactionAlert from '@/app/dashboard/components/RecurringTransactionAlert';
import { mockUnconfirmedPatterns, mockLinkedTransactions } from '@/mocks/recurringPatternsMock';
import * as api from '@/utils/api';

// Create a mock version of the component that uses the mock data
export default function TestRecurringAlert() {
  const [isMocked, setIsMocked] = useState(false);

  useEffect(() => {
    // Store original functions
    const originalFetchUnconfirmedPatterns = api.fetchUnconfirmedPatterns;
    const originalGetLinkedTransactions = api.getLinkedTransactions;
    const originalConfirmPattern = api.confirmPattern;
    const originalUnlinkFromRecurringTransaction = api.unlinkFromRecurringTransaction;
    const originalAdjustPattern = api.adjustPattern;

    // Override with mock implementations using monkey patching
    Object.defineProperty(api, 'fetchUnconfirmedPatterns', {
      value: async () => mockUnconfirmedPatterns,
      writable: true
    });
    
    Object.defineProperty(api, 'getLinkedTransactions', {
      value: async () => mockLinkedTransactions,
      writable: true
    });
    
    Object.defineProperty(api, 'confirmPattern', {
      value: async () => ({ success: true }),
      writable: true
    });
    
    Object.defineProperty(api, 'unlinkFromRecurringTransaction', {
      value: async () => ({ success: true }),
      writable: true
    });
    
    Object.defineProperty(api, 'adjustPattern', {
      value: async () => ({ success: true }),
      writable: true
    });

    setIsMocked(true);

    // Cleanup function
    return () => {
      Object.defineProperty(api, 'fetchUnconfirmedPatterns', {
        value: originalFetchUnconfirmedPatterns,
        writable: true
      });
      Object.defineProperty(api, 'getLinkedTransactions', {
        value: originalGetLinkedTransactions,
        writable: true
      });
      Object.defineProperty(api, 'confirmPattern', {
        value: originalConfirmPattern,
        writable: true
      });
      Object.defineProperty(api, 'unlinkFromRecurringTransaction', {
        value: originalUnlinkFromRecurringTransaction,
        writable: true
      });
      Object.defineProperty(api, 'adjustPattern', {
        value: originalAdjustPattern,
        writable: true
      });
    };
  }, []);

  if (!isMocked) {
    return <div>Loading mocks...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Recurring Transaction Alert</h1>
      <RecurringTransactionAlert />
    </div>
  );
} 