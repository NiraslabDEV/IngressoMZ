# Como usar o orquestrador de agentes

## Pré-requisitos

```bash
# 1. Instalar o Agent SDK
npm install @anthropic-ai/claude-agent-sdk

# 2. Ter a ANTHROPIC_API_KEY no ambiente
export ANTHROPIC_API_KEY=sk-ant-...
```

## Executar

```bash
# Com tsx (recomendado — sem compilação)
npx tsx scripts/redesign-agent.ts

# Com ts-node
npx ts-node --esm scripts/redesign-agent.ts
```

## O que cada agente faz

| Agente | Ficheiros que toca | Tarefa |
|---|---|---|
| `hero-redesigner` | `src/app/[locale]/page.tsx` | Redesenha hero e secções da homepage |
| `component-builder` | `src/components/EventCard.tsx` + `page.tsx` | Cria EventCard + Skeleton, extrai do inline |
| `layout-optimizer` | `src/components/Navbar.tsx` + `layout.tsx` + `globals.css` | Navbar glassmorphism + scroll suave |

## Execução paralela vs. sequencial

```
Fase 1 (paralelo):    hero-redesigner ──┐
                      component-builder ─┴─► Fase 2 (sequencial): layout-optimizer
```

O `layout-optimizer` corre depois porque edita o `layout.tsx` global —
evita conflitos de escrita com o `hero-redesigner`.

## Adicionar novos agentes

```typescript
// No scripts/redesign-agent.ts, adiciona uma nova função:
async function addSeatSelector() {
  for await (const msg of query({
    prompt: `Cria src/components/SeatMap.tsx com SVG interactivo...`,
    options: {
      cwd: PROJECT_ROOT,
      allowedTools: ["Read", "Edit", "Write", "Bash"],
      maxTurns: 20,
    },
  })) {
    if ("result" in msg) console.log(msg.result);
  }
}

// E adiciona ao Promise.all na função main()
```

## Features disruptivas (próximos agentes)

- `offline-checkin-agent` → Service Worker + IndexedDB para check-in sem internet
- `seat-map-agent` → SVG interactivo de lugares com estado em tempo real
- `loyalty-agent` → Sistema de pontos por compra
- `ar-agent` → AR.js + câmera no ingresso QR
