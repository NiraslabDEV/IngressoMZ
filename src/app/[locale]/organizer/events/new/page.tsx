"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";

interface Tier {
  name: string;
  price: string;
  totalQty: string;
  salesEndAt: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([
    { name: "", price: "", totalQty: "", salesEndAt: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addTier() {
    setTiers([...tiers, { name: "", price: "", totalQty: "", salesEndAt: "" }]);
  }

  function removeTier(i: number) {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, idx) => idx !== i));
  }

  function updateTier(i: number, field: keyof Tier, value: string) {
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      title,
      description,
      venue,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      imageUrl: imageUrl || undefined,
      tiers: tiers.map((t) => ({
        name: t.name,
        price: parseFloat(t.price),
        totalQty: parseInt(t.totalQty),
        salesEndAt: t.salesEndAt ? new Date(t.salesEndAt).toISOString() : undefined,
      })),
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao criar evento.");
        return;
      }

      router.push(`/${locale}/organizer/events`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Criar Novo Evento</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-950/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Flyer */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6">
            <label className="block text-sm font-semibold text-white mb-3">
              Flyer do Evento
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* Dados do evento */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-white">Informações do Evento</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ex: Concerto de Verão 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
              rows={4}
              className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Descreva o evento..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Local <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              maxLength={200}
              required
              className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ex: Praça dos Trabalhadores, Maputo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Início <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fim (opcional)
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Lotes de ingressos */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Lotes de Ingressos</h2>
            <button
              type="button"
              onClick={addTier}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              + Adicionar lote
            </button>
          </div>

          {tiers.map((tier, i) => (
            <div key={i} className="border border-gray-800 rounded-lg p-4 space-y-3 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Lote {i + 1}</span>
                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(i, "name", e.target.value)}
                    maxLength={80}
                    required
                    className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Ex: VIP, Normal, Estudante"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Preço (MZN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => updateTier(i, "price", e.target.value)}
                    min="0"
                    step="0.01"
                    required
                    className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="500.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={tier.totalQty}
                    onChange={(e) => updateTier(i, "totalQty", e.target.value)}
                    min="1"
                    required
                    className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Fim das vendas (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={tier.salesEndAt}
                    onChange={(e) => updateTier(i, "salesEndAt", e.target.value)}
                    className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-400 hover:bg-blue-300 text-black py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Evento"}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}
