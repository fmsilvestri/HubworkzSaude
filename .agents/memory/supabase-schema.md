---
name: Supabase schema real vs esperado
description: Mapa das colunas existentes no Supabase vs nomes esperados pelo código. Migration SQL em supabase-migration.sql.
---

## Divergências (real → esperado no código)

| Tabela | Coluna real | Coluna esperada | Ação |
|--------|-------------|-----------------|------|
| processos | `fase` (smallint) | `fase_atual` | Migration ADD COLUMN fase_atual |
| notas_fiscais | `nf_status` | `status` | Migration ADD COLUMN status |
| notas_fiscais | `numero_nf` | `numero` | Migration ADD COLUMN numero |
| notas_fiscais | `valor` | `valor_total` | Migration ADD COLUMN valor_total |
| medicamentos | `apresentacao` | `concentracao` | Migration ADD COLUMN concentracao |
| medicamentos | `modo_uso` | `via_administracao` | Migration ADD COLUMN via_administracao |
| pacientes | `data_nasc` | `data_nascimento` | Migration ADD COLUMN data_nascimento |
| monitoramentos | (missing) | `status` | Migration ADD COLUMN status |
| glosas | (missing) | `paciente_id`, `clinica_id` | Migration ADD COLUMN |

## Tabela ausente
- `cotacoes` — não existe no Supabase. Rota retorna [] graciosamente até migration ser aplicado.

## Como aplicar
Execute `supabase-migration.sql` no Supabase Studio > SQL Editor.

**Why:** O schema foi criado antes do código ser estabilizado, gerando divergências. O código foi corrigido para usar os nomes reais com fallback para pós-migration. Não é possível conectar ao Supabase via psql sem a senha do banco (diferente da service role key).
