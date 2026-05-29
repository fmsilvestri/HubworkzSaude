import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, CheckCircle, Truck, Package, Clock, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMELINE_MOCK = [
  { status: "Entregue", descricao: "Objeto entregue ao destinatário", local: "São Paulo, SP", data: "2025-05-20 14:32", done: true },
  { status: "Saiu para entrega", descricao: "Objeto saiu para entrega ao destinatário", local: "São Paulo, SP", data: "2025-05-20 08:15", done: true },
  { status: "Em transferência", descricao: "Objeto em transferência para unidade de distribuição", local: "Guarulhos, SP", data: "2025-05-19 22:10", done: true },
  { status: "Em trânsito", descricao: "Objeto encaminhado ao Brasil", local: "Miami, FL — EUA", data: "2025-05-17 16:45", done: true },
  { status: "Desembaraço aduaneiro", descricao: "Objeto em processo de desembaraço aduaneiro", local: "Aeroporto de Viracopos, Campinas", data: "2025-05-16 09:00", done: false },
];

const ICONS = [CheckCircle, Home, Truck, Package, Clock];

export default function Rastreio() {
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<typeof TIMELINE_MOCK | null>(null);

  const buscar = () => {
    if (!codigo.trim()) return;
    setBuscando(true);
    setTimeout(() => {
      setResultado(TIMELINE_MOCK);
      setBuscando(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rastreio de Remessa</h1>
        <p className="text-white/50 text-sm mt-1">Acompanhe o status de entrega em tempo real</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            data-testid="input-codigo-rastreio"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Digite o código de rastreio..."
            className="pl-10 bg-[#1B1B1E] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Button data-testid="button-buscar-rastreio" onClick={buscar} disabled={buscando || !codigo.trim()} className="bg-[#F56E0F] hover:bg-[#F56E0F]/80 text-white gap-2">
          <Search className="h-4 w-4" />
          {buscando ? "Buscando..." : "Rastrear"}
        </Button>
      </div>

      {resultado && (
        <div className="space-y-5">
          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-5 flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">Código de Rastreio</p>
              <p className="text-white font-mono font-bold">{codigo}</p>
            </div>
            <Badge className="bg-green-500/15 text-green-400 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" /> Entregue
            </Badge>
          </div>

          <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] p-6">
            <h3 className="text-white font-semibold mb-6">Linha do Tempo</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-6">
                {resultado.map((event, idx) => {
                  const Icon = ICONS[idx] ?? Clock;
                  return (
                    <div key={idx} data-testid={`timeline-event-${idx}`} className="flex gap-5 relative">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 z-10",
                        event.done ? "bg-[#F56E0F]/20 border border-[#F56E0F]/30" : "bg-white/5 border border-white/10"
                      )}>
                        <Icon className={cn("h-4 w-4", event.done ? "text-[#F56E0F]" : "text-white/30")} />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={cn("font-semibold text-sm", event.done ? "text-white" : "text-white/40")}>{event.status}</p>
                            <p className={cn("text-sm mt-0.5", event.done ? "text-white/60" : "text-white/30")}>{event.descricao}</p>
                            <p className="text-white/30 text-xs mt-1">{event.local}</p>
                          </div>
                          <span className="text-white/30 text-xs shrink-0">{event.data}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Button data-testid="button-notificar-paciente" variant="outline" className="border-[#F56E0F]/30 text-[#F56E0F] hover:bg-[#F56E0F]/10 gap-2">
            Notificar Paciente por WhatsApp
          </Button>
        </div>
      )}

      {!resultado && !buscando && (
        <div className="bg-[#1B1B1E] border border-white/10 rounded-[14px] py-16 text-center">
          <MapPin className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">Digite um código de rastreio para visualizar a linha do tempo</p>
        </div>
      )}
    </div>
  );
}
