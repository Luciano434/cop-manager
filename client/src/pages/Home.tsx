import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { CheckCircle2, BookOpen, BarChart3, FileText, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/procedimentos");
    }
  }, [user, setLocation]);

  const features = [
    {
      icon: BookOpen,
      title: "Procedimentos Operacionais",
      description: "Gerencie procedimentos com etapas detalhadas, responsáveis e status de implementação.",
    },
    {
      icon: BarChart3,
      title: "Dashboard COP",
      description: "Visualize o status de conformidade de todos os requisitos regulatórios ANAC.",
    },
    {
      icon: CheckCircle2,
      title: "Requisitos COP",
      description: "Rastreie requisitos regulatórios com vínculo bidirecional aos procedimentos.",
    },
    {
      icon: FileText,
      title: "Repositório de Evidências",
      description: "Centralize evidências de conformidade com histórico e rastreabilidade completa.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">COP Manager</span>
          </div>
          <Button
            onClick={() => setLocation("/procedimentos")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Fazer Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            Gestão de Conformidade Operacional
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema elegante e sofisticado para gerenciar procedimentos, requisitos COP e evidências de conformidade aeronáutica ANAC.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => setLocation("/procedimentos")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-8 py-3 h-auto text-base gap-2 group"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted font-medium px-8 py-3 h-auto text-base"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Funcionalidades Principais
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar conformidade operacional de forma eficiente e rastreável.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-card border border-border rounded-xl p-8 hover:border-accent/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesse o sistema agora e comece a gerenciar seus procedimentos operacionais com conformidade regulatória garantida.
          </p>
          <Button
  onClick={() => setLocation("/procedimentos")}
  className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-8 py-3 h-auto text-base"
>
  Acessar Sistema
</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-8 mt-20">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 App Certificação COP. Sistema de Gestão de Conformidade Operacional ANAC.</p>
        </div>
      </footer>
    </div>
  );
}
