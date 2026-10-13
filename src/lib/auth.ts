import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
        if (!user || !user.emailVerifiedAt) return null;

        const passwordMatches = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordMatches) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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
