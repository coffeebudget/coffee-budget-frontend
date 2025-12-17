import NextAuth, { NextAuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";
import { fetchUserByAuth0Id, createUser } from "@/utils/api"; // Import the utility functions

// Extend the User type to include 'id' and 'accessToken'
declare module "next-auth" {
  interface User {
    id: string;
    accessToken?: string;
  }
  interface Session {
    user: User;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_AUTH0_ISSUER!,
      authorization: {
        url: `${process.env.NEXT_PUBLIC_AUTH0_ISSUER}/authorize`,
        params: {
          scope: "openid profile email read:transactions write:transactions delete:transactions",
          audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // On initial sign-in, account will be present and we save the access token
      if (account?.access_token) {
        console.log('✅ Saving access_token to JWT token');
        token.accessToken = account.access_token;

        // Fetch or create user ONLY on initial sign-in (when account is present)
        try {
          const userData = await fetchUserByAuth0Id(token.sub as string, account.access_token);

          if (!userData) {
            // User doesn't exist, create new user
            await createUser(token.sub as string, user?.email as string || '', account.access_token);
            console.log('✅ New user created on initial sign-in');
          } else {
            console.log('✅ Existing user found on initial sign-in');
          }
        } catch (error) {
          console.error('Error fetching/creating user on sign-in:', error);
          // Continue anyway - user will be created on first API call if needed
        }
      }
      // On subsequent calls, the token already has accessToken, so we just return it
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.accessToken) {
        session.user.id = token.sub;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
