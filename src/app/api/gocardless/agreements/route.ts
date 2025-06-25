import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST endpoint to create end user agreement
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
    const agreementData = await request.json();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gocardless/agreements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agreementData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to create agreement:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create agreement" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in agreements API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 