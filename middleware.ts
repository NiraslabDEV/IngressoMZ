import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["pt", "en"],
  defaultLocale: "pt",
});

const ORGANIZER_PATHS = ["/organizer"];
const BUYER_PATHS = ["/buyer"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const pathWithoutLocale = pathname.replace(/^\/(pt|en)/, "") || "/";
  const isOrganizerPath = ORGANIZER_PATHS.some((p) => pathWithoutLocale.startsWith(p));
  const isBuyerPath = BUYER_PATHS.some((p) => pathWithoutLocale.startsWith(p));

  if (isOrganizerPath || isBuyerPath) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);

    if (!token) return NextResponse.redirect(loginUrl);

    if (isOrganizerPath && token.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Proibido." }, { status: 403 });
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
