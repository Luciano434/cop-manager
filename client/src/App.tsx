import Usuarios from "./pages/Usuarios";
import Login from "@/pages/Login";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/components/DashboardLayout";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Procedimentos from "./pages/Procedimentos";
import ProcedureDetail from "./pages/ProcedureDetail";
import DashboardCOP from "./pages/DashboardCOP";
import Requisitos from "./pages/Requisitos";
import Evidencias from "./pages/Evidencias";
import Projetos from "./pages/Projetos";
import ProjetoDetalhe from "./pages/ProjetoDetalhe";
import RelatorioAuditoria from "./pages/RelatorioAuditoria";
import RelatorioExecutivo from "./pages/RelatorioExecutivo";
import ImportarProcedimento from "./pages/ImportarProcedimento";
import NovoProcedimento from "./pages/NovoProcedimento";
import { ProjectProvider } from "./contexts/ProjectContext";

type UserRole = "USUARIO" | "ENGENHARIA" | "QUALIDADE" | "AUDITOR" | "ADMIN";

type LoggedUser = {
  username: string;
  name: string;
  role: UserRole;
};

function getLoggedUser(): LoggedUser | null {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    return JSON.parse(storedUser) as LoggedUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const user = getLoggedUser();

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/procedimentos" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        {() => {
          const user = getLoggedUser();

          if (!user) {
            return <Redirect to="/login" />;
          }

          return (
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          );
        }}
      </Route>

      <Route path="/procedimentos">
        {() => (
          <ProtectedRoute>
            <Procedimentos />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/procedimentos/:code">
        {() => (
          <ProtectedRoute>
            <ProcedureDetail />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/novo-procedimento">
        {() => (
          <ProtectedRoute allowedRoles={["ENGENHARIA", "ADMIN"]}>
            <NovoProcedimento />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/importar-procedimento">
        {() => (
          <ProtectedRoute allowedRoles={["ENGENHARIA", "ADMIN"]}>
            <ImportarProcedimento />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard-cop">
        {() => (
          <ProtectedRoute allowedRoles={["QUALIDADE", "AUDITOR", "ADMIN"]}>
            <DashboardCOP />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/relatorio-executivo">
        {() => (
          <ProtectedRoute allowedRoles={["QUALIDADE", "AUDITOR", "ADMIN"]}>
            <RelatorioExecutivo />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/relatorio-auditoria">
        {() => (
          <ProtectedRoute allowedRoles={["QUALIDADE", "AUDITOR", "ADMIN"]}>
            <RelatorioAuditoria />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/projetos">
        {() => (
          <ProtectedRoute>
            <Projetos />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/projetos/:id">
        {() => (
          <ProtectedRoute>
            <ProjetoDetalhe />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/requisitos">
        {() => (
          <ProtectedRoute allowedRoles={["ENGENHARIA", "QUALIDADE", "AUDITOR", "ADMIN"]}>
            <Requisitos />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/evidencias">
        {() => (
          <ProtectedRoute allowedRoles={["QUALIDADE", "ADMIN"]}>
            <Evidencias />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/usuarios">
        {() => (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Usuarios />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ProjectProvider>
            <Toaster />
            <Router />
          </ProjectProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;