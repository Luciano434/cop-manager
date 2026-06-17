import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { baseProcedures } from "@/data/procedures/baseProcedures";

type Subitem = {
  id: string;
  item: string;
  title: string;
  content: string;
};

type SectionTable = {
  columns: string[];
  rows: string[][];
};

type SectionMode = "text" | "table";

type Section = {
  number: number;
  title: string;
  content: string;
  hasSubitems: boolean;
  subitems: Subitem[];
  mode?: SectionMode;
  table?: SectionTable;
};

const SECTION_TITLES = [
  "Objetivo",
  "Definições",
  "Procedimentos",
  "Registros da Qualidade",
  "Documentos de Referência",
  "Evidências Objetivas",
  "Rastreabilidade COP",
];

const FAMILY_OPTIONS = [
  { id: "a-classificar", label: "A classificar" },
  { id: "controle-projeto", label: "Controle de Projeto" },
  { id: "controle-materiais", label: "Controle de Materiais" },
  { id: "controle-producao", label: "Controle de Produção" },
  { id: "liberacao-final", label: "Liberação Final" },
  { id: "aeronavegabilidade-continuada", label: "Aeronavegabilidade Continuada" },
  { id: "gestao-organizacional", label: "Gestão Organizacional" },
];

const DEFAULT_EVIDENCE_TABLE: SectionTable = {
  columns: [
    "Requisito",
    "Evidência Objetiva Esperada",
    "Registro Associado",
    "Forma de Verificação",
  ],
  rows: [["", "", "", ""]],
};

const DEFAULT_RECORDS_TABLE: SectionTable = {
  columns: [
    "Código",
    "Registro da Qualidade",
    "Responsável",
    "Retenção",
    "Local de Armazenamento",
  ],
  rows: [["", "", "", "", ""]],
};

const DEFAULT_COP_TABLE: SectionTable = {
  columns: ["Item COP", "Descrição", "Capítulo do CPR", "Evidência", "Status"],
  rows: [["", "", "", "", ""]],
};

function cloneTable(table: SectionTable): SectionTable {
  return {
    columns: [...table.columns],
    rows: table.rows.map((row) => [...row]),
  };
}

function getDefaultEvidenceRow(): string[] {
  return ["", "", "", ""];
}

function getDefaultTableRow(sectionNumber: number, columnCount: number): string[] {
  if (sectionNumber === 6) return getDefaultEvidenceRow();
  return new Array(columnCount).fill("");
}

function normalizeEvidenceRow(row: any[]): string[] {
  const normalized = Array.isArray(row)
    ? row.map((cell: any) => String(cell ?? ""))
    : [];

  return [
    normalized[0] || "",
    normalized[1] || "",
    normalized[2] || "",
    normalized[3] || "",
  ];
}

function normalizeTableForSection(
  sectionNumber: number,
  table?: SectionTable
): SectionTable | undefined {
  if (sectionNumber === 4) {
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
    return cloneTable(DEFAULT_RECORDS_TABLE);
  }

  return {
    columns: [...DEFAULT_RECORDS_TABLE.columns],
    rows:
      table.rows.length > 0
        ? table.rows.map((row) =>
            Array.isArray(row)
              ? DEFAULT_RECORDS_TABLE.columns.map((_, index) =>
                  String(row[index] ?? "")
                )
              : new Array(DEFAULT_RECORDS_TABLE.columns.length).fill("")
          )
        : [new Array(DEFAULT_RECORDS_TABLE.columns.length).fill("")],
  };
}
  
  if (sectionNumber === 6) {
    if (!table || !Array.isArray(table.rows)) {
      return cloneTable(DEFAULT_EVIDENCE_TABLE);
    }

    return {
      columns: [...DEFAULT_EVIDENCE_TABLE.columns],
      rows:
        table.rows.length > 0
          ? table.rows.map((row) => normalizeEvidenceRow(row))
          : [getDefaultEvidenceRow()],
    };
  }

  if (sectionNumber === 7) {
    if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
      return cloneTable(DEFAULT_COP_TABLE);
    }

    return {
      columns: table.columns.map((col) => String(col || "")),
      rows:
        table.rows.length > 0
          ? table.rows.map((row) =>
              Array.isArray(row)
                ? row.map((cell) => String(cell ?? ""))
                : new Array(table.columns.length).fill("")
            )
          : [new Array(table.columns.length).fill("")],
    };
  }

  return undefined;
}

function getDefaultTableForSection(
  sectionNumber: number
): SectionTable | undefined {
  if (sectionNumber === 4) return cloneTable(DEFAULT_RECORDS_TABLE);
  if (sectionNumber === 6) return cloneTable(DEFAULT_EVIDENCE_TABLE);
  if (sectionNumber === 7) return cloneTable(DEFAULT_COP_TABLE);
  return undefined;
}

