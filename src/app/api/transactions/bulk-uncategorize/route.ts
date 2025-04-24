import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    const requestData = await request.json();
    console.log("Received request data:", JSON.stringify(requestData));
    
    const { transactionIds } = requestData;
    console.log("Transaction IDs:", transactionIds);

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      console.log("Invalid transaction IDs:", transactionIds);
      return NextResponse.json(
        { error: "Transaction IDs must be provided as a non-empty array" },
        { status: 400 }
      );
    }

    // Convert transactionIds to numbers if they're strings
    const numericTransactionIds = transactionIds.map(id => 
      typeof id === 'string' ? parseInt(id, 10) : id
    );

    // Format the request body to match the backend DTO
    const requestBody = { 
      transaction_ids: numericTransactionIds 
    };
    console.log("Sending request to backend:", JSON.stringify(requestBody));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-uncategorize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to bulk uncategorize transactions:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to bulk uncategorize transactions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in bulk-uncategorize API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 