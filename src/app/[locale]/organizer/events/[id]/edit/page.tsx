"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";

interface Tier {
  id?: string;
  name: string;
  price: string;
  totalQty: string;
  salesEndAt: string;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  status: string;
  tiers: Tier[];
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "FINISHED", label: "Finalizado" },
];

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export default function EditEventPage() {
  const router = useRouter();
  const { locale, id } = useParams() as { locale: string; id: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [imageUrl, setImageUrl] = useState("");
  const [mainArtist, setMainArtist] = useState("");

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data: EventData & { imageUrl?: string; mainArtist?: string }) => {
        setTitle(data.title);
        setDescription(data.description);
        setVenue(data.venue);
        setStartsAt(toDatetimeLocal(data.startsAt));
        setEndsAt(toDatetimeLocal(data.endsAt));
        setStatus(data.status);
        setImageUrl(data.imageUrl ?? "");
        setMainArtist(data.mainArtist ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar o evento.");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          venue,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          status,
          imageUrl: imageUrl || null,
          mainArtist: mainArtist || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao guardar.");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">A carregar evento...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Editar Evento</h1>
        <button
          onClick={() => router.push(`/${locale}/organizer/events`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            ✓ Evento guardado com sucesso!
          </div>
        )}

        {/* Estado do evento — destaque no mobile */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Estado do evento</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  status === s.value
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {s.value === "DRAFT" && "📝 "}
                {s.value === "PUBLISHED" && "✅ "}
                {s.value === "CANCELLED" && "❌ "}
                {s.value === "FINISHED" && "🏁 "}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flyer */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Flyer do Evento
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Informações do Evento</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              maxLength={200}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artista principal <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={mainArtist}
              onChange={(e) => setMainArtist(e.target.value)}
              maxLength={120}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Ex: DJ Maphorisa, Neyma"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fim (opcional)
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/organizer/events/${id}/checkin`)}
            className="border border-orange-300 text-orange-600 py-3 px-5 rounded-xl font-medium hover:bg-orange-50 transition-colors text-sm"
          >
            🎟️ Check-in
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
