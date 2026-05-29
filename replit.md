# HubWorkz Saúde

SaaS de gestão de intermediação farmacêutica oncológica — 19 módulos, 7 perfis de usuário, 4 fases de processo.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hubworkz run dev` — run the frontend (port 20742)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui + wouter + TanStack Query
- Backend: Express 5 + Node.js
- DB/Auth: Supabase (service role on backend, anon key on frontend)
- AI: Anthropic claude-sonnet-4-5 (Di IA assistant)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/hubworkz/` — React frontend (previewPath: `/`)
- `artifacts/api-server/` — Express API backend (port 8080, paths: `/api`)
- `lib/api-spec/openapi.yaml` — Source of truth for API contract
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — Generated Zod schemas
- `artifacts/api-server/src/routes/` — Backend route handlers

## Architecture decisions

- Backend uses `VITE_SUPABASE_URL` (not `SUPABASE_URL`) because user defined it with that name.
- Backend acts as a proxy layer over Supabase — all data ops go through Express with service role key.
- Supabase table for faturas is `notas_fiscais` (not `faturas`).
- Di IA chat history persisted in `di_messages` Supabase table.
- Cotações stored in `cotacoes` table — may need to be created manually in Supabase if missing.

## Product

HubWorkz Saúde permite que farmacêuticos e gestores de clínicas oncológicas gerenciem o ciclo completo de importação e intermediação de medicamentos — desde a solicitação/cotação (Fase 1), passando por aquisição/logística (Fase 2) e farmácia clínica (Fase 3), até o faturamento (Fase 4). Inclui monitoramento D30 de pacientes, gestão de glosas, di-IA (assistente Anthropic).

## User preferences

- Idioma: Português brasileiro em toda a UI
- Sem emojis na interface
- Dark theme rigoroso: #0F0F12 bg, #1B1B1E cards, #F56E0F primary, #A5FFD6 mint para Di IA
- Font: Exo 2 (Google Fonts)
- No Evolution/WhatsApp API integration

## 7 Perfis de usuário

- `gestor`, `farmaceutico`, `faturamento` → acesso completo (/dashboard)
- `importador`, `convenio`, `fornecedor` → acesso restrito (/restrito)
- `paciente` → portal do paciente (/paciente)

## Gotchas

- ALWAYS use `VITE_SUPABASE_URL` env var (not `SUPABASE_URL`) — it was defined this way.
- Backend table for faturas = `notas_fiscais` in Supabase.
- `cotacoes` table may need to be created manually in Supabase.
- Google Fonts @import MUST be first line of index.css (before @import "tailwindcss").
- Verify workflows are running before testing — frontend on port 20742, API on 8080.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
