import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST endpoint to synchronize all connected account balances
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = session.user.accessToken;
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gocardless/sync-balances`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to sync balances:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to sync balances" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in sync balances API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 