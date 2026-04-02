"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type Role = "BUYER" | "ORGANIZER";
type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const isOrganizerSetup = searchParams.get("msg") === "organizer";

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultCallback = role === "ORGANIZER"
    ? `/${locale}/organizer/dashboard`
    : `/${locale}/buyer/tickets`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Erro ao criar conta.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(mode === "login" ? "Email ou palavra-passe incorrectos." : "Conta criada, mas erro ao entrar. Tenta fazer login.");
        return;
      }

      router.push(callbackUrl ?? defaultCallback);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    const cb = role === "ORGANIZER"
      ? `/${locale}/auth/setup-role?role=ORGANIZER`
      : (callbackUrl ?? `/${locale}/buyer/tickets`);
    signIn("google", { callbackUrl: cb });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* Mensagem pós setup-role */}
          {isOrganizerSetup && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg text-sm mb-6">
              ✅ Conta de organizador activada! Entra novamente para aceder ao painel.
            </div>
          )}

          {/* Tipo de conta */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("BUYER")}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                role === "BUYER"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              🎟️ Sou Comprador
            </button>
            <button
              type="button"
              onClick={() => setRole("ORGANIZER")}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                role === "ORGANIZER"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              🎪 Sou Organizador
            </button>
          </div>

          {/* Toggle login / registo */}
          <div className="flex rounded-xl border border-gray-200 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login" ? "bg-orange-500 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "register" ? "bg-orange-500 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="João Silva"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="exemplo@gmail.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading
                ? (mode === "login" ? "A entrar..." : "A criar conta...")
                : (mode === "login" ? "Entrar" : "Criar conta")}
            </button>
          </form>

          {/* Google */}
          <div className="mt-5">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3">ou continua com Google</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon />
              Continuar com Google
              {role === "ORGANIZER" && <span className="text-xs text-orange-600 font-semibold">(Organizador)</span>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
