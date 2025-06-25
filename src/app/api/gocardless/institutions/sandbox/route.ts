import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to fetch sandbox institutions including Sandbox Finance
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Return the sandbox institution directly
    // According to GoCardless docs, use SANDBOXFINANCE_SFIN0000 as institution_id
    const sandboxInstitutions = [
      {
        id: "SANDBOXFINANCE_SFIN0000",
        name: "Sandbox Finance",
        bic: "SFIN0000",
        transaction_total_days: "90",
        countries: ["GB"],
        logo: "https://cdn.gocardless.com/institutions/SANDBOXFINANCE_SFIN0000.png"
      }
    ];

    return NextResponse.json(sandboxInstitutions);
  } catch (error) {
    console.error("Error in sandbox institutions API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 