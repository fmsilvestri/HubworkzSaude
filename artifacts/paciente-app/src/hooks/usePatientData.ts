import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface Medicamento {
  id: string;
  nome: string;
  concentracao?: string | null;
  via_administracao?: string | null;
  conservacao?: string | null;
  forma_farmaceutica?: string | null;
}

export interface Processo {
  id: string;
  status: string;
  fase_atual: number;
  numero_protocolo?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface NotaFiscal {
  id: string;
  numero?: string | null;
  status?: string | null;
  data_emissao?: string | null;
  codigo_rastreio?: string | null;
  previsao_entrega?: string | null;
  created_at: string;
}

export interface Monitoramento {
  id: string;
  status: string;
  data_contato?: string | null;
  canal?: string | null;
  observacoes?: string | null;
  created_at: string;
}

export interface PacienteCompleto {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  convenio?: string | null;
  diagnostico?: string | null;
  data_nascimento?: string | null;
  medicamento?: Medicamento | null;
  processo?: Processo | null;
  remessas?: NotaFiscal[];
  monitoramentos?: Monitoramento[];
}

export function usePatientData(user: User | null) {
  const [data, setData] = useState<PacienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      const { data: paciente, error: err } = await supabase
        .from("pacientes")
        .select(`
          id, nome, email, telefone, convenio, diagnostico, data_nascimento,
          medicamento:medicamentos(id, nome, concentracao, via_administracao, conservacao, forma_farmaceutica),
          processo:processos(id, status, fase_atual, numero_protocolo, observacoes, created_at, updated_at),
          remessas:notas_fiscais(id, numero, status, data_emissao, codigo_rastreio, previsao_entrega, created_at),
          monitoramentos:monitoramentos(id, status, data_contato, canal, observacoes, created_at)
        `)
        .eq("user_id", user!.id)
        .single();

      if (err) {
        setError("Não conseguimos carregar seus dados. Tente novamente.");
        setLoading(false);
        return;
      }

      setData(paciente as unknown as PacienteCompleto);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  return { data, loading, error };
}
