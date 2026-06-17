import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { copRequirements } from "@/data/copRequirements";

export type Projeto = {
  id: number;
  nome: string;
  cliente: string;
  referencia: string;
  status: "Em andamento" | "Em revisão" | "Concluído";
  responsavel?: string;
  descricao?: string;
};

export type Evidencia = {
  id: number;
  projetoId: number;
  nome: string;
  tipo: string;
  requisito: string;
  arquivo: string;
  status: "Pendente" | "Validada";
};

export type CopRequirement = {
  id: number;
  code: string;
  description: string;
  status: "atendido" | "parcial" | "nao_atendido";
  linkedProcedures: number;
};

type ProjectContextType = {
  projetos: Projeto[];
  evidencias: Evidencia[];
  adicionarEvidencia: (evidencia: Omit<Evidencia, "id">) => void;
  validarEvidencia: (id: number) => void;
  requisitos: CopRequirement[];
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function getStoredEvidences(): Evidencia[] {
  try {
    const raw = localStorage.getItem("copEvidences");
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return parsed.map((e: any) => ({
      id: e.id,
      projetoId: 1,
      nome: e.fileName,
      tipo: "Registro",
      requisito: e.copRequirement,
      arquivo: e.fileName,
      status: e.status === "Validada" || e.status === "Ativa" ? "Validada" : "Pendente",
    }));
  } catch {
    return [];
  }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projetos] = useState<Projeto[]>([
    {
      id: 1,
      nome: "PMA Krueger Flap Seal",
      cliente: "TECPLAS",
      referencia: "B737-KFS-001",
      status: "Em andamento",
      responsavel: "Luciano André",
      descricao:
        "Projeto inicial para controle de dados, revisões, documentos e evidências vinculadas ao processo COP.",
    },
  ]);

  const [evidencias, setEvidencias] = useState<Evidencia[]>(getStoredEvidences());

  const adicionarEvidencia = (evidencia: Omit<Evidencia, "id">) => {
    const nova = { ...evidencia, id: Date.now() };
    const atualizadas = [nova, ...evidencias];
    setEvidencias(atualizadas);
    localStorage.setItem("copEvidences", JSON.stringify(atualizadas));
  };

  const validarEvidencia = (id: number) => {
    const atualizadas = evidencias.map((e) =>
      e.id === id ? { ...e, status: "Validada" } : e
    );
    setEvidencias(atualizadas);
    localStorage.setItem("copEvidences", JSON.stringify(atualizadas));
  };

  const requisitos = useMemo<CopRequirement[]>(() => {
    return copRequirements.map((req, index) => {
      // 🔥 SOMENTE evidências válidas contam
      const evidenciasValidas = evidencias.filter(
        (e) => e.requisito === req.code && e.status === "Validada"
      );

      let status: CopRequirement["status"] = "nao_atendido";

      if (evidenciasValidas.length > 0) {
        status = "atendido";
      }

      return {
        id: index + 1,
        code: req.code,
        description: req.description,
        status,
        linkedProcedures: evidenciasValidas.length,
      };
    });
  }, [evidencias]);

  return (
    <ProjectContext.Provider
      value={{
        projetos,
        evidencias,
        adicionarEvidencia,
        validarEvidencia,
        requisitos,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }

  return context;
}