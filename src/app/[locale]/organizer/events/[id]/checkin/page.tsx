"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

interface CheckInResult {
  success: boolean;
  message: string;
  ticket?: {
    tierName: string;
    buyerName: string;
    checkedInAt?: string;
  };
}

export default function CheckInPage() {
  const { id: eventId } = useParams() as { id: string };
  const [token, setToken] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focar no input automaticamente (leitores de QR enviam como teclado)
  useEffect(() => {
    inputRef.current?.focus();
  }, [result]);

  async function handleCheckin(t: string) {
    if (!t.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(t.trim())}/checkin`, {
        method: "POST",
      });
      const data = await res.json() as { error?: string; ticket?: CheckInResult["ticket"] };

      if (!res.ok) {
        setResult({ success: false, message: data.error ?? "Erro ao validar ingresso." });
      } else {
        setResult({
          success: true,
          message: "Ingresso válido!",
          ticket: data.ticket,
        });
      }
    } catch {
      setResult({ success: false, message: "Erro de conexão." });
    } finally {
      setLoading(false);
      setToken("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleCheckin(token);
  }

  // Input oculto para leitores de QR (enviam enter automaticamente)
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleCheckin(token);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Validar Entradas</h1>
      <p className="text-sm text-gray-500 mb-8">
        Aponte o leitor de QR code para o ingresso ou escreva o token manualmente.
      </p>

      {/* Resultado do check-in */}
      {result && (
        <div
          className={`rounded-2xl p-6 mb-6 text-center ${
            result.success
              ? "bg-green-50 border-2 border-green-400"
              : "bg-red-50 border-2 border-red-400"
          }`}
        >
          <div className="text-5xl mb-3">{result.success ? "✅" : "❌"}</div>
          <p
            className={`font-bold text-lg ${
              result.success ? "text-green-700" : "text-red-700"
            }`}
          >
            {result.message}
          </p>
          {result.ticket && (
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p>
                <strong>{result.ticket.buyerName}</strong>
              </p>
              <p>Lote: {result.ticket.tierName}</p>
              {result.ticket.checkedInAt && (
                <p className="text-xs text-gray-400">
                  Entrada registada às{" "}
                  {new Date(result.ticket.checkedInAt).toLocaleTimeString("pt-MZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Token do ingresso (QR Code)
          </label>
          <input
            ref={inputRef}
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aguardando leitura do QR code..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="text-xs text-gray-400 mt-2">
            O input captura automaticamente leitores USB de QR code
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "A validar..." : "Validar Ingresso"}
        </button>
      </form>

      {/* Instrução visual */}
      <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-5 text-sm text-orange-800">
        <p className="font-medium mb-2">Como usar:</p>
        <ol className="list-decimal list-inside space-y-1 text-orange-700">
          <li>Conecta um leitor USB de QR code ao computador</li>
          <li>O cursor fica sempre no campo acima</li>
          <li>Aponta o leitor para o QR code do ingresso</li>
          <li>A validação é feita automaticamente</li>
        </ol>
      </div>
    </div>
  );
}
