-- ============================================================
-- HubWorkz Saúde — Migration Completo
-- Execute este script no Supabase Studio > SQL Editor
-- ============================================================

-- ── 1. PROCESSOS ─────────────────────────────────────────────
ALTER TABLE processos ADD COLUMN IF NOT EXISTS fase_atual integer;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS numero_protocolo text;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS convenio text;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS medicamento_id uuid REFERENCES medicamentos(id) ON DELETE SET NULL;
UPDATE processos SET fase_atual = fase WHERE fase_atual IS NULL;

-- Corrige o check constraint de status para aceitar todos os valores usados pela aplicação
ALTER TABLE processos DROP CONSTRAINT IF EXISTS processos_status_check;
ALTER TABLE processos ADD CONSTRAINT processos_status_check
  CHECK (status IN (
    'pendente','solicitado','cotacao','em_andamento',
    'ativo','aprovado','concluido','cancelado','importado'
  ));

-- ── 2. NOTAS_FISCAIS ─────────────────────────────────────────
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS valor_total numeric(12,2);
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS convenio_id uuid;
UPDATE notas_fiscais SET status = nf_status WHERE status IS NULL;
UPDATE notas_fiscais SET numero = numero_nf WHERE numero IS NULL;
UPDATE notas_fiscais SET valor_total = valor WHERE valor_total IS NULL;

-- ── 3. MEDICAMENTOS ──────────────────────────────────────────
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS concentracao text;
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS via_administracao text;
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS forma_farmaceutica text;
UPDATE medicamentos SET concentracao = apresentacao WHERE concentracao IS NULL;
UPDATE medicamentos SET via_administracao = modo_uso WHERE via_administracao IS NULL;

-- ── 4. PACIENTES ─────────────────────────────────────────────
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS data_nascimento date;
UPDATE pacientes SET data_nascimento = data_nasc::date WHERE data_nascimento IS NULL;

-- ── 5. MONITORAMENTOS ────────────────────────────────────────
ALTER TABLE monitoramentos ADD COLUMN IF NOT EXISTS status text DEFAULT 'agendado';

-- ── 6. GLOSAS ────────────────────────────────────────────────
ALTER TABLE glosas ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES pacientes(id);
ALTER TABLE glosas ADD COLUMN IF NOT EXISTS clinica_id uuid;

-- ── 7. CRIAR TABELA COTACOES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS cotacoes (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id       uuid        REFERENCES processos(id) ON DELETE CASCADE,
  distribuidora_id  uuid        REFERENCES distribuidoras(id),
  clinica_id        uuid,
  medicamento_nome  text,
  quantidade        integer     DEFAULT 1,
  valor_unitario    numeric(12,2),
  valor_total       numeric(12,2),
  prazo_entrega     text,
  status            text        DEFAULT 'pendente'
                                CHECK (status IN ('pendente','aprovada','recusada','expirada')),
  observacoes       text,
  vencimento        date,
  selecionada       boolean     DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- ── 8. RLS — COTACOES ────────────────────────────────────────
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cotacoes' AND policyname = 'authenticated_all'
  ) THEN
    EXECUTE 'CREATE POLICY authenticated_all ON cotacoes FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ── 9. RLS — GARANTIR ACESSO AUTENTICADO EM TODAS AS TABELAS ─
-- Processos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'processos' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON processos FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Pacientes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Medicamentos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medicamentos' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON medicamentos FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Distribuidoras
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'distribuidoras' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON distribuidoras FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Notas Fiscais
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notas_fiscais' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON notas_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Glosas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'glosas' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON glosas FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Monitoramentos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monitoramentos' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON monitoramentos FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Di Messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'di_messages' AND policyname = 'authenticated_all') THEN
    EXECUTE 'CREATE POLICY authenticated_all ON di_messages FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ── 10. SEED DE DADOS DEMO ────────────────────────────────────
-- Medicamento
INSERT INTO medicamentos (id, nome, principio_ativo, concentracao, via_administracao, apresentacao, modo_uso, conservacao, forma_farmaceutica, ativo)
VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Pembrolizumabe 25mg/mL',
  'Pembrolizumabe',
  '25 mg/mL',
  'Infusão IV lenta (30 min)',
  'Frasco-ampola 4mL (100mg)',
  'Diluir em SF 0,9% ou SG 5%. Infundir em 30 minutos com filtro 0,2-5 µm.',
  'Refrigerado entre 2°C e 8°C. Proteger da luz. Não congelar.',
  'Solução para infusão',
  true
) ON CONFLICT (id) DO NOTHING;

