import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/organizer/SignOutButton";

export default async function OrganizerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || role !== "ORGANIZER") {
    redirect(`/${params.locale}/auth/login`);
  }

  const base = `/${params.locale}/organizer`;

  return (
    <div className="min-h-screen flex flex-col lg:flex bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
        <Link href={`/${params.locale}`}>
          <h1 className="text-lg font-bold text-orange-400">Ingresso MZ</h1>
        </Link>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - desktop only */}
        <aside className="hidden lg:flex lg:w-60 bg-gray-900 text-white flex-col shrink-0">
          <div className="p-5 border-b border-gray-700">
            <Link href={`/${params.locale}`}>
              <h1 className="text-lg font-bold text-orange-400">Ingresso MZ</h1>
            </Link>
            <p className="text-xs text-gray-400 mt-1">Painel do Organizador</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link
              href={`${base}/dashboard`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              <span>📊</span> Dashboard
            </Link>
            <Link
              href={`${base}/events`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              <span>🎟️</span> Meus Eventos
            </Link>
            <Link
              href={`${base}/events/new`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-orange-400 hover:bg-gray-800 transition-colors"
            >
              <span>+</span> Criar Evento
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-300 font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-gray-500 truncate mb-2">{session.user.email}</p>
            <SignOutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto w-full">{children}</main>
      </div>

      {/* Mobile navigation footer */}
      <nav className="lg:hidden bg-gray-900 text-white border-t border-gray-700 flex justify-around p-3">
        <Link
          href={`${base}/dashboard`}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">📊</span> Dashboard
        </Link>
        <Link
          href={`${base}/events`}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">🎟️</span> Eventos
        </Link>
        <Link
          href={`${base}/events/new`}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs text-orange-400 hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">+</span> Novo
        </Link>
      </nav>
    </div>
  );
}
