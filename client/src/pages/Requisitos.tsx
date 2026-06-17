import { useMemo, useState } from "react";
import { Search, CheckCircle2, AlertCircle, XCircle, Filter } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { normalizeProcedureCode } from "@/lib/utils-cop";

type RequirementStatus = "atendido" | "parcial" | "nao_atendido";

type RequirementItem = {
  id: string;
  code: string;
  description: string;
  expectedEvidence: string;
  expectedRecord: string;
  expectedVerification: string;
  cprCode: string;
  status: RequirementStatus;
};

type EvidenciaLS = {
  id: number | string;
  cprCode: string;
  revision?: string;
  requirementId: string;
  status: "OK" | "NOK" | "PARCIAL" | "PENDENTE" | "NA";
  evidences: string[];
  registros: string[];
  responsible: string;
  updatedAt: string;
  observacao?: string;
};

function isValidRequirementRow(row: any[]) {
  if (!Array.isArray(row)) return false;

  const requisito = String(row[0] || "").trim();
  const evidencia = String(row[1] || "").trim();
  const registro = String(row[2] || "").trim();
  const verificacao = String(row[3] || "").trim();

  if (!requisito && !evidencia && !registro && !verificacao) return false;

  const joined = row.join(" ").toLowerCase();

  if (
    joined.includes("requisito") &&
    joined.includes("evid") &&
    joined.includes("registro")
  ) {
    return false;
  }

  return Boolean(requisito);
}

function loadCustomProcedures(): any[] {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadEvidencias(): EvidenciaLS[] {
  try {
    const raw = localStorage.getItem("evidences");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getEvidenceStatus(
  requirementCode: string,
  cprCode: string,
  evidencias: EvidenciaLS[]
): RequirementStatus {
  const evidenciasDoReq = evidencias.filter(
    (item) =>
      item.requirementId === requirementCode &&
      normalizeProcedureCode(item.cprCode) === normalizeProcedureCode(cprCode)
  );

  if (evidenciasDoReq.length === 0) return "nao_atendido";

  if (evidenciasDoReq.some((ev) => ev.status === "OK" || ev.status === "NA")) {
    return "atendido";
  }

  if (evidenciasDoReq.some((ev) => ev.status === "PARCIAL")) {
    return "parcial";
  }

  return "nao_atendido";
}

function loadAllRequirements(evidencias: EvidenciaLS[]): RequirementItem[] {
  const procedures = loadCustomProcedures();
  const result: RequirementItem[] = [];

  procedures.forEach((proc: any) => {
    const cprCode = normalizeProcedureCode(proc.code || "");
    if (!cprCode) return;

    const sections = Array.isArray(proc.sections)
      ? proc.sections
      : Array.isArray(proc.structure)
      ? proc.structure
      : [];

    const item6 = sections.find(
  (s: any) =>
    s.number === 6 ||
    s.number === "6" ||
    s.item === 6 ||
    s.item === "6" ||
    (typeof s.title === "string" && s.title.startsWith("6"))
);

    const rows =
      item6?.table?.rows ||
      item6?.importedTable?.rows ||
      item6?.rows ||
      [];

    if (!Array.isArray(rows)) return;

    rows.filter(isValidRequirementRow).forEach((row: any[], index: number) => {
      const requirementCode = `${cprCode}-6.${index + 1}`;

      result.push({
        id: requirementCode,
        code: requirementCode,
        description: String(row[0] || "").trim(),
        expectedEvidence: String(row[1] || "").trim(),
        expectedRecord: String(row[2] || "").trim(),
        expectedVerification: String(row[3] || "").trim(),
        cprCode,
        status: getEvidenceStatus(requirementCode, cprCode, evidencias),
      });
    });
  });

  return result;
}

function getEvidenciasDoReq(
  req: RequirementItem,
  evidencias: EvidenciaLS[]
): EvidenciaLS[] {
  return evidencias.filter(
    (ev) =>
      ev.requirementId === req.code &&
      normalizeProcedureCode(ev.cprCode) === normalizeProcedureCode(req.cprCode)
  );
}

export default function Requisitos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/requisitos/:code");

  const evidencias = useMemo(() => loadEvidencias(), []);
  const requisitos = useMemo(() => loadAllRequirements(evidencias), [evidencias]);

  const statusConfig = {
    atendido: {
      label: "Atendido",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2,
    },
    parcial: {
      label: "Parcial",
      color: "bg-yellow-100 text-yellow-800",
      icon: AlertCircle,
    },
    nao_atendido: {
      label: "Não Atendido",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
    },
  };

  let lista = requisitos;

  if (match && params?.code) {
    lista = requisitos.filter((r) => r.code === params.code);
  }

  const filteredRequirements = lista.filter((req) => {
    const matchesSearch =
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.cprCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            {filteredRequirements.length} requisito(s) encontrado(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CPR, código ou descrição..."
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

              {Object.entries(statusConfig).map(([key, value]) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? "default" : "outline"}
                  onClick={() =>
                    setStatusFilter(statusFilter === key ? null : key)
                  }
                  size="sm"
                >
                  {value.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredRequirements.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum requisito encontrado
              </p>
            </Card>
          ) : (
            filteredRequirements.map((req) => {
              const config = statusConfig[req.status];
              const Icon = config.icon;
              const evidenciasDoReq = getEvidenciasDoReq(req, evidencias);

              return (
                <Card
                  key={req.id}
                  className="p-6 border-l-4 hover:shadow-md transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="font-mono font-bold">
                          {req.code}
                        </Badge>

                        <Icon
                          className={`w-5 h-5 ${
                            req.status === "atendido"
                              ? "text-green-600"
                              : req.status === "parcial"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        />

                        <span className="text-xs text-muted-foreground">
                          CPR: {req.cprCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge className={`${config.color} border-0`}>
                          {config.label}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          {evidenciasDoReq.length} evidência(s)
                        </span>
                      </div>
                    </div>

                    <p className="text-foreground font-medium">
                      {req.description}
                    </p>

                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">
                          Evidência esperada
                        </p>
                        <p>{req.expectedEvidence || "-"}</p>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground">
                          Registro esperado
                        </p>
                        <p>{req.expectedRecord || "-"}</p>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground">
                          Forma de verificação
                        </p>
                        <p>{req.expectedVerification || "-"}</p>
                      </div>
                    </div>

                    {evidenciasDoReq.length > 0 && (
                      <div className="border-t pt-3 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Evidências vinculadas
                        </p>

                        {evidenciasDoReq.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-md bg-muted/50 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">
                                Status: {ev.status}
                              </span>

                              {ev.updatedAt && (
                                <span className="text-xs text-muted-foreground">
                                  Atualizado em:{" "}
                                  {new Date(ev.updatedAt).toLocaleString()}
                                </span>
                              )}
                            </div>

                            {ev.evidences?.[0] && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Evidência: {ev.evidences[0]}
                              </p>
                            )}

                            {ev.registros?.[0] && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Registro: {ev.registros[0]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}