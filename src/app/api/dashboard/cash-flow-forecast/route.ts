import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'historical'; // 'historical' | 'recurring'
  const months = searchParams.get('months') || '24';

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/cash-flow-forecast?mode=${mode}&months=${months}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Cash flow forecast API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash flow forecast' },
      { status: 500 }
    );
  }
} 