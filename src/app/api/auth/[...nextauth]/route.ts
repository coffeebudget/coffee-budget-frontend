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
  callbacks: {
    async jwt({ token, account, profile }) {
  
      if (account?.access_token) {
        token.accessToken = account.access_token; // ✅ Store the correct access token
      }
      return token;
    },
    async session({ session, token }) {
  
      if (session.user && token.sub && token.accessToken) {
        session.user.id = token.sub;
        session.user.accessToken = token.accessToken as string;

        try {
          const userData = await fetchUserByAuth0Id(token.sub as string, token.accessToken as string);
          
          if (!userData) {
            // User doesn't exist, create new user
            const newUser = await createUser(token.sub as string, session.user.email as string, token.accessToken as string);
          } 
        } catch (error) {
          console.error('Error handling user:', error);
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
