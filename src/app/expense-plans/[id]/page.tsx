import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ExpensePlanDetailView } from './components/ExpensePlanDetailView';

export default async function ExpensePlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const { id: idParam } = await params;
  const id = parseInt(idParam);

  if (isNaN(id)) {
    redirect('/expense-plans');
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/expense-plans">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expense Plans
          </Button>
        </Link>
      </div>

      <ExpensePlanDetailView id={id} />
    </div>
  );
}
