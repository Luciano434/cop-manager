import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { baseProcedures } from "@/data/procedures/baseProcedures";
import { normalizeProcedureCode } from "@/lib/utils-cop";
import { trpc } from "@/lib/trpc";

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
    "Item COP",
  ],
  rows: [["", "", "", "", ""]],
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
  return ["", "", "", "", ""];
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
    normalized[4] || "",
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

function mapLegacyStatus(legacyStatus: string): "nao_iniciado" | "em_desenvolvimento" | "implementado" {
  const s = String(legacyStatus || "").toLowerCase();
  if (s === "aprovado" || s === "implementado") return "implementado";
  if (s === "em_revisao" || s === "em_desenvolvimento") return "em_desenvolvimento";
  return "nao_iniciado";
}

function loadSectionsFromCache(code: string): Section[] {
  try {
    const raw = localStorage.getItem(`sections:${code}`);
    if (!raw) return createEmptySections();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === SECTION_TITLES.length) {
      return parsed.map((s: any, index: number): Section => {
        const sectionNumber = Number(s.number ?? index + 1);
        const needsNormalize = sectionNumber === 4 || sectionNumber === 6 || sectionNumber === 7;
        const table = needsNormalize
          ? normalizeTableForSection(sectionNumber, s.table)
          : s.table;
        return {
          number: sectionNumber,
          title: String(s.title ?? SECTION_TITLES[index] ?? ""),
          content: String(s.content ?? ""),
          hasSubitems: Boolean(s.hasSubitems),
          subitems: Array.isArray(s.subitems) ? s.subitems : [],
          mode: (s.mode === "table" ? "table" : "text") as SectionMode,
          table,
        };
      });
    }
    return createEmptySections();
  } catch {
    return createEmptySections();
  }
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

