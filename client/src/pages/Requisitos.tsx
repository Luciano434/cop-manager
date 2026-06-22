import { useState } from "react";
import { Search, CheckCircle2, AlertCircle, XCircle, Filter } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

type RequirementStatus = "atendido" | "parcial" | "nao_atendido";

const STATUS_CONFIG: Record<
  RequirementStatus,
  { label: string; color: string; Icon: React.ElementType }
> = {
  atendido: {
    label: "Atendido",
    color: "bg-green-100 text-green-800",
    Icon: CheckCircle2,
  },
  parcial: {
    label: "Parcial",
    color: "bg-yellow-100 text-yellow-800",
    Icon: AlertCircle,
  },
  nao_atendido: {
    label: "Não Atendido",
    color: "bg-red-100 text-red-800",
    Icon: XCircle,
  },
};

export default function Requisitos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | null>(null);
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/requisitos/:code");

  const { data: requirements = [], isLoading } = trpc.copRequirements.list.useQuery();

  const filtered = requirements.filter((req) => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      req.code.toLowerCase().includes(searchLower) ||
      (req.description ?? "").toLowerCase().includes(searchLower);

    const reqStatus = (req.status ?? "nao_atendido") as RequirementStatus;
    const matchesStatus = statusFilter === null || reqStatus === statusFilter;

    const matchesRoute =
      !match || !params?.code || req.code === params.code;

    return matchesSearch && matchesStatus && matchesRoute;
  });

  if (isLoading) {
    return <div className="p-6">Carregando requisitos...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <button
            onClick={() => setLocation("/dashboard-cop")}
            className="text-sm text-accent hover:underline mb-2"
          >
            ← Voltar ao Dashboard
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-accent" />
            Requisitos COP
          </h1>

          <p className="text-sm text-muted-foreground mt-2">
            {filtered.length} requisito(s) encontrado(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                onClick={() => setStatusFilter(null)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Todos
              </Button>

              {(Object.entries(STATUS_CONFIG) as [RequirementStatus, (typeof STATUS_CONFIG)[RequirementStatus]][]).map(
                ([key, cfg]) => (
                  <Button
                    key={key}
                    variant={statusFilter === key ? "default" : "outline"}
                    onClick={() =>
                      setStatusFilter(statusFilter === key ? null : key)
                    }
                    size="sm"
                  >
                    {cfg.label}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum requisito encontrado</p>
            </Card>
          ) : (
            filtered.map((req) => {
              const status = (req.status ?? "nao_atendido") as RequirementStatus;
              const cfg = STATUS_CONFIG[status];
              const { Icon } = cfg;

              return (
                <Card
                  key={req.id}
                  className="p-6 border-l-4 hover:shadow-md transition-all duration-300"
                >
                  {/* Cabeçalho: código + CPR + status */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="font-mono font-bold text-base">
                        {req.code}
                      </Badge>

                      {req.procedureCode && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {req.procedureCode}
                        </Badge>
                      )}

                      <Icon
                        className={`w-5 h-5 ${
                          status === "atendido"
                            ? "text-green-600"
                            : status === "parcial"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>

                    <Badge className={`${cfg.color} border-0`}>
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Descrição */}
                  {req.description && (
                    <p className="text-foreground font-medium mt-3">
                      {req.description}
                    </p>
                  )}

                  {/* Evidência esperada */}
                  {req.expectedEvidence && (
                    <div className="mt-4 border-t pt-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Evidência esperada
                      </p>
                      <p className="text-sm text-foreground">{req.expectedEvidence}</p>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
