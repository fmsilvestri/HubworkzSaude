import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MobileLayout from "@/components/MobileLayout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Processos from "@/pages/Processos";
import Pacientes from "@/pages/Pacientes";
import Monitoramento from "@/pages/Monitoramento";
import DiIA from "@/pages/DiIA";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="mobile-container flex items-center justify-center min-h-dvh"
        style={{ background: "#151419" }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "#F56E0F" }} />
      </div>
    );
  }

  if (!user || role !== "gestor") {
    return <Login />;
  }

  return (
    <MobileLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/processos" component={Processos} />
        <Route path="/pacientes" component={Pacientes} />
        <Route path="/monitoramento" component={Monitoramento} />
        <Route path="/di-ia" component={DiIA} />
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
