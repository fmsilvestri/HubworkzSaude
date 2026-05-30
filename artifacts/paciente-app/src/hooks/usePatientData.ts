import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

/**
 * Busca os dados do paciente logado via backend API (/api/paciente/me).
 * O backend usa service role e contorna o RLS do Supabase.
 */
export function usePatientData(user: User | null) {
  const [data, setData] = useState<PacienteCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Obter token JWT da sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setError("Sessão expirada. Faça login novamente.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/paciente/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          setError("Nenhum cadastro encontrado para este usuário. Entre em contato com a clínica.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          setError(body.error ?? "Não conseguimos carregar seus dados. Tente novamente.");
          setLoading(false);
          return;
        }

        const paciente = await res.json() as PacienteCompleto;
        setData(paciente);
      } catch {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return { data, loading, error };
}
