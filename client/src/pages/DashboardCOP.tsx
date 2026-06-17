import { normalizeProcedureCode } from "@/lib/utils-cop";
import { useMemo } from "react";
import { baseProcedures } from "@/data/procedures/baseProcedures";
import { mapBaseProcedureToCPR } from "@/domain/cpr";
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

type EvidenceStatusRaw = "OK" | "NOK" | "PARCIAL" | "PENDENTE" | "NA";

type DashboardStatus = "OK" | "NOK" | "Pendente";

type Evidencia = {
  id?: number;
  cprCode?: string;
  procedureCode?: string;
  requirementId?: string;
  status?: EvidenceStatusRaw | string;
  evidences?: string[];
  registros?: string[];
  responsible?: string;
  responsavel?: string;
  updatedAt?: string;
  dataVerificacao?: string;
  observacao?: string;
  observation?: string;
};

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

interface LoadedSource {
  key: string;
  count: number;
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

interface ReadEvidenceResult {
  evidenceItems: EvidenceItem[];
  sources: LoadedSource[];
  proceduresCount: number;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeFamily(value: unknown): string {
  const normalized = normalizeText(value);

  if (!normalized) return "A classificar";

  if (normalized.includes("projeto")) return "Controle de Projeto";

  if (normalized.includes("material")) return "Controle de Materiais";

  if (normalized.includes("producao")) return "Controle de Produção";

  if (normalized.includes("liberacao")) return "Liberação Final";

  if (normalized.includes("aeronavegabilidade")) {
    return "Aeronavegabilidade Continuada";
  }

  if (
    normalized.includes("gestao") ||
    normalized.includes("organizacional")
  ) {
    return "Gestão Organizacional";
  }

  return "A classificar";
}

function normalizeDashboardStatus(value: unknown): DashboardStatus {
  const normalized = normalizeText(value);

  if (normalized === "ok") return "OK";

  if (
    normalized === "nok" ||
    normalized === "nao ok" ||
    normalized === "não ok" ||
    normalized === "reprovado" ||
    normalized === "nao conforme" ||
    normalized === "não conforme"
  ) {
    return "NOK";
  }

  return "Pendente";
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isProcedureLike(item: any) {
  return (
    item &&
    typeof item === "object" &&
    (item.code || item.name || item.title) &&
    (Array.isArray(item.structure) || Array.isArray(item.sections))
  );
}

function getProcedureName(proc: any) {
  return String(proc?.name || proc?.title || proc?.description || "").trim();
}

function getProcedureSourceKey(proc: any) {
  return String(proc?.__sourceKey || proc?.sourceKey || "baseProcedures");
}

function getAllProceduresFromLocalStorage(): {
  procedures: any[];
  sources: LoadedSource[];
} {
  const proceduresByCode = new Map<string, any>();
  const sourcesMap = new Map<string, number>();

  const mappedBaseProcedures = Array.isArray(baseProcedures)
    ? baseProcedures.map((proc: any) => {
        try {
          return {
            ...mapBaseProcedureToCPR(proc),
            __sourceKey: "baseProcedures",
          };
        } catch {
          return {
            ...proc,
            code: normalizeProcedureCode(String(proc?.code || "")),
            __sourceKey: "baseProcedures",
          };
        }
      })
    : [];

  mappedBaseProcedures.forEach((proc: any) => {
    const code = normalizeProcedureCode(String(proc?.code || ""));

    if (!code) return;

    proceduresByCode.set(code, {
      ...proc,
      code,
      __sourceKey: "baseProcedures",
    });
  });

  if (mappedBaseProcedures.length > 0) {
    sourcesMap.set("baseProcedures", mappedBaseProcedures.length);
  }

  const preferredKeys = [
    "customProcedures",
    "procedures",
    "cprProcedures",
    "tecplasProcedures",
    "importedProcedures",
  ];

  preferredKeys.forEach((key) => {
    const raw = localStorage.getItem(key);
    const parsed = safeJsonParse<any>(raw, null);

    const found = extractProceduresFromParsedValue(parsed);

    if (found.length > 0) {
      sourcesMap.set(key, (sourcesMap.get(key) || 0) + found.length);

      found.forEach((proc: any) => {
        const code = normalizeProcedureCode(String(proc?.code || ""));

        if (!code) return;

        proceduresByCode.set(code, {
          ...proc,
          code,
          __sourceKey: key,
        });
      });
    }
  });

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);

    if (!key) continue;
    if (preferredKeys.includes(key)) continue;
    if (key === "evidencias") continue;

    const raw = localStorage.getItem(key);
    const parsed = safeJsonParse<any>(raw, null);

    const found = extractProceduresFromParsedValue(parsed);

    if (found.length === 0) continue;

    sourcesMap.set(key, (sourcesMap.get(key) || 0) + found.length);

    found.forEach((proc: any) => {
      const code = normalizeProcedureCode(String(proc?.code || ""));

      if (!code) return;

      proceduresByCode.set(code, {
        ...proc,
        code,
        __sourceKey: key,
      });
    });
  }
    return {
    procedures: Array.from(proceduresByCode.values()).sort((a, b) =>
      String(a.code).localeCompare(String(b.code), "pt-BR", {
        numeric: true,
      })
    ),
    sources: Array.from(sourcesMap.entries()).map(([key, count]) => ({
      key,
      count,
    })),
  };
}

function extractProceduresFromParsedValue(parsed: any): any[] {
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    return parsed.filter(isProcedureLike);
  }

