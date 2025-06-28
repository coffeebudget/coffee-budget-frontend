import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/gocardless/import/all - Import transactions from all connected GoCardless accounts
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    
    // Parse request body for duplicate handling options
    let options = {};
    try {
      const body = await request.json();
      options = body || {};
    } catch (error) {
      // If no body or invalid JSON, use empty options
      options = {};
    }
    
    console.log('Starting bulk GoCardless import with options:', options);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/gocardless/import/all`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`❌ Bulk Import Failed: ${response.status} - ${errorMessage}`);
      return NextResponse.json(
        { error: `Failed to import transactions: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Bulk import completed:', data.summary);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in bulk import API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 