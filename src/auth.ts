import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

function getAdminCredentials() {
  const email = process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.AUTH_ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const admin = getAdminCredentials();
        if (!admin) {
          console.error(
            "Auth: faltan AUTH_ADMIN_EMAIL o AUTH_ADMIN_PASSWORD en variables de entorno"
          );
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        if (email !== admin.email || password !== admin.password) {
          return null;
        }

        return {
          id: "admin",
          email: admin.email,
          name: admin.email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
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
});