  if (typeof parsed !== "object") return [];

  const possibleArrays = [
    parsed.procedures,
    parsed.customProcedures,
    parsed.items,
    parsed.data,
    parsed.records,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) {
      const found = value.filter(isProcedureLike);

      if (found.length > 0) return found;
    }
  }

  if (isProcedureLike(parsed)) return [parsed];

  return [];
}

function getProcedureSections(proc: any): any[] {
  if (Array.isArray(proc?.structure)) return proc.structure;
  if (Array.isArray(proc?.sections)) return proc.sections;

  return [];
}

function getSectionNumber(section: any) {
  return String(
    section?.item ||
      section?.number ||
      section?.section ||
      section?.id ||
      ""
  ).trim();
}

function getSectionTitle(section: any) {
  return String(section?.title || section?.name || section?.label || "").trim();
}

function findEvidenceSection(proc: any) {
  const sections = getProcedureSections(proc);

  return sections.find((section: any) => {
    const item = getSectionNumber(section);
    const title = normalizeText(getSectionTitle(section));

    return (
      item === "6" ||
      item === "6." ||
      item.startsWith("6 ") ||
      item.startsWith("6.") ||
      title.includes("evidencia") ||
      title.includes("evidencias") ||
      title.includes("evidencia objetiva")
    );
  });
}

function getTableFromSection(section: any) {
  if (!section) return null;

  if (section.table) return section.table;
  if (section.importedTable) return section.importedTable;

  if (Array.isArray(section.tables) && section.tables.length > 0) {
    return section.tables[0];
  }

  if (Array.isArray(section.rows)) {
    return {
      columns: section.columns || [],
      rows: section.rows,
    };
  }

  return null;
}

function normalizeRow(row: any): string[] {
  if (Array.isArray(row)) {
    return row.map((cell) => String(cell || "").trim());
  }

  if (row && typeof row === "object") {
    return [
      row.requisito || row.requirement || row.requirementId || row.item || "",
      row.evidencia || row.evidence || row.objectiveEvidence || "",
      row.registro || row.record || row.associatedRecord || "",
      row.verificacao || row.verification || row.checkMethod || "",
    ].map((cell) => String(cell || "").trim());
  }

  return [];
}

