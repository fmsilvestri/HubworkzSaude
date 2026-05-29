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

      const { data: pacienteRow, error: err } = await supabase
        .from("pacientes")
        .select(`
          id, nome, email, telefone, convenio, diagnostico,
          data_nascimento, data_nasc,
          medicamento_id,
          medicamento:medicamentos(
            id, nome, concentracao, apresentacao,
            via_administracao, modo_uso,
            conservacao, forma_farmaceutica
          )
        `)
        .eq("user_id", user!.id)
        .single();

      if (err || !pacienteRow) {
        setError("Não conseguimos carregar seus dados. Tente novamente.");
        setLoading(false);
        return;
      }

      const row = pacienteRow as Record<string, unknown>;
      const pacienteId = row.id as string;

      const [processosRes, remessasRes, monitoramentosRes] = await Promise.all([
        supabase
          .from("processos")
          .select("id, status, fase_atual, fase, numero_protocolo, observacoes, created_at, updated_at")
          .eq("paciente_id", pacienteId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("notas_fiscais")
          .select("id, numero, numero_nf, status, nf_status, data_emissao, codigo_rastreio, previsao_entrega, created_at")
          .eq("paciente_id", pacienteId)
          .order("created_at", { ascending: false }),
        supabase
          .from("monitoramentos")
          .select("id, status, data_contato, canal, observacoes, created_at")
          .eq("paciente_id", pacienteId)
          .order("data_contato", { ascending: true }),
      ]);

      const rawMed = row.medicamento as Record<string, unknown> | null;
      const medicamento: Medicamento | null = rawMed
        ? {
            id: rawMed.id as string,
            nome: rawMed.nome as string,
            concentracao: (rawMed.concentracao ?? rawMed.apresentacao) as string | null,
            via_administracao: (rawMed.via_administracao ?? rawMed.modo_uso) as string | null,
            conservacao: rawMed.conservacao as string | null,
            forma_farmaceutica: rawMed.forma_farmaceutica as string | null,
          }
        : null;

      const rawProcesso = (processosRes.data ?? [])[0] as Record<string, unknown> | undefined;
      const processo: Processo | null = rawProcesso
        ? {
            id: rawProcesso.id as string,
            status: rawProcesso.status as string,
            fase_atual: (rawProcesso.fase_atual ?? rawProcesso.fase ?? 1) as number,
            numero_protocolo: rawProcesso.numero_protocolo as string | null,
            observacoes: rawProcesso.observacoes as string | null,
            created_at: rawProcesso.created_at as string,
            updated_at: rawProcesso.updated_at as string | null,
          }
        : null;

      const remessas: NotaFiscal[] = (remessasRes.data ?? []).map((r) => {
        const nr = r as Record<string, unknown>;
        return {
          id: nr.id as string,
          numero: (nr.numero ?? nr.numero_nf) as string | null,
          status: (nr.status ?? nr.nf_status) as string | null,
          data_emissao: nr.data_emissao as string | null,
          codigo_rastreio: nr.codigo_rastreio as string | null,
          previsao_entrega: nr.previsao_entrega as string | null,
          created_at: nr.created_at as string,
        };
      });

      const monitoramentos: Monitoramento[] = (monitoramentosRes.data ?? []).map((m) => {
        const mr = m as Record<string, unknown>;
        return {
          id: mr.id as string,
          status: (mr.status ?? "agendado") as string,
          data_contato: mr.data_contato as string | null,
          canal: mr.canal as string | null,
          observacoes: mr.observacoes as string | null,
          created_at: mr.created_at as string,
        };
      });

      const paciente: PacienteCompleto = {
        id: row.id as string,
        nome: row.nome as string,
        email: row.email as string | null,
        telefone: row.telefone as string | null,
        convenio: row.convenio as string | null,
        diagnostico: row.diagnostico as string | null,
        data_nascimento: (row.data_nascimento ?? row.data_nasc) as string | null,
        medicamento,
        processo,
        remessas,
        monitoramentos,
      };

      setData(paciente);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  return { data, loading, error };
}
