"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import jsQR from "jsqr";

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
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  // O vídeo e canvas ficam sempre no DOM — necessário para o ref funcionar antes de setScanning
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectedRef = useRef<Set<string>>(new Set());
  const scanningRef = useRef(false); // ref síncrono para o loop de RAF

  useEffect(() => {
    if (!scanning) inputRef.current?.focus();
  }, [result, scanning]);

  // Limpa tudo ao desmontar
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckin(t: string) {
    if (!t.trim() || loading) return;
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
        setResult({ success: true, message: "Ingresso válido!", ticket: data.ticket });
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

  // Loop RAF para leitura de QR — roda no contexto do componente com acesso aos refs
  const scanLoop = useCallback(() => {
    if (!scanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (qr?.data) {
      const qrData = qr.data.trim();
      if (!detectedRef.current.has(qrData)) {
        detectedRef.current.add(qrData);
        handleCheckin(qrData);
        // Pausa 2s após detectar para não spammar
        setTimeout(() => {
          if (scanningRef.current) rafRef.current = requestAnimationFrame(scanLoop);
        }, 2000);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(scanLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraError(null);
    detectedRef.current.clear();

    // Pedir permissão e stream
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // "ideal" não falha se não existir câmara traseira
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Acesso à câmera negado.";
      setCameraError(msg);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    streamRef.current = stream;
    video.srcObject = stream;

    // Aguardar o vídeo estar pronto antes de iniciar o loop
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    try {
      await video.play();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível iniciar o vídeo.";
      setCameraError(msg);
      stopCamera();
      return;
    }

    scanningRef.current = true;
    setScanning(true);
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  function stopCamera() {
    scanningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectedRef.current.clear();
    setScanning(false);
    setCameraError(null);
  }

  const hasCamera =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function";

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Validar Entradas</h1>
        <p className="text-sm text-gray-500 mb-6">
          Usa a câmera ou introduz manualmente o token do ingresso.
        </p>

        {/* Resultado */}
        {result && (
          <div
            className={`rounded-2xl p-6 mb-6 text-center ${
              result.success
                ? "bg-green-50 border-2 border-green-400"
                : "bg-red-50 border-2 border-red-400"
            }`}
          >
            <div className="text-5xl mb-3">{result.success ? "✅" : "❌"}</div>
            <p className={`font-bold text-lg ${result.success ? "text-green-700" : "text-red-700"}`}>
              {result.message}
            </p>
            {result.ticket && (
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p><strong>{result.ticket.buyerName}</strong></p>
                <p>Lote: {result.ticket.tierName}</p>
                {result.ticket.checkedInAt && (
                  <p className="text-xs text-gray-400">
                    Entrada às{" "}
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

        {/* Erro câmera */}
        {cameraError && (
          <div className="rounded-2xl p-4 mb-6 bg-red-50 border border-red-200 text-sm text-red-700">
            <p className="font-medium">Erro da câmera:</p>
            <p className="text-xs mt-1 break-words">{cameraError}</p>
          </div>
        )}

        {/* Vídeo — sempre no DOM para o ref funcionar; visível só quando scanning */}
        <div className={`mb-6 ${scanning ? "block" : "hidden"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
              {/* muted DEVE estar aqui no JSX para iOS Safari permitir autoplay */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Canvas oculto usado para extrair frames */}
              <canvas ref={canvasRef} className="hidden" />
              {/* Guia de mira */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-orange-400 rounded-xl opacity-80">
                  {/* cantos decorativos */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />
                </div>
              </div>
              <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs opacity-75">
                Aponta o QR code para o centro
              </p>
            </div>
            <div className="p-3">
              <button
                type="button"
                onClick={stopCamera}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Parar Scanner
              </button>
            </div>
          </div>
        </div>

        {/* Botão abrir scanner */}
        {hasCamera && !scanning && (
          <button
            type="button"
            onClick={startCamera}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mb-6"
          >
            📷 Abrir Scanner de QR Code
          </button>
        )}

        {/* Divisor */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">OU manual</span>
          </div>
        </div>

        {/* Input manual */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Token do ingresso
            </label>
            <input
              ref={inputRef}
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole ou digite o token..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-2">
              Funciona também com leitor USB de QR code
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

        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-5 text-sm text-orange-800">
          <p className="font-medium mb-2">Como usar:</p>
          <ol className="list-decimal list-inside space-y-1 text-orange-700">
            <li>Clica em &quot;Abrir Scanner&quot; e autoriza o acesso à câmera</li>
            <li>Aponta o QR code para o centro do ecrã</li>
            <li>A validação é feita automaticamente</li>
            <li>Ou introduz o token manualmente no campo abaixo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
