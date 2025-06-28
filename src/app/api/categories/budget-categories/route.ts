import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching budget categories from backend...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/budget-categories`, {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Budget categories fetched successfully, count:', data.length);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in budget-categories API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 