function createEmptySections(): Section[] {
  return SECTION_TITLES.map((title, index) => {
    const sectionNumber = index + 1;
    const isRecordsSection = sectionNumber === 4;
    const isEvidenceSection = sectionNumber === 6;
    const isCopSection = sectionNumber === 7;

    return {
      number: sectionNumber,
      title,
      content: "",
      hasSubitems: false,
      subitems: [],
      mode:
  isRecordsSection || isEvidenceSection
    ? "table"
    : "text",
      table:
  isRecordsSection || isEvidenceSection || isCopSection
    ? getDefaultTableForSection(sectionNumber)
    : undefined,
    };
  });
}

function buildNumberLabel(sectionNumber: number, subIndex: number) {
  return `${sectionNumber}.${subIndex + 1}`;
}

function normalizeStatus(value: string) {
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

  return "em_elaboracao";
}

function normalizeEvidenceStatus(value: string) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "ok") return "OK";
  if (normalized === "nok") return "NOK";
  if (normalized === "pendente") return "Pendente";

  return "Pendente";
}

function normalizeRevision(value: string) {
  const raw = String(value || "00").trim().toUpperCase();
  const withoutPrefix = raw.replace(/^R/, "");
  return withoutPrefix || "00";
}

function normalizeFamily(value: string) {
  const raw = String(value || "").trim();

  if (!raw) return "a-classificar";

  const foundById = FAMILY_OPTIONS.find(
    (option) => option.id.toLowerCase() === raw.toLowerCase()
  );

  if (foundById) return foundById.id;

  const foundByLabel = FAMILY_OPTIONS.find(
    (option) => option.label.toLowerCase() === raw.toLowerCase()
  );

  if (foundByLabel) return foundByLabel.id;

  return "a-classificar";
}

function inferFamilyFromProcedure(code: string, name: string) {
  const normalizedCode = normalizeProcedureCode(code);
  const normalizedName = String(name || "").toLowerCase();

  if (
    normalizedCode === "CPR-01" ||
    normalizedCode === "CPR-02" ||
    normalizedName.includes("projeto") ||
    normalizedName.includes("modifica")
  ) {
    return "Controle de Projeto";
  }

  if (
    normalizedCode === "CPR-03" ||
    normalizedName.includes("aeronavegabilidade")
  ) {
    return "Aeronavegabilidade Continuada";
  }

  if (
    normalizedName.includes("material") ||
    normalizedName.includes("materiais") ||
    normalizedName.includes("fornecedor") ||
    normalizedName.includes("compras") ||
    normalizedName.includes("recebimento")
  ) {
    return "Controle de Materiais";
  }

  if (
    normalizedName.includes("produção") ||
    normalizedName.includes("producao") ||
    normalizedName.includes("fabricação") ||
    normalizedName.includes("fabricacao")
  ) {
    return "Controle de Produção";
  }

  if (
    normalizedName.includes("qualidade") ||
    normalizedName.includes("inspeção") ||
    normalizedName.includes("inspecao") ||
    normalizedName.includes("não conformidade") ||
    normalizedName.includes("nao conformidade")
  ) {
    return "Liberação Final";
  }

  return "A classificar";
}

function normalizeStructureToSections(structure: any[] | undefined): Section[] {
  const emptySections = createEmptySections();

  if (!Array.isArray(structure)) return emptySections;

  const sourceNumbers = structure
    .map((item) => String(item?.item || item?.number || "").trim())
    .filter(Boolean);

  const looksLikeOld11Structure =
    sourceNumbers.includes("8") ||
    sourceNumbers.includes("9") ||
    sourceNumbers.includes("10") ||
    sourceNumbers.includes("11");

  const legacyToNewMap: Record<number, number | null> = looksLikeOld11Structure
    ? {
        1: 1, // Objetivo
        2: 4, // Definições
        3: 6, // Procedimentos
        4: null, // Registros da Qualidade
        5: 3, // Documentos de Referência
        6: 8, // Evidências Objetivas
        7: 9, // Rastreabilidade COP
      }
    : {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
      };

  return emptySections.map((baseSection, index) => {
    const sectionNumber = index + 1;
    const sourceNumber = legacyToNewMap[sectionNumber];

    const source =
      sourceNumber === null
        ? null
        : structure.find(
            (item) =>
              String(item?.item || "") === String(sourceNumber) ||
              String(item?.number || "") === String(sourceNumber)
          );

    const subitems = Array.isArray(source?.subitems)
      ? source.subitems.map((subitem: any, subIndex: number) => ({
          id: `${sectionNumber}.${subIndex + 1}`,
          item: `${sectionNumber}.${subIndex + 1}`,
          title: String(subitem?.title || ""),
          content: String(subitem?.content || ""),
        }))
      : [];

    const rawTable =
      source?.table &&
      Array.isArray(source.table.columns) &&
      Array.isArray(source.table.rows)
        ? {
            columns: source.table.columns.map((col: any) => String(col || "")),
            rows: source.table.rows.map((row: any) =>
              Array.isArray(row)
                ? row.map((cell: any) => String(cell ?? ""))
                : []
            ),
          }
        : undefined;

    const table = normalizeTableForSection(sectionNumber, rawTable);

    const mode: SectionMode =
  sectionNumber === 4 || sectionNumber === 6 || sectionNumber === 7
    ? "table"
    : "text";

    return {
      number: sectionNumber,
      title: baseSection.title,
      content: mode === "table" ? "" : String(source?.content || ""),
      hasSubitems: mode === "table" ? false : subitems.length > 0,
      subitems: mode === "table" ? [] : subitems,
      mode,
      table,
    };
  });
}

