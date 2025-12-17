'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PaymentGocardlessCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const requisitionId = searchParams.get('ref');
    const error = searchParams.get('error');

    if (window.opener) {
      if (error) {
        window.opener.postMessage(
          {
            type: 'GOCARDLESS_ERROR',
            data: { error: decodeURIComponent(error) },
          },
          window.location.origin
        );
      } else if (requisitionId) {
        window.opener.postMessage(
          {
            type: 'GOCARDLESS_SUCCESS',
            data: { requisitionId },
          },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          {
            type: 'GOCARDLESS_CANCELLED',
            data: {},
          },
          window.location.origin
        );
      }

      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // If no opener, redirect to payment accounts page
      window.location.href = '/payment-accounts';
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Completing Connection
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we finalize your GoCardless connection...
        </p>
      </div>
    </div>
  );
}
