import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Imagens do Unsplash — festas, concertos, pessoas se divertindo
const IMAGES = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80", // concert crowd
  "https://images.unsplash.com/photo-1540039155733-5bb30b4c35a5?w=600&q=80", // festival night
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80", // dj party
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80", // dj lights
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80", // crowd dancing
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80", // concert stage
  "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80", // festival people
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80", // concert lights
  "https://images.unsplash.com/photo-1520483691742-bada60a1edd6?w=600&q=80", // beach party
  "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=600&q=80", // dj set
  "https://images.unsplash.com/photo-1551818176-8e9e3c3c9a5d?w=600&q=80", // theater
  "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80", // night party
];

// Data base: 3 meses a partir de hoje (Julho 2026)
function date(daysFromNow: number, hour = 20): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const EVENTS = [
  {
    title: "Noite de Afrohouse — Maputo Edition",
    description: "A maior noite de Afrohouse de Moçambique regressa com força total. DJs internacionais, light show épico e o melhor ambiente da cidade. Fica a noite toda e celebra a música africana.",
    venue: "Coconut Beach Club, Maputo",
    startsAt: date(92),
    endsAt: date(93, 4),
    image: IMAGES[0],
    tiers: [
      { name: "Early Bird", price: 300, totalQty: 100 },
      { name: "Normal", price: 500, totalQty: 300 },
      { name: "VIP", price: 1200, totalQty: 50 },
    ],
    highlight: true,
  },
  {
    title: "Festival Moz Urban — Hip Hop & R&B",
    description: "O maior festival de música urbana do país. Artistas nacionais e internacionais num palco épico. Hip Hop, R&B, Trap e muito mais. Não percas este evento histórico.",
    venue: "Praça dos Trabalhadores, Maputo",
    startsAt: date(97),
    endsAt: date(97, 23),
    image: IMAGES[1],
    tiers: [
      { name: "Pista", price: 400, totalQty: 500 },
      { name: "Camarote", price: 900, totalQty: 100 },
      { name: "VIP Lounge", price: 2000, totalQty: 30 },
    ],
    highlight: true,
  },
  {
    title: "Sunset Sessions — Praia da Costa do Sol",
    description: "Pôr do sol com os pés na areia e música ao vivo. Uma experiência única combinando beach vibes, cocktails artesanais e os melhores DJs locais. Entrada limitada.",
    venue: "Praia da Costa do Sol, Maputo",
    startsAt: date(103, 16),
    endsAt: date(103, 22),
    image: IMAGES[8],
    tiers: [
      { name: "General", price: 250, totalQty: 200 },
      { name: "VIP Mesa", price: 800, totalQty: 40 },
    ],
    highlight: false,
  },
  {
    title: "Gala de Teatro — Sonhos de Inhambane",
    description: "Peça teatral de produção nacional que celebra a cultura e tradições de Inhambane. Uma noite de arte, emoção e cultura moçambicana. Apresentação em Português.",
    venue: "Centro Cultural Franco-Moçambicano, Maputo",
    startsAt: date(98, 19),
    endsAt: date(98, 22),
    image: IMAGES[10],
    tiers: [
      { name: "Plateia", price: 350, totalQty: 150 },
      { name: "Balcão VIP", price: 600, totalQty: 60 },
    ],
    highlight: false,
  },
  {
    title: "DJ Concerto — Afrobeats Night",
    description: "Uma noite dedicada ao melhor do Afrobeats, Amapiano e Kizomba. DJ residente internacional mais convidados surpresa. O evento mais aguardado da temporada.",
    venue: "Club Liquid, Maputo",
    startsAt: date(105),
    endsAt: date(106, 3),
    image: IMAGES[2],
    tiers: [
      { name: "Normal", price: 400, totalQty: 250 },
      { name: "VIP", price: 1000, totalQty: 60 },
    ],
    highlight: true,
  },
  {
    title: "Concerto Acústico — Vozes de Moçambique",
    description: "Uma noite íntima com os melhores artistas acústicos do país. Canções originais, covers e muito feeling. Capacidade limitada para garantir uma experiência única.",
    venue: "Café Camissa, Maputo",
    startsAt: date(110, 19),
    endsAt: date(110, 22),
    image: IMAGES[5],
    tiers: [
      { name: "Normal", price: 200, totalQty: 80 },
      { name: "Mesa Premium", price: 500, totalQty: 20 },
    ],
    highlight: false,
  },
  {
    title: "Rave Under The Stars — Beira",
    description: "A Beira recebe a sua primeira rave ao ar livre. Sistema de som profissional, laser show e os melhores DJs de techno e house. Experiência nocturna inesquecível.",
    venue: "Parque de Exposições, Beira",
    startsAt: date(115),
    endsAt: date(116, 5),
    image: IMAGES[3],
    tiers: [
      { name: "Early Bird", price: 350, totalQty: 80 },
      { name: "Normal", price: 550, totalQty: 300 },
      { name: "VIP Area", price: 1300, totalQty: 40 },
    ],
    highlight: false,
  },
  {
    title: "Kizomba & Zouk Festival",
    description: "Três dias de masterclasses, workshops e festas de Kizomba e Zouk. Instrutores internacionais, competições e o melhor ambiente para dançar. Pacotes disponíveis.",
    venue: "Hotel Radisson Blu, Maputo",
    startsAt: date(118, 18),
    endsAt: date(120, 1),
    image: IMAGES[4],
    tiers: [
      { name: "Passe Dia", price: 600, totalQty: 150 },
      { name: "Passe 3 Dias", price: 1500, totalQty: 100 },
      { name: "VIP Full Pass", price: 3000, totalQty: 20 },
    ],
    highlight: false,
  },
  {
    title: "Stand Up Comedy Night — Riso Total",
    description: "Os melhores comediantes de Moçambique reunidos numa noite de gargalhadas garantidas. Humor moçambicano na sua forma mais autêntica. Apto para maiores de 16 anos.",
    venue: "Teatro Avenida, Maputo",
    startsAt: date(120, 19),
    endsAt: date(120, 22),
    image: IMAGES[11],
    tiers: [
      { name: "Plateia", price: 300, totalQty: 200 },
      { name: "Front Row VIP", price: 700, totalQty: 40 },
    ],
    highlight: false,
  },
  {
    title: "Pool Party — Nampula Summer Vibes",
    description: "A maior pool party de Nampula. DJs ao vivo, open bar premium, comida e o melhor ambiente de verão. Trás a tua turma e prepara-te para uma tarde inesquecível.",
    venue: "Hotel Girassol, Nampula",
    startsAt: date(125, 14),
    endsAt: date(125, 22),
    image: IMAGES[9],
    tiers: [
      { name: "Normal", price: 350, totalQty: 200 },
      { name: "VIP Cabana", price: 1200, totalQty: 20 },
    ],
    highlight: false,
  },
  {
    title: "Festival de Jazz & Blues — Ilha de Moçambique",
    description: "O único festival de Jazz & Blues do país, realizado na histórica Ilha de Moçambique. Artistas nacionais e internacionais num cenário único de Património Mundial da UNESCO.",
    venue: "Forte de São Sebastião, Ilha de Moçambique",
    startsAt: date(130, 18),
    endsAt: date(131, 23),
    image: IMAGES[6],
    tiers: [
      { name: "Passe 1 Dia", price: 500, totalQty: 300 },
      { name: "Passe 2 Dias", price: 900, totalQty: 150 },
      { name: "VIP", price: 2000, totalQty: 25 },
    ],
    highlight: true,
  },
  {
    title: "Mega Festa de Fim de Ano Antecipada",
    description: "Não esperes pelo fim de ano para celebrar! Uma mega festa com todos os hits do ano, DJs nacionais, surpresas e o melhor ambiente para festejar com amigos.",
    venue: "Sommerschield Garden, Maputo",
    startsAt: date(135),
    endsAt: date(136, 4),
    image: IMAGES[7],
    tiers: [
      { name: "Early Bird", price: 450, totalQty: 150 },
      { name: "Normal", price: 700, totalQty: 400 },
      { name: "VIP Table", price: 2500, totalQty: 20 },
    ],
    highlight: true,
  },
];

