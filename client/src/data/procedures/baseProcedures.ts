export type BaseProcedure = {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  responsible: string;
  createdAt: string;
};

export const baseProcedures: BaseProcedure[] = [
  {
    id: 1,
    code: "CPR-01",
    name: "Controle de Dados de Projeto e Configuração",
    description: "Controle de dados técnicos e configuração.",
    status: "em_desenvolvimento",
    responsible: "Engenharia",
    createdAt: "2026-04-01",
  },
  {
    id: 2,
    code: "CPR-02",
    name: "Controle de Modificações de Projeto",
    description: "Controle de modificações de projeto.",
    status: "em_desenvolvimento",
    responsible: "Engenharia",
    createdAt: "2026-04-01",
  },
  {
    id: 3,
    code: "CPR-03",
    name: "Instrução de Aeronavegabilidade Continuada",
    description: "ICA e controle de aeronavegabilidade continuada.",
    status: "em_desenvolvimento",
    responsible: "Engenharia",
    createdAt: "2026-04-01",
  },
  {
    id: 4,
    code: "CPR-04",
    name: "Controle de Materiais",
    description: "Controle de materiais, recebimento, identificação e rastreabilidade.",
    status: "em_desenvolvimento",
    responsible: "Engenharia / Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 5,
    code: "CPR-05",
    name: "Controle de Fornecedores",
    description: "Qualificação, avaliação e controle de fornecedores.",
    status: "em_desenvolvimento",
    responsible: "Suprimentos / Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 6,
    code: "CPR-06",
    name: "Controle de Produção",
    description: "Controle das atividades produtivas e instruções de fabricação.",
    status: "em_desenvolvimento",
    responsible: "Produção",
    createdAt: "2026-04-01",
  },
  {
    id: 7,
    code: "CPR-07",
    name: "Controle de Processos Especiais",
    description: "Controle, qualificação e validação de processos especiais.",
    status: "em_desenvolvimento",
    responsible: "Engenharia / Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 8,
    code: "CPR-08",
    name: "Inspeção e Ensaios",
    description: "Controle das inspeções, ensaios e registros associados.",
    status: "em_desenvolvimento",
    responsible: "Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 9,
    code: "CPR-09",
    name: "Produto Não Conforme",
    description: "Tratamento, segregação, disposição e registro de produto não conforme.",
    status: "em_desenvolvimento",
    responsible: "Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 10,
    code: "CPR-10",
    name: "Rastreabilidade e Registros",
    description: "Controle de registros, rastreabilidade e retenção documental.",
    status: "em_desenvolvimento",
    responsible: "Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 11,
    code: "CPR-11",
    name: "Liberação Final",
    description: "Controle da liberação final de produto e documentação associada.",
    status: "em_desenvolvimento",
    responsible: "Qualidade",
    createdAt: "2026-04-01",
  },
  {
    id: 12,
    code: "CPR-12",
    name: "Controle de Mudanças de Processo",
    description: "Controle de alterações de processo produtivo e impactos associados.",
    status: "em_desenvolvimento",
    responsible: "Engenharia / Produção",
    createdAt: "2026-04-01",
  },
];