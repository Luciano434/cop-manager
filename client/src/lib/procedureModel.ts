export type ProcedureStatus =
  | "em_elaboracao"
  | "em_revisao"
  | "aprovado"
  | "cancelado";

export type SectionType =
  | "text"
  | "text_list"
  | "definition_list"
  | "responsibility_list"
  | "process"
  | "criteria_list"
  | "table"
  | "indicator_list"
  | "integration_list";

export type ProcedureMeta = {
  id: number;
  code: string;
  name: string;
  revision: string;
  status: ProcedureStatus;
  date: string;
  description: string;
  sourceDocxName?: string;
};

export type TextSection = {
  id: string;
  title: string;
  type: "text";
  content: string;
};

export type TextListItem = {
  id: string;
  text: string;
};

export type TextListSection = {
  id: string;
  title: string;
  type: "text_list";
  items: TextListItem[];
};

export type DefinitionItem = {
  id: string;
  term: string;
  definition: string;
};

export type DefinitionListSection = {
  id: string;
  title: string;
  type: "definition_list";
  items: DefinitionItem[];
};

export type ResponsibilityItem = {
  id: string;
  role: string;
  duties: string[];
};

export type ResponsibilityListSection = {
  id: string;
  title: string;
  type: "responsibility_list";
  items: ResponsibilityItem[];
};

export type ProcessItem = {
  id: string;
  title: string;
  responsavel: string;
  gatilho: string;
  prazo: string;
  steps: string[];
  verificacao: string;
  criterios_aceitacao: string[];
  bloqueios: string[];
  acesso_auditor: string[];
  sistema_meio: string[];
  registros_gerados: string[];
  aprovacao: string;
};

export type ProcessSection = {
  id: string;
  title: string;
  type: "process";
  items: ProcessItem[];
};

export type CriteriaItem = {
  id: string;
  text: string;
};

export type CriteriaListSection = {
  id: string;
  title: string;
  type: "criteria_list";
  items: CriteriaItem[];
};

export type TableSection = {
  id: string;
  title: string;
  type: "table";
  columns: string[];
  rows: string[][];
};

export type IndicatorItem = {
  id: string;
  name: string;
  calculo: string;
  meta: string;
  frequencia: string;
  responsavel: string;
  reacao: string;
};

export type IndicatorListSection = {
  id: string;
  title: string;
  type: "indicator_list";
  items: IndicatorItem[];
};

export type IntegrationItem = {
  id: string;
  topic: string;
  content: string;
};

export type IntegrationListSection = {
  id: string;
  title: string;
  type: "integration_list";
  items: IntegrationItem[];
};

export type ProcedureSection =
  | TextSection
  | TextListSection
  | DefinitionListSection
  | ResponsibilityListSection
  | ProcessSection
  | CriteriaListSection
  | TableSection
  | IndicatorListSection
  | IntegrationListSection;

export type ProcedureDocument = ProcedureMeta & {
  sections: ProcedureSection[];
};

export const PROCEDURE_SECTION_CONFIG: Array<{
  id: string;
  title: string;
  type: SectionType;
}> = [
  { id: "1", title: "Objetivo", type: "text" },
  { id: "2", title: "Aplicação", type: "text_list" },
  { id: "3", title: "Referências", type: "text_list" },
  { id: "4", title: "Definições", type: "definition_list" },
  { id: "5", title: "Responsabilidades", type: "responsibility_list" },
  { id: "6", title: "Descrição do Processo", type: "process" },
  { id: "7", title: "Critérios Operacionais", type: "criteria_list" },
  { id: "8", title: "Evidências de Conformidade", type: "table" },
  { id: "9", title: "Referência Cruzada", type: "table" },
  { id: "10", title: "Indicadores Mínimos de Eficácia", type: "indicator_list" },
  { id: "11", title: "Integração com SGQ", type: "integration_list" },
];

export const TABLE_DEFAULT_COLUMNS: Record<string, string[]> = {
  "8": [
    "Requisito",
    "Evidência objetiva",
    "Registro",
    "Verificação",
    "Responsável",
    "Acesso",
  ],
  "9": ["Item", "Descrição", "Seção", "Evidência associada"],
};

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptySection(id: string): ProcedureSection {
  const config = PROCEDURE_SECTION_CONFIG.find((item) => item.id === id);

  if (!config) {
    throw new Error(`Seção ${id} não configurada.`);
  }

  switch (config.type) {
    case "text":
      return {
        id: config.id,
        title: config.title,
        type: "text",
        content: "",
      };

    case "text_list":
      return {
        id: config.id,
        title: config.title,
        type: "text_list",
        items: [],
      };

    case "definition_list":
      return {
        id: config.id,
        title: config.title,
        type: "definition_list",
        items: [],
      };

    case "responsibility_list":
      return {
        id: config.id,
        title: config.title,
        type: "responsibility_list",
        items: [],
      };

    case "process":
      return {
        id: config.id,
        title: config.title,
        type: "process",
        items: [],
      };

    case "criteria_list":
      return {
        id: config.id,
        title: config.title,
        type: "criteria_list",
        items: [],
      };

    case "table":
      return {
        id: config.id,
        title: config.title,
        type: "table",
        columns: TABLE_DEFAULT_COLUMNS[config.id] ?? [],
        rows: [],
      };

    case "indicator_list":
      return {
        id: config.id,
        title: config.title,
        type: "indicator_list",
        items: [],
      };

    case "integration_list":
      return {
        id: config.id,
        title: config.title,
        type: "integration_list",
        items: [],
      };

    default:
      throw new Error(`Tipo de seção não suportado: ${String(config.type)}`);
  }
}

export function createEmptyProcedureDocument(
  meta?: Partial<ProcedureMeta>
): ProcedureDocument {
  return {
    id: meta?.id ?? 0,
    code: meta?.code ?? "",
    name: meta?.name ?? "",
    revision: meta?.revision ?? "00",
    status: meta?.status ?? "em_elaboracao",
    date: meta?.date ?? getTodayIsoDate(),
    description: meta?.description ?? "Procedimento do Sistema de Gestão da Qualidade.",
    sourceDocxName: meta?.sourceDocxName,
    sections: PROCEDURE_SECTION_CONFIG.map((section) =>
      createEmptySection(section.id)
    ),
  };
}