---
name: HubWorkz Saúde DB tables
description: Supabase table names used by HubWorkz — some differ from API naming
---

Supabase table names (pre-existing, created by user before project):
- `profiles` — user profiles with role, clinica_id, nome
- `pacientes` — patients
- `medicamentos` — medications catalog
- `distribuidoras` — distributors
- `notas_fiscais` — invoices/faturas (API calls them "faturas" but DB table is notas_fiscais)
- `processos` — process workflow records
- `monitoramentos` — D30 patient monitoring
- `glosas` — billing disputes
- `di_messages` — Di IA chat history (role, content, clinica_id, created_at)
- `di_memory` — Di IA memory (exists but not yet used)
- `cotacoes` — quotation records (MAY NOT EXIST — user did not confirm pre-creation)

**Why:** The user told the agent which tables existed. `notas_fiscais` vs `faturas` mismatch is the sharpest edge.

**How to apply:** When writing any Supabase query, use these exact table names. Always use `notas_fiscais` for fatura/invoice data.
