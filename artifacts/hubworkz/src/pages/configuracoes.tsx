import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, AlertCircle, Key, Building2, Activity, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INTEGRATIONS = [
  { name: "Supabase", desc: "Banco de dados e autenticação", icon: Database, status: "conectado", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/20" },
  { name: "Anthropic — Di IA", desc: "Assistente de IA (claude-sonnet-4-5)", icon: Activity, status: "conectado", color: "text-[#A5FFD6]", bg: "bg-[rgba(63,52,137,0.3)]", border: "border-[#3C3489]/40" },
  { name: "Evolution API (WhatsApp)", desc: "Mensagens automáticas D30", icon: Activity, status: "desconectado", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/20" },
];

export default function Configuracoes() {
  const { toast } = useToast();
  const [clinicaNome, setClinicaNome] = useState("");
  const [clinicaCNPJ, setClinicaCNPJ] = useState("");
  const [clinicaEmail, setClinicaEmail] = useState("");
  const [clinicaEndereco, setClinicaEndereco] = useState("");
  const [clinicaWhatsapp, setClinicaWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clinica")
      .then((r) => r.json())
      .then((d) => {
        setClinicaNome(d.nome ?? "");
        setClinicaCNPJ(d.cnpj ?? "");
        setClinicaEmail(d.email ?? "");
        setClinicaEndereco(d.endereco ?? "");
        setClinicaWhatsapp(d.whatsapp_gestor ?? "");
      })
      .catch(() => {
        toast({ title: "Erro ao carregar dados da clínica", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!clinicaNome.trim()) {
      toast({ title: "Razão Social é obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/clinica", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: clinicaNome,
          cnpj: clinicaCNPJ,
          email: clinicaEmail,
          endereco: clinicaEndereco,
          whatsapp_gestor: clinicaWhatsapp,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      toast({ title: "Dados da clínica salvos com sucesso" });
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-white/50 text-sm mt-1">Dados da clínica e integrações do sistema</p>
      </div>

      {/* Clinic Data */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="h-4 w-4 text-[#F56E0F]" />
          <h3 className="text-white font-semibold">Dados da Clínica</h3>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm block mb-1.5">Razão Social</label>
              <Input
                data-testid="input-clinica-nome"
                value={clinicaNome}
                onChange={(e) => setClinicaNome(e.target.value)}
                placeholder="Nome da clínica..."
                className="bg-[#0F0F12] border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/60 text-sm block mb-1.5">CNPJ</label>
                <Input
                  data-testid="input-clinica-cnpj"
                  value={clinicaCNPJ}
                  onChange={(e) => setClinicaCNPJ(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="bg-[#0F0F12] border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">Email</label>
                <Input
                  data-testid="input-clinica-email"
                  value={clinicaEmail}
                  onChange={(e) => setClinicaEmail(e.target.value)}
                  placeholder="contato@clinica.com.br"
                  className="bg-[#0F0F12] border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-1.5">Endereço</label>
              <Input
                data-testid="input-clinica-endereco"
                value={clinicaEndereco}
                onChange={(e) => setClinicaEndereco(e.target.value)}
                placeholder="Rua, número, bairro, cidade — UF"
                className="bg-[#0F0F12] border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-1.5">WhatsApp do Responsável / Gestor</label>
              <Input
                data-testid="input-clinica-whatsapp"
                value={clinicaWhatsapp}
                onChange={(e) => setClinicaWhatsapp(e.target.value)}
                placeholder="(00) 90000-0000"
                className="bg-[#0F0F12] border-white/10 text-white"
              />
            </div>

            <Button
              data-testid="button-save-clinica"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Dados da Clínica
            </Button>
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="h-4 w-4 text-[#F56E0F]" />
          <h3 className="text-white font-semibold">Status das Integrações</h3>
        </div>
        <div className="space-y-4">
          {INTEGRATIONS.map((int) => (
            <div key={int.name} data-testid={`integration-${int.name}`} className={`flex items-center justify-between p-4 rounded-xl border ${int.bg} ${int.border}`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center">
                  <int.icon className={`h-4 w-4 ${int.color}`} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{int.name}</p>
                  <p className="text-white/40 text-xs">{int.desc}</p>
                </div>
              </div>
              <Badge className={`border text-xs gap-1 ${int.bg} ${int.color} ${int.border}`}>
                {int.status === "conectado" ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {int.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key className="h-4 w-4 text-[#F56E0F]" />
          <h3 className="text-white font-semibold">Chaves de API</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "SUPABASE_URL" },
            { label: "SUPABASE_ANON_KEY" },
            { label: "ANTHROPIC_API_KEY" },
          ].map(({ label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">{label}</p>
                <Input value="••••••••••••••••••••••••••••••••" readOnly className="bg-[#0F0F12] border-white/10 text-white/40 font-mono text-xs cursor-not-allowed" />
              </div>
              <Badge className="bg-green-500/15 text-green-400 border-green-500/20 shrink-0 mt-5">Configurada</Badge>
            </div>
          ))}
        </div>
        <p className="text-white/30 text-xs mt-4">As chaves são gerenciadas via variáveis de ambiente. Use o painel Secrets do Replit para atualizá-las.</p>
      </div>
    </div>
  );
}
