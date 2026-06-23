import { normalizeProcedureCode } from "@/lib/utils-cop";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Search,
  XCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

function CprEvidenceCount({ procedureId }: { procedureId: number }) {
  const { data } = trpc.procedures.getEvidenceCount.useQuery({ id: procedureId });
  return <span>{data?.count ?? '—'}</span>;
}

type DashboardStatus = "OK" | "NOK" | "Pendente";

interface EvidenceItem {
  id: string;
  procedureCode: string;
  procedureName: string;
  family: string;
  requirementId: string;
  requisito: string;
  evidencia: string;
  registro: string;
  verificacao: string;
  status: DashboardStatus;
  evidences: string[];
  registros: string[];
  responsavel: string;
  dataVerificacao: string;
  observacao: string;
  sourceKey: string;
}

interface FamilyStats {
  family: string;
  total: number;
  ok: number;
  nok: number;
  pendente: number;
  conformityPercentage: number;
}

interface ProcedureStats {
  procedureCode: string;
  procedureName: string;
  family: string;
  total: number;
  ok: number;
  nok: number;
  pendente: number;
  conformityPercentage: number;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function normalizeFamily(value: unknown): string {
  const normalized = normalizeText(value);

  if (!normalized) return "A classificar";
  if (normalized.includes("projeto")) return "Controle de Projeto";
  if (normalized.includes("material")) return "Controle de Materiais";
  if (normalized.includes("producao")) return "Controle de Produção";
  if (normalized.includes("liberacao")) return "Liberação Final";
  if (normalized.includes("aeronavegabilidade")) return "Aeronavegabilidade Continuada";
  if (normalized.includes("gestao") || normalized.includes("organizacional")) return "Gestão Organizacional";

  return "A classificar";
}

function getFamilyFromProcedure(code: string, proc?: any) {
  const familyFromData = normalizeFamily(
    proc?.family || proc?.familyCOP || proc?.familia || proc?.copFamily || proc?.categoria
  );

  if (familyFromData !== "A classificar") return familyFromData;

  const normalizedCode = normalizeProcedureCode(code);
  const familyMap: Record<string, string> = {
    "CPR-01": "Controle de Projeto",
    "CPR-02": "Controle de Projeto",
    "CPR-03": "Controle de Projeto",
    "CPR-04": "Controle de Materiais",
    "CPR-05": "Controle de Materiais",
    "CPR-06": "Controle de Materiais",
  };

  return familyMap[normalizedCode] || "A classificar";
}

function getFamilyBorderClass(conformityPercentage: number) {
  if (conformityPercentage >= 80) return "border-l-green-500";
  if (conformityPercentage >= 40) return "border-l-yellow-500";
  return "border-l-red-500";
}

function getFamilyStatusLabel(conformityPercentage: number) {
  if (conformityPercentage >= 80) return "Controlado";
  if (conformityPercentage >= 40) return "Atenção";
  return "Crítico";
}

function hasObjectiveEvidence(item: EvidenceItem) {
  return (
    Boolean(item.evidences?.[0]?.trim()) ||
    Boolean(item.registros?.[0]?.trim())
  );
}

function buildFamilyStats(evidenceItems: EvidenceItem[]): FamilyStats[] {
  const familyMap = new Map<
    string,
    { family: string; total: number; ok: number; nok: number; pendente: number }
  >();

  evidenceItems.forEach((item) => {
    const family =
      normalizeFamily(item.family) !== "A classificar"
        ? normalizeFamily(item.family)
        : getFamilyFromProcedure(item.procedureCode, item);

    if (!familyMap.has(family)) {
      familyMap.set(family, { family, total: 0, ok: 0, nok: 0, pendente: 0 });
    }

    const current = familyMap.get(family)!;
    current.total += 1;

    if (item.status === "OK") {
      current.ok += 1;
    } else if (item.status === "NOK") {
      current.nok += 1;
    } else {
      current.pendente += 1;
    }
  });

  return Array.from(familyMap.values())
    .map((family) => ({
      ...family,
      conformityPercentage:
        family.total > 0 ? Math.round((family.ok / family.total) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.pendente !== a.pendente) return b.pendente - a.pendente;
      if (b.nok !== a.nok) return b.nok - a.nok;
      return a.conformityPercentage - b.conformityPercentage;
    });
}

function buildProcedureStats(evidenceItems: EvidenceItem[]): ProcedureStats[] {
  const procedureMap = new Map<
    string,
    {
      procedureCode: string;
      procedureName: string;
      family: string;
      total: number;
      ok: number;
      nok: number;
      pendente: number;
    }
  >();

  evidenceItems.forEach((item) => {
    const key = item.procedureCode;

    if (!procedureMap.has(key)) {
      procedureMap.set(key, {
        procedureCode: item.procedureCode,
        procedureName: item.procedureName,
        family:
          normalizeFamily(item.family) !== "A classificar"
            ? normalizeFamily(item.family)
            : getFamilyFromProcedure(item.procedureCode, item),
        total: 0,
        ok: 0,
        nok: 0,
        pendente: 0,
      });
    }

    const current = procedureMap.get(key)!;
    current.total += 1;

    if (item.status === "OK") {
      current.ok += 1;
    } else if (item.status === "NOK") {
      current.nok += 1;
    } else {
      current.pendente += 1;
    }
  });

  return Array.from(procedureMap.values())
    .map((procedure) => ({
      ...procedure,
      conformityPercentage:
        procedure.total > 0
          ? Math.round((procedure.ok / procedure.total) * 100)
          : 0,
    }))
    .sort((a, b) =>
      a.procedureCode.localeCompare(b.procedureCode, "pt-BR", { numeric: true })
    );
}

function getStatusBadge(status: DashboardStatus) {
  if (status === "OK") {
    return {
      label: "OK",
      className: "bg-green-100 text-green-800 border-0",
      icon: CheckCircle2,
      iconClassName: "text-green-600",
    };
  }

  if (status === "NOK") {
    return {
      label: "NOK",
      className: "bg-red-100 text-red-800 border-0",
      icon: XCircle,
      iconClassName: "text-red-600",
    };
  }

  return {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 border-0",
    icon: AlertCircle,
    iconClassName: "text-yellow-600",
  };
}

function getCriticalBorderClass(item: EvidenceItem) {
  if (item.status === "NOK") return "border-l-red-500";
  return "border-l-yellow-500";
}

export default function DashboardCOP() {
  const [, setLocation] = useLocation();

  const { data: procedures = [], isLoading: loadingProcedures } =
    trpc.procedures.list.useQuery();
  const { data: copReqs = [], isLoading: loadingCopReqs } =
    trpc.copRequirements.list.useQuery();
  const { data: evidenceFiles = [], isLoading: loadingEvidences } =
    trpc.evidences.list.useQuery();

  const isLoading = loadingProcedures || loadingCopReqs || loadingEvidences;

  const procedureById = useMemo(() => {
    const map = new Map<number, (typeof procedures)[0]>();
    procedures.forEach((p) => map.set(p.id, p));
    return map;
  }, [procedures]);

  // Each COP requirement becomes one EvidenceItem.
  // Evidence files are linked via copRequirementId; procedure is resolved via
  // the first evidence file that also carries a procedureId.
  const evidenceItems = useMemo((): EvidenceItem[] => {
    return copReqs.map((req) => {
      const reqFiles = evidenceFiles.filter(
        (e) => e.copRequirementId === req.id
      );

      const linkedProcedureId =
        reqFiles.find((e) => e.procedureId != null)?.procedureId ?? null;
      const linkedProcedure =
        linkedProcedureId != null
          ? (procedureById.get(linkedProcedureId) ?? null)
          : (procedures.find(
              (p) =>
                normalizeProcedureCode(p.code) ===
                normalizeProcedureCode(req.procedureCode ?? "")
            ) ?? null);

      const procedureCode = normalizeProcedureCode(
        linkedProcedure?.code ?? req.procedureCode ?? ""
      );
      const procedureName = linkedProcedure?.name ?? "";
      const family = getFamilyFromProcedure(procedureCode, linkedProcedure);

      // atendido → OK | parcial → NOK | nao_atendido → Pendente
      const status: DashboardStatus =
        req.status === "atendido"
          ? "OK"
          : req.status === "parcial"
          ? "NOK"
          : "Pendente";

      return {
        id: String(req.id),
        procedureCode,
        procedureName,
        family,
        requirementId: req.code,
        requisito: req.description ?? req.code,
        evidencia: "-",
        registro: "-",
        verificacao: "-",
        status,
        evidences: reqFiles.map((e) => e.fileName),
        registros: [],
        responsavel: "-",
        dataVerificacao: "-",
        observacao: "",
        sourceKey: "db",
      };
    });
  }, [copReqs, evidenceFiles, procedureById]);

  const stats = useMemo(() => {
    let ok = 0;
    let nok = 0;
    let pendente = 0;

    evidenceItems.forEach((item) => {
      if (item.status === "OK") {
        ok += 1;
      } else if (item.status === "NOK") {
        nok += 1;
      } else {
        pendente += 1;
      }
    });

    return { total: evidenceItems.length, ok, nok, pendente };
  }, [evidenceItems]);

  const conformityPercentage =
    stats.total > 0 ? Math.round((stats.ok / stats.total) * 100) : 0;

  const pendingPercentage =
    stats.total > 0 ? Math.round((stats.pendente / stats.total) * 100) : 0;

  const nokPercentage =
    stats.total > 0 ? Math.round((stats.nok / stats.total) * 100) : 0;

  const familyStats = useMemo(
    () => buildFamilyStats(evidenceItems),
    [evidenceItems]
  );

  // Only include items that are linked to a procedure for per-procedure stats.
  const procedureStats = useMemo(
    () =>
      buildProcedureStats(
        evidenceItems.filter((item) => item.procedureCode !== "")
      ),
    [evidenceItems]
  );

  const criticalItems = useMemo(
    () =>
      evidenceItems.filter(
        (item) =>
          item.status === "NOK" ||
          item.status === "Pendente"
      ),
    [evidenceItems]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-accent" />
            Dashboard COP
          </h1>

          <p className="text-muted-foreground mt-2">
            Visão consolidada dos requisitos de Evidências Objetivas dos CPRs cadastrados.
          </p>
        </div>

        <Card className="p-4 bg-slate-50 border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              BASE REGULATÓRIA — Formulário COP 300-28
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{copReqs.length} itens COP</span> monitorados
            em <span className="font-semibold text-foreground">{procedures.length} CPR(s)</span> cadastrado(s).
            Estes são os requisitos que o auditor ANAC verifica no formulário 300-28.
          </p>

          <div className="flex items-center gap-2 pt-1 border-t">
            <span className="text-xs font-bold uppercase tracking-wide text-green-700 bg-green-100 px-2 py-0.5 rounded">
              EVIDÊNCIAS OBJETIVAS — Capítulo 6 dos CPRs
            </span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {procedures.map(proc => (
              <div key={proc.id} className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground w-16">{proc.code}</span>
                <span className="text-muted-foreground truncate">{proc.name}</span>
                <span className="ml-auto text-xs shrink-0">
                  <CprEvidenceCount procedureId={proc.id} /> evidências objetivas
                  {' · '}
                  <span className="font-semibold">
                    {copReqs.filter(r => r.procedureCode === proc.code).length} itens COP
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6 border-l-4 border-l-blue-500">
            <p className="text-sm text-muted-foreground font-medium">
              Itens COP monitorados
            </p>
            <div className="text-3xl font-bold text-foreground">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Requisitos do formulário 300-28
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ⓘ Base regulatória ANAC — não confundir com evidências do Cap. 6
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500">
            <p className="text-sm text-muted-foreground font-medium">
              Evidências OK válidas
            </p>
            <div className="text-3xl font-bold text-foreground">{stats.ok}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ok} de {stats.total} requisitos com evidência registrada
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-yellow-500">
            <p className="text-sm text-muted-foreground font-medium">
              Pendentes
            </p>
            <div className="text-3xl font-bold text-foreground">
              {stats.pendente}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPercentage}% do total
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-red-500">
            <p className="text-sm text-muted-foreground font-medium">
              Evidências NOK
            </p>
            <div className="text-3xl font-bold text-foreground">
              {stats.nok}
            </div>
            <p className="text-xs text-muted-foreground">
              {nokPercentage}% do total
            </p>
          </Card>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Status Geral de Conformidade
          </h3>

          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Conformidade Geral
            </span>
            <span className="text-sm font-bold text-accent">
              {conformityPercentage}%
            </span>
          </div>

          <Progress value={conformityPercentage} className="h-2 w-full" />

          <p className="text-sm text-muted-foreground mt-4">
            Cálculo: requisitos atendidos com evidência registrada ÷ total de
            requisitos COP. Requisitos sem comprovação são classificados como
            pendentes.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Pendências por Família COP
          </h2>

          {familyStats.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                Nenhuma família COP foi identificada porque ainda não há
                requisitos cadastrados com procedimentos vinculados.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {familyStats.map((family) => {
                const statusLabel = getFamilyStatusLabel(
                  family.conformityPercentage
                );

                return (
                  <Card
                    key={family.family}
                    className={`p-6 border-l-4 ${getFamilyBorderClass(
                      family.conformityPercentage
                    )}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {family.family}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statusLabel}
                          </p>
                        </div>

                        <Badge variant="outline" className="font-mono">
                          {family.conformityPercentage}%
                        </Badge>
                      </div>

                      <Progress
                        value={family.conformityPercentage}
                        className="h-2"
                      />

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-foreground">
                            {family.total}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">OK válidos</p>
                          <p className="font-bold text-green-700">
                            {family.ok}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Pendentes</p>
                          <p className="font-bold text-yellow-700">
                            {family.pendente}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">NOK</p>
                          <p className="font-bold text-red-700">
                            {family.nok}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Resumo por CPR
          </h2>

          {procedureStats.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                Nenhum CPR com requisito COP vinculado foi localizado.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {procedureStats.map((procedure) => (
                <Card
                  key={procedure.procedureCode}
                  className="p-4 overflow-hidden"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_220px_90px] lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono font-bold shrink-0"
                        >
                          {procedure.procedureCode}
                        </Badge>

                        <Badge variant="secondary" className="max-w-full">
                          <span className="truncate">{procedure.family}</span>
                        </Badge>
                      </div>

                      <p className="text-sm font-semibold text-foreground break-words">
                        {procedure.procedureName || "Procedimento sem nome"}
                      </p>

                      <div className="grid grid-cols-4 gap-2 text-xs sm:max-w-md">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-foreground">
                            {procedure.total}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">OK</p>
                          <p className="font-bold text-green-700">
                            {procedure.ok}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Pend.</p>
                          <p className="font-bold text-yellow-700">
                            {procedure.pendente}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">NOK</p>
                          <p className="font-bold text-red-700">
                            {procedure.nok}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          Conformidade
                        </span>
                        <span className="text-xs font-semibold">
                          {procedure.conformityPercentage}%
                        </span>
                      </div>

                      <Progress
                        value={procedure.conformityPercentage}
                        className="h-2 w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-semibold">{procedure.total}</span> itens COP
                        {' · '}
                        Evid. Cap. 6: <CprEvidenceCount procedureId={
                          procedures.find(p => p.code === procedure.procedureCode)?.id ?? 0
                        } />
                      </p>
                    </div>

                    <div className="flex lg:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocation(
                            `/procedimentos/${procedure.procedureCode}`
                          )
                        }
                      >
                        Abrir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Evidências críticas e pendentes
          </h2>

          {criticalItems.length === 0 ? (
            <Card className="p-6 border-l-4 border-l-green-500 bg-green-50">
              <p className="font-semibold text-green-900">
                Nenhuma evidência crítica ou pendente encontrada.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {criticalItems.map((item) => {
                const status = getStatusBadge(item.status);
                const Icon = status.icon;

                return (
                  <Card
                    key={item.id}
                    className={`p-6 border-l-4 ${getCriticalBorderClass(item)}`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge
                            variant="outline"
                            className="font-mono font-bold"
                          >
                            {item.requirementId}
                          </Badge>

                          <Badge className={status.className}>
                            <Icon
                              className={`w-4 h-4 mr-1 ${status.iconClassName}`}
                            />
                            {status.label}
                          </Badge>

                          {item.procedureCode && (
                            <Badge variant="secondary">{item.procedureCode}</Badge>
                          )}

                          {item.family && item.family !== "A classificar" && (
                            <Badge variant="secondary">{item.family}</Badge>
                          )}

                        </div>

                        {item.procedureName && (
                          <p className="text-foreground font-medium">
                            {item.procedureName}
                          </p>
                        )}

                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Requisito:{" "}
                          </span>
                          {item.requisito || "-"}
                        </p>

                        {item.evidences?.[0] && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Evidência registrada:{" "}
                            </span>
                            {item.evidences[0]}
                          </p>
                        )}

                        {item.observacao && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Observação:{" "}
                            </span>
                            {item.observacao}
                          </p>
                        )}
                      </div>

                      {item.procedureCode && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setLocation(`/procedimentos/${item.procedureCode}`)
                          }
                        >
                          Abrir CPR
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Todos os requisitos COP
          </h2>

          {evidenceItems.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>

              <p className="font-semibold text-foreground">
                Nenhum requisito COP foi cadastrado.
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                Cadastre requisitos COP na página de Requisitos para que
                apareçam no dashboard.
              </p>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>
                  Lista consolidada de requisitos COP utilizados no cálculo do
                  dashboard.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-2 font-semibold">Código</th>
                      <th className="text-left p-2 font-semibold">CPR</th>
                      <th className="text-left p-2 font-semibold">Família</th>
                      <th className="text-left p-2 font-semibold">Requisito</th>
                      <th className="text-left p-2 font-semibold">
                        Evidência registrada
                      </th>
                      <th className="text-left p-2 font-semibold">Status</th>
                      <th className="text-left p-2 font-semibold">Ação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {evidenceItems.map((item) => {
                      const status = getStatusBadge(item.status);

                      return (
                        <tr
                          key={`${item.id}-all`}
                          className="border-b align-top"
                        >
                          <td className="p-2 font-mono text-xs">
                            {item.requirementId}
                          </td>
                          <td className="p-2 font-medium">
                            {item.procedureCode || "-"}
                          </td>
                          <td className="p-2">{item.family}</td>
                          <td className="p-2">{item.requisito || "-"}</td>
                          <td className="p-2">
                            {item.evidences?.[0] || "-"}
                          </td>
                          <td className="p-2">
                            <Badge className={status.className}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {item.procedureCode ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setLocation(
                                    `/procedimentos/${item.procedureCode}`
                                  )
                                }
                              >
                                <Search className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
