import type { Theme } from "@/hooks/useTheme";

export const PROCESS_STATUS: Record<Theme, Record<string, { bg: string; text: string }>> = {
  dark: {
    ativo:     { bg: "#0F2A1A", text: "#A5FFD6" },
    pendente:  { bg: "#2A1F0A", text: "#FBBF24" },
    cotacao:   { bg: "#2A1F0A", text: "#FBBF24" },
    concluido: { bg: "#0A1A2A", text: "#60A5FA" },
    cancelado: { bg: "#2A0A0A", text: "#F87171" },
  },
  light: {
    ativo:     { bg: "#D1FAE5", text: "#065F46" },
    pendente:  { bg: "#FEF3C7", text: "#92400E" },
    cotacao:   { bg: "#FEF3C7", text: "#92400E" },
    concluido: { bg: "#DBEAFE", text: "#1E40AF" },
    cancelado: { bg: "#FEE2E2", text: "#991B1B" },
  },
};

export const PROCESS_FASE: Record<Theme, { bg: string; text: string }> = {
  dark:  { bg: "#1B1B2A", text: "#A5A5FF" },
  light: { bg: "#EDE9FE", text: "#5B21B6" },
};

export const MONITOR_STATUS: Record<Theme, Record<string, { bg: string; text: string; label: string }>> = {
  dark: {
    agendado:  { bg: "#1A1A2A", text: "#A5A5FF", label: "Agendado" },
    realizado: { bg: "#0F2A1A", text: "#A5FFD6", label: "Realizado" },
    perdido:   { bg: "#2A0A0A", text: "#F87171", label: "Perdido" },
  },
  light: {
    agendado:  { bg: "#EDE9FE", text: "#5B21B6", label: "Agendado" },
    realizado: { bg: "#D1FAE5", text: "#065F46", label: "Realizado" },
    perdido:   { bg: "#FEE2E2", text: "#991B1B", label: "Perdido" },
  },
};

export const CONVENIO_BADGE: Record<Theme, { bg: string; text: string }> = {
  dark:  { bg: "#0A1A2A", text: "#60A5FA" },
  light: { bg: "#DBEAFE", text: "#1E40AF" },
};

export const MANDATO_BADGE: Record<Theme, { bg: string; text: string }> = {
  dark:  { bg: "#0F2A1A", text: "#A5FFD6" },
  light: { bg: "#D1FAE5", text: "#065F46" },
};

export const AVATAR_COLORS: Record<Theme, { bg: string; text: string }> = {
  dark:  { bg: "#2A1A0A", text: "#F56E0F" },
  light: { bg: "#FFF7ED", text: "#F56E0F" },
};
