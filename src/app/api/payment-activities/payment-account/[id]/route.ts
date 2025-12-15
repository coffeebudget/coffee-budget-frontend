import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to fetch payment activities for a payment account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid payment account ID" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = session.user.accessToken;

    // Build query params from URL search params
    const searchParams = request.nextUrl.searchParams;
    const queryParams = new URLSearchParams();

    // Forward filter params
    ['reconciliationStatus', 'activityType', 'startDate', 'endDate', 'searchTerm'].forEach(param => {
      const value = searchParams.get(param);
      if (value) queryParams.append(param, value);
    });

    const url = `${process.env.NEXT_PUBLIC_API_URL}/payment-activities/payment-account/${id}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to fetch payment activities for account ${id}:`, errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch payment activities" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in payment-activities/payment-account/[id] API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
