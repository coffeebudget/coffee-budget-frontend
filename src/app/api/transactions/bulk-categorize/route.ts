import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = session.user.accessToken;
    const { transactionIds, categoryId } = await request.json();

    if (!transactionIds || !Array.isArray(transactionIds) || !categoryId) {
      return NextResponse.json(
        { error: "Invalid request. Expected transactionIds array and categoryId" },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-categorize`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transaction_ids: transactionIds,
        category_id: categoryId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error categorizing transactions:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Error categorizing transactions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in bulk-categorize API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 