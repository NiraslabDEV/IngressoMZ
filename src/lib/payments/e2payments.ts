// e2Payments (Explicador) — gateway real para M-Pesa MZ
// Docs: https://e2payments.explicador.co.mz/docs

const E2P_BASE = "https://e2payments.explicador.co.mz";

// Cache do token OAuth2 em memória (evita auth a cada pedido)
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(`${E2P_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.E2P_CLIENT_ID,
      client_secret: process.env.E2P_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error("E2P_AUTH_FAILED");

  const data = await res.json();
  // Cache por 50 minutos (tokens expiram em ~60min)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };

  return tokenCache.token;
}

export interface InitiateResult {
  success: boolean;
  providerRef?: string;
  error?: string;
}

export async function initiateMpesaPayment(params: {
  phone: string;
  amount: number;
  reference: string; // idempotencyKey — usado para polling posterior
}): Promise<InitiateResult> {
  const walletId = process.env.E2P_WALLET_ID;
  if (!walletId) throw new Error("E2P_WALLET_ID não configurado.");

  const token = await getToken();

  const res = await fetch(`${E2P_BASE}/v1/c2b/mpesa-payment/${walletId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.E2P_CLIENT_ID,
      amount: String(params.amount),
      phone: params.phone,
      reference: params.reference,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: (err as { message?: string }).message ?? "E2P_PAYMENT_FAILED" };
  }

  const data = await res.json() as { reference?: string };
  return { success: true, providerRef: data.reference ?? params.reference };
}

export interface E2PPayment {
  reference: string;
  status: string;
  amount?: string;
}

// Sem webhooks — confirma pagamento por polling
export async function getMpesaPayments(): Promise<E2PPayment[]> {
  const token = await getToken();

  const res = await fetch(`${E2P_BASE}/v1/payments/mpesa/get/all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ client_id: process.env.E2P_CLIENT_ID }),
  });

  if (!res.ok) throw new Error("E2P_LIST_FAILED");

  const data = await res.json() as { payments?: E2PPayment[] } | E2PPayment[];
  return (Array.isArray(data) ? data : data.payments) ?? [];
}
