import { useMemo } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { normalizeProcedureCode } from "@/lib/utils-cop";

type EvidenciaStatus = "OK" | "NOK" | "PARCIAL" | "PENDENTE" | "NA";

type EvidenciaLS = {
  id: number | string;
  cprCode: string;
  revision?: string;
  requirementId: string;
  status: EvidenciaStatus;
  evidences?: string[];
  registros?: string[];
  responsible?: string;
  updatedAt?: string;
  observacao?: string;
  requisito?: string;
};

function readEvidences(): EvidenciaLS[] {
  try {
    const raw = localStorage.getItem("evidences");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readProcedures(): any[] {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getProcedureName(code: string, procedures: any[]) {
  const normalizedCode = normalizeProcedureCode(code);

  const found = procedures.find(
    (p) => normalizeProcedureCode(String(p.code || "")) === normalizedCode
  );

  return String(found?.name || found?.title || normalizedCode);
}

function hasObjectiveEvidence(ev: EvidenciaLS) {
  return Boolean(ev.evidences?.[0]?.trim()) || Boolean(ev.registros?.[0]?.trim());
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    OK: "Atendido",
    PARCIAL: "Parcial",
    NOK: "Não Atendido",
    PENDENTE: "Pendente",
    NA: "Não aplicável",
  };

  return map[status] || status;
}

export default function RelatorioAuditoria() {
  const [, setLocation] = useLocation();

  const evidencias = useMemo(() => readEvidences(), []);
  const procedures = useMemo(() => readProcedures(), []);

  const validEvidencias = useMemo(() => {
    return evidencias.filter((ev) => String(ev.requirementId || "").includes("6."));
  }, [evidencias]);

  const stats = useMemo(() => {
    const total = validEvidencias.length;

    const atendido = validEvidencias.filter(
      (ev) => (ev.status === "OK" || ev.status === "NA") && hasObjectiveEvidence(ev)
    ).length;

    const parcial = validEvidencias.filter((ev) => ev.status === "PARCIAL").length;

    const naoAtendido = validEvidencias.filter(
      (ev) =>
        ev.status === "NOK" ||
        ev.status === "PENDENTE" ||
        (ev.status === "OK" && !hasObjectiveEvidence(ev))
    ).length;

    const conformidade =
      total > 0 ? Math.round(((atendido + parcial * 0.5) / total) * 100) : 0;

    return {
      total,
      atendido,
      parcial,
      naoAtendido,
      conformidade,
    };
  }, [validEvidencias]);

  const requisitosCriticos = useMemo(() => {
    return validEvidencias.filter(
      (ev) =>
        ev.status === "NOK" ||
        ev.status === "PENDENTE" ||
        ev.status === "PARCIAL" ||
        (ev.status === "OK" && !hasObjectiveEvidence(ev))
    );
  }, [validEvidencias]);

  const evidenciasPendentes = useMemo(() => {
    return validEvidencias.filter(
      (ev) =>
        ev.status === "PENDENTE" ||
        ev.status === "PARCIAL" ||
        (ev.status === "OK" && !hasObjectiveEvidence(ev))
    );
  }, [validEvidencias]);

  const uniqueProcedures = new Set(
    validEvidencias.map((ev) => normalizeProcedureCode(ev.cprCode)).filter(Boolean)
  );

  const dataRelatorio = new Date().toLocaleDateString("pt-BR");

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <>
      <style>{`
  @media print {
    .no-print {
      display: none !important;
    }

    aside,
    header {
      display: none !important;
    }

    html,
    body,
    #root {
      background: white !important;
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
    }

    main {
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
      display: block !important;
    }

    .print-container {
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      height: auto !important;
    }

    .print-card {
      box-shadow: none !important;
      border: 1px solid #d4d4d8 !important;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .print-section {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    * {
      overflow: visible !important;
    }

    @page {
      size: A4 portrait;
      margin: 12mm;
    }
  }
`}</style>

      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 print-container">
          <div className="no-print flex items-center justify-between gap-4">
            <button
              onClick={() => setLocation("/dashboard-cop")}
              className="text-sm text-accent hover:underline"
            >
              ← Voltar ao Dashboard
            </button>

            <Button onClick={imprimirRelatorio} className="gap-2">
              <Printer className="w-4 h-4" />
              Exportar / Imprimir PDF
            </Button>
          </div>

          <Card className="p-8 print-card">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8 text-accent" />
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Relatório de Auditoria COP
                  </h1>
                </div>

                <p className="text-muted-foreground">
                  Visão executiva da conformidade dos CPRs com base nas
                  Evidências Objetivas registradas no Item 6.
                </p>
              </div>

              <div className="text-right text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Data:</span>{" "}
                  {dataRelatorio}
                </p>
                <p>
                  <span className="font-medium text-foreground">CPRs:</span>{" "}
                  {uniqueProcedures.size}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Evidências:
                  </span>{" "}
                  {validEvidencias.length}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-4 gap-4 print-section">
            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Total Requisitos</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.total}
              </p>
            </Card>

            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Atendidos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.atendido}
              </p>
            </Card>

            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Parciais</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.parcial}
              </p>
            </Card>

            <Card className="p-6 text-center print-card">
              <p className="text-sm text-muted-foreground">Não Atendidos</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.naoAtendido}
              </p>
            </Card>
          </div>

          <Card className="p-6 print-card print-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-foreground">
                Conformidade Geral
              </h2>
              <span className="text-2xl font-bold text-accent">
                {stats.conformidade}%
              </span>
            </div>

            <Progress value={stats.conformidade} className="h-3" />

            <p className="text-sm text-muted-foreground mt-4">
              Cálculo: requisitos OK com evidência/registro contam integralmente;
              requisitos parciais contam com peso intermediário; pendentes, NOK
              ou OK sem comprovação não contam como conformes.
            </p>
          </Card>

          <Card className="p-6 print-card print-section">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Resumo Executivo
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              O sistema apresenta atualmente{" "}
              <strong>{stats.conformidade}%</strong> de conformidade geral nas
              Evidências Objetivas monitoradas. Há{" "}
              <strong>{stats.atendido}</strong> requisito(s) atendido(s),{" "}
              <strong>{stats.parcial}</strong> parcial(is) e{" "}
              <strong>{stats.naoAtendido}</strong> não atendido(s) ou pendente(s).
            </p>
          </Card>

          <Card className="p-6 print-card print-section">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Requisitos Críticos
            </h2>

            {requisitosCriticos.length === 0 ? (
              <p className="text-green-600 font-medium">
                Todos os requisitos monitorados estão atendidos.
              </p>
            ) : (
              <div className="space-y-3">
                {requisitosCriticos.map((ev) => {
                  const cprCode = normalizeProcedureCode(ev.cprCode);

                  return (
                    <div
                      key={ev.id}
                      className="border border-border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold">
                            {cprCode} — {ev.requirementId}
                          </span>

                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              ev.status === "PARCIAL"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {statusLabel(ev.status)}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {getProcedureName(cprCode, procedures)}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Requisito: {ev.requisito || ev.requirementId}
                        </p>

                        {ev.observacao && (
                          <p className="text-sm text-muted-foreground">
                            Observação: {ev.observacao}
                          </p>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Evidência:{" "}
                        <span className="font-medium text-foreground">
                          {hasObjectiveEvidence(ev) ? "registrada" : "pendente"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6 print-card print-section">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Evidências Pendentes
            </h2>

            {evidenciasPendentes.length === 0 ? (
              <p className="text-green-600 font-medium">
                Não há evidências pendentes de validação.
              </p>
            ) : (
              <div className="space-y-3">
                {evidenciasPendentes.map((ev) => {
                  const cprCode = normalizeProcedureCode(ev.cprCode);

                  return (
                    <div
                      key={ev.id}
                      className="border border-border rounded-md p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {cprCode} — {ev.requirementId}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Procedimento: {getProcedureName(cprCode, procedures)}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Evidência apresentada: {ev.evidences?.[0] || "-"}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Registro apresentado: {ev.registros?.[0] || "-"}
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1 rounded bg-yellow-100 text-yellow-700 w-fit">
                          {statusLabel(ev.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6 print-card print-section">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Conclusão da Auditoria
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              Recomenda-se tratar prioritariamente os requisitos classificados
              como <strong>parciais</strong>, <strong>NOK</strong> ou{" "}
              <strong>pendentes</strong>, bem como complementar evidências OK
              sem comprovação documental. O relatório agora utiliza a mesma base
              de dados do Dashboard COP e da Gestão de Evidências.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}