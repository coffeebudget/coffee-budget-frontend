'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';
import type { PaymentActivity } from '@/types/payment-types';
import { getStatusBadgeColor, getStatusLabel } from '@/types/payment-types';

interface PaymentActivityCardProps {
  activity: PaymentActivity;
  onReconcile?: (activity: PaymentActivity) => void;
}

export function PaymentActivityCard({ activity, onReconcile }: PaymentActivityCardProps) {
  const canReconcile = activity.reconciliationStatus === 'pending' || activity.reconciliationStatus === 'failed';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">
              {activity.merchantName || activity.description || 'Payment Activity'}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(activity.reconciliationStatus)}`}
            >
              {getStatusLabel(activity.reconciliationStatus)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Date:</span>{' '}
              {new Date(activity.executionDate).toLocaleDateString()}
            </div>
            {activity.merchantCategory && (
              <div>
                <span className="font-medium">Category:</span> {activity.merchantCategory}
              </div>
            )}
            {activity.reconciliationConfidence !== undefined && activity.reconciliationConfidence !== null && (
              <div>
                <span className="font-medium">Confidence:</span> {activity.reconciliationConfidence}%
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-sm text-gray-500 mt-2">{activity.description}</p>
          )}
        </div>

        <div className="flex flex-col items-end ml-4 gap-2">
          <p
            className={`text-2xl font-bold ${activity.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            {activity.amount < 0 ? '-' : '+'}€{Math.abs(activity.amount).toFixed(2)}
          </p>

          {canReconcile && onReconcile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReconcile(activity)}
              className="flex items-center gap-1"
            >
              <Link2 className="h-3 w-3" />
              Reconcile
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
