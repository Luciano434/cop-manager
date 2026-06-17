export type CopRequirementDefinition = {
  code: string;
  description: string;
};

export const copRequirements: CopRequirementDefinition[] = [
  // ===== 1.A - CONTROLE DE PROJETO =====
  { code: "1.A.1", description: "Controle de dados de projeto" },
  { code: "1.A.2", description: "Gerenciamento de configuração" },
  { code: "1.A.3", description: "Rastreabilidade de modificações" },

  // ===== 1.B - DOCUMENTAÇÃO =====
  { code: "1.B.1", description: "Documentação operacional" },

  // ===== 1.C - AERONAVEGABILIDADE =====
  { code: "1.C.1", description: "Instruções de aeronavegabilidade continuada" },
  { code: "1.C.2", description: "Controle de manutenção e falhas" },
];