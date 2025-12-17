import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    console.log('Session in GoCardless callback:', {
      hasSession: !!session,
      hasAccessToken: !!session?.user?.accessToken,
      userEmail: session?.user?.email
    });

    if (!session?.user?.accessToken) {
      console.error('No access token in session');
      return NextResponse.json(
        { message: 'Unauthorized - Please sign out and sign back in to refresh your session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentAccountId, requisitionId } = body;

    console.log('Callback request:', { paymentAccountId, requisitionId });

    if (!paymentAccountId || !requisitionId) {
      console.error('Missing required fields:', { paymentAccountId, requisitionId });
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/payment-accounts/gocardless/callback`;
    console.log('Calling backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.user.accessToken}`,
      },
      body: JSON.stringify({
        paymentAccountId,
        requisitionId,
      }),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Failed to complete GoCardless connection' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Callback completed successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GoCardless callback proxy:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
