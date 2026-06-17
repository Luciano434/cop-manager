import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { useProjectContext } from "@/contexts/ProjectContext";

export default function ProjetoDetalhe() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/projetos/:id");

  const { projetos, evidencias, adicionarEvidencia, validarEvidencia } =
    useProjectContext();

  const projeto = useMemo(() => {
    if (!match) return null;

    const id = Number(params?.id);
    return projetos.find((p) => p.id === id) ?? null;
  }, [match, params, projetos]);

  const [nomeEvidencia, setNomeEvidencia] = useState("");
  const [tipoEvidencia, setTipoEvidencia] = useState("Documento");
  const [requisitoCop, setRequisitoCop] = useState("1.A.1");
  const [arquivo, setArquivo] = useState("");

  const handleAdicionarEvidencia = () => {
    if (!nomeEvidencia.trim() || !arquivo.trim() || !projeto) return;

    adicionarEvidencia({
      projetoId: projeto.id,
      nome: nomeEvidencia.trim(),
      tipo: tipoEvidencia,
      requisito: requisitoCop,
      arquivo: arquivo.trim(),
      status: "Pendente",
    });

    setNomeEvidencia("");
    setTipoEvidencia("Documento");
    setRequisitoCop("1.A.1");
    setArquivo("");
  };

  const statusClass = (status: "Pendente" | "Validada") => {
    switch (status) {
      case "Validada":
        return "bg-green-100 text-green-700";
      case "Pendente":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (!projeto) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Projeto não encontrado
            </h1>
            <p className="text-muted-foreground mb-4">
              Não foi possível localizar o projeto solicitado.
            </p>
            <button
              onClick={() => setLocation("/projetos")}
              className="rounded-md bg-accent text-white px-4 py-2 hover:opacity-90 transition"
            >
              Voltar para Projetos
            </button>
          </Card>
        </div>
      </div>
    );
  }

  const evidenciasDoProjeto = evidencias.filter(
    (item) => item.projetoId === projeto.id
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <button
            onClick={() => setLocation("/projetos")}
            className="text-sm text-accent hover:underline mb-2"
          >
            ← Voltar para Projetos
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {projeto.nome}
          </h1>

          <p className="text-muted-foreground mt-1">
            Detalhamento inicial do projeto para evolução do módulo de Controle
            de Projeto
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Dados Gerais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Cliente:</span>
              <p className="text-muted-foreground mt-1">{projeto.cliente}</p>
            </div>

            <div>
              <span className="font-medium text-foreground">Referência:</span>
              <p className="text-muted-foreground mt-1">{projeto.referencia}</p>
            </div>

            <div>
              <span className="font-medium text-foreground">Status:</span>
              <p className="text-muted-foreground mt-1">{projeto.status}</p>
            </div>

            <div>
              <span className="font-medium text-foreground">Responsável:</span>
              <p className="text-muted-foreground mt-1">
                {projeto.responsavel ?? "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Descrição
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {projeto.descricao ?? "Sem descrição cadastrada."}
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Documentos
            </h3>
            <p className="text-sm text-muted-foreground">
              Em breve: cadastro e controle de documentos do projeto.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Revisões
            </h3>
            <p className="text-sm text-muted-foreground">
              Em breve: histórico de revisões e alterações.
            </p>
          </Card>

          <Card className="p-6 border-accent/30 bg-accent/5">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Evidências
            </h3>
            <p className="text-sm text-muted-foreground">
              Controle de evidências vinculadas aos requisitos COP do projeto.
            </p>
          </Card>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Nova Evidência
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registre documentos e registros vinculados aos requisitos COP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome da Evidência
              </label>
              <input
                type="text"
                value={nomeEvidencia}
                onChange={(e) => setNomeEvidencia(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 bg-background"
                placeholder="Ex.: Lista Mestra de Dados de Projeto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={tipoEvidencia}
                onChange={(e) => setTipoEvidencia(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 bg-background"
              >
                <option>Documento</option>
                <option>Registro</option>
                <option>Relatório</option>
                <option>Checklist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Requisito COP
              </label>
              <select
                value={requisitoCop}
                onChange={(e) => setRequisitoCop(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 bg-background"
              >
                <option>1.A.1</option>
                <option>1.A.2</option>
                <option>1.A.3</option>
                <option>1.B.1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nome do Arquivo
              </label>
              <input
                type="text"
                value={arquivo}
                onChange={(e) => setArquivo(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 bg-background"
                placeholder="Ex.: evidencia_001.pdf"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAdicionarEvidencia}
              className="rounded-md bg-accent text-white px-5 py-2 hover:opacity-90 transition"
            >
              Adicionar Evidência
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Evidências do Projeto
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registros vinculados aos requisitos COP e prontos para
              rastreabilidade.
            </p>
          </div>

          {evidenciasDoProjeto.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma evidência cadastrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-2">Evidência</th>
                    <th className="text-left py-3 px-2">Tipo</th>
                    <th className="text-left py-3 px-2">Requisito COP</th>
                    <th className="text-left py-3 px-2">Arquivo</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {evidenciasDoProjeto.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/50 transition"
                    >
                      <td className="py-3 px-2 font-medium">{item.nome}</td>
                      <td className="py-3 px-2">{item.tipo}</td>
                      <td className="py-3 px-2">{item.requisito}</td>
                      <td className="py-3 px-2">{item.arquivo}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>

                          {item.status === "Pendente" && (
                            <button
                              onClick={() => validarEvidencia(item.id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:opacity-90 transition"
                            >
                              Validar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}