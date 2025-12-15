import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PATCH endpoint to update reconciliation for a payment activity
export async function PATCH(
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
    const reconciliationData = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payment-activities/${id}/reconciliation`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reconciliationData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to update reconciliation for activity ${id}:`, errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to update reconciliation" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in payment-activities/[id]/reconciliation API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
