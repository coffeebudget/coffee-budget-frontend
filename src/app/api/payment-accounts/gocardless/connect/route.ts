import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    console.log('Session in GoCardless connect:', {
      hasSession: !!session,
      hasAccessToken: !!session?.user?.accessToken,
      userEmail: session?.user?.email
    });

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { message: 'Unauthorized - Please sign out and sign back in to refresh your session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentAccountId, institutionId, redirectUrl } = body;

    if (!paymentAccountId || !institutionId || !redirectUrl) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payment-accounts/gocardless/connect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({
          paymentAccountId,
          institutionId,
          redirectUrl,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Failed to initiate GoCardless connection' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GoCardless connect proxy:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
