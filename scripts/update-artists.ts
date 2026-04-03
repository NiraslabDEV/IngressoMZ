import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ARTISTS: Record<string, string> = {
  "Noite de Afrohouse — Maputo Edition": "DJ Maphorisa",
  "Festival Moz Urban — Hip Hop & R&B": "Azagaia & Lizha James",
  "Sunset Sessions — Praia da Costa do Sol": "Neyma",
  "Gala de Teatro — Sonhos de Inhambane": "Companhia Nacional de Canto e Dança",
  "DJ Concerto — Afrobeats Night": "Mr. Bow & Stewart Sukuma",
  "Concerto Acústico — Vozes de Moçambique": "Mingas",
  "Rave Under The Stars — Beira": "DJ Ardiles",
  "Kizomba & Zouk Festival": "Anselmo Ralph",
  "Stand Up Comedy Night — Riso Total": "Índio e Papagaio",
  "Pool Party — Nampula Summer Vibes": "Marllen",
  "Festival de Jazz & Blues — Ilha de Moçambique": "Moreira Chonguiça",
  "Mega Festa de Fim de Ano Antecipada": "Wazimbo & Ziqo",
};

async function main() {
  for (const [title, artist] of Object.entries(ARTISTS)) {
    const result = await db.event.updateMany({
      where: { title },
      data: { mainArtist: artist },
    });
    console.log(`${result.count > 0 ? "✅" : "⚠️"} ${title} → ${artist}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
