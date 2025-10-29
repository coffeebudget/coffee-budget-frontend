// app/recurring-transactions/[id]/edit/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRecurringTransactionById } from '@/utils/api';
import EditRecurringTransactionForm from '@/app/recurring-transactions/components/EditRecurringTransactionForm';

export default async function EditRecurringTransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idString } = await params;
    const id = Number(idString); // 🔍 ensures we parse only once
  
    const session = await getServerSession(authOptions);
    const token = session?.user?.accessToken;
  
    if (!token) {
      return <div className="p-6">Unauthorized</div>;
    }
  
    const recurringTransaction = await getRecurringTransactionById(token, id);
  
    if (!recurringTransaction) {
      return <div className="p-6">Recurring transaction not found.</div>;
    }
  
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Edit Recurring Transaction</h1>
        <EditRecurringTransactionForm
          token={token}
          recurringTransaction={recurringTransaction}
        />
      </div>
    );
  }
  
