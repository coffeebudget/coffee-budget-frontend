'use client';

import type { ReconciliationStats } from '@/types/payment-types';

interface ReconciliationStatsCardProps {
  stats: ReconciliationStats;
}

export function ReconciliationStatsCard({ stats }: ReconciliationStatsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Total</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-yellow-50 p-3 rounded-lg">
        <p className="text-sm text-yellow-700">Pending</p>
        <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="text-sm text-green-700">Reconciled</p>
        <p className="text-2xl font-bold text-green-900">{stats.reconciled}</p>
      </div>
      <div className="bg-red-50 p-3 rounded-lg">
        <p className="text-sm text-red-700">Failed</p>
        <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
      </div>
    </div>
  );
}
