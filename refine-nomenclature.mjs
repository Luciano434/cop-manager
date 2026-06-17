import { getDb } from "./server/db.ts";
import { procedures, operationalSteps } from "./drizzle/schema.ts";
import { eq, and } from "drizzle-orm";

const refinedSteps = [
  {
    stepNumber: 1,
    name: "Recebimento do dado de projeto",
    description: "Receber e registrar formalmente o dado de projeto conforme especificação técnica. Verificar aplicabilidade ao Type Design.",
    howToExecute: "1. Receber documento de projeto do cliente\n2. Verificar completude e conformidade com checklist de recebimento\n3. Verificar aplicabilidade ao Type Design conforme matriz de compatibilidade\n4. Registrar na Lista Mestra de Dados de Projeto com data/hora e responsável\n5. Atribuir Código de Controle do Documento (CC) único (ex: CC-2026-001)\n6. Gerar Registro de Recebimento de Dados de Projeto",
    responsible: "Engenheiro de Projetos",
    input: "Documento de projeto do cliente (formato: PDF, Word ou especificação técnica)",
    output: "Registro de Recebimento de Dados de Projeto com Código de Controle do Documento (CC) e data/hora de recebimento",
    evidenceType: "Registro de Recebimento de Dados de Projeto",
    evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Registros de Projeto",
    auditAccess: "Auditor acessa SCD, consulta Lista Mestra de Dados de Projeto, verifica Registro de Recebimento com timestamp e assinatura digital",
    acceptanceCriteria: "Registro de Recebimento preenchido com: data/hora, responsável, CC único, conformidade verificada, Type Design validado"
  },
  {
    stepNumber: 2,
    name: "Registro no controle de dados",
    description: "Registrar o dado no sistema de controle centralizado com rastreabilidade completa. Validar aplicabilidade ao Type Design.",
    howToExecute: "1. Acessar Sistema de Controle de Dados (SCD)\n2. Criar novo registro com dados do Registro de Recebimento (etapa anterior)\n3. Preencher: ID, origem, data recebimento, responsável, status inicial\n4. Validar aplicabilidade ao Type Design conforme procedimento específico\n5. Gerar Código de Controle do Documento (CC) no formato: CC-AAAA-NNN-PR-01\n6. Registrar entrada na Lista Mestra de Dados de Projeto",
    responsible: "Técnico de Controle de Dados",
    input: "Registro de Recebimento de Dados de Projeto da etapa anterior",
    output: "Registro no SCD com Código de Controle do Documento (CC) e entrada na Lista Mestra de Dados de Projeto",
    evidenceType: "Lista Mestra de Dados de Projeto com entrada registrada",
    evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Controle de Documentos",
    auditAccess: "Auditor consulta SCD com filtro por CC, verifica Lista Mestra com timestamp, valida rastreabilidade com Registro de Recebimento",
    acceptanceCriteria: "Lista Mestra com entrada completa, CC gerado, rastreabilidade com Registro de Recebimento confirmada, Type Design validado"
  },
  {
    stepNumber: 3,
    name: "Análise e classificação",
    description: "Analisar e classificar o dado conforme criticidade, impacto operacional e aplicabilidade ao Type Design",
    howToExecute: "1. Acessar SCD com CC da etapa anterior\n2. Executar análise conforme Matriz de Criticidade e aplicabilidade ao Type Design\n3. Classificar em: Crítico (C), Importante (I) ou Padrão (P)\n4. Documentar justificativa de classificação e validação Type Design\n5. Gerar Relatório de Análise assinado digitalmente\n6. Atualizar status no SCD para 'Classificado'",
    responsible: "Engenheiro Sênior de Análise",
    input: "Código de Controle do Documento (CC) e Registro no SCD da etapa anterior",
    output: "Relatório de Análise com classificação, justificativa Type Design e assinatura digital",
    evidenceType: "Relatório de Análise com Matriz de Criticidade e validação Type Design",
    evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Análise e Classificação",
    auditAccess: "Auditor consulta Relatório de Análise no SCD, verifica aplicação da Matriz de Criticidade e validação Type Design, valida assinatura digital",
    acceptanceCriteria: "Relatório completo com classificação justificada, validação Type Design documentada, assinado digitalmente, rastreabilidade com CC confirmada"
  },
  {
    stepNumber: 4,
    name: "Aprovação do dado",
    description: "Obter aprovação formal do dado de projeto conforme nível de classificação e aplicabilidade ao Type Design",
    howToExecute: "1. Encaminhar Relatório de Análise (etapa anterior) para aprovador conforme classificação:\n   - Crítico: Gerente de Projeto + Diretor de Engenharia\n   - Importante: Gerente de Projeto\n   - Padrão: Engenheiro Sênior\n2. Revisor acessa SCD, consulta Relatório de Análise e validação Type Design\n3. Revisor aprova ou rejeita com justificativa\n4. Sistema gera Registro de Aprovação com assinatura digital\n5. Atualizar status no SCD para 'Aprovado' ou 'Rejeitado'",
    responsible: "Gerente de Projeto / Diretor de Engenharia",
    input: "Relatório de Análise e Código de Controle do Documento (CC) da etapa anterior",
    output: "Registro de Aprovação assinado digitalmente com data/hora, justificativa e validação Type Design",
    evidenceType: "Registro de Aprovação com assinatura digital e rastreabilidade",
    evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Aprovações",
    auditAccess: "Auditor consulta Registro de Aprovação no SCD, verifica assinatura digital, valida nível de aprovação conforme classificação, rastreabilidade completa",
    acceptanceCriteria: "Registro de Aprovação assinado digitalmente, status SCD = 'Aprovado', rastreabilidade com Relatório de Análise e CC confirmada, Type Design validado"
  },
  {
    stepNumber: 5,
    name: "Liberação para uso",
    description: "Liberar o dado aprovado para uso em produção com registro formal de liberação e validação final Type Design",
    howToExecute: "1. Verificar status no SCD = 'Aprovado' (etapa anterior)\n2. Executar testes de integração conforme Plano de Testes\n3. Validar conformidade final com Type Design\n4. Se testes OK: gerar Ordem de Liberação com:\n   - CC, Relatório de Análise, Registro de Aprovação, data/hora liberação, responsável\n   - Ambiente de destino (Produção, Homolog, etc)\n5. Registrar entrada no Livro de Liberação\n6. Atualizar status no SCD para 'Em Produção'",
    responsible: "Engenheiro de Implantação / Líder de Liberação",
    input: "Registro de Aprovação e Código de Controle do Documento (CC) aprovado",
    output: "Ordem de Liberação com registro no Livro de Liberação e status 'Em Produção'",
    evidenceType: "Ordem de Liberação e Livro de Liberação com entrada registrada",
    evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Liberações",
    auditAccess: "Auditor consulta Ordem de Liberação no SCD, verifica Livro de Liberação, valida testes de integração e conformidade Type Design, rastreabilidade completa",
    acceptanceCriteria: "Ordem de Liberação gerada com testes OK, Livro de Liberação atualizado, status SCD = 'Em Produção', Type Design validado, rastreabilidade com Registro de Aprovação e CC confirmada"
  },
  {
    stepNumber: 6,
    name: "Controle de revisão",
    description: "Manter controle formal de revisões, modificações e histórico de mudanças com rastreabilidade Type Design",
    howToExecute: "1. Monitorar dado em produção via SCD\n2. Se houver solicitação de mudança: criar Solicitação de Alteração\n3. Solicitação deve referenciar CC original e justificar mudança\n4. Validar impacto ao Type Design conforme Procedimento de Mudança\n5. Executar análise de impacto\n6. Se aprovada: gerar Registro de Revisão com:\n   - Versão anterior e nova, data/hora, responsável, justificativa\n   - Rastreabilidade com Solicitação de Alteração e aprovações\n   - Validação Type Design para nova versão\n7. Manter Histórico de Revisões no SCD com todas as versões\n8. Atualizar versão no SCD e notificar stakeholders",
    responsible: "Engenheiro de Manutenção / Gerente de Mudanças",
    input: "Ordem de Liberação e Código de Controle do Documento (CC) em produção",
    output: "Histórico de Revisões com todas as versões, Registros de Revisão e rastreabilidade completa Type Design",
    evidenceType: "Histórico de Revisões com versões, datas, responsáveis, justificativas e validação Type Design",
    evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Histórico de Revisões",
    auditAccess: "Auditor consulta Histórico de Revisões no SCD, verifica todas as versões com timestamps, valida aprovações de mudanças e conformidade Type Design, rastreabilidade completa de origem até versão atual",
    acceptanceCriteria: "Histórico de Revisões completo com todas as versões, Registros de Revisão com justificativas, validação Type Design para cada versão, rastreabilidade com Solicitações de Alteração e aprovações, sem gaps de auditoria"
  }
];

async function updatePR01Nomenclature() {
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

    console.log("\n✅ All steps updated with refined nomenclature and Type Design validation!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating steps:", error);
    process.exit(1);
  }
}

updatePR01Nomenclature();
