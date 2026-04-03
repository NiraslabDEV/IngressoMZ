import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ingresso MZ — Compra de Ingressos em Moçambique",
    short_name: "Ingresso MZ",
    description: "Compra ingressos para eventos em Moçambique com M-Pesa, e-Mola ou cartão.",
    start_url: "/pt",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["entertainment", "shopping"],
    lang: "pt",
    dir: "ltr",
  };
}
