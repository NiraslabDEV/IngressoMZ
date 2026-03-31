import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

function fmt(value: number) {
  return value.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function OrderPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${params.locale}/auth/login`);

  const order = await db.order.findUnique({
    where: { id: params.id, buyerId: session.user.id! },
    include: {
      event: { select: { title: true, venue: true, startsAt: true } },
      items: { include: { tier: { select: { name: true } } } },
      tickets: { include: { tier: { select: { name: true } } } },
      payments: { select: { provider: true, status: true, amount: true, createdAt: true } },
    },
  });

  if (!order) notFound();

  const qrCodes = await Promise.all(
    order.tickets.map(async (t) => ({
      id: t.id,
      qr: t.status === "ACTIVE" ? await QRCode.toDataURL(t.token, { width: 180, margin: 1 }) : null,
      tierName: t.tier.name,
      status: t.status,
      checkedInAt: t.checkedInAt,
    }))
  );

  const statusLabel: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };

  const providerLabel: Record<string, string> = {
    MPESA: "M-Pesa",
    EMOLA: "e-Mola",
    STRIPE: "Cartão",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/${params.locale}/buyer/tickets`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Meus Ingressos
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{order.event.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        Pedido #{order.id.slice(0, 8).toUpperCase()} ·{" "}
        {new Date(order.createdAt).toLocaleDateString("pt-MZ", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* Resumo do pedido */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Resumo</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Local</dt>
            <dd className="text-gray-800">{order.event.venue}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Data</dt>
            <dd className="text-gray-800">
              {new Date(order.event.startsAt).toLocaleDateString("pt-MZ", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <dt className="text-gray-500">
                {item.tier.name} × {item.quantity}
              </dt>
              <dd className="text-gray-800">{fmt(Number(item.unitPrice) * item.quantity)} MZN</dd>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
            <dt>Total</dt>
            <dd className="text-orange-600">{fmt(Number(order.totalAmount))} MZN</dd>
          </div>
        </dl>

        {/* Pagamento */}
        {order.payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">
              {providerLabel[order.payments[0].provider] ?? order.payments[0].provider}
            </span>
            <span
              className={
                order.payments[0].status === "COMPLETED"
                  ? "text-green-600 font-medium"
                  : "text-gray-600"
              }
            >
              {order.payments[0].status === "COMPLETED" ? "✓ Pago" : statusLabel[order.payments[0].status]}
            </span>
          </div>
        )}
      </div>

      {/* Ingressos com QR */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800">Ingressos</h2>
        {qrCodes.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-5">
            {t.qr ? (
              <img src={t.qr} alt="QR Code" className="w-28 h-28 rounded-xl border border-gray-100" />
            ) : (
              <div className="w-28 h-28 rounded-xl bg-gray-100 flex items-center justify-center text-4xl">
                {t.status === "USED" ? "✅" : "❌"}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{t.tierName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.status === "ACTIVE" && "Apresente este QR code na entrada"}
                {t.status === "USED" && `Utilizado às ${t.checkedInAt ? new Date(t.checkedInAt).toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" }) : ""}`}
                {t.status === "CANCELLED" && "Ingresso cancelado"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
