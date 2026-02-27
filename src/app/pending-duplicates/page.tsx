"use client";

import { useSession } from "next-auth/react";
import { AlertTriangleIcon } from "lucide-react";
import DuplicatesPanel from "@/app/transactions/components/DuplicatesPanel";
import PageLayout from "@/components/layout/PageLayout";

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
    <PageLayout
      title="Pending Duplicates"
      description="Review and resolve potential duplicate transactions detected in your account."
      icon={AlertTriangleIcon}
    >
      <DuplicatesPanel />
    </PageLayout>
  );
}
