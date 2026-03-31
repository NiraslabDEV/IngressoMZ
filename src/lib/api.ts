import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Session = Awaited<ReturnType<typeof auth>>;
type AppUser = { id: string; role: string };

export function getUser(session: Session): AppUser | null {
  if (!session?.user) return null;
  return session.user as AppUser;
}

/** Retorna NextResponse de erro ou null se autorizado */
export function requireRole(
  session: Session,
  role: "ORGANIZER" | "ADMIN"
): NextResponse | null {
  const user = getUser(session);
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.role !== role) return NextResponse.json({ error: "Proibido." }, { status: 403 });
  return null;
}

export const HTML_TAG_RE = /<[^>]*>/;
