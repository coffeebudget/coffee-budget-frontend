import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST endpoint to start the bank connection flow
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
    const flowData = await request.json();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gocardless/flow/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flowData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to start GoCardless flow:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to start GoCardless flow" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GoCardless flow start API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 