import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to fetch institutions by country
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = session.user.accessToken;
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'IT';
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/gocardless/institutions?country=${country}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to fetch institutions:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch institutions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in institutions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 