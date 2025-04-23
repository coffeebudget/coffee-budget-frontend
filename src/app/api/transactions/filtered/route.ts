import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/transactions/filtered - Filter transactions with complex parameters
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const filters = await request.json();
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.categoryIds?.length) params.append('categoryIds', filters.categoryIds.join(','));
    if (filters.tagIds?.length) params.append('tagIds', filters.tagIds.join(','));
    if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.orderBy) params.append('orderBy', filters.orderBy);
    if (filters.orderDirection) params.append('orderDirection', filters.orderDirection);
    if (filters.uncategorizedOnly) params.append('uncategorizedOnly', 'true');
    
    console.log(`Making filtered API request with params: ${params.toString()}`);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/transactions?${params.toString()}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`❌ Fetch Filtered Transactions Failed: ${response.status} - ${errorMessage}`);
      return NextResponse.json(
        { error: `Failed to fetch filtered transactions: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in filtered transactions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add the DELETE method for bulk deletion of transactions
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = session.user.accessToken;
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Expected transaction ids array" },
        { status: 400 }
      );
    }
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/transactions/bulk-delete`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction_ids: ids }),
    });
    
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error(`❌ Bulk Delete Transactions Failed: ${response.status} - ${errorMessage}`);
      return NextResponse.json(
        { error: `Failed to delete transactions: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true, message: `${ids.length} transactions deleted` });
  } catch (error) {
    console.error("Error in bulk delete transactions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 