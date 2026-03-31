// Mock M-Pesa — substituir pela integração real da Vodacom MZ na v2
export interface MpesaInitiateParams {
  phone: string;
  amount: number;
  reference: string; // idempotencyKey enviado como ThirdPartyReference
}

export interface MpesaInitiateResult {
  success: boolean;
  providerRef?: string;
  error?: string;
}

export async function initiateMpesaPayment(
  params: MpesaInitiateParams
): Promise<MpesaInitiateResult> {
  // TODO: substituir pela chamada real à API Vodacom M-Pesa MZ
  // POST https://api.sandbox.vm.co.mz/ipg/v1x/c2bPayment/singleStage/
  console.log("[M-PESA MOCK] Initiating payment", params);
  return {
    success: true,
    providerRef: `MOCK-MPESA-${Date.now()}`,
  };
}