async function main() {
  console.log("🌱 Seeding events...");

  // Criar ou reutilizar um organizador de seed
  const passwordHash = await bcrypt.hash("seed1234", 10);
  const organizer = await db.user.upsert({
    where: { email: "organizer@ingressomz.com" },
    update: {},
    create: {
      name: "Ingresso MZ Demo",
      email: "organizer@ingressomz.com",
      passwordHash,
      role: "ORGANIZER",
    },
  });

  console.log(`✅ Organizer: ${organizer.email}`);

  let highlightPosition = 1;

  for (const ev of EVENTS) {
    // Criar evento
    const event = await db.event.create({
      data: {
        organizerId: organizer.id,
        title: ev.title,
        description: ev.description,
        venue: ev.venue,
        startsAt: ev.startsAt,
        endsAt: ev.endsAt ?? null,
        imageUrl: ev.image,
        status: "PUBLISHED",
        tiers: {
          create: ev.tiers.map((t) => ({
            name: t.name,
            price: t.price,
            totalQty: t.totalQty,
            soldQty: 0,
          })),
        },
      },
    });

    // Adicionar highlight se necessário
    if (ev.highlight) {
      const now = new Date();
      const endsHighlight = new Date();
      endsHighlight.setDate(endsHighlight.getDate() + 30);

      await db.eventHighlight.create({
        data: {
          eventId: event.id,
          startsAt: now,
          endsAt: endsHighlight,
          position: highlightPosition++,
          paidAmount: 0,
        },
      });
      console.log(`⭐ ${ev.title} → destaque #${highlightPosition - 1}`);
    } else {
      console.log(`🎟️  ${ev.title}`);
    }
  }

  console.log(`\n✅ ${EVENTS.length} eventos criados com sucesso!`);
  console.log(`   ${EVENTS.filter((e) => e.highlight).length} em destaque`);
  console.log(`\n🔑 Login do organizador demo:`);
  console.log(`   Email: organizer@ingressomz.com`);
  console.log(`   Password: seed1234`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
