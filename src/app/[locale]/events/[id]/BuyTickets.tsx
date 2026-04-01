"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tier {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface Props {
  eventId: string;
  tiers: Tier[];
  locale: string;
  isLoggedIn: boolean;
}

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type PaymentMethod = "MPESA" | "EMOLA" | "STRIPE";

export default function BuyTickets({ eventId, tiers, locale, isLoggedIn }: Props) {
  const router = useRouter();
  const availableTiers = tiers.filter((t) => t.available);

  const [selectedTier, setSelectedTier] = useState(availableTiers[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("MPESA");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"select" | "pay" | "polling" | "done">("select");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const tier = tiers.find((t) => t.id === selectedTier);
  const total = tier ? tier.price * qty : 0;

  if (!isLoggedIn) {
    return (
      <a
        href={`/${locale}/auth/login?callbackUrl=/${locale}/events/${eventId}`}
        className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center font-semibold py-3 rounded-xl transition-colors"
      >
        Entrar para comprar
      </a>
    );
  }

  if (availableTiers.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-4">
        Nenhum ingresso disponível.
      </div>
    );
  }

  async function handleBuy() {
    setError("");

    if ((method === "MPESA" || method === "EMOLA") && !phone.match(/^8[2-7]\d{7}$/)) {
      setError("Número de telefone inválido (ex: 841234567).");
      return;
    }

    setStep("pay");

    try {
      // 1. Criar order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          items: [{ tierId: selectedTier, quantity: qty }],
        }),
      });

      if (!orderRes.ok) {
        const d = await orderRes.json();
        setError(d.error ?? "Erro ao criar pedido.");
        setStep("select");
        return;
      }

      const order = await orderRes.json() as { id: string };
      setOrderId(order.id);

      // 2. Iniciar pagamento
      const payRoute = method === "MPESA" ? "/api/payments/mpesa" : method === "EMOLA" ? "/api/payments/emola" : "/api/payments/stripe";

      const idempotencyKey = `${order.id}-${Date.now()}`;

      const payRes = await fetch(payRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, phone, idempotencyKey }),
      });

      if (!payRes.ok) {
        const d = await payRes.json();
        setError(d.error ?? "Erro ao iniciar pagamento.");
        setStep("select");
        return;
      }

      const payData = await payRes.json() as { id?: string; url?: string };

      // Stripe — redirecionar para checkout
      if (method === "STRIPE" && payData.url) {
        window.location.href = payData.url;
        return;
      }

      // M-Pesa / e-Mola — polling
      if (payData.id) {
        setStep("polling");
        await pollPayment(payData.id, order.id);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStep("select");
    }
  }

  async function pollPayment(paymentId: string, oId: string) {
    const maxAttempts = 24; // 2 min (5s × 24)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const res = await fetch(`/api/payments/poll/${paymentId}`);
      if (!res.ok) continue;

      const data = await res.json() as { status: string };
      if (data.status === "COMPLETED") {
        setStep("done");
        setTimeout(() => router.push(`/${locale}/buyer/orders/${oId}`), 1500);
        return;
      }
      if (data.status === "FAILED") {
        setError("Pagamento recusado. Tente novamente.");
        setStep("select");
        return;
      }
    }

    setError("Tempo de espera expirado. Verifique o seu M-Pesa e contacte o suporte.");
    setStep("select");
  }

  if (step === "done") {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-2">✅</div>
        <p className="font-semibold text-green-600">Pagamento confirmado!</p>
        <p className="text-xs text-gray-400 mt-1">A redirecionar para os seus ingressos...</p>
      </div>
    );
  }

  if (step === "polling") {
    return (
      <div className="text-center py-4">
        <div className="animate-spin text-3xl mb-3">⏳</div>
        <p className="font-semibold text-gray-700">A aguardar confirmação do pagamento...</p>
        <p className="text-xs text-gray-400 mt-2">Confirme o pagamento no seu telemóvel</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Seleccionar lote */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de ingresso</label>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {availableTiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {fmt(t.price)} MZN
            </option>
          ))}
        </select>
      </div>

      {/* Quantidade */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantidade</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-bold"
          >
            −
          </button>
          <span className="text-lg font-semibold w-6 text-center">{qty}</span>
          <button
            onClick={() => setQty(Math.min(10, qty + 1))}
            className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Método de pagamento */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Método de pagamento
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["MPESA", "EMOLA", "STRIPE"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-2 rounded-lg border text-xs font-medium transition-colors ${
                method === m
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {m === "MPESA" ? "M-Pesa" : m === "EMOLA" ? "e-Mola" : "Cartão"}
            </button>
          ))}
        </div>
      </div>

      {/* Número de telefone */}
      {(method === "MPESA" || method === "EMOLA") && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Número {method === "MPESA" ? "M-Pesa" : "e-Mola"}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="841234567"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      )}

      {/* Total + botão */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-600">Total</span>
          <span className="font-bold text-gray-900">{fmt(total)} MZN</span>
        </div>
        <button
          onClick={handleBuy}
          disabled={step === "pay"}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {step === "pay" ? "A processar..." : `Comprar por ${fmt(total)} MZN`}
        </button>
      </div>
    </div>
  );
}
