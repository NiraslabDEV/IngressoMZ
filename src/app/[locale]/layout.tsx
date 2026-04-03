import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { Providers } from "@/components/Providers";
import { InstallButton } from "@/components/InstallButton";
import "../globals.css";

export const metadata: Metadata = {
  title: "Ingresso MZ — Eventos em Moçambique",
  description: "Compra os teus ingressos para os melhores eventos em Moçambique.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ingresso MZ",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
  themeColor: "#000000",
};

const locales = ["pt", "en"];

async function Navbar({ locale }: { locale: string }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="text-xl font-bold text-white hover:text-blue-400 hover:scale-105 transition-all"
        >
          Ingresso MZ
        </Link>

        <nav className="flex items-center gap-6">
          {session?.user ? (
            <>
              <InstallButton />
              {role === "ORGANIZER" && (
                <>
                  <Link
                    href={`/${locale}/organizer/dashboard`}
                    className="text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200"
                  >
                    Painel
                  </Link>
                  <Link
                    href={`/${locale}/buyer/tickets`}
                    className="text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200"
                  >
                    Meus Ingressos
                  </Link>
                </>
              )}
              {role === "BUYER" && (
                <Link
                  href={`/${locale}/buyer/tickets`}
                  className="text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200"
                >
                  Meus Ingressos
                </Link>
              )}
              <UserMenu
                name={session.user.name ?? "Utilizador"}
                email={session.user.email ?? ""}
                locale={locale}
              />
            </>
          ) : (
            <>
              <InstallButton />
              <Link
                href={`/${locale}/auth/login`}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
              >
                Entrar
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="bg-blue-400 hover:bg-blue-300 text-black font-semibold px-5 py-2 rounded-full transition-colors duration-200"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar locale={locale} />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
