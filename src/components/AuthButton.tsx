"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        onClick={() => signIn("auth0")}
      >
        Login with Auth0
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p>Welcome, {session.user?.name}</p>
      <p className="text-sm text-gray-500">
        Role: {session.user?.roles ? session.user.roles.join(", ") : "No role assigned"}
      </p>
      <button
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
        onClick={() => signOut()}
      >
        Logout
      </button>
    </div>
  );
}
