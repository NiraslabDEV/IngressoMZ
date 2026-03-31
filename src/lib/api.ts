import type { Session } from "next-auth";
import { NextResponse } from "next/server";

export type AuthedSession = Session & { user: { id: string; role: string; name?: string | null; email?: string | null } };

export const HTML_TAG_RE = /<[^>]*>/;

/**
 * Type guard — devolve true se a sessão existe e tem o papel correcto.
 * Após `if (!hasRole(session, "ORGANIZER")) return authError(...)` o TypeScript
 * sabe que `session` é AuthedSession no resto da função.
 */
export function hasRole(
  session: Session | null,
  role: "ORGANIZER" | "ADMIN" | "BUYER"
): session is AuthedSession {
  const user = session?.user as { role?: string } | undefined;
  return !!user?.role && user.role === role;
}

/**
 * Versão imperativa — devolve NextResponse de erro ou null.
 * Usar quando se quer retornar cedo e depois usar session como AuthedSession.
 */
export function requireRole(
  session: Session | null,
  role: "ORGANIZER" | "ADMIN"
): NextResponse | null {
  if (!hasRole(session, role)) {
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }
  return null;
}
