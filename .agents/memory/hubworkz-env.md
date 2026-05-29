---
name: HubWorkz Saúde env vars
description: Non-obvious env var choices and potential missing tables in Supabase
---

The user created the env var as `VITE_SUPABASE_URL` (with VITE_ prefix), not `SUPABASE_URL`. The backend reads `process.env["VITE_SUPABASE_URL"]` — this is intentional and consistent.

**Why:** User configured the secret with that name before the project started. Changing it would break both frontend and backend.

**How to apply:** Any new backend code that needs the Supabase URL should use `process.env["VITE_SUPABASE_URL"]`.

The `cotacoes` table may not exist in the user's Supabase project. The user listed it as a required feature but didn't confirm it was pre-created. If backend calls to /api/cotacoes fail with Supabase 404/relation errors, the table needs to be created manually.
