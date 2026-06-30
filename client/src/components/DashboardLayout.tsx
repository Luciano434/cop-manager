import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  BookOpen,
  Users,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type LocalUser = {
  username?: string;
  name?: string;
  email?: string;
  role?: string;
};

function getLocalUser(): LocalUser | null {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const localUser = getLocalUser();
  const currentUser = localUser ?? user ?? null;
  const isAdmin = currentUser?.role === "ADMIN";

  const menuItems = [
    {
      label: "Procedimentos",
      href: "/procedimentos",
      icon: BookOpen,
      adminOnly: false,
    },
    {
  label: "Dashboard COP",
  href: "/dashboard-cop",
  icon: BarChart3,
  adminOnly: false,
},
{
  label: "Relatório Executivo",
  href: "/relatorio-executivo",
  icon: ClipboardList,
  adminOnly: false,
},
{
  label: "Relatório Detalhado",
  href: "/relatorio-auditoria",
  icon: FileText,
  adminOnly: false,
},
{
  label: "Requisitos",
  href: "/requisitos",
  icon: CheckCircle2,
  adminOnly: false,
},
    {
      label: "Evidências",
      href: "/evidencias",
      icon: FileText,
      adminOnly: false,
    },
    {
      label: "Usuários",
      href: "/usuarios",
      icon: Users,
      adminOnly: true,
    },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isActive = (href: string) => location === href;

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">
              COP Manager
            </h1>
            <p className="text-xs text-sidebar-foreground/60 mt-2">
              Certificação Operacional ANAC
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4 space-y-3">
            <div className="px-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser?.name || "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate mt-1">
                {currentUser?.role || currentUser?.email || ""}
              </p>
            </div>

            <Button
              onClick={() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              variant="outline"
              className="w-full justify-start gap-2 text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent/10 h-9 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-card border-b border-border h-16 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex-1" />

          <div className="text-sm text-muted-foreground">
            Bem-vindo,{" "}
            <span className="font-medium text-foreground">
              {currentUser?.name || "Usuário"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}