import { Badge } from '@/components/ui/badge';
import { SyncStatus } from '@/types/sync-history';

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const variants: Record<SyncStatus, string> = {
    [SyncStatus.SUCCESS]: 'bg-green-100 text-green-800',
    [SyncStatus.PARTIAL]: 'bg-yellow-100 text-yellow-800',
    [SyncStatus.FAILED]: 'bg-red-100 text-red-800',
  };

  const labels: Record<SyncStatus, string> = {
    [SyncStatus.SUCCESS]: 'Success',
    [SyncStatus.PARTIAL]: 'Partial',
    [SyncStatus.FAILED]: 'Failed',
  };

  return <Badge className={variants[status]}>{labels[status]}</Badge>;
}
