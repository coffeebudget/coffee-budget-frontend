'use client';

import { useState } from 'react';
import { SyncHistoryList } from './SyncHistoryList';
import { SyncStatisticsCard } from './SyncStatisticsCard';
import { SyncSource } from '@/types/sync-history';

export function SyncHistoryPageClient() {
  const [sourceFilter, setSourceFilter] = useState<SyncSource | undefined>();

  return (
    <div className="space-y-6">
      <SyncStatisticsCard source={sourceFilter} />
      <SyncHistoryList
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
      />
    </div>
  );
}
