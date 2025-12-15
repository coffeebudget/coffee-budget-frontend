import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to search transactions for reconciliation with a payment activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid payment activity ID" },
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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm');

    // Build backend URL with query params
    const backendUrl = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/payment-activities/${id}/search-transactions`
    );
    if (searchTerm) {
      backendUrl.searchParams.append('searchTerm', searchTerm);
    }

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to search transactions for activity ${id}:`, errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to search transactions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in payment-activities/[id]/search-transactions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
