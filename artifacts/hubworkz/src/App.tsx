import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Processos from "@/pages/processos";
import Pacientes from "@/pages/pacientes";
import Medicamentos from "@/pages/medicamentos";
import Distribuidoras from "@/pages/distribuidoras";
import Faturamento from "@/pages/faturamento";
import Glosas from "@/pages/glosas";
import Monitoramento from "@/pages/monitoramento";
import Cotacao from "@/pages/cotacao";
import DiIA from "@/pages/di-ia";
import Mandatos from "@/pages/mandatos";
import Declaracoes from "@/pages/declaracoes";
import Recebimento from "@/pages/recebimento";
import Pedidos from "@/pages/pedidos";
import Rastreio from "@/pages/rastreio";
import Configuracoes from "@/pages/configuracoes";
import Restrito from "@/pages/restrito";
import PacientePortal from "@/pages/paciente-portal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Carregando HubWorkz Saúde...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!profile) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Root redirect based on role */}
      <Route path="/">
        {() => {
          if (!profile) return <Redirect to="/login" />;
          if (profile.role === "paciente") return <Redirect to="/paciente" />;
          if (["importador", "convenio", "fornecedor"].includes(profile.role)) return <Redirect to="/restrito" />;
          return <Redirect to="/dashboard" />;
        }}
      </Route>

      {/* Master Desktop — gestor, farmaceutico, faturamento */}
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/processos">{() => <ProtectedRoute component={Processos} />}</Route>
      <Route path="/pacientes">{() => <ProtectedRoute component={Pacientes} />}</Route>
      <Route path="/medicamentos">{() => <ProtectedRoute component={Medicamentos} />}</Route>
      <Route path="/distribuidoras">{() => <ProtectedRoute component={Distribuidoras} />}</Route>
      <Route path="/mandatos">{() => <ProtectedRoute component={Mandatos} />}</Route>
      <Route path="/declaracoes">{() => <ProtectedRoute component={Declaracoes} />}</Route>
      <Route path="/monitoramento">{() => <ProtectedRoute component={Monitoramento} />}</Route>
      <Route path="/cotacao">{() => <ProtectedRoute component={Cotacao} />}</Route>
      <Route path="/recebimento">{() => <ProtectedRoute component={Recebimento} />}</Route>
      <Route path="/faturamento">{() => <ProtectedRoute component={Faturamento} />}</Route>
      <Route path="/glosas">{() => <ProtectedRoute component={Glosas} />}</Route>
      <Route path="/pedidos">{() => <ProtectedRoute component={Pedidos} />}</Route>
      <Route path="/rastreio">{() => <ProtectedRoute component={Rastreio} />}</Route>
      <Route path="/di-ia">{() => <ProtectedRoute component={DiIA} />}</Route>
      <Route path="/configuracoes">{() => <ProtectedRoute component={Configuracoes} />}</Route>

      {/* Restricted access roles */}
      <Route path="/restrito">{() => <ProtectedRoute component={Restrito} />}</Route>

      {/* Patient portal */}
      <Route path="/paciente">{() => <ProtectedRoute component={PacientePortal} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
