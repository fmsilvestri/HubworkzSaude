import { useState } from "react";
import { signIn } from "@/hooks/useAuth";
import { Heart } from "lucide-react";

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
      setError("Email ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.["role"];
    if (role !== "paciente") {
      await import("@/lib/supabase").then(({ supabase }) => supabase.auth.signOut());
      setError("Este app é exclusivo para pacientes.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh" style={{ background: "#fff" }}>
      <div
        className="flex flex-col items-center pt-16 pb-8 px-6"
        style={{
          background: "linear-gradient(160deg, #FFF7ED 0%, #fff 60%)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
          style={{ background: "#F56E0F" }}
        >
          <Heart size={28} color="#fff" fill="#fff" />
        </div>
        <h1 className="text-2xl font-bold text-center" style={{ color: "#1A1A2E" }}>
          HubWorkz Saúde
        </h1>
        <p className="text-sm text-center mt-1" style={{ color: "#6B7280" }}>
          Seu portal de acompanhamento do tratamento
        </p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
              style={{ background: "#F8F8FA", border: "1.5px solid #E5E7EB", color: "#1A1A2E" }}
              onFocus={(e) => (e.target.style.borderColor = "#F56E0F")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
              Senha
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
              style={{ background: "#F8F8FA", border: "1.5px solid #E5E7EB", color: "#1A1A2E" }}
              onFocus={(e) => (e.target.style.borderColor = "#F56E0F")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-4 text-sm font-bold tracking-wide mt-2 transition-all shadow-sm"
            style={{
              background: loading ? "#FDBA74" : "#F56E0F",
              color: "#fff",
            }}
          >
            {loading ? "Entrando..." : "Acessar meu portal"}
          </button>
        </form>

        <p className="text-xs text-center mt-8" style={{ color: "#D1D5DB" }}>
          Problemas para acessar? Fale com a clínica.
        </p>
      </div>
    </div>
  );
}
