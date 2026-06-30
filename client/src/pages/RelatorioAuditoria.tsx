import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { normalizeProcedureCode, normalizeRevision } from "@/lib/utils-cop";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, Printer, ChevronDown, ChevronRight } from "lucide-react";

function normalizeText(v: unknown) {
  return String(v || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeFamily(v: unknown): string {
  const s = normalizeText(v);
  if (!s) return "A classificar";
  if (s.includes("projeto")) return "Controle de Projeto";
  if (s.includes("material")) return "Controle de Materiais";
  if (s.includes("producao")) return "Controle de Produção";
  if (s.includes("liberacao")) return "Liberação Final";
  if (s.includes("aeronavegabilidade")) return "Aeronavegabilidade Continuada";
  if (s.includes("gestao") || s.includes("organizacional")) return "Gestão Organizacional";
  return "A classificar";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "OK":      return "bg-green-100 text-green-800";
    case "NOK":     return "bg-red-100 text-red-800";
    case "PARCIAL": return "bg-orange-100 text-orange-800";
    case "NA":      return "bg-slate-100 text-slate-600";
    default:        return "bg-yellow-100 text-yellow-800";
  }
}

function isValidRow(row: unknown): row is string[] {
  if (!Array.isArray(row)) return false;
  if (!String(row[0] || "").trim()) return false;
  const joined = row.join(" ").toLowerCase();
  if (joined.includes("requisito") && joined.includes("evid")) return false;
  return true;
}

function CprDetailCard({ procedure, expanded }: { procedure: any; expanded: boolean }) {
  const cprCode = normalizeProcedureCode(procedure.code);
  const revision = normalizeRevision((procedure as any).revision || "00");

  const { data: sectionsData } = trpc.procedures.getSections.useQuery(
    { id: procedure.id },
    { enabled: expanded && !!procedure.id }
  );

  const { data: verifications = [] } = trpc.evidenceVerifications.listByCpr.useQuery(
    { cprCode, revision },
    { enabled: expanded && !!cprCode }
  );

  const sections: any[] = Array.isArray(sectionsData) ? sectionsData : [];
  const cap6 = sections.find((s: any) => s.number === 6 || s.number === "6");
  const rows: unknown[] = cap6?.table?.rows ?? [];
  const validRows = rows.filter(isValidRow);

  const totalReqs = validRows.length;
  const atendidos = verifications.filter((v) => v.status === "OK").length;
  const pct = totalReqs > 0 ? Math.round((atendidos / totalReqs) * 100) : 0;

  if (!expanded) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Rev. {revision}</span>
        <span className="font-medium">{atendidos}/{totalReqs} requisitos atendidos</span>
        <span className="font-bold text-accent">{pct}%</span>
      </div>

      <Progress value={pct} className="h-2" />

      {validRows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2">
          Nenhuma linha no Cap. 6 cadastrada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-1.5 font-semibold w-10">#</th>
                <th className="p-1.5 font-semibold">Requisito</th>
                <th className="p-1.5 font-semibold">Evidência Esperada</th>
                <th className="p-1.5 font-semibold">Evidência Apresentada</th>
                <th className="p-1.5 font-semibold">Registro</th>
                <th className="p-1.5 font-semibold">Responsável</th>
                <th className="p-1.5 font-semibold">Item COP</th>
                <th className="p-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {validRows.map((row, i) => {
                const reqId = `6.${i + 1}`;
                const ver = verifications.find((v) => v.requirementId === reqId);
                return (
                  <React.Fragment key={reqId}>
                    <tr className="border-b align-top hover:bg-slate-50">
                      <td className="p-1.5 font-mono text-muted-foreground">{reqId}</td>
                      <td className="p-1.5">{String(row[0] || "").trim()}</td>
                      <td className="p-1.5 text-muted-foreground">{String(row[1] || "").trim() || "—"}</td>
                      <td className="p-1.5">{ver?.evidenceText || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-1.5">{ver?.registroText || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-1.5">{ver?.responsible || "—"}</td>
                      <td className="p-1.5 font-mono">{String(row[4] || "").trim() || "—"}</td>
                      <td className="p-1.5">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${statusBadgeClass(ver?.status ?? "PENDENTE")}`}>
                          {ver?.status ?? "PENDENTE"}
                        </span>
                      </td>
                    </tr>
                    {ver?.observacao && (
                      <tr className="border-b bg-yellow-50">
                        <td className="p-1.5" />
                        <td colSpan={7} className="p-1.5 text-yellow-800">
                          <span className="font-medium">Obs:</span> {ver.observacao}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RelatorioAuditoria() {
  const { data: procedures = [], isLoading: loadingProcs } = trpc.procedures.list.useQuery();
  const { data: copReqs = [] } = trpc.copRequirements.list.useQuery();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const allExpanded = procedures.length > 0 && expandedIds.size === procedures.length;

  function toggleAll() {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(procedures.map((p) => p.id)));
    }
  }

  function toggle(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const dataRelatorio = new Date().toLocaleDateString("pt-BR");

  if (loadingProcs) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          html, body, #root { background: white !important; height: auto !important; overflow: visible !important; }
          main { display: block !important; height: auto !important; overflow: visible !important; }
          .print-container { max-width: 100% !important; padding: 0 !important; }
          * { overflow: visible !important; }
          .page-break { page-break-before: always; }
          @page { size: A4 landscape; margin: 8mm; }
        }
      `}</style>

      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 print-container">

          {/* Cabeçalho */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="w-6 h-6 text-accent" />
                  <h1 className="text-2xl font-bold">Relatório Detalhado de Conformidade COP</h1>
                </div>
                <p className="text-sm text-muted-foreground">Gerado em {dataRelatorio} · {procedures.length} CPR(s)</p>
              </div>
              <div className="no-print flex gap-2">
                <Button variant="outline" onClick={toggleAll}>
                  {allExpanded ? "Recolher todos" : "Expandir todos"}
                </Button>
                <Button onClick={() => window.print()} className="gap-2">
                  <Printer className="w-4 h-4" /> Imprimir
                </Button>
              </div>
            </div>
          </Card>

          {/* Cards por CPR */}
          {procedures.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhum CPR cadastrado.
            </Card>
          ) : (
            procedures.map((proc, idx) => {
              const isExpanded = expandedIds.has(proc.id);
              const cprCode = normalizeProcedureCode(proc.code);
              const procReqs = copReqs.filter(
                (r) => normalizeProcedureCode(r.procedureCode || "") === cprCode
              );
              const atendidos = procReqs.filter((r) => r.status === "atendido").length;
              const total = procReqs.length;
              const pct = total > 0 ? Math.round((atendidos / total) * 100) : 0;
              const family = normalizeFamily(proc.family);

              return (
                <Card key={proc.id} className={`p-4 ${idx > 0 ? "page-break" : ""}`}>
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => toggle(proc.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                      <span className="font-mono font-bold shrink-0">{cprCode}</span>
                      <span className="font-semibold truncate">{proc.name}</span>
                      {family !== "A classificar" && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded shrink-0">{family}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                        proc.status === "em_desenvolvimento"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {proc.status === "em_desenvolvimento" ? "Em desenvolvimento"
                          : "Não iniciado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0 ml-4">
                      <span className="text-muted-foreground">{atendidos}/{total}</span>
                      <span className="font-bold text-accent w-10 text-right">{pct}%</span>
                    </div>
                  </div>

                  <CprDetailCard procedure={proc} expanded={isExpanded} />
                </Card>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}
