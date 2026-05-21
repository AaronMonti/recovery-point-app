import type { NextAuthConfig } from "next-auth";

/**
 * Config compatible con Edge (middleware en Vercel).
 * Los providers viven solo en auth.ts — no importarlos aquí.
 */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (!isLoggedIn && !isLoginPage) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
