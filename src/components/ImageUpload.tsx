"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao carregar imagem.");
        return;
      }

      onChange(data.url);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setUploading(false);
      // limpar input para permitir re-upload do mesmo ficheiro
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value ? (
        <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
          <Image src={value} alt="Flyer do evento" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
          >
            Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[16/7] rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-orange-500 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">A carregar...</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Clica para enviar o flyer</span>
              <span className="text-xs">JPG, PNG, WEBP — máx 5MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
