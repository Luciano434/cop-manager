import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

type ProcedimentoModulo = {
  code: string;
  title: string;
  cop: string;
};

const moduleConfig: Record<string, { title: string; description: string }> = {
  "controle-projeto": {
    title: "Controle de Projeto",
    description: "Gestão de dados, revisões, modificações e documentos de projeto.",
  },
  "controle-materiais": {
    title: "Controle de Materiais",
    description: "Recebimento, identificação, rastreabilidade e status dos materiais.",
  },
  "controle-producao": {
    title: "Controle de Produção",
    description: "Execução, inspeção em processo e registros de fabricação.",
  },
  "liberacao-final": {
    title: "Liberação Final",
    description: "Verificação final, conformidade e liberação do produto.",
  },
  "aeronavegabilidade-continuada": {
    title: "Aeronavegabilidade Continuada",
    description: "Suporte pós-entrega, falhas, ações corretivas e instruções continuadas.",
  },
  "gestao-organizacional": {
    title: "Gestão Organizacional",
    description: "Papéis, responsabilidades, treinamentos e integração com o SGQ.",
  },
};

const procedimentosPorModulo: Record<string, ProcedimentoModulo[]> = {
  "controle-projeto": [
    {
      code: "PR-01",
      title: "Controle de Dados de Projeto",
      cop: "1.A.1",
    },
    {
      code: "PR-02",
      title: "Controle de Modificações de Projeto",
      cop: "1.A.1, 1.A.2, 1.A.3, 1.B.1",
    },
  ],
  "controle-materiais": [],
  "controle-producao": [],
  "liberacao-final": [],
  "aeronavegabilidade-continuada": [
    {
      code: "PR-03",
      title: "Instrução de Aeronavegabilidade Continuada",
      cop: "1.C.1, 1.C.2",
    },
  ],
  "gestao-organizacional": [],
};

function normalizeStatus(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "aprovado") return "Aprovado";
  if (normalized === "cancelado") return "Cancelado";
  if (
    normalized === "em_revisao" ||
    normalized === "em revisão" ||
    normalized === "em revisao"
  ) {
    return "Em revisão";
  }

  return "Em elaboração";
}

function getProcedureStorage(code: string) {
  try {
    const raw = localStorage.getItem(`procedure-${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getProcedureStatus(code: string) {
  const stored = getProcedureStorage(code);
  return normalizeStatus(stored?.status);
}

function getProcedureRevision(code: string) {
  const stored = getProcedureStorage(code);
  return stored?.revision || "R00";
}

export default function Projetos() {
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const modulo = params.get("modulo") || "controle-projeto";

  const currentModule = moduleConfig[modulo] || moduleConfig["controle-projeto"];
  const procedimentos = procedimentosPorModulo[modulo] || [];

  const statusClass = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-700";
      case "Em revisão":
        return "bg-yellow-100 text-yellow-700";
      case "Cancelado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const abrirProcedimento = (code: string) => {
    setLocation(`/procedimentos/${code}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <button
            onClick={() => setLocation("/dashboard-cop")}
            className="text-sm text-accent hover:underline mb-2"
          >
            ← Voltar ao Dashboard
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {currentModule.title}
          </h1>

          <p className="text-muted-foreground mt-1">
            {currentModule.description}
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Procedimentos do Módulo
          </h2>

          {procedimentos.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              Nenhum procedimento cadastrado para este módulo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-2">Código</th>
                    <th className="text-left py-3 px-2">Procedimento</th>
                    <th className="text-left py-3 px-2">COP Aplicável</th>
                    <th className="text-left py-3 px-2">Revisão</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {procedimentos.map((procedimento) => {
                    const status = getProcedureStatus(procedimento.code);
                    const revision = getProcedureRevision(procedimento.code);

                    return (
                      <tr
                        key={procedimento.code}
                        onClick={() => abrirProcedimento(procedimento.code)}
                        className="border-b border-border hover:bg-muted/50 transition cursor-pointer"
                      >
                        <td className="py-3 px-2 font-mono font-semibold text-accent">
                          {procedimento.code}
                        </td>

                        <td className="py-3 px-2 font-medium">
                          {procedimento.title}
                        </td>

                        <td className="py-3 px-2">{procedimento.cop}</td>

                        <td className="py-3 px-2 font-mono">{revision}</td>

                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}