function readEvidences(): any[] {
  try {
    const raw = localStorage.getItem("evidences");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvidences(items: any[]) {
  localStorage.setItem("evidences", JSON.stringify(items));
}

import {
  ArrowLeft,
  Printer,
  FileDown,
  Lock,
  GitBranchPlus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Workflow,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { baseProcedures } from "@/data/procedures/baseProcedures";
import {
  normalizeProcedureCode,
  getCurrentUser,
} from "@/lib/utils-cop";
import { trpc } from "@/lib/trpc";

type ProcedureStatus =
  | "nao_iniciado"
  | "em_desenvolvimento"
  | "implementado"
  | "aprovado"
  | "em_revisao"
  | "em_elaboracao"
  | "bloqueado"
  | "cancelado";

type ImportedSectionContent = string | string[];

interface ImportedTable {
  columns: string[];
  rows: string[][];
}

interface ImportedSubitem {
  item?: string;
  title: string;
  content: ImportedSectionContent;
}

interface ImportedSection {
  number?: string;
  item?: string;
  title: string;
  content?: ImportedSectionContent;
  subitems?: ImportedSubitem[];
  mode?: "text" | "table";
  table?: ImportedTable;
}

interface LegacyOperationalStep {
  id: number;
  stepNumber: number;
  name: string;
  description: string;
  howToExecute: string;
  responsible: string;
  input: string;
  output: string;
  evidenceType: string;
  evidenceLocation: string;
  auditAccess: string;
  acceptanceCriteria: string;
  status: "nao_iniciado" | "em_desenvolvimento" | "implementado";
}

interface LegacyCopRequirement {
  id: number;
  code: string;
  description: string;
}

interface LegacyEvidence {
  id: number;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface LegacyProcedure {
  id?: number;
  code: string;
  name: string;
  description?: string;
  status?: ProcedureStatus | string;
  responsible?: string;
  createdAt?: string;
  updatedAt?: string;
  steps?: LegacyOperationalStep[];
  requirements?: LegacyCopRequirement[];
  evidences?: LegacyEvidence[];
  revision?: string;
  structure?: ImportedSection[];
}

interface ProcedureMasterDocument {
  type: string;
  fileName: string;
  path: string;
}

interface ProcedureMetadata {
  code: string;
  title: string;
  revision?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: { name: string; area?: string }[];
  preparedBy?: { name: string; area?: string }[];
  masterDocument?: ProcedureMasterDocument | null;
  masterPdf?: ProcedureMasterDocument | null;
}

interface FullProcedure {
  metadata: ProcedureMetadata;
  objective?: string;
  application?: string;
  references?: string[];
  definitions?: { term: string; description: string }[];
  responsibilities?: { role: string; items: string[] }[];
  process?: {
    step: string;
    title: string;
    description?: string;
    activities?: string[];
    records?: string[];
    system?: string;
    approval?: string;
    verification?: string;
  }[];
  criteria?: string[];
  evidences?: string[];
  copMatrix?: { requirement: string; description: string; items: string[] }[];
  indicators?: string[];
  sgqIntegration?: string[];
}

interface ImportedProcedure {
  id?: number;
  code: string;
  name: string;
  description?: string;
  status?: string;
  responsible?: string;
  createdAt?: string;
  updatedAt?: string;
  sections?: ImportedSection[];
  structure?: ImportedSection[];
  revision?: string;
}

type ProcedureData = LegacyProcedure | FullProcedure | ImportedProcedure;

type NormalizedSection = {
  order: number;
  title: string;
  content: ImportedSectionContent;
  subitems: ImportedSubitem[];
  mode: "text" | "table";
  table?: ImportedTable;
};

type ProcedureView = {
  mode: "full" | "imported" | "legacy";
  code: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  responsible: string;
  revision: string;
  masterDocument: ProcedureMasterDocument | null;
  masterPdf: ProcedureMasterDocument | null;
  sections: NormalizedSection[];
  
  createdBy?: string;
  createdByRole?: string;
  lastModifiedBy?: string;
  lastModifiedByRole?: string;
  lastModifiedAt?: string;
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
};

const proceduresData: Record<string, ProcedureData> = Object.fromEntries(
  baseProcedures.flatMap((item) => {
    const rawCode = String(item.code || "");
    const normalizedCode = normalizeProcedureCode(rawCode);

    return [
      [rawCode, item as ProcedureData],
      [normalizedCode, item as ProcedureData],
    ];
  })
);

const STANDARD_SECTION_TITLES: Record<number, string> = {
  1: "Objetivo",
  2: "Definições",
  3: "Procedimentos",
  4: "Registros da Qualidade",
  5: "Documentos de Referência",
  6: "Evidências Objetivas",
  7: "Rastreabilidade COP",
};

function normalizeRevision(value?: string) {
  const raw = String(value || "00").trim().toUpperCase();
  const withoutPrefix = raw.replace(/^R/, "");
  return withoutPrefix || "00";
}

function normalizeStatus(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "em revisão" ||
    normalized === "em revisao" ||
    normalized === "em_revisao"
  ) {
    return "em_revisao";
  }

  if (normalized === "aprovado") return "aprovado";
  if (normalized === "bloqueado") return "bloqueado";
  if (normalized === "cancelado") return "cancelado";
  if (normalized === "nao_iniciado") return "nao_iniciado";
  if (normalized === "implementado") return "implementado";
  if (normalized === "em_desenvolvimento") return "em_desenvolvimento";

  if (normalized === "em elaboração" || normalized === "em elaboracao") {
    return "em_elaboracao";
  }

  return "em_elaboracao";
}

function formatStatusLabel(status?: string) {
  const normalized = normalizeStatus(status);

  const map: Record<string, string> = {
    nao_iniciado: "Não Iniciado",
    em_desenvolvimento: "Em Desenvolvimento",
    implementado: "Implementado",
    aprovado: "Aprovado",
    em_revisao: "Em Revisão",
    em_elaboracao: "Em Elaboração",
    bloqueado: "Bloqueado",
    cancelado: "Cancelado",
  };

  return map[normalized] || "Em Elaboração";
}

function getStatusClasses(status?: string) {
  const normalized = normalizeStatus(status);

  const map: Record<string, string> = {
    nao_iniciado: "bg-gray-100 text-gray-800",
    em_desenvolvimento: "bg-blue-100 text-blue-800",
    implementado: "bg-green-100 text-green-800",
    aprovado: "bg-green-100 text-green-800",
    em_revisao: "bg-yellow-100 text-yellow-800",
    em_elaboracao: "bg-blue-100 text-blue-800",
    bloqueado: "bg-gray-200 text-gray-900",
    cancelado: "bg-red-100 text-red-800",
  };

  return map[normalized] || "bg-blue-100 text-blue-800";
}

function getNextRevision(currentRevision?: string) {
  const normalized = normalizeRevision(currentRevision || "00");
  const currentNumber = Number(normalized);

  if (!Number.isFinite(currentNumber)) return "01";

  const nextNumber = currentNumber + 1;
  return String(nextNumber).padStart(2, "0");
}

function normalizeLine(line: string) {
  return line.replace(/[ \t]+/g, " ").trim();
}

function contentToBlocks(content?: ImportedSectionContent): string[] {
  if (!content) return [];

  const lines = Array.isArray(content) ? content : String(content).split(/\n/);

  return lines
    .map((line) => normalizeLine(String(line)))
    .filter((line) => line.length > 0);
}

function parseSectionOrder(section: ImportedSection, fallbackOrder: number) {
  const raw = String(section.number || section.item || "").trim();
  const match = raw.match(/^(\d+)/);

  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return fallbackOrder;
}

function isValidTable(table?: ImportedTable) {
  return Boolean(
    table &&
      Array.isArray(table.columns) &&
      table.columns.length > 0 &&
      Array.isArray(table.rows)
  );
}

function isSectionEmpty(section: NormalizedSection): boolean {
  if (section.mode === "table") {
    return !isValidTable(section.table);
  }
  const hasContent = contentToBlocks(section.content).length > 0;
  const hasSubitems = (section.subitems || []).some(
    (sub) =>
      String(sub.title || "").trim().length > 0 ||
      contentToBlocks(sub.content).length > 0
  );
  return !hasContent && !hasSubitems;
}

function renderStructuredText(content?: ImportedSectionContent) {
  const lines = contentToBlocks(content);

  if (!lines.length) return null;

  const elements: ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc pl-5 text-sm text-gray-700 space-y-1"
        >
          {currentBullets.map((item, i) => (
            <li key={`li-${i}`} className="leading-7">
              {item}
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    const bulletMatch = trimmed.match(/^[-•–*]\s+(.*)$/);
    const alphaMatch = trimmed.match(/^([a-z]\))\s+(.*)$/i);

    if (bulletMatch) {
      currentBullets.push(bulletMatch[1]);
      return;
    }

    flushBullets();

    if (alphaMatch) {
      elements.push(
        <div key={`alpha-${index}`} className="flex items-start gap-3 pl-4">
          <span className="min-w-[28px] font-medium text-sm text-gray-900">
            {alphaMatch[1]}
          </span>
          <p className="text-sm text-gray-700 break-words leading-7">
            {alphaMatch[2]}
          </p>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="text-sm text-gray-700 leading-7">
        {trimmed}
      </p>
    );
  });

  flushBullets();

  return <div className="space-y-3">{elements}</div>;
}

function renderTable(table?: ImportedTable, sectionNumber?: number, copReqs: any[] = []) {
  if (!isValidTable(table)) return null;

  const isEvidenceTable = sectionNumber === 6;
  const isCap7Table = sectionNumber === 7;

  let columns = table!.columns;
  let rows = table!.rows;

  if (isEvidenceTable) {
    columns = [
      "Requisito",
      "Evidência Objetiva Esperada",
      "Registro Associado",
      "Forma de Verificação",
      "Item COP",
    ];

    rows = table!.rows.map((row) => {
      const r = Array.isArray(row) ? [...row] : [];

      return [
        r[0] || "",
        r[1] || "",
        r[2] || "",
        r[3] || "",
        r[4] || "—",
      ];
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-slate-50">
            {columns.map((column, index) => (
              <th key={index} className="text-left p-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b align-top">
              {columns.map((_, colIndex) => {
                let value = row[colIndex] ?? "-";

if (isEvidenceTable && colIndex === 0) {
  value = `6.${rowIndex + 1} — ${value}`;
}
if (isCap7Table && colIndex === 0) {
  value = `7.${rowIndex + 1} — ${value}`;
}

                
                if (isEvidenceTable && colIndex === 4) {
                  const codes = String(value || '')
                    .split(',')
                    .map((c: string) => c.trim())
                    .filter(Boolean);
                  return (
                    <td key={colIndex} className="p-2">
                      {codes.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {codes.map((code: string) => (
                            <span
                              key={code}
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                }

                if (isCap7Table && colIndex === 4) {
                  const itemCop = String(row[0] || '').trim();
                  const req = copReqs.find((r: any) => r.code === itemCop);
                  const status = req?.status;
                  const label = status === 'atendido' ? 'Atendido'
                    : status === 'parcial' ? 'Parcial'
                    : status === 'nao_atendido' ? 'Não Atendido'
                    : value || '—';
                  const color = status === 'atendido' ? 'bg-green-100 text-green-800'
                    : status === 'parcial' ? 'bg-yellow-100 text-yellow-800'
                    : status === 'nao_atendido' ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-500';
                  return (
                    <td key={colIndex} className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                        {label}
                      </span>
                    </td>
                  );
                }

                return (
                  <td key={colIndex} className="p-2 break-words">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between gap-4"
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm text-gray-500 shrink-0">
          {isOpen ? "Recolher" : "Expandir"}
        </span>
      </button>

      {isOpen && <div className="px-4 pb-4 border-t">{children}</div>}
    </Card>
  );
}

function readCustomProcedures(): any[] {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomProcedures(items: any[]) {
  localStorage.setItem("customProcedures", JSON.stringify(items));
}


function hasUsefulStructure(structure: any) {
  if (!Array.isArray(structure)) return false;

  return structure.some((section: any) => {
    const hasContent = String(section?.content || "").trim().length > 0;

    const hasSubitems =
      Array.isArray(section?.subitems) &&
      section.subitems.some((subitem: any) => {
        return (
          String(subitem?.title || "").trim().length > 0 ||
          String(subitem?.content || "").trim().length > 0
        );
      });

    const hasTable =
      section?.table &&
      Array.isArray(section.table.rows) &&
      section.table.rows.some((row: any[]) => {
        if (!Array.isArray(row)) return false;

        return row.some((cell, cellIndex) => {
          const value = String(cell || "").trim();

          // No item 6, "Pendente" pode ser apenas valor padrão do status.
          if (cellIndex === 4 && value.toLowerCase() === "pendente") {
            return false;
          }

          return value.length > 0;
        });
      });

    return hasContent || hasSubitems || hasTable;
  });
}

function getStructureCandidate(item: any) {
  if (Array.isArray(item?.structure)) return item.structure;
  if (Array.isArray(item?.sections)) return item.sections;
  return [];
}
function sortRevisions(revisions: any[]) {
  return [...revisions].sort((a, b) => {
    const numericA = Number(normalizeRevision(a?.revision || "00"));
    const numericB = Number(normalizeRevision(b?.revision || "00"));

    if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
      return numericA - numericB;
    }

    return String(a?.revision || "00").localeCompare(
      String(b?.revision || "00")
    );
  });
}

function getBestStructureForProcedure(procedure: any, preferredRevision?: any) {
  const preferredStructure = getStructureCandidate(preferredRevision);
  if (hasUsefulStructure(preferredStructure)) return preferredStructure;

  const topLevelStructure = getStructureCandidate(procedure);
  if (hasUsefulStructure(topLevelStructure)) return topLevelStructure;

  if (Array.isArray(procedure?.revisions)) {
    const usefulRevision = [...sortRevisions(procedure.revisions)]
      .reverse()
      .find((revisionItem: any) =>
        hasUsefulStructure(getStructureCandidate(revisionItem))
      );

    if (usefulRevision) return getStructureCandidate(usefulRevision);
  }

  return preferredStructure.length > 0 ? preferredStructure : topLevelStructure;
}

function getBaseRevisionSnapshot(
  procedureCode: string,
  rawProcedure: ProcedureData | null
) {
  if (!rawProcedure) return null;

  const baseItem = convertBaseProcedureToCustomShape(procedureCode, rawProcedure);
  const baseStructure = getStructureCandidate(baseItem);

  // Base inicial vazia não deve sobrescrever conteúdo salvo no navegador.
  if (!hasUsefulStructure(baseStructure)) return null;

  return {
    revision: normalizeRevision(baseItem.revision || "00"),
    status: normalizeStatus(baseItem.status || "aprovado"),
    name: baseItem.name,
    description: baseItem.description,
    responsible: baseItem.responsible,
    createdAt: baseItem.createdAt,
    updatedAt: baseItem.updatedAt,
    structure: baseStructure,
    sections: baseStructure,
    source: baseItem.source || "manual",
  };
}

function normalizeRevisionRecordFromProcedure(item: any) {
  const structure = getStructureCandidate(item);

  return {
    revision: normalizeRevision(item?.revision || "00"),
    status: normalizeStatus(item?.status || "em_elaboracao"),
    name: String(item?.name || ""),
    description: String(item?.description || ""),
    responsible: String(item?.responsible || "Engenharia"),
    createdAt: String(item?.createdAt || new Date().toISOString().slice(0, 10)),
    updatedAt: String(
      item?.updatedAt || item?.createdAt || new Date().toISOString().slice(0, 10)
    ),
    structure,
    sections: structure,
    source: item?.source || "manual",
  };
}

function ensureUnifiedProcedureRecord(
  procedureCode: string,
  storedProcedure: any | null,
  baseProcedure: ProcedureData | null
) {
  const today = new Date().toISOString().slice(0, 10);
  const normalizedCode = normalizeProcedureCode(procedureCode);
  const baseSnapshot = getBaseRevisionSnapshot(normalizedCode, baseProcedure);

  const sourceItem = storedProcedure
    ? {
        ...storedProcedure,
        code: normalizedCode,
      }
    : baseProcedure
    ? convertBaseProcedureToCustomShape(normalizedCode, baseProcedure)
    : null;

  if (!sourceItem) return null;

  const revisionMap = new Map<string, any>();

  // Regra estrutural:
  // - Se há registro salvo no localStorage, ele é a fonte de verdade.
  // - A base só entra como revisão quando NÃO existe registro salvo.
  if (!storedProcedure && baseSnapshot) {
    revisionMap.set(baseSnapshot.revision, baseSnapshot);
  }

  if (Array.isArray(sourceItem.revisions)) {
    sourceItem.revisions.forEach((revisionItem: any) => {
      const revision = normalizeRevision(revisionItem?.revision || "00");

      const revisionStructure = getStructureCandidate(revisionItem);
      const sourceStructure = getStructureCandidate(sourceItem);
      const structureToUse = hasUsefulStructure(revisionStructure)
        ? revisionStructure
        : hasUsefulStructure(sourceStructure)
        ? sourceStructure
        : revisionStructure.length > 0
        ? revisionStructure
        : sourceStructure;

      const normalizedRevisionRecord = {
        ...normalizeRevisionRecordFromProcedure(sourceItem),
        ...revisionItem,
        revision,
        status: normalizeStatus(revisionItem?.status || sourceItem.status),
        structure: structureToUse,
        sections: structureToUse,
      };

      revisionMap.set(revision, normalizedRevisionRecord);
    });
  } else {
    const currentRevision = normalizeRevision(sourceItem.revision || "00");
    if (!revisionMap.has(currentRevision)) {
      revisionMap.set(currentRevision, normalizeRevisionRecordFromProcedure(sourceItem));
    }
  }

  const revisions = Array.from(revisionMap.values()).sort((a, b) => {
    const numericA = Number(a.revision);
    const numericB = Number(b.revision);

    if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
      return numericA - numericB;
    }

    return String(a.revision).localeCompare(String(b.revision));
  });

  const latest = revisions[revisions.length - 1] || normalizeRevisionRecordFromProcedure(sourceItem);
  const structureToUse = getBestStructureForProcedure(
    {
      ...sourceItem,
      revisions,
    },
    latest
  );

  return {
    ...sourceItem,
    code: normalizedCode,
    id: sourceItem.id ?? Date.now(),
    name: String(sourceItem.name || latest.name || normalizedCode),
    description: String(sourceItem.description || latest.description || ""),
    responsible: String(sourceItem.responsible || latest.responsible || "Engenharia"),
    createdAt: String(sourceItem.createdAt || latest.createdAt || today),
    updatedAt: String(latest.updatedAt || today),
    source: sourceItem.source || "manual",
    revision: normalizeRevision(latest.revision || "00"),
    status: normalizeStatus(latest.status || sourceItem.status),
    structure: structureToUse,
    sections: structureToUse,
    revisions,
  };
}

function getStoredProcedureView(code: string) {
  try {
    const raw = localStorage.getItem(`procedure-${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredProcedureView(
  code: string,
  data: { status: string; revision: string }
) {
  try {
    localStorage.setItem(`procedure-${code}`, JSON.stringify(data));
  } catch (error) {
    console.error("Falha ao gravar procedure view:", error);
  }
}

function isFullProcedure(
  procedure: ProcedureData | null
): procedure is FullProcedure {
  return !!procedure && typeof procedure === "object" && "metadata" in procedure;
}

function isImportedProcedure(
  procedure: ProcedureData | null
): procedure is ImportedProcedure {
  return (
    !!procedure &&
    typeof procedure === "object" &&
    (("sections" in procedure && Array.isArray(procedure.sections)) ||
      ("structure" in procedure && Array.isArray(procedure.structure)))
  );
}
function normalizeImportedSections(
  rawProcedure: ImportedProcedure
): NormalizedSection[] {
  const sourceSections = rawProcedure.sections || rawProcedure.structure || [];

  const normalized = sourceSections.map((section, index) => {
    const order = parseSectionOrder(section, index + 1);
    const title =
      section.title || STANDARD_SECTION_TITLES[order] || `Capítulo ${order}`;

    const tableIsValid = isValidTable(section.table);
    const mode: "text" | "table" =
      section.mode === "table" || tableIsValid ? "table" : "text";

    return {
      order,
      title,
      content: section.content || "",
      subitems: Array.isArray(section.subitems) ? section.subitems : [],
      mode,
      table: tableIsValid ? section.table : undefined,
    };
  });

  return normalized.sort((a, b) => a.order - b.order);
}

function normalizeFullProcedure(rawProcedure: FullProcedure): NormalizedSection[] {
  return [
    {
      order: 1,
      title: "Objetivo",
      content: rawProcedure.objective || "",
      subitems: [],
      mode: "text",
    },
    {
      order: 2,
      title: "Aplicação",
      content: rawProcedure.application || "",
      subitems: [],
      mode: "text",
    },
    {
      order: 3,
      title: "Referências",
      content: (rawProcedure.references || []).join("\n"),
      subitems: [],
      mode: "text",
    },
    {
      order: 4,
      title: "Definições",
      content: "",
      subitems: (rawProcedure.definitions || []).map((item, idx) => ({
        item: `4.${idx + 1}`,
        title: item.term,
        content: item.description,
      })),
      mode: "text",
    },
    {
      order: 5,
      title: "Responsabilidades",
      content: "",
      subitems: (rawProcedure.responsibilities || []).map((item, idx) => ({
        item: `5.${idx + 1}`,
        title: item.role,
        content: item.items.join("\n"),
      })),
      mode: "text",
    },
    {
      order: 6,
      title: "Descrição do Processo",
      content: "",
      subitems: (rawProcedure.process || []).map((item, idx) => ({
        item: item.step || `6.${idx + 1}`,
        title: item.title,
        content: [
          item.description || "",
          ...(item.activities || []),
          ...(item.system ? [`Sistema/meio: ${item.system}`] : []),
          ...(item.records?.length
            ? ["Registros:", ...(item.records || [])]
            : []),
          ...(item.approval ? [`Aprovação: ${item.approval}`] : []),
          ...(item.verification ? [`Verificação: ${item.verification}`] : []),
        ]
          .filter(Boolean)
          .join("\n"),
      })),
      mode: "text",
    },
    {
      order: 7,
      title: "Critérios Operacionais Obrigatórios",
      content: (rawProcedure.criteria || []).join("\n"),
      subitems: [],
      mode: "text",
    },
    {
      order: 8,
      title: "Evidências Objetivas",
      content: (rawProcedure.evidences || []).join("\n"),
      subitems: [],
      mode: "text",
    },
    {
      order: 9,
      title: "Rastreabilidade COP",
      content: "",
      subitems: (rawProcedure.copMatrix || []).map((item, idx) => ({
        item: `9.${idx + 1}`,
        title: item.requirement,
        content: `${item.description}\n${(item.items || []).join(", ")}`,
      })),
      mode: "text",
    },
    {
      order: 10,
      title: "Indicadores Mínimos de Eficácia",
      content: (rawProcedure.indicators || []).join("\n"),
      subitems: [],
      mode: "text",
    },
    {
      order: 11,
      title: "Integração com o SGQ",
      content: (rawProcedure.sgqIntegration || []).join("\n"),
      subitems: [],
      mode: "text",
    },
  ];
}

function normalizeLegacyProcedure(rawProcedure: LegacyProcedure): NormalizedSection[] {
  return Array.from({ length: 7 }, (_, index) => {
    const order = index + 1;

    if (order === 3) {
      return {
        order: 3,
        title: STANDARD_SECTION_TITLES[3] || "Procedimentos",
        content: rawProcedure.description || "",
        subitems:
          rawProcedure.steps?.map((step) => ({
            item: String(step.stepNumber),
            title: step.name,
            content: step.howToExecute || step.description || "",
          })) || [],
        mode: "text" as const,
      };
    }

    return {
      order,
      title: STANDARD_SECTION_TITLES[order] || `Capítulo ${order}`,
      content: "",
      subitems: [],
      mode: "text" as const,
    };
  });
}

function convertBaseProcedureToCustomShape(
  procedureCode: string,
  rawProcedure: ProcedureData
) {
  const normalizedCode = normalizeProcedureCode(procedureCode);

  if (isImportedProcedure(rawProcedure)) {
    return {
      id: typeof rawProcedure.id === "number" ? rawProcedure.id : Date.now(),
      code: normalizeProcedureCode(String(rawProcedure.code || normalizedCode)),
      name: String(rawProcedure.name || normalizedCode),
      description: String(rawProcedure.description || ""),
      status: normalizeStatus(rawProcedure.status || "em_elaboracao"),
      revision: normalizeRevision(rawProcedure.revision || "00"),
      responsible: String(rawProcedure.responsible || "Engenharia"),
      createdAt: String(
        rawProcedure.createdAt || new Date().toISOString().slice(0, 10)
      ),
      updatedAt: String(
        rawProcedure.updatedAt || new Date().toISOString().slice(0, 10)
      ),
      source: "manual",
      structure: Array.isArray(rawProcedure.structure)
        ? rawProcedure.structure
        : Array.isArray(rawProcedure.sections)
        ? rawProcedure.sections
        : [],
    };
  }

  if (isFullProcedure(rawProcedure)) {
    return {
      id: Date.now(),
      code: normalizeProcedureCode(
        String(rawProcedure.metadata.code || normalizedCode)
      ),
      name: String(rawProcedure.metadata.title || normalizedCode),
      description: String(rawProcedure.objective || ""),
      status: normalizeStatus(rawProcedure.metadata.status || "aprovado"),
      revision: normalizeRevision(rawProcedure.metadata.revision || "00"),
      responsible:
        rawProcedure.metadata.approvedBy?.map((p) => p.name).join(", ") ||
        rawProcedure.metadata.preparedBy?.map((p) => p.name).join(", ") ||
        "Engenharia",
      createdAt: String(
        rawProcedure.metadata.createdAt || new Date().toISOString().slice(0, 10)
      ),
      updatedAt: String(
        rawProcedure.metadata.updatedAt || new Date().toISOString().slice(0, 10)
      ),
      source: "manual",
      structure: normalizeFullProcedure(rawProcedure),
    };
  }

  return {
    id: typeof rawProcedure.id === "number" ? rawProcedure.id : Date.now(),
    code: normalizeProcedureCode(String(rawProcedure.code || normalizedCode)),
    name: String(rawProcedure.name || normalizedCode),
    description: String(rawProcedure.description || ""),
    status: normalizeStatus(rawProcedure.status || "em_elaboracao"),
    revision: normalizeRevision(rawProcedure.revision || "00"),
    responsible: String(rawProcedure.responsible || "Engenharia"),
    createdAt: String(
      rawProcedure.createdAt || new Date().toISOString().slice(0, 10)
    ),
    updatedAt: String(
      rawProcedure.updatedAt || new Date().toISOString().slice(0, 10)
    ),
    source: "manual",
    structure: Array.isArray(rawProcedure.structure)
      ? rawProcedure.structure
      : normalizeLegacyProcedure(rawProcedure),
  };
}

function buildProcedureView(
  rawProcedure: ProcedureData,
  procedureCode: string
): ProcedureView {
  if (isFullProcedure(rawProcedure)) {
    return {
      mode: "full",
      code: normalizeProcedureCode(rawProcedure.metadata.code),
      title: rawProcedure.metadata.title,
      description: rawProcedure.objective || "",
      status: normalizeStatus(rawProcedure.metadata.status || "aprovado"),
      createdAt: rawProcedure.metadata.createdAt || "",
      updatedAt: rawProcedure.metadata.updatedAt || "",
      responsible:
        rawProcedure.metadata.approvedBy?.map((p) => p.name).join(", ") ||
        rawProcedure.metadata.preparedBy?.map((p) => p.name).join(", ") ||
        "",
      revision: normalizeRevision(rawProcedure.metadata.revision || "00"),
      masterDocument: rawProcedure.metadata.masterDocument || null,
      masterPdf: rawProcedure.metadata.masterPdf || null,
      sections: normalizeFullProcedure(rawProcedure),
    };
  }

  if (isImportedProcedure(rawProcedure)) {
    return {
      mode: "imported",
      code: normalizeProcedureCode(rawProcedure.code || procedureCode),
      title: rawProcedure.name || procedureCode,
      description: rawProcedure.description || "",
      status: normalizeStatus(rawProcedure.status || "em_elaboracao"),
      createdAt: rawProcedure.createdAt || "",
      updatedAt: rawProcedure.updatedAt || "",
      responsible: rawProcedure.responsible || "Engenharia",
      revision: normalizeRevision(rawProcedure.revision || "00"),
      masterDocument: null,
      masterPdf: null,
      createdBy: (rawProcedure as any).createdBy || "",
      createdByRole: (rawProcedure as any).createdByRole || "",
      lastModifiedBy: (rawProcedure as any).lastModifiedBy || "",
      lastModifiedByRole: (rawProcedure as any).lastModifiedByRole || "",
      lastModifiedAt: (rawProcedure as any).lastModifiedAt || "",
      approvedBy: (rawProcedure as any).approvedBy || "",
      approvedByRole: (rawProcedure as any).approvedByRole || "",
      approvedAt: (rawProcedure as any).approvedAt || "",
      sections: normalizeImportedSections(rawProcedure),
    };
  }

  return {
    mode: "legacy",
    code: normalizeProcedureCode(rawProcedure.code || procedureCode),
    title: rawProcedure.name || procedureCode,
    description: rawProcedure.description || "",
    status: normalizeStatus(rawProcedure.status || "em_desenvolvimento"),
    createdAt: rawProcedure.createdAt || "",
    updatedAt: rawProcedure.updatedAt || "",
    responsible: rawProcedure.responsible || "",
    revision: normalizeRevision(rawProcedure.revision || "00"),
    masterDocument: null,
    masterPdf: null,
    sections: normalizeLegacyProcedure(rawProcedure),
  };
}

function FlowchartPlaceholder({
  code,
  revision,
}: {
  code: string;
  revision: string;
}) {
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const revisionFlowPath = `/flows/${code}_${revision}_Flow.png`;
  const fallbackFlowPath = `/flows/${code}_Flow.png`;

  const [flowSrc, setFlowSrc] = useState(revisionFlowPath);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setFlowSrc(revisionFlowPath);
    setImageError(false);
  }, [revisionFlowPath]);

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  const handleImageError = () => {
    if (flowSrc !== fallbackFlowPath) {
      setFlowSrc(fallbackFlowPath);
    } else {
      setImageError(true);
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Workflow className="mt-0.5 h-5 w-5 text-slate-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">
                  Fluxograma do procedimento
                </p>
                <p className="text-sm text-slate-600">
                  Visualização do fluxo operacional vinculado ao procedimento.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFlowOpen((prev) => !prev)}
              >
                {isFlowOpen ? "Recolher" : "Expandir"}
              </Button>

              {isFlowOpen && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                  >
                    -
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetZoom}
                  >
                    {Math.round(zoom * 100)}%
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                  >
                    +
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                  >
                    Tela cheia
                  </Button>
                </>
              )}
            </div>
          </div>

          {isFlowOpen && (
            <div className="overflow-auto rounded-lg border bg-slate-50 p-3">
              {!imageError ? (
                <img
                  src={flowSrc}
                  alt={`Fluxograma ${code}`}
                  onError={handleImageError}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  className="h-auto max-w-none"
                />
              ) : (
                <div className="w-full text-center py-10 text-sm text-gray-500">
                  Fluxograma ainda não disponível para esta revisão.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-2 p-4 border-b">
              <h3 className="font-semibold">Fluxograma — {code}</h3>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                >
                  -
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetZoom}
                >
                  {Math.round(zoom * 100)}%
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                >
                  +
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>

            <div className="w-full h-[calc(100%-64px)] overflow-auto bg-slate-100 p-4">
              {!imageError ? (
                <img
                  src={flowSrc}
                  alt={`Fluxograma ${code}`}
                  onError={handleImageError}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  className="max-w-none"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                  Fluxograma ainda não disponível para esta revisão.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default function ProcedureDetail() {
  const currentUser = getCurrentUser();
  const [location, setLocation] = useLocation();
  const [openProcessItems, setOpenProcessItems] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
]);
  const [storageVersion, setStorageVersion] = useState(0);

  const codeMatch = location.match(/\/procedimentos\/(.+)/);
  const procedureCodeRaw = codeMatch ? decodeURIComponent(codeMatch[1]) : "CPR-01";
  const procedureCode = normalizeProcedureCode(procedureCodeRaw);

  const { data: dbProcedure, isLoading: loadingProcedure } = trpc.procedures.getByCode.useQuery(
    { code: procedureCode },
    { retry: false }
  );
  const { data: dbSections } = trpc.procedures.getSections.useQuery(
    { id: dbProcedure?.id ?? 0 },
    { enabled: !!dbProcedure?.id }
  );
  const { data: copReqs = [] } = trpc.copRequirements.list.useQuery();
  const updateProcedureMutation = trpc.procedures.update.useMutation();
  const deleteProcedureMutation = trpc.procedures.delete.useMutation();
  const utils = trpc.useUtils();

  const dbProcedureAsImported = useMemo((): ImportedProcedure | null => {
    if (!dbProcedure) return null;

    const mapSection = (s: any) => ({
      number: String(s.number ?? ""),
      item: String(s.number ?? ""),
      title: String(s.title ?? ""),
      content: s.content ?? "",
      subitems: Array.isArray(s.subitems)
        ? s.subitems.map((sub: any) => ({
            item: sub.item ?? "",
            title: sub.title ?? "",
            content: sub.content ?? "",
          }))
        : [],
      mode: s.mode === "table" ? "table" : ("text" as "text" | "table"),
      table: s.table ?? undefined,
    });

    let sections: ImportedSection[] = [];
    if (Array.isArray(dbSections) && dbSections.length > 0) {
      sections = dbSections.map(mapSection);
    } else {
      // fallback: localStorage enquanto não há dados no banco
      try {
        const raw = localStorage.getItem(`sections:${procedureCode}`);
        if (raw) {
          const parsed: any[] = JSON.parse(raw);
          if (Array.isArray(parsed)) sections = parsed.map(mapSection);
        }
      } catch { /* ignore */ }
    }

    const dbDate = (d: any): string => {
      if (!d) return new Date().toISOString().slice(0, 10);
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      return String(d).slice(0, 10);
    };

    return {
      id: dbProcedure.id,
      code: dbProcedure.code,
      name: dbProcedure.name,
      description: dbProcedure.description ?? undefined,
      status: dbProcedure.status,
      responsible: dbProcedure.responsible ?? undefined,
      createdAt: dbDate(dbProcedure.createdAt),
      updatedAt: dbDate(dbProcedure.updatedAt),
      sections,
      revision: "00",
    };
  }, [dbProcedure, dbSections, procedureCode]);

  const storedProcedure = useMemo(() => {
    if (dbProcedureAsImported) return null;
    try {
      const stored = localStorage.getItem("customProcedures");
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return null;

      return (
        parsed.find((item: any) => {
          const itemCode = normalizeProcedureCode(String(item.code || ""));
          return itemCode.toLowerCase() === procedureCode.toLowerCase();
        }) || null
      );
    } catch {
      return null;
    }
  }, [procedureCode, storageVersion, dbProcedureAsImported]);

  const baseProcedureSource: ProcedureData | null = dbProcedureAsImported
    ? null
    : proceduresData[procedureCodeRaw] || proceduresData[procedureCode] || null;

  const rawProcedureSource: ProcedureData | null =
    (dbProcedureAsImported as ProcedureData | null) || storedProcedure || baseProcedureSource || null;

  useEffect(() => {
    if (dbProcedureAsImported) return;
    if (!baseProcedureSource && !storedProcedure) return;

    try {
      const existing = readCustomProcedures();
      const currentCodeLower = procedureCode.toLowerCase();
      const targetIndex = existing.findIndex((item: any) => {
        const itemCode = normalizeProcedureCode(String(item.code || ""));
        return itemCode.toLowerCase() === currentCodeLower;
      });

      const unified = ensureUnifiedProcedureRecord(
        procedureCode,
        targetIndex >= 0 ? existing[targetIndex] : storedProcedure,
        baseProcedureSource
      );

      if (!unified) return;

      const currentSerialized =
        targetIndex >= 0 ? JSON.stringify(existing[targetIndex]) : "";
      const nextSerialized = JSON.stringify(unified);

      if (currentSerialized === nextSerialized) return;

      const updated = [...existing];
      if (targetIndex >= 0) {
        updated[targetIndex] = unified;
      } else {
        updated.push(unified);
      }

      writeCustomProcedures(updated);
      setStorageVersion((prev) => prev + 1);
    } catch (error) {
      console.error("Falha ao unificar histórico de revisões:", error);
    }
  }, [procedureCode, baseProcedureSource, storedProcedure]);

  const storedData = getStoredProcedureView(procedureCode);

  const revisionOptions = useMemo(() => {
    const options: string[] = [];

    if (Array.isArray(storedProcedure?.revisions)) {
      storedProcedure.revisions.forEach((revisionItem: any) => {
        const revision = normalizeRevision(revisionItem?.revision || "00");
        if (!options.includes(revision)) options.push(revision);
      });
    }

    const baseRevision = normalizeRevision(
      String(
        (baseProcedureSource as any)?.revision ||
          (baseProcedureSource as any)?.metadata?.revision ||
          "00"
      )
    );

    if (!options.includes(baseRevision)) options.push(baseRevision);

    const topLevelRevision = normalizeRevision(
      String(
        storedProcedure?.revision ||
          (rawProcedureSource as any)?.revision ||
          (rawProcedureSource as any)?.metadata?.revision ||
          "00"
      )
    );

    if (!options.includes(topLevelRevision)) options.push(topLevelRevision);

    return options.sort((a, b) => {
      const numericA = Number(a);
      const numericB = Number(b);

      if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
        return numericA - numericB;
      }

      return a.localeCompare(b);
    });
  }, [storedProcedure, rawProcedureSource, baseProcedureSource]);

  const latestRevisionOption = revisionOptions[revisionOptions.length - 1] || "00";

  const [selectedRevision, setSelectedRevision] = useState<string>(
    normalizeRevision(storedData?.revision || latestRevisionOption || "00")
  );

  useEffect(() => {
    const preferredRevision = normalizeRevision(
      storedData?.revision || latestRevisionOption || "00"
    );

    setSelectedRevision(preferredRevision);
  }, [procedureCode, latestRevisionOption]);

  const selectedRevisionData = useMemo(() => {
    if (!Array.isArray(storedProcedure?.revisions)) return null;

    return (
      storedProcedure.revisions.find((revisionItem: any) => {
        return (
          normalizeRevision(revisionItem?.revision || "00") ===
          normalizeRevision(selectedRevision || "00")
        );
      }) || null
    );
  }, [storedProcedure, selectedRevision]);

  const rawProcedure: ProcedureData | null = useMemo(() => {
    if (!rawProcedureSource) return null;

    const selectedRevisionNormalized = normalizeRevision(selectedRevision || "00");
    const baseRevision = normalizeRevision(
      String(
        (baseProcedureSource as any)?.revision ||
          (baseProcedureSource as any)?.metadata?.revision ||
          "00"
      )
    );

    // Revisão R00: usar base somente se não houver revisão salva no localStorage.
if (
  baseProcedureSource &&
  selectedRevisionNormalized === baseRevision &&
  !selectedRevisionData &&
  !storedProcedure
) {
  return baseProcedureSource;
}

    if (storedProcedure && selectedRevisionData) {
      return {
        ...storedProcedure,
        ...selectedRevisionData,
        code: procedureCode,
        name: String(
          selectedRevisionData.name ||
            storedProcedure.name ||
            (rawProcedureSource as any)?.name ||
            procedureCode
        ),
        description: String(
          selectedRevisionData.description ||
            storedProcedure.description ||
            (rawProcedureSource as any)?.description ||
            ""
        ),
        status: normalizeStatus(selectedRevisionData.status || storedProcedure.status),
        revision: normalizeRevision(selectedRevisionData.revision || selectedRevision || "00"),
        responsible: String(
          selectedRevisionData.responsible ||
            storedProcedure.responsible ||
            (rawProcedureSource as any)?.responsible ||
            "Engenharia"
        ),
        createdAt: String(
          selectedRevisionData.createdAt || storedProcedure.createdAt || ""
        ),
        updatedAt: String(
          selectedRevisionData.updatedAt || storedProcedure.updatedAt || ""
        ),
        structure: getBestStructureForProcedure(storedProcedure, selectedRevisionData),
        sections: getBestStructureForProcedure(storedProcedure, selectedRevisionData),
      } as ProcedureData;
    }

    return rawProcedureSource;
  }, [rawProcedureSource, storedProcedure, selectedRevisionData, selectedRevision, procedureCode, baseProcedureSource]);

  const baseProcedureView = useMemo(() => {
    if (!rawProcedure) return null;
    return buildProcedureView(rawProcedure, procedureCode);
  }, [rawProcedure, procedureCode]);

  const [currentStatus, setCurrentStatus] = useState<string | undefined>(
    storedData?.status ? normalizeStatus(storedData.status) : undefined
  );

  const [currentRevision, setCurrentRevision] = useState<string | undefined>(
    storedData?.revision ? normalizeRevision(storedData.revision) : undefined
  );

  const isSelectedLatestRevision =
    normalizeRevision(selectedRevision || "00") === normalizeRevision(latestRevisionOption || "00");

  useEffect(() => {
    if (!baseProcedureView) return;

    setCurrentRevision(
      normalizeRevision(selectedRevisionData?.revision || selectedRevision || baseProcedureView.revision || "00")
    );
    setCurrentStatus(
      normalizeStatus(selectedRevisionData?.status || baseProcedureView.status)
    );
  }, [selectedRevision, selectedRevisionData, baseProcedureView]);

  useEffect(() => {
    if (!baseProcedureView) return;

    setStoredProcedureView(procedureCode, {
      status: normalizeStatus(currentStatus ?? baseProcedureView.status),
      revision: normalizeRevision(currentRevision ?? baseProcedureView.revision ?? "00"),
    });
  }, [procedureCode, currentStatus, currentRevision, baseProcedureView]);

  useEffect(() => {
    if (dbProcedureAsImported) return;
    if (!rawProcedure || !baseProcedureView || !isSelectedLatestRevision) return;

    const nextStatus = normalizeStatus(currentStatus ?? baseProcedureView.status);
    const nextRevision = normalizeRevision(
      currentRevision ?? baseProcedureView.revision ?? "00"
    );

    try {
      const existing = readCustomProcedures();
      const currentCodeLower = procedureCode.toLowerCase();

      const targetIndex = existing.findIndex((item: any) => {
        const itemCode = normalizeProcedureCode(String(item.code || ""));
        return itemCode.toLowerCase() === currentCodeLower;
      });

      if (targetIndex >= 0) {
        const currentItem = existing[targetIndex];
        const revisions = Array.isArray(currentItem.revisions)
          ? currentItem.revisions.map((revisionItem: any) => {
              if (normalizeRevision(revisionItem?.revision || "00") !== nextRevision) {
                return revisionItem;
              }

              return {
                ...revisionItem,
                status: nextStatus,
                updatedAt: new Date().toISOString().slice(0, 10),
              };
            })
          : currentItem.revisions;

        const updated = [...existing];
        updated[targetIndex] = {
          ...currentItem,
          code: procedureCode,
          status: nextStatus,
          revision: nextRevision,
          updatedAt: new Date().toISOString().slice(0, 10),
          ...(Array.isArray(revisions) ? { revisions } : {}),
        };
        writeCustomProcedures(updated);
      } else {
        const baseItem = convertBaseProcedureToCustomShape(procedureCode, rawProcedure);
        const newLocalItem = ensureUnifiedProcedureRecord(
          procedureCode,
          {
            ...baseItem,
            code: procedureCode,
            status: nextStatus,
            revision: nextRevision,
            updatedAt: new Date().toISOString().slice(0, 10),
          },
          baseProcedureSource
        );

        writeCustomProcedures([...existing, newLocalItem || baseItem]);
        setStorageVersion((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Falha ao sincronizar customProcedures:", error);
    }
  }, [
    procedureCode,
    rawProcedure,
    baseProcedureView,
    currentStatus,
    currentRevision,
    isSelectedLatestRevision,
  ]);

  const procedureView = useMemo(() => {
    if (!baseProcedureView) return null;

    return {
      ...baseProcedureView,
      code: procedureCode,
      status: normalizeStatus(currentStatus ?? baseProcedureView.status),
      revision: normalizeRevision(currentRevision ?? baseProcedureView.revision ?? "00"),
    };
  }, [baseProcedureView, currentStatus, currentRevision, procedureCode]);

useEffect(() => {
  if (dbProcedureAsImported) return;
  if (!procedureView) return;

  const evidences = readEvidences();

  const evidenceSection = procedureView.sections.find(
    (section) => section.order === 6
  );

  if (!evidenceSection || !evidenceSection.table) return;

  const rows = evidenceSection.table.rows || [];
  const newItems: any[] = [];

  rows.forEach((row, index) => {
    const requirementId = `6.${index + 1}`;
const revision = `R${normalizeRevision(procedureView.revision)}`;

    const alreadyExists = evidences.find(
      (e) =>
        e.cprCode === procedureView.code &&
        e.requirementId === requirementId
    );

    if (!alreadyExists) {
      newItems.push({
  id: `${procedureView.code}-${revision}-${requirementId}`,
  cprCode: procedureView.code,
  revision,
  requirementId,
  requisito: row[0] || "",
        evidencias: [],
        registros: [],
        status: "PENDENTE",
        responsavel: "",
        updatedAt: new Date().toISOString(),
      });
    }
  });

  if (newItems.length > 0) {
    writeEvidences([...evidences, ...newItems]);
  }
}, [procedureView]);

  const allSectionKeys = useMemo(() => {
    if (!procedureView) return [];
    return procedureView.sections.map((section) => String(section.order));
  }, [procedureView]);

  const allProcessKeys = useMemo(() => {
    if (!procedureView) return [];
    const processSection = procedureView.sections.find((s) => s.order === 6);
    return (processSection?.subitems || []).map(
      (item, index) => item.item || `6.${index + 1}`
    );
  }, [procedureView]);

  if (loadingProcedure) {
    return <div className="p-6">Carregando procedimento...</div>;
  }

  if (!rawProcedure || !procedureView) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">Procedimento não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O procedimento solicitado não existe na base atual ou ainda não foi
              cadastrado corretamente.
            </p>

            <Button type="button" onClick={() => setLocation("/procedimentos")}>
              Voltar para Procedimentos
            </Button>
          </div>
        </Card>
      </div>
    );
  }

const normalizedStatus = normalizeStatus(procedureView.status);
const isApproved = normalizedStatus === "aprovado" || normalizedStatus === "implementado";
const isBlocked = normalizedStatus === "bloqueado";
const isCanceled = normalizedStatus === "cancelado";

const isProcedureLocked = isApproved || isBlocked || isCanceled;
const isLocked = isProcedureLocked;

const canEditEvidence =
  currentUser.role !== "USUARIO"; // ajuste conforme sua regra

const hasMasterDocument = Boolean(procedureView.masterDocument?.path);
const hasMasterPdf = Boolean(procedureView.masterPdf?.path);
  const toggleProcessItem = (key: string) => {
    setOpenProcessItems((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const expandAll = () => {
    setOpenSections(allSectionKeys);
    setOpenProcessItems(allProcessKeys);
  };

  const collapseAll = () => {
    setOpenSections([]);
    setOpenProcessItems([]);
  };

  const downloadFile = (path: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = path;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMasterDocument = () => {
    if (!procedureView.masterDocument?.path) return;
    downloadFile(
      procedureView.masterDocument.path,
      procedureView.masterDocument.fileName || "documento-mestre.docx"
    );
  };

  const downloadMasterPdf = () => {
    if (!procedureView.masterPdf?.path) return;
    downloadFile(
      procedureView.masterPdf.path,
      procedureView.masterPdf.fileName || "documento-mestre.pdf"
    );
  };

const handleDeleteProcedure = async () => {
  const code = String(procedureView.code || "").trim().toUpperCase();

  if (!code) return;

  const confirmDelete = window.confirm(
    `Excluir definitivamente o ${code}?\n\nEsta ação removerá o procedimento, o status salvo e as evidências vinculadas.`
  );

  if (!confirmDelete) return;

  if (dbProcedure) {
    try {
      await deleteProcedureMutation.mutateAsync({ id: dbProcedure.id });
      await utils.procedures.list.invalidate();
      localStorage.removeItem(`sections:${procedureCode}`);
      localStorage.removeItem(`procedure-${code}`);
      alert(`${code} excluído com sucesso.`);
      setLocation("/procedimentos");
    } catch (err: any) {
      alert(err?.message || "Erro ao excluir o procedimento.");
    }
    return;
  }

  localStorage.removeItem(`procedure-${code}`);

  const customProcedures = JSON.parse(
    localStorage.getItem("customProcedures") || "[]"
  );

  const filteredCustomProcedures = customProcedures.filter(
    (procedure: any) =>
      String(procedure.code || "").trim().toUpperCase() !== code
  );

  localStorage.setItem(
    "customProcedures",
    JSON.stringify(filteredCustomProcedures)
  );

  const evidences = JSON.parse(localStorage.getItem("evidences") || "[]");

  const filteredEvidences = evidences.filter((evidence: any) => {
    const evidenceCode = String(
      evidence.cprCode || evidence.procedureCode || ""
    )
      .trim()
      .toUpperCase();

    return evidenceCode !== code;
  });

  localStorage.setItem("evidences", JSON.stringify(filteredEvidences));

  alert(`${code} excluído com sucesso.`);
  setLocation("/procedimentos");
};

  const handleExportPdf = () => {
    if (!isApproved) {
      alert("PDF disponível apenas para documentos aprovados.");
      return;
    }

    if (!hasMasterPdf) {
      alert("PDF mestre ainda não disponível para este procedimento.");
      return;
    }

    downloadMasterPdf();
  };

  const handleNewRevision = () => {
    if (!isApproved) {
      alert(
        "Nova revisão só pode ser criada a partir de um procedimento com status Aprovado."
      );
      return;
    }

    if (!isSelectedLatestRevision) {
      alert("Selecione a revisão atual antes de criar uma nova revisão.");
      return;
    }

    const existing = readCustomProcedures();
    const currentCodeLower = procedureCode.toLowerCase();

    const index = existing.findIndex((item: any) => {
      const itemCode = normalizeProcedureCode(String(item.code || ""));
      return itemCode.toLowerCase() === currentCodeLower;
    });

    const nextRevision = getNextRevision(procedureView.revision || "00");
    const today = new Date().toISOString().slice(0, 10);

    const currentItem =
      index >= 0
        ? existing[index]
        : convertBaseProcedureToCustomShape(procedureCode, rawProcedure);

    const unifiedItem = ensureUnifiedProcedureRecord(
      procedureCode,
      currentItem,
      baseProcedureSource
    );

    if (!unifiedItem) {
      alert("Não foi possível criar a nova revisão.");
      return;
    }

    const alreadyExists = Array.isArray(unifiedItem.revisions)
      ? unifiedItem.revisions.some(
          (revisionItem: any) =>
            normalizeRevision(revisionItem?.revision || "00") === nextRevision
        )
      : false;

    const revisions = alreadyExists
      ? unifiedItem.revisions
      : [
          ...unifiedItem.revisions,
          {
            revision: nextRevision,
            status: "em_revisao",
            name: unifiedItem.name,
            description: unifiedItem.description,
            responsible: unifiedItem.responsible,
            createdAt: today,
            updatedAt: today,
            structure: getBestStructureForProcedure(unifiedItem, null),
            sections: getBestStructureForProcedure(unifiedItem, null),
            source: unifiedItem.source || "manual",
          },
        ];

    const updatedItem = {
      ...unifiedItem,
      revisions,
      revision: nextRevision,
      status: "em_revisao",
      updatedAt: today,
      structure: getBestStructureForProcedure(
        { ...unifiedItem, revisions },
        revisions[revisions.length - 1]
      ),
      sections: getBestStructureForProcedure(
        { ...unifiedItem, revisions },
        revisions[revisions.length - 1]
      ),
    };

    const updated = [...existing];

    if (index >= 0) {
      updated[index] = updatedItem;
    } else {
      updated.push(updatedItem);
    }

    writeCustomProcedures(updated);
    setStorageVersion((prev) => prev + 1);
    setSelectedRevision(nextRevision);
    setCurrentRevision(nextRevision);
    setCurrentStatus("em_revisao");

    alert(
      `Nova revisão criada com sucesso.\n\n` +
        `Procedimento: ${procedureView.code}\n` +
        `Revisão anterior: ${procedureView.revision || "00"}\n` +
        `Nova revisão: ${nextRevision}\n` +
        `Novo status: Em Revisão`
    );
  };

  const handleEditProcedure = () => {
    if (!isSelectedLatestRevision) {
      alert(
        "Esta é uma revisão histórica.\n\n" +
          "Para editar, selecione a revisão atual."
      );
      return;
    }

    if (isLocked) {
      alert(
        "Este procedimento está em base controlada.\n\n" +
          "Para realizar alterações, crie uma nova revisão."
      );
      return;
    }

    setLocation(
      `/novo-procedimento?code=${encodeURIComponent(procedureView.code)}`
    );
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleEditProcedure}
              disabled={
  isLocked ||
  !isSelectedLatestRevision ||
  currentUser.role === "USUARIO"
}
              title={
                !isSelectedLatestRevision
                  ? "Revisão histórica. Selecione a revisão atual para editar."
                  : isLocked
                  ? "Procedimento aprovado/bloqueado. Crie uma nova revisão para editar."
                  : "Editar procedimento"
              }
            >
              <Pencil className="mr-2 w-4 h-4" />
              Editar procedimento
            </Button>

            <Button
              variant="outline"
              onClick={handleNewRevision}
              disabled={
  !!dbProcedure ||
  !isApproved ||
  !isSelectedLatestRevision ||
  !["ADMIN", "QUALIDADE"].includes(currentUser.role)
}
              title={
                !!dbProcedure
                  ? "Revisões não disponíveis para procedimentos cadastrados no banco de dados"
                  : !isSelectedLatestRevision
                  ? "Disponível apenas na revisão atual"
                  : isApproved
                  ? "Criar nova revisão"
                  : "Disponível apenas quando o status estiver como Aprovado"
              }
            >
              <GitBranchPlus className="mr-2 w-4 h-4" />
              Nova revisão
            </Button>
<Button
  variant="outline"
  onClick={() =>
    setLocation(`/evidencias?cpr=${encodeURIComponent(procedureView.code)}`)
  }
  title="Gerenciar evidências de conformidade do Item 6"
>
  Gerenciar evidências
</Button>

<Button
  variant="destructive"
  onClick={handleDeleteProcedure}
disabled={!["ADMIN", "QUALIDADE"].includes(currentUser.role)}
  title="Excluir CPR, status salvo e evidências vinculadas"
>
  Excluir CPR
</Button>

            {hasMasterDocument && (
              <Button variant="outline" onClick={downloadMasterDocument}>
                <FileDown className="mr-2 w-4 h-4" />
                Baixar mestre
              </Button>
            )}

            {isApproved && hasMasterPdf && (
              <Button onClick={handleExportPdf}>
                <Printer className="mr-2 w-4 h-4" />
                Exportar PDF
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <button
              onClick={() => setLocation("/procedimentos")}
              className="shrink-0"
            >
              <ArrowLeft />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold break-words">
                  {procedureView.code}
                </h1>

                <Badge className={getStatusClasses(procedureView.status)}>
                  {formatStatusLabel(procedureView.status)}
                </Badge>

                {isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    <Lock className="h-3.5 w-3.5" />
                    Base controlada
                  </span>
                )}
              </div>

              <h2 className="text-lg break-words">{procedureView.title}</h2>

              {procedureView.description && (
                <p className="text-sm text-gray-500 mt-1 break-words">
                  {procedureView.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Status da revisão visualizada
              </label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={normalizeStatus(procedureView.status)}
                disabled={
  !isSelectedLatestRevision ||
  isLocked ||
  !["ADMIN", "QUALIDADE"].includes(currentUser.role)
}
                onChange={(e) => {
  if (dbProcedure) {
    const dbStatus = e.target.value as "nao_iniciado" | "em_desenvolvimento" | "implementado";
    setCurrentStatus(dbStatus);
    updateProcedureMutation.mutate({ id: dbProcedure.id, status: dbStatus });
    return;
  }

  const nextStatus = normalizeStatus(e.target.value);
  setCurrentStatus(nextStatus);

  if (nextStatus === "aprovado") {
    const nowIso = new Date().toISOString();

    try {
      const existing = readCustomProcedures();
      const currentCodeLower = procedureCode.toLowerCase();
      const currentRevision = normalizeRevision(
        selectedRevision || procedureView.revision || "00"
      );

      const updated = existing.map((item: any) => {
        const itemCode = normalizeProcedureCode(String(item.code || ""));

        if (itemCode.toLowerCase() !== currentCodeLower) return item;

        const updatedRevisions = Array.isArray(item.revisions)
          ? item.revisions.map((revisionItem: any) => {
              if (
                normalizeRevision(revisionItem?.revision || "00") !==
                currentRevision
              ) {
                return revisionItem;
              }

              return {
                ...revisionItem,
                status: "aprovado",
                approvedBy: currentUser.name || "Usuário",
                approvedByRole: currentUser.role || "",
                approvedAt: nowIso,
                updatedAt: nowIso.slice(0, 10),
              };
            })
          : item.revisions;

        return {
          ...item,
          status: "aprovado",
          approvedBy: currentUser.name || "Usuário",
          approvedByRole: currentUser.role || "",
          approvedAt: nowIso,
          updatedAt: nowIso.slice(0, 10),
          ...(Array.isArray(updatedRevisions)
            ? { revisions: updatedRevisions }
            : {}),
        };
      });

      writeCustomProcedures(updated);
    } catch (error) {
      console.error("Falha ao registrar aprovação:", error);
    }
  }
}}
              >
                {dbProcedure ? (
                  <>
                    <option value="nao_iniciado">Não iniciado</option>
                    <option value="em_desenvolvimento">Em desenvolvimento</option>
                    <option value="implementado">Implementado</option>
                  </>
                ) : (
                  <>
                    <option value="em_elaboracao">Em elaboração</option>
                    <option value="em_revisao">Em revisão</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="bloqueado">Bloqueado</option>
                    <option value="cancelado">Cancelado</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Revisão visualizada
              </label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={normalizeRevision(selectedRevision || procedureView.revision || "00")}
                onChange={(e) =>
                  setSelectedRevision(normalizeRevision(e.target.value))
                }
              >
                {revisionOptions.map((revisionOption) => (
                  <option key={revisionOption} value={revisionOption}>
                    Rev. {revisionOption}
                    {revisionOption === latestRevisionOption ? " — atual" : " — histórico"}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-muted-foreground">
              {isSelectedLatestRevision
                ? "Alterações de status são gravadas automaticamente na revisão atual."
                : "Você está visualizando uma revisão histórica. Ela permanece bloqueada para alteração."}
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-700 space-y-1">
            <p className="font-semibold">Regra de revisão</p>
            <p>
              Uma nova revisão só pode ser criada quando o procedimento estiver
              com status <strong>Aprovado</strong>.
            </p>
            <p>
              Ao criar nova revisão, o sistema incrementa a revisão atual e
              altera o status automaticamente para <strong>Em Revisão</strong>.
            </p>
          </div>
        </Card>

        <FlowchartPlaceholder
          code={procedureView.code}
          revision={procedureView.revision || "00"}
        />

        <div className="flex items-center gap-2 pl-0 md:pl-10">
          <Button
            variant="outline"
            size="icon"
            onClick={expandAll}
            aria-label="Expandir tudo"
            title="Expandir tudo"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={collapseAll}
            aria-label="Recolher tudo"
            title="Recolher tudo"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLocked && (
        <Card className="border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-gray-600 shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold">
  {isCanceled
    ? "Procedimento cancelado"
    : "Procedimento em base controlada"}
</p>
              <p>
                Alterações diretas não são permitidas. Para modificar este
                procedimento, crie uma nova revisão.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Código</p>
      <p className="break-words">{procedureView.code}</p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Status</p>
      <p className="break-words">
        {formatStatusLabel(procedureView.status)}
      </p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Data base</p>
      <p className="break-words">{procedureView.createdAt || "-"}</p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Revisão</p>
      <p className="break-words">{procedureView.revision || "00"}</p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Criado por</p>
      <p className="break-words">
        {(procedureView as any).createdBy || "-"}
      </p>
      <p className="text-xs text-gray-500">
        {(procedureView as any).createdByRole || ""}
      </p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Última edição</p>
      <p className="break-words">
        {(procedureView as any).lastModifiedBy || "-"}
      </p>
            <p className="text-xs text-gray-500">
        {(procedureView as any).lastModifiedByRole || ""}
      </p>
      <p className="text-xs text-gray-500">
        {(procedureView as any).lastModifiedAt
          ? new Date((procedureView as any).lastModifiedAt).toLocaleString()
          : ""}
      </p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Aprovado por</p>
      <p className="break-words">
        {(procedureView as any).approvedBy || "-"}
      </p>
      <p className="text-xs text-gray-500">
  {(procedureView as any).approvedByRole || ""}
</p>
<p className="text-xs text-gray-500">
  {(procedureView as any).approvedAt
    ? new Date((procedureView as any).approvedAt).toLocaleString()
    : ""}
</p>
    </div>

    <div className="min-w-0">
      <p className="font-semibold text-gray-700">Documento mestre</p>
      <p className="break-words">
        {procedureView.masterDocument?.fileName || "Não disponível"}
      </p>
    </div>
  </div>
</Card>

      {procedureView.sections.filter((section) => !isSectionEmpty(section)).map((section) => {
        const sectionKey = String(section.order);
        const isProcessSection = section.order === 6;
        const isTableSection =
          section.mode === "table" && isValidTable(section.table);

        return (
          <SectionCard
            key={sectionKey}
            title={`${section.order}. ${section.title}`}
            isOpen={openSections.includes(sectionKey)}
            onToggle={() => toggleSection(sectionKey)}
          >
            <div className="mt-4 space-y-4">
              {isTableSection
                ? renderTable(section.table, section.order, copReqs)
                : renderStructuredText(section.content)}

              {!isProcessSection &&
                !isTableSection &&
                (section.subitems || []).map((subitem, index) => (
                  <div key={`${section.order}-${index}`} className="space-y-2">
                    <p className="font-semibold text-sm break-words">
                      {subitem.item || `${section.order}.${index + 1}`}{" "}
                      {subitem.title}
                    </p>
                    {renderStructuredText(subitem.content)}
                  </div>
                ))}

              {isProcessSection &&
                (section.subitems || []).map((subitem, index) => {
                  const processKey = subitem.item || `6.${index + 1}`;
                  const isOpen = openProcessItems.includes(processKey);
                  const processLines = contentToBlocks(subitem.content);

                  return (
                    <div key={processKey} className="border rounded-lg min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleProcessItem(processKey)}
                        className="w-full text-left p-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold break-words">
                            {processKey} - {subitem.title}
                          </p>
                        </div>

                        <span className="text-sm text-gray-500 shrink-0">
                          {isOpen ? "Recolher" : "Expandir"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t">
                          <div className="mt-4">
                            <p className="font-semibold text-sm mb-1">
                              Atividades
                            </p>

                            <div className="space-y-3">
                              {processLines.map((activity, idx) => {
                                const alphaMatch = activity.match(
                                  /^([a-z]\))\s+(.*)$/i
                                );
                                const bulletMatch = activity.match(
                                  /^[-•–*]\s+(.*)$/
                                );

                                if (alphaMatch) {
                                  return (
                                    <div
                                      key={`${processKey}-activity-${idx}`}
                                      className="flex items-start gap-3 pl-4"
                                    >
                                      <span className="min-w-[28px] font-medium text-sm text-gray-900">
                                        {alphaMatch[1]}
                                      </span>

                                      <p className="text-sm text-gray-700 break-words leading-7">
                                        {alphaMatch[2]}
                                      </p>
                                    </div>
                                  );
                                }

                                if (bulletMatch) {
                                  return (
                                    <ul
                                      key={`${processKey}-activity-${idx}`}
                                      className="list-disc pl-5 text-sm text-gray-700"
                                    >
                                      <li className="leading-7">
                                        {bulletMatch[1]}
                                      </li>
                                    </ul>
                                  );
                                }

                                return (
                                  <p
                                    key={`${processKey}-activity-${idx}`}
                                    className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-7"
                                  >
                                    {activity}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}