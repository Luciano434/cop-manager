import { getDb } from "./server/db.ts";
import { procedures, operationalSteps } from "./drizzle/schema.ts";
import { eq, and } from "drizzle-orm";

const refinedSteps = [
  {
    stepNumber: 1,
    name: "Recebimento do dado de projeto",
    description: "Receber e registrar formalmente o dado de projeto conforme especificação técnica",
    howToExecute: "1. Receber documento de projeto do cliente\n2. Verificar completude e conformidade com checklist de recebimento\n3. Registrar na Lista Mestra de Dados de Projeto (LMDP) com data/hora e responsável\n4. Atribuir identificador único (ex: PROJ-2026-001)\n5. Gerar Comprovante de Recebimento (CR-001)",
    responsible: "Engenheiro de Projetos",
    input: "Documento de projeto do cliente (formato: PDF, Word ou especificação técnica)",
    output: "Comprovante de Recebimento (CR-001) com identificador único e data/hora de recebimento",
    evidenceType: "Comprovante de Recebimento (CR-001)",
    evidenceLocation: "Sistema de Gestão de Documentos (SGD) - Pasta: /Procedimentos/PR-01/Etapa1/Recebimentos/",
    auditAccess: "Auditor acessa SGD com credencial, consulta LMDP, verifica CR-001 com timestamp e assinatura digital",
    acceptanceCriteria: "CR-001 preenchido com: data/hora, responsável, identificador único, conformidade verificada"
  },
  {
    stepNumber: 2,
    name: "Registro no controle de dados",
    description: "Registrar o dado no sistema de controle centralizado com rastreabilidade completa",
    howToExecute: "1. Acessar Sistema de Controle de Dados (SCD)\n2. Criar novo registro com dados do CR-001 (etapa anterior)\n3. Preencher: ID, origem, data recebimento, responsável, status inicial\n4. Gerar Número de Controle (NC) no formato: NC-2026-001-PR-01\n5. Registrar entrada no Livro de Controle de Dados (LCD)",
    responsible: "Técnico de Controle de Dados",
    input: "Comprovante de Recebimento (CR-001) da etapa anterior",
    output: "Registro no SCD com Número de Controle (NC) e entrada no Livro de Controle de Dados (LCD)",
    evidenceType: "Livro de Controle de Dados (LCD) com entrada registrada",
    evidenceLocation: "Sistema de Controle de Dados (SCD) - Módulo: Registros de Entrada / Backup: /Procedimentos/PR-01/Etapa2/LCD/",
    auditAccess: "Auditor consulta SCD com filtro por NC, verifica LCD com timestamp, valida rastreabilidade com CR-001",
    acceptanceCriteria: "LCD com entrada completa, NC gerado, rastreabilidade com CR-001 confirmada, sem gaps de data/hora"
  },
  {
    stepNumber: 3,
    name: "Análise e classificação",
    description: "Analisar e classificar o dado conforme criticidade e impacto operacional",
    howToExecute: "1. Acessar SCD com NC da etapa anterior\n2. Executar análise conforme Matriz de Criticidade (MC-01)\n3. Classificar em: Crítico (C), Importante (I) ou Padrão (P)\n4. Documentar justificativa de classificação\n5. Gerar Relatório de Análise (RA) assinado digitalmente\n6. Atualizar status no SCD para 'Classificado'",
    responsible: "Engenheiro Sênior de Análise",
    input: "Número de Controle (NC) e Registro no SCD da etapa anterior",
    output: "Relatório de Análise (RA) com classificação, justificativa e assinatura digital",
    evidenceType: "Relatório de Análise (RA) com Matriz de Criticidade aplicada",
    evidenceLocation: "SCD - Módulo: Análise e Classificação / Arquivo: /Procedimentos/PR-01/Etapa3/RA/RA-NC-XXXX.pdf",
    auditAccess: "Auditor consulta RA no SCD, verifica aplicação da MC-01, valida assinatura digital e rastreabilidade com etapas anteriores",
    acceptanceCriteria: "RA completo com classificação justificada, assinado digitalmente, rastreabilidade com NC confirmada, status SCD atualizado"
  },
  {
    stepNumber: 4,
    name: "Aprovação do dado",
    description: "Obter aprovação formal do dado de projeto conforme nível de classificação",
    howToExecute: "1. Encaminhar RA (etapa anterior) para aprovador conforme classificação:\n   - Crítico: Gerente de Projeto + Diretor de Engenharia\n   - Importante: Gerente de Projeto\n   - Padrão: Engenheiro Sênior\n2. Revisor acessa SCD, consulta RA e documentação relacionada\n3. Revisor aprova ou rejeita com justificativa\n4. Sistema gera Registro de Aprovação (RgA) com assinatura digital\n5. Atualizar status no SCD para 'Aprovado' ou 'Rejeitado'",
    responsible: "Gerente de Projeto / Diretor de Engenharia",
    input: "Relatório de Análise (RA) e Número de Controle (NC) da etapa anterior",
    output: "Registro de Aprovação (RgA) assinado digitalmente com data/hora e justificativa",
    evidenceType: "Registro de Aprovação (RgA) com assinatura digital e rastreabilidade",
    evidenceLocation: "SCD - Módulo: Aprovações / Arquivo: /Procedimentos/PR-01/Etapa4/RgA/RgA-NC-XXXX.pdf",
    auditAccess: "Auditor consulta RgA no SCD, verifica assinatura digital, valida nível de aprovação conforme classificação, rastreabilidade completa",
    acceptanceCriteria: "RgA assinado digitalmente, status SCD = 'Aprovado', rastreabilidade com RA e NC confirmada, sem gaps de aprovação"
  },
  {
    stepNumber: 5,
    name: "Liberação para uso",
    description: "Liberar o dado aprovado para uso em produção com registro formal de liberação",
    howToExecute: "1. Verificar status no SCD = 'Aprovado' (etapa anterior)\n2. Executar testes de integração conforme Plano de Testes (PT)\n3. Se testes OK: gerar Ordem de Liberação (OL) com:\n   - NC, RA, RgA, data/hora liberação, responsável\n   - Ambiente de destino (Produção, Homolog, etc)\n4. Registrar entrada no Livro de Liberação (LL)\n5. Atualizar status no SCD para 'Em Produção'\n6. Notificar usuários finais via sistema de comunicação",
    responsible: "Engenheiro de Implantação / Líder de Liberação",
    input: "Registro de Aprovação (RgA) e Número de Controle (NC) aprovado",
    output: "Ordem de Liberação (OL) com registro no Livro de Liberação (LL) e status 'Em Produção'",
    evidenceType: "Ordem de Liberação (OL) e Livro de Liberação (LL) com entrada registrada",
    evidenceLocation: "SCD - Módulo: Liberações / Arquivo: /Procedimentos/PR-01/Etapa5/OL/OL-NC-XXXX.pdf",
    auditAccess: "Auditor consulta OL no SCD, verifica LL, valida testes de integração, rastreabilidade completa com aprovação",
    acceptanceCriteria: "OL gerada com testes OK, LL atualizado, status SCD = 'Em Produção', rastreabilidade com RgA e NC confirmada"
  },
  {
    stepNumber: 6,
    name: "Controle de revisão",
    description: "Manter controle formal de revisões, modificações e histórico de mudanças",
    howToExecute: "1. Monitorar dado em produção via SCD\n2. Se houver solicitação de mudança: criar Solicitação de Alteração (SA)\n3. SA deve referenciar NC original e justificar mudança\n4. Executar análise de impacto conforme Procedimento de Mudança\n5. Se aprovada: gerar Registro de Revisão (RR) com:\n   - Versão anterior e nova, data/hora, responsável, justificativa\n   - Rastreabilidade com SA e aprovações\n6. Manter Histórico de Revisões (HR) no SCD com todas as versões\n7. Atualizar versão no SCD e notificar stakeholders",
    responsible: "Engenheiro de Manutenção / Gerente de Mudanças",
    input: "Ordem de Liberação (OL) e Número de Controle (NC) em produção",
    output: "Histórico de Revisões (HR) com todas as versões, Registros de Revisão (RR) e rastreabilidade completa",
    evidenceType: "Histórico de Revisões (HR) com versões, datas, responsáveis e justificativas",
    evidenceLocation: "SCD - Módulo: Histórico de Revisões / Arquivo: /Procedimentos/PR-01/Etapa6/HR/HR-NC-XXXX.pdf",
    auditAccess: "Auditor consulta HR no SCD, verifica todas as versões com timestamps, valida aprovações de mudanças, rastreabilidade completa de origem até versão atual",
    acceptanceCriteria: "HR completo com todas as versões, RR com justificativas, rastreabilidade com SA e aprovações, sem gaps de auditoria"
  }
];

async function updatePR01Steps() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Get PR-01 procedure
    const proc = await db
      .select()
      .from(procedures)
      .where(eq(procedures.code, "PR-01"))
      .limit(1);

    if (proc.length === 0) {
      console.error("PR-01 not found");
      process.exit(1);
    }

    const procedureId = proc[0].id;
    console.log(`Found PR-01 with ID: ${procedureId}\n`);

    // Update each step
    for (const step of refinedSteps) {
      await db
        .update(operationalSteps)
        .set({
          name: step.name,
          description: step.description,
          howToExecute: step.howToExecute,
          responsible: step.responsible,
          input: step.input,
          output: step.output,
          evidenceType: step.evidenceType,
          evidenceLocation: step.evidenceLocation,
          auditAccess: step.auditAccess,
          acceptanceCriteria: step.acceptanceCriteria,
        })
        .where(
          and(
            eq(operationalSteps.procedureId, procedureId),
            eq(operationalSteps.stepNumber, step.stepNumber)
          )
        );

      console.log(`✓ Updated step ${step.stepNumber}: ${step.name}`);
    }

    console.log("\n✅ All steps updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating steps:", error);
    process.exit(1);
  }
}

updatePR01Steps();
