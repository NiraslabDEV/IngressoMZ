"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  const [name, setName] = useState(session?.user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradingRole, setUpgradingRole] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const isOrganizer = session?.user?.role === "ORGANIZER";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    const payload: Record<string, string> = {};
    if (name.trim() && name.trim() !== session?.user?.name) payload.name = name.trim();
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setError("Nenhuma alteração para guardar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao guardar.");
        return;
      }

      await update({ name: data.user.name });
      setSuccess("Perfil actualizado com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBecomeOrganizer() {
    setUpgradingRole(true);
    setUpgradeSuccess(false);
    setError("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ORGANIZER" }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao activar conta de organizador.");
        return;
      }

      await update();
      setUpgradeSuccess(true);
      router.push(`/${locale}/organizer/dashboard`);
      router.refresh();
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setUpgradingRole(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar perfil</h1>
      <p className="text-sm text-gray-500 mb-8">{session?.user?.email}</p>

      {/* Tornar-me Organizador */}
      {!isOrganizer && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-orange-800 mb-1">Quer organizar eventos?</h2>
          <p className="text-xs text-orange-700 mb-4">
            Activa a conta de organizador para criar e gerir os teus eventos na plataforma.
          </p>
          {upgradeSuccess && (
            <p className="text-xs text-green-700 mb-3">✅ Conta de organizador activada!</p>
          )}
          <button
            type="button"
            onClick={handleBecomeOrganizer}
            disabled={upgradingRole}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {upgradingRole ? "A activar..." : "🎪 Tornar-me Organizador"}
          </button>
        </div>
      )}

      {isOrganizer && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 text-sm text-green-800 font-medium">
          ✅ Conta de organizador activa
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Alterar palavra-passe</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova palavra-passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova palavra-passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading ? "A guardar..." : "Guardar alterações"}
        </button>
      </form>
    </main>
  );
}
