import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

export default function Restrito() {
  const { profile } = useAuth();

  const MODULE_LABELS: Record<string, string> = {
    importador: "Pedidos e Rastreio",
    convenio: "Solicitações e Faturas",
    fornecedor: "Cotações",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-16 w-16 bg-[#F56E0F]/15 rounded-2xl flex items-center justify-center mb-6">
        <Shield className="h-8 w-8 text-[#F56E0F]" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
      <p className="text-white/50 mb-1">
        Seu perfil: <span className="text-white font-semibold capitalize">{profile?.role ?? "—"}</span>
      </p>
      <p className="text-white/40 text-sm">
        Módulo disponível: <span className="text-[#F56E0F]">{MODULE_LABELS[profile?.role ?? ""] ?? "Dashboard"}</span>
      </p>
      <div className="mt-8 bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6 max-w-sm w-full">
        <p className="text-white/60 text-sm">
          Você tem acesso apenas ao módulo referente ao seu perfil. 
          Para acesso completo ao sistema, entre em contato com o gestor da clínica.
        </p>
      </div>
    </div>
  );
}
