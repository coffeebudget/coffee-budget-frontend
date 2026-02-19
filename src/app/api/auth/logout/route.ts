import { NextResponse } from 'next/server';

export async function GET() {
  const issuer = process.env.NEXT_PUBLIC_AUTH0_ISSUER;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const returnTo = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!issuer || !clientId) {
    // Fallback: redirect to home if Auth0 config is missing
    return NextResponse.redirect(new URL('/', returnTo));
  }

  const logoutUrl = new URL(`${issuer}/v2/logout`);
  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('returnTo', returnTo);

  return NextResponse.redirect(logoutUrl.toString());
}
