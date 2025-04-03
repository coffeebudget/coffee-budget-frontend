"use client";

import { useSession } from "next-auth/react"; // ✅ Import useSession from next-auth
import AuthButton from "@/components/AuthButton";

export default function Home() {
  const { data: session } = useSession(); 
  const token = session?.user?.accessToken || "";


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-500 mb-4">Coffee Budget 🚀</h1>
      <AuthButton />

      <h1>Create Dashboard here</h1>
    </div>
  );
}