function isValidRequirementRow(row: any) {
  const normalizedRow = normalizeRow(row);

  if (normalizedRow.length === 0) return false;

  const requisito = String(normalizedRow[0] || "").trim();
  const evidencia = String(normalizedRow[1] || "").trim();
  const registro = String(normalizedRow[2] || "").trim();
  const verificacao = String(normalizedRow[3] || "").trim();

  if (!requisito && !evidencia && !registro && !verificacao) return false;

  const joined = normalizedRow.join(" ").toLowerCase();

  if (
    joined.includes("requisito") &&
    joined.includes("evid") &&
    joined.includes("registro")
  ) {
    return false;
  }

  return true;
}
/*
function getRequirementRowsFromProcedure(proc: any) {
  const evidenceSection = findEvidenceSection(proc);
  const table = getTableFromSection(evidenceSection);

  if (!table) return [];

  const rows = Array.isArray(table.rows) ? table.rows : [];

  return rows.filter(isValidRequirementRow).map((row: any, index: number) => {
    const normalizedRow = normalizeRow(row);

    return {
      requirementId: `${normalizeProcedureCode(String(proc?.code || ""))}.6.${
        index + 1
      }`,
      requisito: normalizedRow[0] || "-",
      evidencia: normalizedRow[1] || "-",
      registro: normalizedRow[2] || "-",
      verificacao: normalizedRow[3] || "-",
    };
  });
}
*/
function getFamilyFromProcedure(code: string, proc?: any) {
  const familyFromData = normalizeFamily(
    proc?.family ||
      proc?.familyCOP ||
      proc?.familia ||
      proc?.familiaCOP ||
      proc?.copFamily ||
      proc?.categoria
  );

  if (familyFromData !== "A classificar") {
    return familyFromData;
  }

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
    {
      family: string;
      total: number;
      ok: number;
      nok: number;
      pendente: number;
    }
  >();

  evidenceItems.forEach((item) => {
    const family =
  normalizeFamily(item.family) !== "A classificar"
    ? normalizeFamily(item.family)
    : getFamilyFromProcedure(item.procedureCode, item);

    if (!familyMap.has(family)) {
      familyMap.set(family, {
        family,
        total: 0,
        ok: 0,
        nok: 0,
        pendente: 0,
      });
    }

    const current = familyMap.get(family)!;

    current.total += 1;

    if (item.status === "OK" && hasObjectiveEvidence(item)) {
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

    if (item.status === "OK" && hasObjectiveEvidence(item)) {
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
      a.procedureCode.localeCompare(b.procedureCode, "pt-BR", {
        numeric: true,
      })
    );
}

function findEvidenceForRequirement(
  evidencias: Evidencia[],
  procedureCode: string,
  rowIndex: number,
  requisito: string
) {
  const normalizedProcedureCode = normalizeProcedureCode(procedureCode);

  const possibleRequirementIds = [
  `${normalizedProcedureCode}.6.${rowIndex + 1}`,
  `${normalizedProcedureCode}-6.${rowIndex + 1}`,
  `6.${rowIndex + 1}`,
    String(rowIndex + 1),
    requisito,
  ].map((value) => normalizeText(value));

  return evidencias.find((evidence) => {
    const evidenceProcedureCode = normalizeProcedureCode(
      String(evidence.cprCode || evidence.procedureCode || "")
    );

    if (evidenceProcedureCode !== normalizedProcedureCode) return false;

    const evidenceRequirementId = normalizeText(evidence.requirementId || "");

    return possibleRequirementIds.includes(evidenceRequirementId);
  });
}
/*
function readEvidenceItems(): ReadEvidenceResult {
  const evidencias = safeJsonParse<Evidencia[]>(
    localStorage.getItem("evidences"),
    []
  );

  const { procedures, sources } = getAllProceduresFromLocalStorage();

  const evidenceItems: EvidenceItem[] = [];

  procedures.forEach((proc: any) => {
    const procedureCode = normalizeProcedureCode(String(proc?.code || ""));
    const procedureName = getProcedureName(proc) || procedureCode;
    const sourceKey = getProcedureSourceKey(proc);
    const matchingProcedure = allProcedures.find(
  (proc) => normalizeProcedureCode(String(proc.code || "")) === procedureCode
);

const family = getFamilyFromProcedure(procedureCode, matchingProcedure);
    const rows = getRequirementRowsFromProcedure(proc);

    rows.forEach((row, rowIndex) => {
      const evidence = findEvidenceForRequirement(
        evidencias,
        procedureCode,
        rowIndex,
        row.requisito
      );

      const status = normalizeDashboardStatus(evidence?.status || "PENDENTE");

      evidenceItems.push({
        id: `${procedureCode}-8-${rowIndex + 1}`,
        procedureCode,
        procedureName,
        family,
        requirementId: row.requirementId,
        requisito: row.requisito,
        evidencia: row.evidencia,
        registro: row.registro,
        verificacao: row.verificacao,
        status,
        evidences: Array.isArray(evidence?.evidences)
          ? evidence.evidences
          : [],
        registros: Array.isArray(evidence?.registros)
          ? evidence.registros
          : [],
        responsavel:
          String(evidence?.responsible || evidence?.responsavel || "").trim() ||
          "-",
        dataVerificacao:
          String(
            evidence?.updatedAt || evidence?.dataVerificacao || ""
          ).trim() || "-",
        observacao:
          String(evidence?.observacao || evidence?.observation || "").trim() ||
          "",
        sourceKey,
      });
    });
  });
    const evidenciasSemProcedimento = evidencias.filter((evidence) => {
    const code = normalizeProcedureCode(
      String(evidence.cprCode || evidence.procedureCode || "")
    );

    if (!code) return false;

    return !evidenceItems.some(
      (item) =>
        item.procedureCode === code &&
        normalizeText(item.requirementId) ===
          normalizeText(evidence.requirementId || "")
    );
  });

  evidenciasSemProcedimento.forEach((evidence, index) => {
    const procedureCode = normalizeProcedureCode(
      String(evidence.cprCode || evidence.procedureCode || "")
    );

    if (!procedureCode) return;

    const status = normalizeDashboardStatus(evidence.status || "PENDENTE");
    const procedureName = procedureCode;
    const family = getFamilyFromProcedure(procedureCode);

    evidenceItems.push({
      id: `${procedureCode}-manual-${index + 1}`,
      procedureCode,
      procedureName,
      family,
      requirementId: String(evidence.requirementId || "-"),
      requisito: String(evidence.requirementId || "-"),
      evidencia: "-",
      registro: "-",
      verificacao: "-",
      status,
      evidences: Array.isArray(evidence.evidences) ? evidence.evidences : [],
      registros: Array.isArray(evidence.registros) ? evidence.registros : [],
      responsavel:
        String(evidence.responsible || evidence.responsavel || "").trim() ||
        "-",
      dataVerificacao:
        String(evidence.updatedAt || evidence.dataVerificacao || "").trim() ||
        "-",
      observacao:
        String(evidence.observacao || evidence.observation || "").trim() || "",
      sourceKey: "evidencias",
    });
  });

  const sourcesWithEvidence = [...sources];

  if (evidencias.length > 0) {
    sourcesWithEvidence.push({
      key: "evidencias",
      count: evidencias.length,
    });
  }

  return {
    evidenceItems,
    sources: sourcesWithEvidence,
    proceduresCount: procedures.length,
  };
}
*/

function readEvidenceItemsFromStorageOnly(): ReadEvidenceResult {
  const evidencias = safeJsonParse<Evidencia[]>(
    localStorage.getItem("evidences"),
    []
  );

  const allProcedures = safeJsonParse<any[]>(
    localStorage.getItem("customProcedures"),
    []
  );

  const getProcedureByCode = (procedureCode: string) => {
  return allProcedures.find(
    (proc) =>
      normalizeProcedureCode(String(proc.code || "")) === procedureCode
  );
};

  const getProcedureDisplayName = (procedureCode: string) => {
    const matchingProcedure = allProcedures.find(
      (proc) =>
        normalizeProcedureCode(String(proc.code || "")) === procedureCode
    );

    return (
      String(matchingProcedure?.name || matchingProcedure?.title || "").trim() ||
      procedureCode
    );
  };

  const validNewStructureEvidences = evidencias.filter((evidence) => {
  const requirementId = String(evidence.requirementId || "");
  return requirementId.includes("6.");
});

const evidenceItems: EvidenceItem[] = validNewStructureEvidences.map((evidence, index) => {
    const procedureCode = normalizeProcedureCode(
      String(evidence.cprCode || evidence.procedureCode || "")
    );

    const status = normalizeDashboardStatus(evidence.status || "PENDENTE");
    const matchingProcedure = getProcedureByCode(procedureCode);
    const procedureName = getProcedureDisplayName(procedureCode);
    const family = getFamilyFromProcedure(procedureCode, matchingProcedure);

    return {
      id: String(
        evidence.id || `${procedureCode}-${evidence.requirementId}-${index}`
      ),
      procedureCode,
      procedureName,
      family,
      requirementId: String(evidence.requirementId || "-"),
      requisito: String(
        (evidence as any).requisito || evidence.requirementId || "-"
      ),
      evidencia: "-",
      registro: "-",
      verificacao: "-",
      status,
      evidences: Array.isArray(evidence.evidences) ? evidence.evidences : [],
      registros: Array.isArray(evidence.registros) ? evidence.registros : [],
      responsavel:
        String(evidence.responsible || evidence.responsavel || "").trim() ||
        "-",
      dataVerificacao:
        String(evidence.updatedAt || evidence.dataVerificacao || "").trim() ||
        "-",
      observacao:
        String(evidence.observacao || evidence.observation || "").trim() || "",
      sourceKey: "localStorage.evidences",
    };
  });

  const uniqueProcedures = new Set(
    evidenceItems.map((item) => item.procedureCode).filter(Boolean)
  );

  return {
    evidenceItems,
    sources: [
      {
        key: "localStorage.evidences",
        count: evidenceItems.length,
      },
    ],
    proceduresCount: uniqueProcedures.size,
  };
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

  const { evidenceItems, sources, proceduresCount } = useMemo(
  () => readEvidenceItemsFromStorageOnly(),
    []
  );

  const stats = useMemo(() => {
    let ok = 0;
    let nok = 0;
    let pendente = 0;

    evidenceItems.forEach((item) => {
      if (item.status === "OK" && hasObjectiveEvidence(item)) {
        ok += 1;
      } else if (item.status === "NOK") {
        nok += 1;
      } else {
        pendente += 1;
      }
    });

    return {
      total: evidenceItems.length,
      ok,
      nok,
      pendente,
    };
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

  const procedureStats = useMemo(
    () => buildProcedureStats(evidenceItems),
    [evidenceItems]
  );

  const criticalItems = useMemo(
    () =>
      evidenceItems.filter(
        (item) =>
          item.status === "NOK" ||
          item.status === "Pendente" ||
          (item.status === "OK" && !hasObjectiveEvidence(item))
      ),
    [evidenceItems]
  );

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

        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-sm text-muted-foreground">
            Diagnóstico: {proceduresCount} procedimento(s) localizado(s),{" "}
            {stats.total} requisito(s) de Evidências Objetivas contabilizado(s).
          </p>

          {sources.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Fonte(s):{" "}
              {sources
                .map((source) => `${source.key} (${source.count})`)
                .join(", ")}
            </p>
          )}
        </Card>
                <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6 border-l-4 border-l-blue-500">
            <p className="text-sm text-muted-foreground font-medium">
              Total de Requisitos
            </p>
            <div className="text-3xl font-bold text-foreground">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Linhas válidas de Evidências Objetivas
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500">
            <p className="text-sm text-muted-foreground font-medium">
              Evidências OK válidas
            </p>
            <div className="text-3xl font-bold text-foreground">{stats.ok}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ok} de {stats.total} requisitos com evidência/registro
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
            Cálculo: evidências OK com evidência/registro ÷ total de requisitos
            válidos de Evidências Objetivas. Requisitos sem comprovação são
            classificados como pendentes.
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
                requisitos contabilizados em Evidências Objetivas.
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
                Nenhum CPR com requisito de Evidências Objetivas foi localizado.
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
                    className={`p-6 border-l-4 ${getCriticalBorderClass(
                      item
                    )}`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge
                            variant="outline"
                            className="font-mono font-bold"
                          >
                            {item.procedureCode}
                          </Badge>

                          <Badge className={status.className}>
                            <Icon
                              className={`w-4 h-4 mr-1 ${status.iconClassName}`}
                            />
                            {status.label}
                          </Badge>

                          <Badge variant="secondary">{item.family}</Badge>

                          {item.status === "OK" &&
                            !hasObjectiveEvidence(item) && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-0">
                                OK sem comprovação
                              </Badge>
                            )}
                        </div>

                        <p className="text-foreground font-medium">
                          {item.procedureName || "Procedimento sem nome"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Requisito:{" "}
                          </span>
                          {item.requisito || "-"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Evidência esperada:{" "}
                          </span>
                          {item.evidencia || "-"}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Registro esperado:{" "}
                          </span>
                          {item.registro || "-"}
                        </p>

                        {item.evidences?.[0] && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Evidência apresentada:{" "}
                            </span>
                            {item.evidences[0]}
                          </p>
                        )}

                        {item.registros?.[0] && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Registro apresentado:{" "}
                            </span>
                            {item.registros[0]}
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

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setLocation(`/procedimentos/${item.procedureCode}`)
                        }
                      >
                        Abrir CPR
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Todos os requisitos de Evidências Objetivas
          </h2>

          {evidenceItems.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>

              <p className="font-semibold text-foreground">
                Nenhum requisito de Evidências Objetivas foi localizado.
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                Verifique se os CPRs possuem uma seção 6 (Evidências Objetivas)
                com tabela contendo as colunas Requisito, Evidência Objetiva,
                Registro Associado e Forma de Verificação.
              </p>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>
                  Lista consolidada para conferência dos requisitos utilizados
                  no cálculo do dashboard.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-2 font-semibold">CPR</th>
                      <th className="text-left p-2 font-semibold">Família</th>
                      <th className="text-left p-2 font-semibold">
                        Requisito
                      </th>
                      <th className="text-left p-2 font-semibold">
                        Evidência esperada
                      </th>
                      <th className="text-left p-2 font-semibold">
                        Registro esperado
                      </th>
                      <th className="text-left p-2 font-semibold">
                        Evidência apresentada
                      </th>
                      <th className="text-left p-2 font-semibold">
                        Registro apresentado
                      </th>
                      <th className="text-left p-2 font-semibold">
                        Verificação
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
                          <td className="p-2 font-medium">
                            {item.procedureCode}
                          </td>
                          <td className="p-2">{item.family}</td>
                          <td className="p-2">{item.requisito || "-"}</td>
                          <td className="p-2">{item.evidencia || "-"}</td>
                          <td className="p-2">{item.registro || "-"}</td>
                          <td className="p-2">
                            {item.evidences?.[0] || "-"}
                          </td>
                          <td className="p-2">
                            {item.registros?.[0] || "-"}
                          </td>
                          <td className="p-2">{item.verificacao || "-"}</td>
                          <td className="p-2">
                            <Badge className={status.className}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="p-2">
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