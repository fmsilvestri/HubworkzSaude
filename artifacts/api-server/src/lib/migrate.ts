export const MIGRATION_SQL = `
-- HubWorkz Saúde — execute no Supabase Studio > SQL Editor

CREATE TABLE IF NOT EXISTS cotacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Orçamento fields (from spreadsheet)
  data_cotacao date,
  nome_paciente text,
  origem_paciente text,
  convenio text,
  medicamento_nome text,
  tipo text,
  marca_laboratorio text,
  valor_importado text,
  frete_imposto text,
  total numeric(15,2),
  valor_noova numeric(15,2),
  valor_brasindice numeric(15,2),
  valor_enviado_convenio numeric(15,2),
  data_envio date,
  status text DEFAULT 'pendente',
  valor_aprovado numeric(15,2),
  imposto numeric(15,2),
  resultado numeric(15,2),
  -- Legacy/relation fields
  processo_id uuid,
  medicamento_id uuid,
  fornecedor_tipo text,
  fornecedor_id uuid,
  valor numeric(15,2),
  prazo_entrega text,
  recomendada boolean DEFAULT false,
  clinica_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS clinicas (
  id uuid DEFAULT '00000000-0000-0000-0000-000000000001' PRIMARY KEY,
  nome text DEFAULT 'HubWorkz Saúde',
  cnpj text,
  telefone text,
  whatsapp_gestor text,
  endereco text,
  cidade text,
  estado text,
  created_at timestamptz DEFAULT now() NOT NULL
);

INSERT INTO clinicas (id, nome) VALUES ('00000000-0000-0000-0000-000000000001', 'HubWorkz Saúde')
  ON CONFLICT (id) DO NOTHING;
`;