-- Distribuidora
INSERT INTO distribuidoras (id, nome, cnpj, uf, email, telefone, ativo)
VALUES (
  'b2c3d4e5-0002-0002-0002-000000000002',
  'OncoFarma Distribuidora',
  '12.345.678/0001-90',
  'SP',
  'pedidos@oncofarma.com.br',
  '(11) 3000-1234',
  true
) ON CONFLICT (id) DO NOTHING;

-- Paciente demo (sem user_id — para testes do gestor)
INSERT INTO pacientes (id, nome, email, telefone, convenio, diagnostico, data_nasc, data_nascimento, medicamento_id, mandato_status, ativo)
VALUES (
  'c3d4e5f6-0003-0003-0003-000000000003',
  'Maria Silva Ferreira',
  'maria.silva@email.com',
  '(11) 98765-4321',
  'Unimed Nacional',
  'Neoplasia maligna de pulmão — CID10 C34',
  '1968-03-15',
  '1968-03-15',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'ativo',
  true
) ON CONFLICT (id) DO NOTHING;

-- Processo demo
INSERT INTO processos (id, paciente_id, medicamento_id, distribuidora_id, status, fase, fase_atual, numero_protocolo, observacoes)
VALUES (
  'd4e5f6a7-0004-0004-0004-000000000004',
  'c3d4e5f6-0003-0003-0003-000000000003',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'b2c3d4e5-0002-0002-0002-000000000002',
  'cotacao',
  1,
  1,
  'HW-2026-001',
  'Processo iniciado — aguardando cotação de fornecedores.'
) ON CONFLICT (id) DO NOTHING;

-- Nota Fiscal demo
INSERT INTO notas_fiscais (id, processo_id, paciente_id, distribuidora_id, numero_nf, numero, data_emissao, valor, valor_total, nf_status, status, codigo_rastreio, previsao_entrega, entrega_status)
VALUES (
  'e5f6a7b8-0005-0005-0005-000000000005',
  'd4e5f6a7-0004-0004-0004-000000000004',
  'c3d4e5f6-0003-0003-0003-000000000003',
  'b2c3d4e5-0002-0002-0002-000000000002',
  'NF-2026-4521',
  'NF-2026-4521',
  NOW()::date,
  18750.00,
  18750.00,
  'transito',
  'transito',
  'BR123456789BR',
  (NOW() + INTERVAL '3 days')::date,
  'transito'
) ON CONFLICT (id) DO NOTHING;

-- Monitoramento D30 demo
INSERT INTO monitoramentos (id, processo_id, paciente_id, data_contato, canal, status, observacoes)
VALUES (
  'f6a7b8c9-0006-0006-0006-000000000006',
  'd4e5f6a7-0004-0004-0004-000000000004',
  'c3d4e5f6-0003-0003-0003-000000000003',
  (NOW() + INTERVAL '5 days')::date,
  'whatsapp',
  'agendado',
  'D30 — verificar adesão e eventos adversos do ciclo 3.'
) ON CONFLICT (id) DO NOTHING;

-- Glosa demo
INSERT INTO glosas (id, paciente_id, motivo, valor, prazo_recurso, status)
VALUES (
  'a7b8c9d0-0007-0007-0007-000000000007',
  'c3d4e5f6-0003-0003-0003-000000000003',
  'Documentação incompleta — falta laudo médico atualizado',
  2500.00,
  (NOW() + INTERVAL '10 days')::date,
  'aberta'
) ON CONFLICT (id) DO NOTHING;

-- Cotação demo
INSERT INTO cotacoes (id, processo_id, distribuidora_id, medicamento_nome, quantidade, valor_unitario, valor_total, prazo_entrega, status)
VALUES (
  'b8c9d0e1-0008-0008-0008-000000000008',
  'd4e5f6a7-0004-0004-0004-000000000004',
  'b2c3d4e5-0002-0002-0002-000000000002',
  'Pembrolizumabe 25mg/mL',
  3,
  6250.00,
  18750.00,
  '7 dias úteis',
  'pendente'
) ON CONFLICT (id) DO NOTHING;

SELECT 'Migration aplicado com sucesso!' as resultado;

-- ============================================================
-- TABELA: clinicas
-- ============================================================
CREATE TABLE IF NOT EXISTS clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registro padrão da clínica (ID fixo usado pelo sistema)
INSERT INTO clinicas (id, nome, cnpj, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clínica HubWorkz',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna whatsapp_gestor na tabela clinicas (se não existir)
ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS whatsapp_gestor TEXT;
