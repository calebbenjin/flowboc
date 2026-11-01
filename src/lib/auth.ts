import NextAuth from "next-auth";
import { SESSION_MAX_AGE_SECONDS, sessionIdleExpired } from "@/lib/session-policy";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/auth" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.["email"];
        const password = credentials?.["password"];
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        });
        // No hashedPassword means this account was created via Google
        // sign-in and never set a password.
        if (!user || !user.emailVerifiedAt || !user.hashedPassword) return null;

        const passwordMatches = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatches) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    Google,
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (!user && sessionIdleExpired(token)) return null;
      // Google already verifies the email, so this skips the OTP flow
      // entirely — find-or-create the User row directly rather than going
      // through src/app/auth/actions.ts's signUp/verifyOtp pair.
      if (account?.provider === "google") {
        const email = user?.email?.trim().toLowerCase();
        if (!email) return token;

        const existing = await prisma.user.findUnique({ where: { email } });
        const dbUser = existing
          ? existing.emailVerifiedAt
            ? existing
            : await prisma.user.update({
                where: { id: existing.id },
                data: { emailVerifiedAt: new Date() },
              })
          : await prisma.user.create({
              data: {
                email,
                name: user?.name ?? email,
                emailVerifiedAt: new Date(),
                termsAcceptedAt: new Date(),
              },
            });

        token["userId"] = dbUser.id;
        token["role"] = dbUser.role;
        return token;
      }

      if (user?.id) token["userId"] = user.id;
      if (user && "role" in user) token["role"] = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token["userId"] === "string") {
        session.user.id = token["userId"];
      }
      if (session.user && typeof token["role"] === "string") {
        session.user.role = token["role"] as Role;
      }
      return session;
    },
  },
});
