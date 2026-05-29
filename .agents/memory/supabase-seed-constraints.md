---
name: Seed data constraints Supabase HubWorkz
description: Constraints NOT NULL e CHECK nas tabelas principais; ordem correta de inserção para dados de seed.
---

## Campos required (NOT NULL) nas tabelas principais

| Tabela | Required | Observações |
|--------|----------|-------------|
| pacientes | id, clinica_id, nome, cpf, convenio | mandato_status tem CHECK — omitir (default 'aguardando') |
| processos | id, clinica_id, convenio | paciente_id é FK opcional no schema |
| notas_fiscais | id, clinica_id, numero_nf | entrega_status tem CHECK — omitir |
| monitoramentos | id | data_contato é timestamptz (não date) |
| medicamentos | clinica_id NOT NULL | |
| distribuidoras | clinica_id NOT NULL | |

## Ordem de inserção por FK

1. medicamentos
2. distribuidoras
3. pacientes (depende de medicamentos via medicamento_id)
4. processos (depende de pacientes, medicamentos, distribuidoras)
5. notas_fiscais (depende de processos, pacientes, distribuidoras)
6. monitoramentos (depende de processos e pacientes)
7. glosas (sem FK chain obrigatória)
8. di_messages (clinica_id e user_id devem ser UUIDs válidos — não strings)

## Valor de clinica_id para demo
Use UUID fixo: `00000000-0000-0000-0000-000000000001`

**Why:** Seed falhou múltiplas vezes por NOT NULL e CHECK constraints descobertos apenas em runtime. Documentar para evitar retrabalho.
