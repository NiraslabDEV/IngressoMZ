import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["pt", "en"],
  defaultLocale: "pt",
});

const ORGANIZER_PATHS = ["/organizer"];
const BUYER_PATHS = ["/buyer"];
const AUTH_PATHS = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Remove locale prefix para checar rota
  const pathWithoutLocale = pathname.replace(/^\/(pt|en)/, "") || "/";

  const isOrganizerPath = ORGANIZER_PATHS.some((p) => pathWithoutLocale.startsWith(p));
  const isBuyerPath = BUYER_PATHS.some((p) => pathWithoutLocale.startsWith(p));

  // Rota de organizador sem sessão → redireciona para login
  if (isOrganizerPath && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Rota de organizador com sessão mas role errado → 403
  if (isOrganizerPath && session?.user && (session.user as any).role !== "ORGANIZER") {
    return NextResponse.json({ error: "Proibido." }, { status: 403 });
  }

  // Rota de comprador sem sessão → redireciona para login
  if (isBuyerPath && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req as any);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
