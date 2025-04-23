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
    const { transactionIds, tagIds } = await request.json();

    if (!transactionIds || !Array.isArray(transactionIds) || !tagIds || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "Invalid request. Expected transactionIds and tagIds arrays" },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-tag`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transaction_ids: transactionIds,
        tag_ids: tagIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error tagging transactions:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Error tagging transactions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in bulk-tag API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 