function findProcedureInCustomProcedures(editCode: string) {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return null;

    return (
      mergeProcedureWithLatestRevision(
        parsed.find((item: any) => {
          const itemCode = String(item.code || "").toLowerCase();
          const searchCode = String(editCode || "").toLowerCase();

          return (
            itemCode === searchCode ||
            itemCode === normalizeProcedureCode(searchCode).toLowerCase()
          );
        }) || null
      ) || null
    );
  } catch {
    return null;
  }
}

function findProcedureInBase(editCode: string) {
  return (
    baseProcedures.find((item: any) => {
      const itemCode = String(item.code || "").toLowerCase();
      const searchCode = String(editCode || "").toLowerCase();

      return (
        itemCode === searchCode ||
        itemCode === normalizeProcedureCode(searchCode).toLowerCase()
      );
    }) || null
  );
}

function safelyReadCustomProcedures() {
  try {
    const raw = localStorage.getItem("customProcedures");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sortRevisions(revisions: any[]) {
  return [...revisions].sort((a, b) => {
    const numericA = Number(normalizeRevision(a?.revision || "00"));
    const numericB = Number(normalizeRevision(b?.revision || "00"));

    if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
      return numericA - numericB;
    }

    return String(a?.revision || "00").localeCompare(String(b?.revision || "00"));
  });
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

          // No item 8, "Pendente" pode ser apenas valor padrão do status.
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

function getLatestRevisionRecord(procedure: any) {
  if (!Array.isArray(procedure?.revisions) || procedure.revisions.length === 0) {
    return null;
  }

  const sorted = sortRevisions(procedure.revisions);
  return sorted[sorted.length - 1] || null;
}

function mergeProcedureWithLatestRevision(procedure: any) {
  if (!procedure) return null;

  const latestRevision = getLatestRevisionRecord(procedure);

  if (!latestRevision) {
    return {
      ...procedure,
      structure: getStructureCandidate(procedure),
      sections: getStructureCandidate(procedure),
    };
  }

  const structureToUse = getBestStructureForProcedure(procedure, latestRevision);

  return {
    ...procedure,
    ...latestRevision,
    id: procedure.id,
    code: normalizeProcedureCode(
      String(procedure.code || latestRevision.code || "")
    ),
    name: String(latestRevision.name || procedure.name || ""),
    description: String(
      latestRevision.description || procedure.description || ""
    ),
    responsible: String(
      latestRevision.responsible || procedure.responsible || "Engenharia"
    ),
    status: normalizeStatus(latestRevision.status || procedure.status),
    revision: normalizeRevision(
      latestRevision.revision || procedure.revision || "00"
    ),
    structure: structureToUse,
    sections: structureToUse,
  };
}

function buildRevisionRecordFromPayload(payload: any) {
  return {
    revision: normalizeRevision(payload.revision || "00"),
    status: normalizeStatus(payload.status || "em_elaboracao"),
    name: payload.name,
    description: payload.description,
    responsible: payload.responsible,

    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,

    createdBy: payload.createdBy || "",
    createdByRole: payload.createdByRole || "",
    lastModifiedBy: payload.lastModifiedBy || "",
    lastModifiedByRole: payload.lastModifiedByRole || "",
    lastModifiedAt: payload.lastModifiedAt || "",
    approvedBy: payload.approvedBy || "",
    approvedByRole: payload.approvedByRole || "",
    approvedAt: payload.approvedAt || "",

    structure: Array.isArray(payload.structure) ? payload.structure : [],
    sections: Array.isArray(payload.sections) ? payload.sections : [],
    source: payload.source || "manual",
  };
}

function upsertRevisionInProcedure(existingItem: any, payload: any) {
  const payloadStructure = getStructureCandidate(payload);
  const existingBestStructure = getBestStructureForProcedure(existingItem || {}, null);

  const safePayload =
    !hasUsefulStructure(payloadStructure) && hasUsefulStructure(existingBestStructure)
      ? {
          ...payload,
          structure: existingBestStructure,
          sections: existingBestStructure,
        }
      : payload;

  const revisionRecord = buildRevisionRecordFromPayload(safePayload);
  const targetRevision = normalizeRevision(revisionRecord.revision);

  const existingRevisions = Array.isArray(existingItem?.revisions)
    ? sortRevisions(existingItem.revisions)
    : existingItem
    ? [
        buildRevisionRecordFromPayload({
          ...existingItem,
          revision: existingItem?.revision || "00",
          status: existingItem?.status || "em_elaboracao",
          structure: getStructureCandidate(existingItem),
          sections: getStructureCandidate(existingItem),
        }),
      ]
    : [];

  const updatedRevisions = existingRevisions.some(
    (item: any) => normalizeRevision(item?.revision || "00") === targetRevision
  )
    ? existingRevisions.map((item: any) =>
        normalizeRevision(item?.revision || "00") === targetRevision
          ? { ...item, ...revisionRecord }
          : item
      )
    : [...existingRevisions, revisionRecord];

  const sortedRevisions = sortRevisions(updatedRevisions);
  const latest = sortedRevisions[sortedRevisions.length - 1] || revisionRecord;
  const structureToUse = getBestStructureForProcedure(
    {
      ...existingItem,
      ...safePayload,
      revisions: sortedRevisions,
    },
    latest
  );

  return {
    ...existingItem,
    ...safePayload,
    id: existingItem?.id ?? safePayload.id,
    createdAt: existingItem?.createdAt ?? safePayload.createdAt,
    code: safePayload.code,
    revision: normalizeRevision(latest.revision || safePayload.revision || "00"),
    status: normalizeStatus(latest.status || safePayload.status),
    structure: structureToUse,
    sections: structureToUse,
    revisions: sortedRevisions,
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

function removeStoredProcedureView(code: string) {
  try {
    localStorage.removeItem(`procedure-${code}`);
  } catch (error) {
    console.error("Falha ao remover procedure view:", error);
  }
}

export default function NovoProcedimento() {
  const [, setLocation] = useLocation();

  const editCode = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("code");
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalCode, setOriginalCode] = useState<string | null>(null);
  const [loadedProcedureId, setLoadedProcedureId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [family, setFamily] = useState("A classificar");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("Engenharia");
  const [status, setStatus] = useState("em_elaboracao");
  const [revision, setRevision] = useState("00");

  const [sections, setSections] = useState<Section[]>(createEmptySections());
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSection = sections[currentIndex];
  const isEvidenceSection = currentSection.number === 6;
  const isCopSection = currentSection.number === 7;
  const isTableMode = currentSection.mode === "table";
  const isApprovedLocked = isEditMode && status === "aprovado";

  const progressText = useMemo(() => {
    return `Capítulo ${currentIndex + 1} de ${sections.length}`;
  }, [currentIndex, sections.length]);

  useEffect(() => {
    if (!editCode) {
      setIsEditMode(false);
      setOriginalCode(null);
      setLoadedProcedureId(null);
      setCode("");
      setName("");
      setFamily("A classificar");
      setDescription("");
      setResponsible("Engenharia");
      setStatus("em_elaboracao");
      setRevision("00");
      setSections(createEmptySections());
      setCurrentIndex(0);
      return;
    }

    const foundCustom = findProcedureInCustomProcedures(editCode);
    const foundBase = findProcedureInBase(editCode);
    const found = foundCustom || foundBase;

    if (!found) {
      console.error(`Procedimento ${editCode} não encontrado.`);
      setIsEditMode(false);
      setOriginalCode(null);
      setLoadedProcedureId(null);
      return;
    }

    setIsEditMode(true);
    setOriginalCode(String(found.code || ""));
    setLoadedProcedureId(
      typeof found.id === "number" ? found.id : Number(found.id) || null
    );

    const storedView = getStoredProcedureView(String(found.code || ""));

    const loadedCode = normalizeProcedureCode(String(found.code || ""));
    const loadedName = String(found.name || found.metadata?.title || "");
    const loadedFamily = normalizeFamily(
      String(found.family || inferFamilyFromProcedure(loadedCode, loadedName))
    );

    setCode(loadedCode);
    setName(loadedName);
    setFamily(loadedFamily);
    setDescription(String(found.description || found.objective || ""));
    setResponsible(String(found.responsible || "Engenharia"));
    setStatus(
      normalizeStatus(
        String(storedView?.status || found.status || found.metadata?.status || "em_elaboracao")
      )
    );
    setRevision(
      normalizeRevision(String(storedView?.revision || found.revision || found.metadata?.revision || "00"))
    );

    const latestRevision = getLatestRevisionRecord(found);
    const structureForEdit = getBestStructureForProcedure(found, latestRevision);

    if (Array.isArray(structureForEdit) && structureForEdit.length > 0) {
      setSections(normalizeStructureToSections(structureForEdit));
    } else {
      setSections(createEmptySections());
    }

    setCurrentIndex(0);
  }, [editCode]);

  function updateSectionContent(index: number, value: string) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, content: value } : section
      )
    );
  }

  function updateSectionHasSubitems(index: number, checked: boolean) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) =>
        i === index
          ? {
              ...section,
              hasSubitems: checked,
              subitems: checked ? section.subitems : [],
            }
          : section
      )
    );
  }

  function updateSectionMode(index: number, mode: SectionMode) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== index) return section;

        const isSection6 = section.number === 6;
        const isSection7 = section.number === 7;

        if (isSection6) {
          return {
            ...section,
            mode: "table",
            content: "",
            hasSubitems: false,
            subitems: [],
            table: normalizeTableForSection(6, section.table),
          };
        }

        if (!isSection7) return section;

        return {
          ...section,
          mode,
          content: mode === "table" ? "" : section.content,
          hasSubitems: mode === "table" ? false : section.hasSubitems,
          subitems: mode === "table" ? [] : section.subitems,
          table:
            mode === "table"
              ? normalizeTableForSection(7, section.table)
              : section.table,
        };
      })
    );
  }

  function updateTableColumn(
    sectionIndex: number,
    columnIndex: number,
    value: string
  ) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex || !section.table) return section;

        const updatedColumns = section.table.columns.map((col, idx) =>
          idx === columnIndex ? value : col
        );

        return {
          ...section,
          table: {
            ...section.table,
            columns: updatedColumns,
          },
        };
      })
    );
  }

  function updateTableCell(
    sectionIndex: number,
    rowIndex: number,
    columnIndex: number,
    value: string
  ) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex || !section.table) return section;

        const isSection6 = section.number === 6;

        const updatedRows = section.table.rows.map((row, rIdx) => {
          if (rIdx !== rowIndex) return row;

          const workingRow = isSection6 ? normalizeEvidenceRow(row) : [...row];

          return workingRow.map((cell, cIdx) => {
            if (cIdx !== columnIndex) return cell;

            if (isSection6 && columnIndex === 4) {
              return normalizeEvidenceStatus(value);
            }

            return value;
          });
        });

        return {
          ...section,
          table: {
            ...section.table,
            rows: updatedRows,
          },
        };
      })
    );
  }

  function addTableRow(sectionIndex: number) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex || !section.table) return section;

        return {
          ...section,
          table: {
            ...section.table,
            rows: [
              ...section.table.rows,
              getDefaultTableRow(section.number, section.table.columns.length),
            ],
          },
        };
      })
    );
  }

  function removeTableRow(sectionIndex: number, rowIndex: number) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex || !section.table) return section;

        const updatedRows = section.table.rows.filter((_, idx) => idx !== rowIndex);

        return {
          ...section,
          table: {
            ...section.table,
            rows:
              updatedRows.length > 0
                ? updatedRows
                : [getDefaultTableRow(section.number, section.table.columns.length)],
          },
        };
      })
    );
  }

  function addSubitem(index: number) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== index) return section;

        const nextSubitemNumber = section.subitems.length + 1;

        return {
          ...section,
          hasSubitems: true,
          subitems: [
            ...section.subitems,
            {
              id: `${section.number}.${nextSubitemNumber}`,
              item: `${section.number}.${nextSubitemNumber}`,
              title: "",
              content: "",
            },
          ],
        };
      })
    );
  }

  function removeSubitem(index: number, subitemIndex: number) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== index) return section;

        const updatedSubitems = section.subitems.filter((_, s) => s !== subitemIndex);

        return {
          ...section,
          subitems: updatedSubitems.map((subitem, idx) => ({
            ...subitem,
            item: `${section.number}.${idx + 1}`,
          })),
          hasSubitems: updatedSubitems.length > 0,
        };
      })
    );
  }

  function updateSubitem(
    sectionIndex: number,
    subitemIndex: number,
    field: "title" | "content",
    value: string
  ) {
    if (isApprovedLocked) return;

    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex) return section;

        return {
          ...section,
          subitems: section.subitems.map((subitem, s) =>
            s === subitemIndex ? { ...subitem, [field]: value } : subitem
          ),
        };
      })
    );
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function goNext() {
    if (currentIndex < sections.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function buildPayload() {
  const existing = safelyReadCustomProcedures();
  const currentUser = getCurrentUser();

  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  const existingItem = existing.find((item: any) => {
    const itemCode = String(item.code || "").toLowerCase();
    const original = String(originalCode || "").toLowerCase();
    const normalizedOriginal = normalizeProcedureCode(original).toLowerCase();

    return itemCode === original || itemCode === normalizedOriginal;
  });

  const preservedId =
    isEditMode && loadedProcedureId !== null
      ? loadedProcedureId
      : existingItem?.id || Date.now();

  const normalizedCode = normalizeProcedureCode(code);
  const normalizedFamily = normalizeFamily(family);

  const normalizedStructure = sections.map((section) => {
    const isSection4 = section.number === 4;
    const isSection6 = section.number === 6;
    const isSection7 = section.number === 7;
    const isTableSection =
      isSection4 || isSection6 || (isSection7 && section.mode === "table");

    const baseSection: any = {
      number: String(section.number),
      item: String(section.number),
      title: section.title,
      content: isTableSection ? "" : section.content.trim(),
      subitems: isTableSection
        ? []
        : section.subitems.map((subitem, index) => ({
            item: buildNumberLabel(section.number, index),
            title: subitem.title.trim(),
            content: subitem.content.trim(),
          })),
      mode: isTableSection ? "table" : "text",
    };

    if (isTableSection && section.table) {
      const normalizedTable = normalizeTableForSection(
        section.number,
        section.table
      );

      baseSection.table = {
        columns: (normalizedTable?.columns || []).map((col) => col.trim()),
        rows: (normalizedTable?.rows || []).map((row) =>
          row.map((cell, cellIndex) =>
            isSection6 && cellIndex === 4
              ? normalizeEvidenceStatus(cell)
              : String(cell || "").trim()
          )
        ),
      };
    }

    return baseSection;
  });

  return {
    id: preservedId,
    code: normalizedCode,
    name: name.trim(),
    family: normalizedFamily,
    description: description.trim(),
    status: normalizeStatus(status),
    revision: normalizeRevision(revision),
    responsible: responsible.trim(),

    createdAt:
      isEditMode && existingItem?.createdAt ? existingItem.createdAt : today,
    updatedAt: today,

    createdBy:
      isEditMode && existingItem?.createdBy
        ? existingItem.createdBy
        : currentUser.name,
    createdByRole:
      isEditMode && existingItem?.createdByRole
        ? existingItem.createdByRole
        : currentUser.role,

    lastModifiedBy: currentUser.name,
    lastModifiedByRole: currentUser.role,
    lastModifiedAt: nowIso,

    approvedBy: existingItem?.approvedBy || "",
    approvedByRole: existingItem?.approvedByRole || "",
    approvedAt: existingItem?.approvedAt || "",

    source: "manual",
    structure: normalizedStructure,
    sections: normalizedStructure,
  };
}

  function handlePreviewJson() {
    const payload = buildPayload();
    alert(JSON.stringify(payload, null, 2));
  }

  function validateForm() {
    if (!code.trim()) {
      alert("Preencha o código do procedimento.");
      return false;
    }

    if (!normalizeProcedureCode(code).match(/^CPR-[A-Z0-9]+$/)) {
      alert("O código deve seguir o padrão CPR-XX. Exemplo: CPR-01.");
      return false;
    }

    if (!name.trim()) {
      alert("Preencha o nome do procedimento.");
      return false;
    }

    if (!normalizeFamily(family)) {
      alert("Selecione a família COP do procedimento.");
      return false;
    }

    if (sections[7]?.mode === "table") {
      const table8 = normalizeTableForSection(8, sections[7]?.table);

      if (!table8 || !Array.isArray(table8.columns) || table8.columns.length !== 4) {
        alert(
          "A tabela do item 8 precisa ter 4 colunas válidas: requisito, evidência objetiva, registro associado."
        );
        return false;
      }
    }

    if (sections[8]?.mode === "table") {
      const table9 = sections[8]?.table;

      if (!table9 || !Array.isArray(table9.columns) || table9.columns.length === 0) {
        alert("A tabela do item 9 precisa ter colunas definidas.");
        return false;
      }
    }

    return true;
  }

  function handleSaveProcedure() {
    if (isApprovedLocked) {
      alert(
        "Procedimento aprovado está bloqueado para edição. Qualquer alteração deve ser feita em uma nova revisão."
      );
      return;
    }

    if (!validateForm()) return;

    const payload = buildPayload();
    const existing = safelyReadCustomProcedures();

    try {
      if (isEditMode) {
        const payloadCodeLower = payload.code.toLowerCase();
        const originalCodeLower = String(originalCode || "").toLowerCase();
        const normalizedOriginalCodeLower =
          normalizeProcedureCode(originalCode || "").toLowerCase();

        const conflictingProcedure = existing.find((item: any) => {
          const itemCodeLower = String(item.code || "").toLowerCase();

          if (
            originalCodeLower &&
            (itemCodeLower === originalCodeLower ||
              itemCodeLower === normalizedOriginalCodeLower)
          ) {
            return false;
          }

          return itemCodeLower === payloadCodeLower;
        });

        if (conflictingProcedure) {
          alert(`Já existe outro procedimento salvo com o código ${payload.code}.`);
          return;
        }

        const indexByOriginalCode = existing.findIndex((item: any) => {
          const itemCodeLower = String(item.code || "").toLowerCase();

          return (
            itemCodeLower === originalCodeLower ||
            itemCodeLower === normalizedOriginalCodeLower
          );
        });

        const indexById =
          loadedProcedureId !== null
            ? existing.findIndex(
                (item: any) => Number(item.id) === Number(loadedProcedureId)
              )
            : -1;

        const targetIndex =
          indexByOriginalCode >= 0 ? indexByOriginalCode : indexById;

        if (targetIndex >= 0) {
          const currentItem = existing[targetIndex];
          const updatedItem = upsertRevisionInProcedure(currentItem, payload);

          const updated = [...existing];
          updated[targetIndex] = updatedItem;
          localStorage.setItem("customProcedures", JSON.stringify(updated));
        } else {
          localStorage.setItem(
            "customProcedures",
            JSON.stringify([...existing, upsertRevisionInProcedure(null, payload)])
          );
        }

        setStoredProcedureView(payload.code, {
          status: payload.status,
          revision: payload.revision,
        });

        if (originalCode && originalCode.toLowerCase() !== payload.code.toLowerCase()) {
          removeStoredProcedureView(originalCode);
        }

        alert(`Procedimento ${payload.code} atualizado com sucesso.`);
        setLocation(`/procedimentos/${payload.code}`);
        return;
      }

      const alreadyExists = existing.some(
        (item: any) =>
          String(item.code || "").toLowerCase() === payload.code.toLowerCase()
      );

      if (alreadyExists) {
        alert(`Já existe um procedimento salvo com o código ${payload.code}.`);
        return;
      }

      localStorage.setItem(
        "customProcedures",
        JSON.stringify([...existing, upsertRevisionInProcedure(null, payload)])
      );

      setStoredProcedureView(payload.code, {
        status: payload.status,
        revision: payload.revision,
      });

      alert(
        `Procedimento ${payload.code} salvo com sucesso.\nRevisão inicial criada: ${payload.revision}`
      );

      setLocation(`/procedimentos/${payload.code}`);
    } catch (error) {
      console.error(error);
      alert("Falha ao salvar o procedimento no navegador.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Editar Procedimento" : "Novo Procedimento"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Cadastro guiado por capítulos, seguindo a estrutura padrão 1–11.
        </p>
      </div>

      {isApprovedLocked && (
        <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-md p-4">
          Procedimento aprovado bloqueado para edição. Qualquer alteração deve
          ser realizada somente por meio de nova revisão.
        </div>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Dados gerais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={code}
              onChange={(e) => setCode(normalizeProcedureCode(e.target.value))}
              placeholder="Ex.: CPR-04"
              disabled={isApprovedLocked}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Família COP</label>
            <select
  className="w-full border rounded-md px-3 py-2"
  value={family}
  onChange={(e) => setFamily(e.target.value)}
  disabled={isApprovedLocked}
>
  {FAMILY_OPTIONS.map((option) => (
    <option key={option.id} value={option.id}>
      {option.label}
    </option>
  ))}
</select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Responsável</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Ex.: Engenharia"
              disabled={isApprovedLocked}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isApprovedLocked}
            >
              <option value="em_elaboracao">Em elaboração</option>
              <option value="em_revisao">Em revisão</option>
              <option value="aprovado">Aprovado</option>
              <option value="bloqueado">Bloqueado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Controle de Materiais"
              disabled={isApprovedLocked}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumo do procedimento"
              disabled={isApprovedLocked}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Revisão</label>
            <input
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
              value={revision || "00"}
              disabled
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Card className="p-4 space-y-2 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Capítulos</h2>
            <span className="text-sm text-muted-foreground">{progressText}</span>
          </div>

          <div className="space-y-2">
            {sections.map((section, index) => (
              <button
                key={section.number}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-full text-left border rounded-md px-3 py-2 transition ${
                  currentIndex === index
                    ? "bg-black text-white"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="font-medium">
                  {section.number}. {section.title}
                </div>
                <div className="text-xs opacity-80 mt-1">
  {section.number === 4
    ? "Tabela registros"
    : section.number === 6
    ? "Tabela evidências"
    : section.number === 7 && section.mode === "table"
    ? "Tabela COP"
    : section.hasSubitems
    ? `${section.subitems.length} subitem(ns)`
    : "Sem subitens"}
</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold">
              {currentSection.number}. {currentSection.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEvidenceSection
                ? "No item 8, preencha a evidência e controle o status de verificação por linha."
                : isCopSection
                ? "No item 9 você pode usar texto ou tabela estruturada."
                : "Cole aqui o texto do capítulo exatamente como está no documento aprovado."}
            </p>
          </div>

          {isCopSection && (
            <div className="border rounded-md p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Formato do capítulo 9
                </label>
                <select
                  className="w-full md:w-[280px] border rounded-md px-3 py-2"
                  value={currentSection.mode || "text"}
                  onChange={(e) =>
                    updateSectionMode(currentIndex, e.target.value as SectionMode)
                  }
                  disabled={isApprovedLocked}
                >
                  <option value="text">Texto</option>
                  <option value="table">Tabela</option>
                </select>
              </div>
            </div>
          )}

          {isTableMode && currentSection.table && (
            <div className="space-y-4 border rounded-md p-4">
              <div className="text-sm text-muted-foreground">
                {isEvidenceSection
                  ? "A tabela do item 8 alimenta a gestão de evidências e o dashboard COP."
                  : "Preencha a tabela diretamente no app. Isso é mais seguro do que colar uma tabela do Word."}
              </div>

              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      {currentSection.table.columns.map((column, columnIndex) => (
                        <th key={columnIndex} className="p-2 min-w-[160px]">
                          <input
                            className="w-full border rounded-md px-2 py-1 font-medium bg-white"
                            value={column}
                            onChange={(e) =>
                              updateTableColumn(
                                currentIndex,
                                columnIndex,
                                e.target.value
                              )
                            }
                            disabled={isEvidenceSection || isApprovedLocked}
                          />
                        </th>
                      ))}
                      <th className="p-2 w-[120px]">Ação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentSection.table.rows.map((row, rowIndex) => {
                      const workingRow = isEvidenceSection
                        ? normalizeEvidenceRow(row)
                        : row;

                      return (
                        <tr key={rowIndex} className="border-b align-top">
                          {currentSection.table?.columns.map((_, columnIndex) => (
                            <td key={columnIndex} className="p-2">
                              {isEvidenceSection && columnIndex === 4 ? (
                                <select
                                  className="w-full border rounded-md px-2 py-2 min-h-[38px]"
                                  value={normalizeEvidenceStatus(
                                    workingRow[columnIndex] || "Pendente"
                                  )}
                                  disabled={isApprovedLocked}
                                  onChange={(e) =>
                                    updateTableCell(
                                      currentIndex,
                                      rowIndex,
                                      columnIndex,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="Pendente">Pendente</option>
                                  <option value="OK">OK</option>
                                  <option value="NOK">NOK</option>
                                </select>
                              ) : isEvidenceSection && columnIndex === 6 ? (
                                <input
                                  type="date"
                                  className="w-full border rounded-md px-2 py-2 min-h-[38px]"
                                  value={workingRow[columnIndex] || ""}
                                  disabled={isApprovedLocked}
                                  onChange={(e) =>
                                    updateTableCell(
                                      currentIndex,
                                      rowIndex,
                                      columnIndex,
                                      e.target.value
                                    )
                                  }
                                />
                              ) : (
                                <textarea
                                  className="w-full border rounded-md px-2 py-1 min-h-[70px]"
                                  value={workingRow[columnIndex] || ""}
                                  disabled={isApprovedLocked}
                                  onChange={(e) =>
                                    updateTableCell(
                                      currentIndex,
                                      rowIndex,
                                      columnIndex,
                                      e.target.value
                                    )
                                  }
                                />
                              )}
                            </td>
                          ))}

                          <td className="p-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeTableRow(currentIndex, rowIndex)}
                              disabled={isApprovedLocked}
                            >
                              Remover
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => addTableRow(currentIndex)}
                disabled={isApprovedLocked}
              >
                + Adicionar linha
              </Button>
            </div>
          )}

          {!isTableMode && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Conteúdo principal do item {currentSection.number}
              </label>
              <textarea
                className="w-full border rounded-md px-3 py-2 min-h-[180px]"
                value={currentSection.content}
                onChange={(e) => updateSectionContent(currentIndex, e.target.value)}
                placeholder={`Cole aqui o conteúdo do item ${currentSection.number}`}
                disabled={isApprovedLocked}
              />
            </div>
          )}

          {!isTableMode && (
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-medium">Subitens</div>
                  <div className="text-sm text-muted-foreground">
                    Use quando houver 3.1, 3.2, 6.1 etc.
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={currentSection.hasSubitems}
                    onChange={(e) =>
                      updateSectionHasSubitems(currentIndex, e.target.checked)
                    }
                    disabled={isApprovedLocked}
                  />
                  Este capítulo possui subitens
                </label>
              </div>

              {currentSection.hasSubitems && (
                <div className="space-y-4">
                  {currentSection.subitems.map((subitem, subIndex) => (
                    <div
                      key={`${currentSection.number}-${subIndex}`}
                      className="border rounded-md p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-medium">
                          {buildNumberLabel(currentSection.number, subIndex)}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeSubitem(currentIndex, subIndex)}
                          disabled={isApprovedLocked}
                        >
                          Remover
                        </Button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Título do subitem
                        </label>
                        <input
                          className="w-full border rounded-md px-3 py-2"
                          value={subitem.title}
                          onChange={(e) =>
                            updateSubitem(currentIndex, subIndex, "title", e.target.value)
                          }
                          placeholder={`Ex.: ${buildNumberLabel(
                            currentSection.number,
                            subIndex
                          )} Fluxo de aprovação`}
                          disabled={isApprovedLocked}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Conteúdo do subitem
                        </label>
                        <textarea
                          className="w-full border rounded-md px-3 py-2 min-h-[120px]"
                          value={subitem.content}
                          onChange={(e) =>
                            updateSubitem(
                              currentIndex,
                              subIndex,
                              "content",
                              e.target.value
                            )
                          }
                          placeholder={`Cole aqui o conteúdo do subitem ${buildNumberLabel(
                            currentSection.number,
                            subIndex
                          )}`}
                          disabled={isApprovedLocked}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSubitem(currentIndex)}
                    disabled={isApprovedLocked}
                  >
                    + Adicionar subitem
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-between pt-2">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={goPrevious}
                disabled={currentIndex === 0}
              >
                Anterior
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={goNext}
                disabled={currentIndex === sections.length - 1}
              >
                Próximo
              </Button>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handlePreviewJson}>
                Gerar prévia JSON
              </Button>

              <Button type="button" onClick={handleSaveProcedure} disabled={isApprovedLocked}>
                {isEditMode ? "Salvar alterações" : "Salvar procedimento"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}