import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/transactions - Fetch all transactions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    
    // Get URL parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Forward the request to the backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    console.log(`Making API request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`❌ Fetch Transactions Failed: ${response.status} - ${errorMessage}`);
      return NextResponse.json(
        { error: `Failed to fetch transactions: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in transactions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const transactionData = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to create transaction: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in transactions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 