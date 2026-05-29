import { FileText, Download, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PacienteCompleto } from "@/hooks/usePatientData";

interface Props {
  paciente: PacienteCompleto;
}

interface Documento {
  id: string;
  titulo: string;
  descricao: string;
  disponivel: boolean;
  storagePath?: string;
}

function buildDocumentos(paciente: PacienteCompleto): Documento[] {
  const processo = paciente.processo;
  const remessas = paciente.remessas ?? [];

  return [
    {
      id: "laudo",
      titulo: "Laudo médico",
      descricao: "Documento do seu médico com o diagnóstico",
      disponivel: !!processo,
      storagePath: processo ? `pacientes/${paciente.id}/laudo.pdf` : undefined,
    },
    {
      id: "prescricao",
      titulo: "Prescrição médica",
      descricao: "Receita médica com o seu tratamento",
      disponivel: !!processo,
      storagePath: processo ? `pacientes/${paciente.id}/prescricao.pdf` : undefined,
    },
    {
      id: "mandato",
      titulo: "Mandato assinado",
      descricao: "Autorização do seu convênio para o tratamento",
      disponivel: !!paciente.convenio,
      storagePath: paciente.convenio ? `pacientes/${paciente.id}/mandato.pdf` : undefined,
    },
    {
      id: "declaracao",
      titulo: "Declaração de ciência",
      descricao: "Documento que você assinou antes de iniciar o tratamento",
      disponivel: !!processo,
      storagePath: processo ? `pacientes/${paciente.id}/declaracao.pdf` : undefined,
    },
    ...remessas.slice(0, 3).map((r, i) => ({
      id: `nf-${r.id}`,
      titulo: r.numero ? `Nota Fiscal NF ${r.numero}` : `Nota Fiscal ${i + 1}`,
      descricao: `Comprovante de entrega — ${new Date(r.created_at).toLocaleDateString("pt-BR")}`,
      disponivel: !!r.numero,
      storagePath: r.numero ? `pacientes/${paciente.id}/nf_${r.numero}.pdf` : undefined,
    })),
  ];
}

async function downloadDocumento(storagePath: string, titulo: string) {
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    alert("Documento não disponível no momento. Fale com a clínica.");
    return;
  }

  const link = document.createElement("a");
  link.href = data.signedUrl;
  link.download = `${titulo}.pdf`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function Documentos({ paciente }: Props) {
  const documentos = buildDocumentos(paciente);

  return (
    <div>
      <div className="page-header">
        <h1 className="text-lg font-bold" style={{ color: "#1A1A2E" }}>
          Meus Documentos
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
          Toque em um documento disponível para baixar
        </p>
      </div>

      <div className="px-4 pt-4 pb-4 flex flex-col gap-2">
        {documentos.map((doc) => (
          <button
            key={doc.id}
            disabled={!doc.disponivel}
            onClick={() => {
              if (doc.disponivel && doc.storagePath) {
                downloadDocumento(doc.storagePath, doc.titulo);
              }
            }}
            className="card-p p-4 w-full text-left transition-all active:scale-[0.98]"
            style={{ opacity: doc.disponivel ? 1 : 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: doc.disponivel ? "#FFF7ED" : "#F9FAFB" }}
              >
                <FileText size={18} style={{ color: doc.disponivel ? "#F56E0F" : "#D1D5DB" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: doc.disponivel ? "#1A1A2E" : "#9CA3AF" }}>
                  {doc.titulo}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "#9CA3AF" }}>
                  {doc.descricao}
                </p>
              </div>
              <div className="shrink-0 ml-2">
                {doc.disponivel ? (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "#F56E0F" }}
                  >
                    <Download size={14} color="#fff" />
                  </div>
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "#F3F4F6" }}
                  >
                    <Clock size={14} style={{ color: "#D1D5DB" }} />
                  </div>
                )}
              </div>
            </div>
            {!doc.disponivel && (
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className="pill-badge"
                  style={{ background: "#FEF3C7", color: "#92400E" }}
                >
                  Pendente
                </span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>
                  A clínica irá disponibilizar em breve
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