export default function NovoProcedimento() {
  const [, setLocation] = useLocation();

  const editCode = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("code");
  }, []);

  const existingProcedureQuery = trpc.procedures.getByCode.useQuery(
    { code: editCode! },
    { enabled: !!editCode, retry: false }
  );
  const createProcedureMutation = trpc.procedures.create.useMutation();
  const updateProcedureMutation = trpc.procedures.update.useMutation();
  const updateSectionsMutation = trpc.procedures.updateSections.useMutation();
  const utils = trpc.useUtils();
  const { data: copReqs = [] } = trpc.copRequirements.list.useQuery();
  const initializedForRef = useRef<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalCode, setOriginalCode] = useState<string | null>(null);
  const [loadedProcedureId, setLoadedProcedureId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [family, setFamily] = useState("a-classificar");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("Engenharia");
  const [status, setStatus] = useState("nao_iniciado");
  const [revision, setRevision] = useState("00");

  const [sections, setSections] = useState<Section[]>(createEmptySections());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openCopSelectors, setOpenCopSelectors] = useState<Set<string>>(new Set());

  const currentSection = sections[currentIndex];
  const isEvidenceSection = currentSection.number === 6;
  const isCopSection = currentSection.number === 7;
  const isTableMode = currentSection.mode === "table";
  const isApprovedLocked = isEditMode && status === "implementado";

  const progressText = useMemo(() => {
    return `Capítulo ${currentIndex + 1} de ${sections.length}`;
  }, [currentIndex, sections.length]);

  useEffect(() => {
    if (!editCode) {
      initializedForRef.current = null;
      setIsEditMode(false);
      setOriginalCode(null);
      setLoadedProcedureId(null);
      setCode("");
      setName("");
      setFamily("a-classificar");
      setDescription("");
      setResponsible("Engenharia");
      setStatus("nao_iniciado");
      setRevision("00");
      setSections(createEmptySections());
      setCurrentIndex(0);
      return;
    }

    if (existingProcedureQuery.isLoading) return;
    if (initializedForRef.current === editCode) return;

    initializedForRef.current = editCode;

    const dbProc = existingProcedureQuery.data ?? null;

    if (dbProc) {
      const loadedCode = normalizeProcedureCode(dbProc.code);
      setIsEditMode(true);
      setOriginalCode(dbProc.code);
      setLoadedProcedureId(dbProc.id);
      setCode(loadedCode);
      setName(dbProc.name);
      setDescription(dbProc.description || "");
      setResponsible(dbProc.responsible || "Engenharia");
      setStatus(dbProc.status);
      setRevision("00");
      setFamily(normalizeFamily((dbProc as any).family || inferFamilyFromProcedure(loadedCode, dbProc.name)));
      setCurrentIndex(0);
      void (async () => {
        const dbSects = await utils.procedures.getSections.fetch({ id: dbProc.id });
        if (Array.isArray(dbSects) && dbSects.length > 0) {
          const normalized = dbSects.map((s: any, idx: number): Section => ({
            number: Number(s.number ?? idx + 1),
            title: String(s.title ?? SECTION_TITLES[idx] ?? ""),
            content: String(s.content ?? ""),
            hasSubitems: Boolean(s.hasSubitems),
            subitems: Array.isArray(s.subitems) ? s.subitems : [],
            mode: (s.mode === "table" ? "table" : "text") as SectionMode,
            table: s.table,
          }));
          setSections(normalized.map((s) => ({
            ...s,
            table: (s.number === 4 || s.number === 6 || s.number === 7)
              ? normalizeTableForSection(s.number, s.table) ?? s.table
              : s.table,
          })));
        } else {
          setSections(loadSectionsFromCache(loadedCode));
        }
      })();
      return;
    }

    const foundBase = findProcedureInBase(editCode);

    if (!foundBase) {
      console.error(`Procedimento ${editCode} não encontrado.`);
      return;
    }

    const loadedCode = normalizeProcedureCode(String((foundBase as any).code || ""));
    const loadedName = String(
      (foundBase as any).name || (foundBase as any).metadata?.title || ""
    );

    setIsEditMode(true);
    setOriginalCode(String((foundBase as any).code || ""));
    setLoadedProcedureId(null);
    setCode(loadedCode);
    setName(loadedName);
    setDescription(String((foundBase as any).description || (foundBase as any).objective || ""));
    setResponsible(String((foundBase as any).responsible || "Engenharia"));
    setStatus(mapLegacyStatus(String((foundBase as any).status || "nao_iniciado")));
    setRevision("00");
    setFamily(
      normalizeFamily(
        String((foundBase as any).family || inferFamilyFromProcedure(loadedCode, loadedName))
      )
    );

    const structure = (foundBase as any).structure || (foundBase as any).sections || [];
    setSections(
      Array.isArray(structure) && structure.length > 0
        ? normalizeStructureToSections(structure)
        : createEmptySections()
    );
    setCurrentIndex(0);
  }, [editCode, existingProcedureQuery.isLoading, existingProcedureQuery.data]);

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

  function toggleCopSelector(key: string) {
    setOpenCopSelectors(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Itens COP derivados do Cap. 7 em edição (sempre em sincronia com o formulário)
  const copReqsForCpr = useMemo(() => {
    const cap7 = sections.find(s => s.number === 7);
    if (cap7?.table?.rows?.length) {
      return cap7.table.rows
        .map((row: string[]) => ({
          code: String(row[0] || '').replace(/\t/g, '').trim(),
          description: String(row[1] || '').replace(/\t/g, '').trim(),
        }))
        .filter(r => r.code);
    }
    return copReqs.filter(r => !r.procedureCode || r.procedureCode === code);
  }, [sections, copReqs, code]);

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

  async function handleSaveProcedure() {
    if (isApprovedLocked) {
      alert(
        "Procedimento implementado está bloqueado para edição. Qualquer alteração deve ser feita em uma nova revisão."
      );
      return;
    }

    if (!validateForm()) return;

    const normalizedCode = normalizeProcedureCode(code);
    const dbStatus = status as "nao_iniciado" | "em_desenvolvimento" | "implementado";

    try {
      const normalizedFamily = normalizeFamily(family);
      const familyValue = normalizedFamily !== "a-classificar" ? normalizedFamily : undefined;

      if (isEditMode && loadedProcedureId !== null) {
        await updateProcedureMutation.mutateAsync({
          id: loadedProcedureId,
          code: normalizedCode,
          name: name.trim(),
          description: description.trim() || undefined,
          status: dbStatus,
          responsible: responsible.trim() || undefined,
          family: familyValue,
        });
      } else {
        await createProcedureMutation.mutateAsync({
          code: normalizedCode,
          name: name.trim(),
          description: description.trim() || undefined,
          status: dbStatus,
          responsible: responsible.trim() || undefined,
          family: familyValue,
        });
      }

      // Salva seções no banco
      const savedProc = await utils.procedures.getByCode.fetch({ code: normalizedCode });
      if (savedProc?.id) {
        await updateSectionsMutation.mutateAsync({ id: savedProc.id, sections });
      }
      // Mantém localStorage como cache local temporário
      localStorage.setItem(`sections:${normalizedCode}`, JSON.stringify(sections));
      await utils.procedures.list.invalidate();

      alert(
        `Procedimento ${normalizedCode} ${isEditMode && loadedProcedureId !== null ? "atualizado" : "salvo"} com sucesso.`
      );
      setLocation(`/procedimentos/${normalizedCode}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao salvar o procedimento.");
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
          Procedimento implementado bloqueado para edição. Qualquer alteração deve
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
              <option value="nao_iniciado">Não iniciado</option>
              <option value="em_desenvolvimento">Em desenvolvimento</option>
              <option value="implementado">Implementado</option>
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
                      {(isEvidenceSection || isCopSection) && (
                        <th className="p-2 w-16 text-center text-muted-foreground font-semibold bg-slate-100">N°</th>
                      )}
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
                            disabled={isEvidenceSection || isCopSection || isApprovedLocked}
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
                          {(isEvidenceSection || isCopSection) && (
                            <td className="p-2 w-16 text-center bg-slate-50 text-muted-foreground text-xs font-mono select-none">
                              {`${currentSection.number}.${rowIndex + 1}`}
                            </td>
                          )}
                          {currentSection.table?.columns.map((_, columnIndex) => (
                            <td key={columnIndex} className="p-2">
                              {isEvidenceSection && columnIndex === 4 ? (() => {
                                const selectorKey = `${currentIndex}-${rowIndex}`;
                                const isOpen = openCopSelectors.has(selectorKey);
                                const currentCodes = (workingRow[4] || '')
                                  .split(',')
                                  .map((c: string) => c.trim())
                                  .filter(Boolean);
                                return (
                                  <div className="border rounded-md bg-white min-w-[200px]">
                                    <button
                                      type="button"
                                      disabled={isApprovedLocked}
                                      onClick={() => toggleCopSelector(selectorKey)}
                                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs hover:bg-slate-50 rounded-md"
                                    >
                                      <div className="flex flex-wrap gap-1 flex-1 text-left">
                                        {currentCodes.length === 0 ? (
                                          <span className="text-gray-400">— Selecione item COP —</span>
                                        ) : (
                                          currentCodes.map(code => (
                                            <span
                                              key={code}
                                              className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                                            >
                                              {code}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                      <span className="ml-2 text-gray-400 shrink-0">
                                        {isOpen ? '▲' : '▼'}
                                      </span>
                                    </button>
                                    {isOpen && (
                                      <div className="border-t max-h-[200px] overflow-y-auto p-1">
                                        {copReqsForCpr
                                          .slice()
                                          .sort((a, b) => a.code.localeCompare(b.code))
                                          .map(req => {
                                            const isChecked = currentCodes.includes(req.code);
                                            return (
                                              <label
                                                key={req.code}
                                                className="flex items-center gap-2 text-xs py-0.5 px-1 cursor-pointer hover:bg-slate-50 rounded"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  disabled={isApprovedLocked}
                                                  onChange={(e) => {
                                                    const codes = (workingRow[4] || '')
                                                      .split(',')
                                                      .map((c: string) => c.trim())
                                                      .filter(Boolean);
                                                    const updated = e.target.checked
                                                      ? [...codes, req.code]
                                                      : codes.filter((c: string) => c !== req.code);
                                                    updateTableCell(currentIndex, rowIndex, 4, updated.join(','));
                                                  }}
                                                />
                                                <span className="font-mono shrink-0">{req.code}</span>
                                                <span className="text-muted-foreground truncate">
                                                  — {req.description?.substring(0, 40)}
                                                </span>
                                              </label>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })() : isCopSection && columnIndex === 4 ? (() => {
                                const itemCop = workingRow[0]?.trim();
                                const req = copReqs.find(r => r.code === itemCop);
                                const status = req?.status;
                                const label = status === 'atendido' ? 'Atendido'
                                  : status === 'parcial' ? 'Parcial'
                                  : status === 'nao_atendido' ? 'Não Atendido'
                                  : '—';
                                const color = status === 'atendido' ? 'bg-green-100 text-green-800'
                                  : status === 'parcial' ? 'bg-yellow-100 text-yellow-800'
                                  : status === 'nao_atendido' ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-500';
                                return (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                                    {label}
                                  </span>
                                );
                              })() : (
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
              <Button
                type="button"
                onClick={handleSaveProcedure}
                disabled={isApprovedLocked || createProcedureMutation.isPending || updateProcedureMutation.isPending}
              >
                {createProcedureMutation.isPending || updateProcedureMutation.isPending
                  ? "Salvando..."
                  : isEditMode
                  ? "Salvar alterações"
                  : "Salvar procedimento"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}