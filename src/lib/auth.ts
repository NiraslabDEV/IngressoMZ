import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
  ...(process.env.APPLE_CLIENT_ID
    ? [
        Apple({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
        }),
      ]
    : []),
  Credentials({
    credentials: {
      email: { type: "email" },
      password: { type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await db.user.findUnique({
        where: { email: parsed.data.email },
      });

      // Mensagem genérica — nunca diferenciar "email não existe" de "senha errada"
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sem PrismaAdapter — sessões guardadas em JWT (mais simples e sem dependência de DB no build)
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt" },
});
