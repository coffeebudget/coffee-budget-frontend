"use client";

import { useSession } from "next-auth/react";
import { AlertTriangleIcon } from "lucide-react";
import DuplicatesPanel from "@/app/transactions/components/DuplicatesPanel";

export default function PendingDuplicatesPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500">Please log in to manage pending duplicates.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-800">Pending Duplicates</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          Review and resolve potential duplicate transactions detected in your account.
        </p>
      </div>
      <div className="max-w-7xl mx-auto">
        <DuplicatesPanel />
      </div>
    </div>
  );
}
