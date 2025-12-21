'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import type { PaymentActivity } from '@/types/payment-types';
import { PaymentActivityCard } from './PaymentActivityCard';

interface PaymentActivityListProps {
  activities: PaymentActivity[];
  isLoading: boolean;
  onReconcile?: (activity: PaymentActivity) => void;
  onImport?: () => void;
}

export function PaymentActivityList({
  activities,
  isLoading,
  onReconcile,
  onImport,
}: PaymentActivityListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading payment activities...</span>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No payment activities found.</p>
        {onImport && (
          <Button onClick={onImport} className="mt-4">
            <Download className="h-4 w-4 mr-2" />
            Import Activities
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <PaymentActivityCard
          key={activity.id}
          activity={activity}
          onReconcile={onReconcile}
        />
      ))}
    </div>
  );
}
