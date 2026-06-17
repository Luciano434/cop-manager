export type CPRStatus = "draft" | "review" | "approved" | "obsolete";

export interface CPR {
  code: string;
  version: number;
  status: CPRStatus;

  name: string;
  description?: string;

  structure: any; // depois refinamos (itens 1–11)

  createdAt: string;
  updatedAt: string;
}