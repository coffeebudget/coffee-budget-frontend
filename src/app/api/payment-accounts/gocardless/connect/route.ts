import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST endpoint to initiate GoCardless connection for a payment account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = session.user.accessToken;
    const connectionRequest = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payment-accounts/gocardless/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(connectionRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to initiate GoCardless connection:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to initiate GoCardless connection" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in payment-accounts/gocardless/connect API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
