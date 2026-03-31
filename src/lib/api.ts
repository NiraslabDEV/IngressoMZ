import type { Session } from "next-auth";
import { NextResponse } from "next/server";

// Re-exportado para compatibilidade com routes existentes
export type AuthedSession = Session;

export const HTML_TAG_RE = /<[^>]*>/;

/** Retorna NextResponse de erro ou null se autorizado */
export function requireRole(
  session: Session | null,
  role: "ORGANIZER" | "ADMIN"
): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.role !== role) {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }
  return null;
}
