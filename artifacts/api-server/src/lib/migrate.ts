export const MIGRATION_SQL = `
-- HubWorkz Saúde — run this in Supabase Studio > SQL Editor

CREATE TABLE IF NOT EXISTS cotacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id uuid,
  medicamento_id uuid,
  fornecedor_tipo text,
  fornecedor_id uuid,
  valor numeric(15,2),
  prazo_entrega text,
  status text DEFAULT 'pendente',
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
