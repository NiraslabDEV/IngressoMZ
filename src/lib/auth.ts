import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";


const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
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
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Login com credentials — id já é o UUID do Prisma
        if (!account || account.provider === "credentials") {
          token.id = user.id as string;
          token.role = (user as unknown as { role: string }).role;
        } else {
          // Login social (Google, etc.) — criar ou recuperar utilizador no Prisma
          const email = user.email ?? (token.email as string | undefined);
          if (email) {
            const dbUser = await db.user.upsert({
              where: { email },
              update: {},
              create: {
                email,
                name: user.name ?? email.split("@")[0],
                role: "BUYER",
              },
            });
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }

      // Fallback: se token.id não for UUID válido (ex: sub Google em sessões antigas)
      // re-busca o utilizador na DB pelo email
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.id ?? "");
      if (!isUUID && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
