import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/transactions/paypal-enrich - Enrich transactions with PayPal data
export async function POST(request: Request) {
  try {
    console.log("PayPal enrichment API route called");
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      console.log("PayPal enrichment: Unauthorized - no valid session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const enrichmentData = await request.json();
    
    console.log("PayPal enrichment: received data", { 
      dateRangeForMatching: enrichmentData.dateRangeForMatching,
      csvDataLength: enrichmentData.csvData?.length || 0
    });
    
    // Log the first few lines of the CSV for debugging
    if (enrichmentData.csvData) {
      const firstFewLines = enrichmentData.csvData.split('\n').slice(0, 3).join('\n');
      console.log('First few lines of PayPal CSV:', firstFewLines);
    }
    
    console.log(`PayPal enrichment: Calling backend API at ${process.env.NEXT_PUBLIC_API_URL}/transactions/paypal-enrich`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/paypal-enrich`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(enrichmentData),
    });
    
    console.log(`PayPal enrichment: Backend API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch((e) => {
        console.error("Failed to parse error response:", e);
        return null;
      });
      console.error("PayPal enrichment: Backend API error", errorData);
      return NextResponse.json(
        { error: errorData?.message || "Failed to enrich transactions with PayPal data" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log("PayPal enrichment: Success", {
      count: data.count,
      message: data.message
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PayPal enrichment API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 