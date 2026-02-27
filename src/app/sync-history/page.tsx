import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { History } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { SyncHistoryPageClient } from '@/components/sync-history/SyncHistoryPageClient';

export default async function SyncHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  return (
    <PageLayout
      title="Sync History"
      description="Review past synchronization runs and their results."
      icon={History}
    >
      <SyncHistoryPageClient />
    </PageLayout>
  );
}
