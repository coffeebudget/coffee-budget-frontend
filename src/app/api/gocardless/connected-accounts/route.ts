import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to fetch all connected GoCardless accounts
export async function GET() {
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
      `${process.env.NEXT_PUBLIC_API_URL}/gocardless/connected-accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to fetch connected accounts:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch connected accounts" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in connected accounts API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 