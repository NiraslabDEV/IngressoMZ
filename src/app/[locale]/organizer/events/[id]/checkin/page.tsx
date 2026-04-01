"use client";

import { useState, useRef, useEffect } from "react";
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
  const [useCameraScanner, setUseCameraScanner] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectedRef = useRef<Set<string>>(new Set());

  // Focar no input automaticamente
  useEffect(() => {
    if (!useCameraScanner) {
      inputRef.current?.focus();
    }
  }, [result, useCameraScanner]);

  // Verificar suporte para câmera
  useEffect(() => {
    const hasCamera =
      typeof navigator !== "undefined" &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setCameraSupported(hasCamera);
  }, []);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleCheckin(token);
    }
  }

  // Iniciar scanner de câmera
  async function startCameraScanner() {
    try {
      setCameraError(null);
      detectedRef.current.clear();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Garantir que o vídeo começa a tocar
        await videoRef.current.play();
        setUseCameraScanner(true);

        // Iniciar detecção de QR codes
        startQRScanning();
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? error.message
          : "Erro ao acessar câmera";
      setCameraError(errMsg);
      setCameraSupported(false);
    }
  }

  // Escanear QR codes usando canvas e jsQR
  function startQRScanning() {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    scannerIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Definir tamanho do canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Desenhar frame do vídeo no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Extrair dados de imagem
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Decodificar QR code
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (qrCode) {
          const qrData = qrCode.data.trim();

          // Evitar processar o mesmo código múltiplas vezes
          if (!detectedRef.current.has(qrData)) {
            detectedRef.current.add(qrData);
            setToken(qrData);
            handleCheckin(qrData);
          }
        }
      }
    }, 300);
  }

  // Parar scanner de câmera
  function stopCameraScanner() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectedRef.current.clear();
    setUseCameraScanner(false);
    setCameraError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Validar Entradas</h1>
        <p className="text-sm text-gray-500 mb-6">
          Usa a câmera ou introduce manualmente o token do ingresso.
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

        {/* Erro de câmera */}
        {cameraError && (
          <div className="rounded-2xl p-4 mb-6 bg-red-50 border border-red-200 text-sm text-red-700">
            <p className="font-medium">Erro da câmera:</p>
            <p className="text-xs mt-1">{cameraError}</p>
          </div>
        )}

        {/* Scanner de Câmera */}
        {cameraSupported && (
          <div className="mb-6">
            {useCameraScanner ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-orange-400 rounded-lg opacity-75" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 transition-colors"
                >
                  Parar Scanner
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCameraScanner}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                📷 Abrir Scanner
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        {cameraSupported && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">OU</span>
            </div>
          </div>
        )}

        {/* Input manual */}
        {!useCameraScanner && (
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
        )}

        {/* Instrução visual */}
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-5 text-sm text-orange-800">
          <p className="font-medium mb-2">Como usar:</p>
          <ol className="list-decimal list-inside space-y-1 text-orange-700">
            {cameraSupported ? (
              <>
                <li>Clica em &quot;Abrir Scanner&quot; e autoriza o acesso à câmera</li>
                <li>Aponta o QR code do ingresso para o centro do ecrã</li>
                <li>A validação é feita automaticamente quando o código é detectado</li>
                <li>Ou introduce o token manualmente no campo abaixo</li>
              </>
            ) : (
              <>
                <li>Usa um leitor USB de QR code ou introduce o token manualmente</li>
                <li>O cursor fica sempre no campo acima</li>
                <li>A validação é feita automaticamente quando pressiona Enter</li>
              </>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
