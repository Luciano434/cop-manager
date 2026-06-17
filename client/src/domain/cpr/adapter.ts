import { CPR } from "./types";

// modelo antigo (baseProcedures)
export function mapBaseProcedureToCPR(proc: any): CPR {
  return {
    code: proc.code,
    version: 1,

    status: mapStatus(proc.status),

    name: proc.name,
    description: proc.description,

    structure: proc, // mantém tudo como está por enquanto

    createdAt: proc.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// conversão de status antigo → novo padrão
function mapStatus(status: string): CPR["status"] {
  switch (status) {
    case "Aprovado":
      return "approved";
    case "em_desenvolvimento":
      return "draft";
    default:
      return "draft";
  }
}