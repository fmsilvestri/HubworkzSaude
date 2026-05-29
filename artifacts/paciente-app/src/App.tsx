import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePatientData } from "@/hooks/usePatientData";
import MobileLayout from "@/components/MobileLayout";
import Login from "@/pages/Login";
import Inicio from "@/pages/Inicio";
import MeuProcesso from "@/pages/MeuProcesso";
import MinhasRemessas from "@/pages/MinhasRemessas";
import Consultas from "@/pages/Consultas";
import Documentos from "@/pages/Documentos";
import DiIA from "@/pages/DiIA";
import { Loader2, Heart } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
});

function LoadingScreen() {
  return (
    <div
      className="mobile-container flex flex-col items-center justify-center min-h-dvh"
      style={{ background: "#fff" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#F56E0F" }}
      >
        <Heart size={26} color="#fff" fill="#fff" />
      </div>
      <Loader2 size={24} className="animate-spin" style={{ color: "#F56E0F" }} />
      <p className="text-sm mt-3" style={{ color: "#9CA3AF" }}>
        Carregando seus dados...
      </p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      className="mobile-container flex flex-col items-center justify-center min-h-dvh px-8 text-center"
      style={{ background: "#fff" }}
    >
      <p className="text-sm" style={{ color: "#EF4444" }}>
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: "#F56E0F", color: "#fff" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}

function AppRoutes() {
  const { user, role, loading: authLoading } = useAuth();
  const { data: paciente, loading: dataLoading, error } = usePatientData(
    user && role === "paciente" ? user : null
  );

  if (authLoading) return <LoadingScreen />;

  if (!user || role !== "paciente") {
    return <Login />;
  }

  if (dataLoading) return <LoadingScreen />;

  if (error || !paciente) {
    return <ErrorScreen message={error ?? "Não foi possível carregar seus dados."} />;
  }

  return (
    <MobileLayout>
      <Switch>
        <Route path="/" component={() => <Inicio paciente={paciente} />} />
        <Route path="/processo" component={() => <MeuProcesso paciente={paciente} />} />
        <Route path="/remessas" component={() => <MinhasRemessas paciente={paciente} />} />
        <Route path="/consultas" component={() => <Consultas paciente={paciente} />} />
        <Route path="/documentos" component={() => <Documentos paciente={paciente} />} />
        <Route path="/di-ia" component={() => <DiIA paciente={paciente} />} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRoutes />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
