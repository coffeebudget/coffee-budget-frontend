"use client";

import { useSession } from "next-auth/react";

export default function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session || !session.user.roles?.includes(role)) {
    return <p>Access Denied</p>;
  }

  return <>{children}</>;
}
