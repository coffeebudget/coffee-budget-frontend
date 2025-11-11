import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { SyncDetailView } from '@/components/sync-history/SyncDetailView';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SyncDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const id = parseInt(params.id);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/sync-history">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sync History
          </Button>
        </Link>
      </div>

      <SyncDetailView id={id} />
    </div>
  );
}
