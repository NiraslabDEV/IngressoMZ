// Mock e-Mola — substituir pela integração real na v2
export interface EmolaInitiateParams {
  phone: string;
  amount: number;
  reference: string;
}

export interface EmolaInitiateResult {
  success: boolean;
  providerRef?: string;
  error?: string;
}

export async function initiateEmolaPayment(
  params: EmolaInitiateParams
): Promise<EmolaInitiateResult> {
  // TODO: substituir pela chamada real à API e-Mola
  console.log("[E-MOLA MOCK] Initiating payment", params);
  return {
    success: true,
    providerRef: `MOCK-EMOLA-${Date.now()}`,
  };
}
