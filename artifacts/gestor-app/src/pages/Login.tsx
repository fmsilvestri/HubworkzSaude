import { useState } from "react";
import { signIn } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await signIn(email, password);

    if (authError) {
      setError("Email ou senha inválidos.");
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.["role"];
    if (role !== "gestor") {
      await import("@/lib/supabase").then(({ supabase }) => supabase.auth.signOut());
      setError("Acesso restrito. Este app é exclusivo para gestores.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="mobile-container flex flex-col justify-between min-h-dvh">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                style={{ background: "#F56E0F" }}
              >
                HW
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ color: "var(--t-text-1)" }}>
                HubWorkz
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--t-text-4)" }}>
              Gestão Oncológica — App Gestor
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--t-text-4)" }}>
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--t-surface)",
                  border: "1px solid var(--t-border)",
                  color: "var(--t-text-1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#F56E0F")}
                onBlur={(e) => (e.target.style.borderColor = "var(--t-border)")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--t-text-4)" }}>
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--t-surface)",
                  border: "1px solid var(--t-border)",
                  color: "var(--t-text-1)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#F56E0F")}
                onBlur={(e) => (e.target.style.borderColor = "var(--t-border)")}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "#2A1515", border: "1px solid #7F1D1D", color: "#FCA5A5" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-opacity mt-2"
              style={{
                background: loading ? "#7A370A" : "#F56E0F",
                color: "#fff",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>

      <div className="pb-8 text-center">
        <p className="text-[10px]" style={{ color: "var(--t-text-6)" }}>
          HubWorkz Saúde — Intermediação Farmacêutica Oncológica
        </p>
      </div>
    </div>
  );
}
