export type EvidenciaStatus =
  | "OK"
  | "NOK"
  | "PARCIAL"
  | "PENDENTE"
  | "NA";

export interface Evidencia {
  id: string;

  cprCode: string;
  requirementId: string;

  status: EvidenciaStatus;

  evidences: string[]; // links, arquivos, descrições
  registros: string[]; // códigos de registros

  responsible: string;
  updatedAt: string;
  observacao?: string;
}