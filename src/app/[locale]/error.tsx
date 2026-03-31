"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Algo correu mal</h2>
        <p className="text-gray-500 mb-4">{error.message || "Erro interno do servidor."}</p>
        <button
          onClick={reset}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
