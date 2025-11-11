import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { SyncHistoryList } from '@/components/sync-history/SyncHistoryList';
import { SyncStatisticsCard } from '@/components/sync-history/SyncStatisticsCard';

export default async function SyncHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Sync History</h1>

      <div className="space-y-6">
        <SyncStatisticsCard />
        <SyncHistoryList />
      </div>
    </div>
  );
}
