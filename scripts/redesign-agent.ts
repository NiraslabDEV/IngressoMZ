/**
 * Orquestrador de redesign Apple-style para IngressoMZ
 *
 * Executa subagentes em paralelo para melhorar o frontend do site.
 * Requer: ANTHROPIC_API_KEY no ambiente
 *
 * Uso:
 *   npx tsx scripts/redesign-agent.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

// ─── Fase 1: Hero + EventCard (paralelo) ─────────────────────────────────────

async function redesignHero() {
  console.log("[hero] Redesenhando homepage...");
  for await (const msg of query({
    prompt: `
Lê src/app/[locale]/page.tsx e redesenha APENAS o markup/CSS (manter toda a lógica de dados intacta).

Alterações:
1. Hero: fundo escuro (bg-gray-950), min-h-[70vh], título text-5xl md:text-7xl font-black tracking-tight text-white,
   subtítulo text-xl text-gray-400, botões rounded-full com hover:scale-105 transition-transform.
2. Secções de eventos: py-20, títulos text-3xl font-bold tracking-tight sem emojis.
3. Footer: bg-gray-950 text-gray-500, mais espaçamento.
4. Grid de cards: gap-6 em vez de gap-4.
5. NÃO alterar queries do Prisma, tipos, imports de dados, ou lógica de negócio.
    `,
    options: {
      cwd: PROJECT_ROOT,
      allowedTools: ["Read", "Edit", "Write"],
      maxTurns: 10,
    },
  })) {
    if ("result" in msg) return msg.result;
  }
}

async function buildEventCard() {
  console.log("[card] Extraindo e melhorando EventCard...");
  for await (const msg of query({
    prompt: `
1. Lê src/app/[locale]/page.tsx e extrai o componente EventCard inline para src/components/EventCard.tsx.
2. Mantém as mesmas props e lógica, mas melhora o CSS:
   - hover:-translate-y-1 transition-all duration-300 hover:shadow-xl
   - Imagem com aspect-[4/3] e overlay gradient-to-t from-black/40
   - Badge "Destaque" rounded-full text-xs font-semibold
   - Botão "Ver evento" rounded-full bg-gray-900 text-white hover:bg-gray-800
   - Preço em font-bold text-lg
3. Exporta também um EventCardSkeleton com animate-pulse.
4. Actualiza page.tsx para importar o novo componente.
    `,
    options: {
      cwd: PROJECT_ROOT,
      allowedTools: ["Read", "Edit", "Write"],
      maxTurns: 12,
    },
  })) {
    if ("result" in msg) return msg.result;
  }
}

// ─── Fase 2: Navbar + Layout global ──────────────────────────────────────────

async function improveNavbarAndLayout() {
  console.log("[layout] Melhorando navbar e layout...");
  for await (const msg of query({
    prompt: `
1. Lê src/app/[locale]/layout.tsx para entender o layout actual.
2. Cria src/components/Navbar.tsx (client component) com:
   - fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100
   - Logo "Ingresso MZ" font-bold tracking-tight text-xl
   - Links de navegação em text-sm text-gray-600 hover:text-gray-900
   - Botão "Entrar" rounded-full bg-gray-900 text-white text-sm px-4 py-2
   - Menu mobile com hamburger icon (useState para toggle)
3. Integra o Navbar no layout.tsx (importar e renderizar antes do {children}).
4. Adiciona pt-16 ao body/main para compensar a navbar fixed.
5. Lê src/app/globals.css e adiciona scroll-behavior: smooth no html se não existir.
    `,
    options: {
      cwd: PROJECT_ROOT,
      allowedTools: ["Read", "Edit", "Write"],
      maxTurns: 12,
    },
  })) {
    if ("result" in msg) return msg.result;
  }
}

// ─── Fase 3: Páginas internas ────────────────────────────────────────────────

async function polishInternalPages() {
  console.log("[pages] Polindo páginas internas...");
  for await (const msg of query({
    prompt: `
Lê e melhora o CSS/markup destas páginas (mantendo toda a lógica intacta):

1. src/app/[locale]/events/[id]/page.tsx — página do evento:
   - Imagem hero com aspect-[21/9] e overlay gradient
   - Info com espaçamento generoso, tipografia hierárquica
   - Secção de tickets com cards limpos

2. src/app/[locale]/auth/login/page.tsx — login:
   - Centrar verticalmente (min-h-screen flex items-center justify-center)
   - Card com max-w-md rounded-2xl shadow-xl p-8
   - Inputs com rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500

3. src/app/[locale]/auth/register/page.tsx — registo (mesmos padrões do login).

Se algum ficheiro não existir, ignora-o.
    `,
    options: {
      cwd: PROJECT_ROOT,
      allowedTools: ["Read", "Edit", "Write"],
      maxTurns: 15,
    },
  })) {
    if ("result" in msg) return msg.result;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== IngressoMZ Frontend Redesign ===\n");

  // Fase 1: Hero + EventCard em paralelo (ficheiros diferentes)
  console.log("Fase 1: Hero + EventCard (paralelo)");
  await Promise.all([redesignHero(), buildEventCard()]);

  // Fase 2: Navbar + Layout (depende do layout.tsx livre)
  console.log("\nFase 2: Navbar + Layout");
  await improveNavbarAndLayout();

  // Fase 3: Páginas internas
  console.log("\nFase 3: Páginas internas");
  await polishInternalPages();

  console.log("\n=== Redesign concluído! Corre: npm run dev ===");
}

main().catch(console.error);
