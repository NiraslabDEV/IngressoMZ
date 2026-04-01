import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("A popular a base de dados...");

  const passwordHash = await bcrypt.hash("senha123456", 12);
  const day = 24 * 60 * 60 * 1000;
  const now = new Date();

  // Organizadores
  const org1 = await db.user.upsert({
    where: { email: "kudzai@eventos.co.mz" },
    update: {},
    create: { name: "Kudzai Eventos", email: "kudzai@eventos.co.mz", passwordHash, role: "ORGANIZER" },
  });

  const org2 = await db.user.upsert({
    where: { email: "maputo@live.co.mz" },
    update: {},
    create: { name: "Maputo Live", email: "maputo@live.co.mz", passwordHash, role: "ORGANIZER" },
  });

  // Comprador de teste
  await db.user.upsert({
    where: { email: "comprador@example.com" },
    update: {},
    create: { name: "Carlos Machava", email: "comprador@example.com", passwordHash, role: "BUYER" },
  });

  console.log("Utilizadores OK");

  // Eventos
  const e1 = await db.event.create({
    data: {
      organizerId: org1.id,
      title: "Maputo Jazz Festival 2026",
      description: "O maior festival de jazz de Mocambique regressa ao Jardim dos Professores com artistas nacionais e internacionais. Uma noite inesquecivel de musica ao vivo, gastronomia e cultura. Mais de 10 horas de espectaculo continuo.",
      venue: "Jardim dos Professores, Maputo",
      startsAt: new Date(now.getTime() + day * 7),
      endsAt: new Date(now.getTime() + day * 7 + 10 * 3600 * 1000),
      status: "PUBLISHED",
    },
  });

  const e2 = await db.event.create({
    data: {
      organizerId: org1.id,
      title: "Noite Afro-House — Club Coconut",
      description: "A noite mais quente de Maputo! Os melhores DJs de afro-house, amapiano e techno africano numa so noite. Ambiente exclusivo, sistema de som de ultima geracao e bar premium.",
      venue: "Club Coconut, Sommerschield, Maputo",
      startsAt: new Date(now.getTime() + day * 3),
      endsAt: new Date(now.getTime() + day * 3 + 6 * 3600 * 1000),
      status: "PUBLISHED",
    },
  });

  const e3 = await db.event.create({
    data: {
      organizerId: org2.id,
      title: "Stand-Up Comedy: Maputo Ri",
      description: "Os melhores comediantes de Mocambique num espectaculo de stand-up comedy imperdivel. Prepare-se para rir ate as lagrimas com historias do quotidiano mocambicano.",
      venue: "Teatro Avenida, Maputo",
      startsAt: new Date(now.getTime() + day * 14),
      endsAt: new Date(now.getTime() + day * 14 + 3 * 3600 * 1000),
      status: "PUBLISHED",
    },
  });

  const e4 = await db.event.create({
    data: {
      organizerId: org2.id,
      title: "Concerto Marrabenta — Homenagem",
      description: "Uma noite de homenagem a musica moçambicana. Artistas convidados interpretam os maiores exitos da marrabenta numa celebracao da cultura nacional.",
      venue: "Centro Cultural Franco-Mocambicano, Maputo",
      startsAt: new Date(now.getTime() + day * 21),
      endsAt: new Date(now.getTime() + day * 21 + 4 * 3600 * 1000),
      status: "PUBLISHED",
    },
  });

  const e5 = await db.event.create({
    data: {
      organizerId: org1.id,
      title: "Beira Music Fest",
      description: "O festival de musica da cidade da Beira reune artistas locais e nacionais num palco unico a beira-mar. Dois dias de musica, arte e gastronomia da costa mocambicana.",
      venue: "Praca do Municipio, Beira",
      startsAt: new Date(now.getTime() + day * 30),
      endsAt: new Date(now.getTime() + day * 31),
      status: "PUBLISHED",
    },
  });

  const e6 = await db.event.create({
    data: {
      organizerId: org2.id,
      title: "Expo Arte Mocambique 2026",
      description: "A maior exposicao de arte contemporanea mocambicana. Pinturas, esculturas, fotografia e instalacoes de mais de 50 artistas de todo o pais.",
      venue: "Museu Nacional de Arte, Maputo",
      startsAt: new Date(now.getTime() + day * 10),
      endsAt: new Date(now.getTime() + day * 17),
      status: "PUBLISHED",
    },
  });

  console.log("Eventos OK");

  // Lotes de ingressos
  await db.ticketTier.createMany({
    data: [
      { eventId: e1.id, name: "Geral", price: 500, totalQty: 500, soldQty: 120 },
      { eventId: e1.id, name: "VIP", price: 1500, totalQty: 100, soldQty: 45 },
      { eventId: e1.id, name: "Camarote", price: 3500, totalQty: 20, soldQty: 8 },

      { eventId: e2.id, name: "Entrada", price: 300, totalQty: 300, soldQty: 250 },
      { eventId: e2.id, name: "VIP", price: 800, totalQty: 50, soldQty: 30 },

      { eventId: e3.id, name: "Plateia", price: 400, totalQty: 200, soldQty: 80 },
      { eventId: e3.id, name: "Frente", price: 700, totalQty: 50, soldQty: 20 },

      { eventId: e4.id, name: "Geral", price: 350, totalQty: 400, soldQty: 60 },
      { eventId: e4.id, name: "VIP", price: 900, totalQty: 60, soldQty: 15 },

      { eventId: e5.id, name: "Dia 1", price: 400, totalQty: 1000, soldQty: 300 },
      { eventId: e5.id, name: "Dia 2", price: 400, totalQty: 1000, soldQty: 200 },
      { eventId: e5.id, name: "Passe 2 Dias", price: 700, totalQty: 500, soldQty: 150 },

      { eventId: e6.id, name: "Entrada Geral", price: 150, totalQty: 1000, soldQty: 40 },
      { eventId: e6.id, name: "Estudante", price: 75, totalQty: 300, soldQty: 10 },
    ],
  });

  console.log("Ingressos OK");

  // Destaques na homepage
  await db.eventHighlight.createMany({
    data: [
      {
        eventId: e1.id,
        startsAt: new Date(now.getTime() - 3600 * 1000),
        endsAt: new Date(now.getTime() + day * 8),
        position: 1,
        paidAmount: 5000,
      },
      {
        eventId: e2.id,
        startsAt: new Date(now.getTime() - 3600 * 1000),
        endsAt: new Date(now.getTime() + day * 4),
        position: 2,
        paidAmount: 3000,
      },
    ],
  });

  console.log("Destaques OK");
  console.log("");
  console.log("Seed concluido!");
  console.log("  Organizador: kudzai@eventos.co.mz  / senha123456");
  console.log("  Organizador: maputo@live.co.mz      / senha123456");
  console.log("  Comprador:   comprador@example.com  / senha123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
