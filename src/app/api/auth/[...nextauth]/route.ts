export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handler(req: Request) {
  const { default: NextAuth } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  return NextAuth(authOptions)(req as any, undefined as any);
}

export { handler as GET, handler as POST };
