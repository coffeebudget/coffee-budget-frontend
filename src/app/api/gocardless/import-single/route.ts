import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/gocardless/import-single - Import transactions from a single GoCardless account
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const { accountId, bankAccountId, creditCardId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: "GoCardless account ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Importing transactions for single account: ${accountId}`);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/transactions/import/gocardless`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        bankAccountId,
        creditCardId,
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`❌ Single Account Import Failed: ${response.status} - ${errorMessage}`);
      return NextResponse.json(
        { error: `Failed to import transactions: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in single account import API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 