import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/api/auth");
      if (isAuthRoute) return true;
      return isLoggedIn;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      if (token.picture !== undefined)
        session.user.image = token.picture ?? null;
      if (token.name) session.user.name = token.name as string;
      return session;
    },
  },
};
