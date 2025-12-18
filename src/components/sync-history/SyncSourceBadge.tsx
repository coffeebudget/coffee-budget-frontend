import { Badge } from '@/components/ui/badge';
import { SyncSource } from '@/types/sync-history';
import { Landmark, CreditCard, Wallet, Building2, Upload } from 'lucide-react';

interface SyncSourceBadgeProps {
  source: SyncSource;
  className?: string;
}

export function SyncSourceBadge({ source, className }: SyncSourceBadgeProps) {
  const variants: Record<SyncSource, string> = {
    [SyncSource.GOCARDLESS]: 'bg-blue-100 text-blue-800',
    [SyncSource.PAYPAL]: 'bg-indigo-100 text-indigo-800',
    [SyncSource.STRIPE]: 'bg-purple-100 text-purple-800',
    [SyncSource.PLAID]: 'bg-teal-100 text-teal-800',
    [SyncSource.MANUAL]: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<SyncSource, string> = {
    [SyncSource.GOCARDLESS]: 'GoCardless',
    [SyncSource.PAYPAL]: 'PayPal',
    [SyncSource.STRIPE]: 'Stripe',
    [SyncSource.PLAID]: 'Plaid',
    [SyncSource.MANUAL]: 'Manual',
  };

  const icons: Record<SyncSource, React.ReactNode> = {
    [SyncSource.GOCARDLESS]: <Landmark className="h-3 w-3 mr-1" />,
    [SyncSource.PAYPAL]: <Wallet className="h-3 w-3 mr-1" />,
    [SyncSource.STRIPE]: <CreditCard className="h-3 w-3 mr-1" />,
    [SyncSource.PLAID]: <Building2 className="h-3 w-3 mr-1" />,
    [SyncSource.MANUAL]: <Upload className="h-3 w-3 mr-1" />,
  };

  return (
    <Badge className={`${variants[source]} ${className || ''}`}>
      <span className="flex items-center">
        {icons[source]}
        {labels[source]}
      </span>
    </Badge>
  );
}
