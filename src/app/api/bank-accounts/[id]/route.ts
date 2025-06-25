import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to fetch a single bank account by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid bank account ID" },
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
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to fetch bank account ${id}:`, errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch bank account" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in bank-accounts/[id] API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update bank account (e.g., associate with GoCardless)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = session.user.accessToken;
    const accountId = params.id;
    const body = await request.json();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts/${accountId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to update bank account:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to update bank account" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in bank account update API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a bank account by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid bank account ID" },
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
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bank-accounts/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to delete bank account ${id}:`, errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to delete bank account" },
        { status: response.status }
      );
    }

    // For successful deletion, return a 204 No Content response or simple success message
    return NextResponse.json({ message: "Bank account deleted successfully" });
  } catch (error) {
    console.error("Error in bank-accounts/[id] API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 