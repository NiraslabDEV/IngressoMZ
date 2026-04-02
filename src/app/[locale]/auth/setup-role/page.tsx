"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SetupRolePage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (role !== "ORGANIZER") {
      router.replace(`/${locale}/buyer/tickets`);
      return;
    }

    fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ORGANIZER" }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("done");
          // O token JWT ainda tem role=BUYER — precisa de novo login para refletir ORGANIZER
          // Faz signOut e redireciona para login com callbackUrl para o painel
          await signOut({
            redirect: false,
          });
          setTimeout(() => {
            router.replace(`/${locale}/auth/login?callbackUrl=/${locale}/organizer/dashboard&msg=organizer`);
          }, 1200);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [role, locale, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        {status === "loading" && (
          <>
            <div className="text-3xl animate-spin inline-block">⏳</div>
            <p className="text-gray-600 text-sm">A configurar a tua conta de organizador...</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-green-700">Conta de organizador activada!</p>
            <p className="text-gray-500 text-sm">A redirecionar para o painel...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl">❌</div>
            <p className="text-red-600 text-sm">Erro ao configurar a conta.</p>
            <button
              onClick={() => router.replace(`/${locale}`)}
              className="text-orange-600 underline text-sm"
            >
              Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  );
}
