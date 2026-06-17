import { getDb } from "./server/db.ts";
import { procedures, operationalSteps, copRequirements, procedureCopLinks } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const pr02Data = {
  code: "PR-02",
  name: "Controle de Modificações de Projeto",
  description: "Procedimento para controle formal de modificações em dados de projeto, com análise de impacto, aprovação e rastreabilidade completa conforme ANAC COP F-300-28",
  status: "em_desenvolvimento",
  responsible: "Engenharia",
  steps: [
    {
      stepNumber: 1,
      name: "Solicitação de Modificação",
      description: "Receber e registrar formalmente a solicitação de modificação de projeto com justificativa e impacto estimado",
      howToExecute: "1. Receber Solicitação de Modificação (SM) do cliente ou departamento interno\n2. Verificar completude: justificativa, dados afetados, impacto estimado\n3. Atribuir Código de Controle de Modificação (CCM) no formato: CCM-AAAA-NNN-PR-02\n4. Registrar na Lista Mestra de Modificações (LMM)\n5. Gerar Registro de Solicitação de Modificação com data/hora e responsável\n6. Validar aplicabilidade ao Type Design conforme matriz de compatibilidade",
      responsible: "Engenheiro de Projetos",
      input: "Solicitação de Modificação do cliente ou departamento interno",
      output: "Registro de Solicitação de Modificação com Código de Controle de Modificação (CCM) e entrada na Lista Mestra de Modificações",
      evidenceType: "Registro de Solicitação de Modificação com CCM",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Modificações",
      auditAccess: "Auditor acessa SCD, consulta Lista Mestra de Modificações, verifica Registro de Solicitação com timestamp e assinatura digital",
      acceptanceCriteria: "Registro completo com CCM único, justificativa documentada, impacto estimado, Type Design validado, sem gaps de rastreabilidade"
    },
    {
      stepNumber: 2,
      name: "Análise de Impacto",
      description: "Analisar o impacto técnico, operacional e regulatório da modificação proposta",
      howToExecute: "1. Acessar SCD com CCM da etapa anterior\n2. Executar análise de impacto conforme Matriz de Impacto (MI-02):\n   - Impacto técnico (sistemas, interfaces, dados)\n   - Impacto operacional (processos, usuários, treinamento)\n   - Impacto regulatório (conformidade, certificações)\n3. Avaliar aplicabilidade ao Type Design e compatibilidade com certificação\n4. Documentar justificativa de cada impacto identificado\n5. Gerar Relatório de Análise de Impacto assinado digitalmente\n6. Classificar modificação em: Crítica (C), Importante (I) ou Padrão (P)",
      responsible: "Engenheiro Sênior de Análise",
      input: "Registro de Solicitação de Modificação e CCM da etapa anterior",
      output: "Relatório de Análise de Impacto com classificação, justificativas e assinatura digital",
      evidenceType: "Relatório de Análise de Impacto com Matriz de Impacto aplicada",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Análise de Impacto",
      auditAccess: "Auditor consulta Relatório de Análise no SCD, verifica aplicação da Matriz de Impacto, valida Type Design e rastreabilidade com CCM",
      acceptanceCriteria: "Relatório completo com análise técnica, operacional e regulatória, Type Design validado, classificação justificada, assinado digitalmente, rastreabilidade com CCM confirmada"
    },
    {
      stepNumber: 3,
      name: "Avaliação de Viabilidade",
      description: "Avaliar viabilidade técnica, cronograma, recursos e riscos da modificação",
      howToExecute: "1. Acessar SCD com CCM e Relatório de Análise de Impacto\n2. Executar avaliação de viabilidade:\n   - Viabilidade técnica: tecnologias, compatibilidades, dependências\n   - Cronograma: estimativa de esforço, prazos, marcos\n   - Recursos: equipe, ferramentas, orçamento\n   - Riscos: identificação, probabilidade, impacto, mitigação\n3. Validar impacto no Type Design e conformidade regulatória\n4. Gerar Relatório de Viabilidade com recomendação (Viável, Viável com Restrições, Não Viável)\n5. Atualizar status no SCD para 'Avaliado'",
      responsible: "Gerente de Projeto / Engenheiro Sênior",
      input: "Relatório de Análise de Impacto e CCM da etapa anterior",
      output: "Relatório de Viabilidade com recomendação e plano de execução (se viável)",
      evidenceType: "Relatório de Viabilidade com análise de riscos e Type Design",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Viabilidade",
      auditAccess: "Auditor consulta Relatório de Viabilidade no SCD, verifica análise de riscos, valida Type Design, rastreabilidade com Relatório de Análise de Impacto",
      acceptanceCriteria: "Relatório com viabilidade técnica, cronograma, recursos e riscos documentados, Type Design validado, recomendação clara, rastreabilidade completa, assinado digitalmente"
    },
    {
      stepNumber: 4,
      name: "Aprovação de Modificação",
      description: "Obter aprovação formal da modificação conforme nível de classificação e impacto",
      howToExecute: "1. Encaminhar Relatório de Viabilidade para aprovador conforme classificação:\n   - Crítica: Diretor de Engenharia + Gerente de Qualidade\n   - Importante: Gerente de Projeto + Gerente de Qualidade\n   - Padrão: Gerente de Projeto\n2. Revisor acessa SCD, consulta Relatório de Viabilidade e Análise de Impacto\n3. Revisor aprova, aprova com restrições ou rejeita com justificativa\n4. Se aprovada: Sistema gera Registro de Aprovação de Modificação com assinatura digital\n5. Atualizar status no SCD para 'Aprovado' ou 'Rejeitado'\n6. Se rejeitada: Documentar motivo e retornar à etapa 1",
      responsible: "Diretor de Engenharia / Gerente de Projeto / Gerente de Qualidade",
      input: "Relatório de Viabilidade e CCM da etapa anterior",
      output: "Registro de Aprovação de Modificação assinado digitalmente com data/hora e justificativa",
      evidenceType: "Registro de Aprovação de Modificação com assinatura digital",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Aprovações",
      auditAccess: "Auditor consulta Registro de Aprovação no SCD, verifica assinatura digital, valida nível de aprovação conforme classificação, rastreabilidade completa",
      acceptanceCriteria: "Registro de Aprovação assinado digitalmente, status SCD = 'Aprovado', nível de aprovação conforme classificação, rastreabilidade com Relatório de Viabilidade e CCM confirmada"
    },
    {
      stepNumber: 5,
      name: "Implementação de Modificação",
      description: "Executar a modificação conforme plano aprovado com validação de conformidade",
      howToExecute: "1. Verificar status no SCD = 'Aprovado' (etapa anterior)\n2. Executar modificação conforme Plano de Execução:\n   - Preparar ambiente de desenvolvimento/teste\n   - Implementar alterações conforme especificação\n   - Executar testes unitários e de integração\n   - Validar conformidade com Type Design\n   - Documentar mudanças realizadas\n3. Gerar Relatório de Implementação com:\n   - Modificações realizadas vs. planejado\n   - Resultados de testes\n   - Validação Type Design\n   - Data/hora de conclusão, responsável\n4. Registrar entrada no Livro de Modificações (LM)\n5. Atualizar status no SCD para 'Implementado'",
      responsible: "Engenheiro de Desenvolvimento / Engenheiro de Testes",
      input: "Registro de Aprovação de Modificação e Plano de Execução",
      output: "Relatório de Implementação com testes OK e validação Type Design",
      evidenceType: "Relatório de Implementação com resultados de testes",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Implementação",
      auditAccess: "Auditor consulta Relatório de Implementação no SCD, verifica testes, valida Type Design, rastreabilidade com Registro de Aprovação",
      acceptanceCriteria: "Relatório completo com modificações implementadas, testes OK, Type Design validado, Livro de Modificações atualizado, status SCD = 'Implementado', rastreabilidade com Aprovação confirmada"
    },
    {
      stepNumber: 6,
      name: "Validação e Testes",
      description: "Executar validação completa e testes de aceitação da modificação",
      howToExecute: "1. Acessar SCD com CCM e Relatório de Implementação\n2. Executar Plano de Testes de Aceitação (PTA):\n   - Testes funcionais: validar comportamento esperado\n   - Testes de regressão: garantir não-impacto em funcionalidades existentes\n   - Testes de conformidade: validar aderência a requisitos COP e Type Design\n   - Testes de performance: validar impacto em performance\n3. Registrar resultados de testes com evidências\n4. Se todos os testes OK: Gerar Relatório de Validação com aprovação\n5. Se testes falharem: Documentar falhas e retornar à etapa 5\n6. Atualizar status no SCD para 'Validado' ou 'Rejeição'",
      responsible: "Engenheiro de Testes / Analista de Qualidade",
      input: "Relatório de Implementação e Plano de Testes de Aceitação",
      output: "Relatório de Validação com testes OK e conformidade Type Design confirmada",
      evidenceType: "Relatório de Validação com resultados de testes e conformidade",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Validação",
      auditAccess: "Auditor consulta Relatório de Validação no SCD, verifica testes de conformidade, valida Type Design, rastreabilidade com Implementação",
      acceptanceCriteria: "Relatório com testes funcionais, regressão e conformidade OK, Type Design validado, sem falhas críticas, rastreabilidade com Implementação confirmada, status SCD = 'Validado'"
    },
    {
      stepNumber: 7,
      name: "Liberação e Controle de Versão",
      description: "Liberar modificação aprovada para produção e manter controle de versão",
      howToExecute: "1. Verificar status no SCD = 'Validado' (etapa anterior)\n2. Preparar Ordem de Liberação de Modificação (OLM) com:\n   - CCM, Relatório de Validação, data/hora liberação, responsável\n   - Ambiente de destino (Produção, Homolog, etc)\n   - Plano de rollback (se necessário)\n3. Gerar Registro de Versão com:\n   - Versão anterior e nova, data/hora, responsável\n   - Modificações incluídas, Type Design validado\n   - Rastreabilidade com CCM e aprovações\n4. Registrar entrada no Livro de Liberação de Modificações (LLM)\n5. Atualizar status no SCD para 'Em Produção'\n6. Manter Histórico de Modificações (HM) no SCD com todas as versões\n7. Notificar stakeholders sobre liberação",
      responsible: "Líder de Liberação / Engenheiro de Implantação",
      input: "Relatório de Validação e Ordem de Liberação de Modificação",
      output: "Registro de Versão com Histórico de Modificações e status 'Em Produção'",
      evidenceType: "Ordem de Liberação de Modificação e Histórico de Modificações",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Liberação",
      auditAccess: "Auditor consulta Ordem de Liberação no SCD, verifica Livro de Liberação de Modificações, valida Histórico de Modificações, rastreabilidade completa de origem até versão atual",
      acceptanceCriteria: "Ordem de Liberação completa, Livro de Liberação atualizado, Histórico de Modificações com todas as versões, status SCD = 'Em Produção', Type Design validado, rastreabilidade com Validação e CCM confirmada, sem gaps de auditoria"
    }
  ],
  copRequirements: [
    { code: "1.D.1", description: "Processo de controle de modificações" },
    { code: "1.D.2", description: "Análise de impacto de modificações" },
    { code: "1.D.3", description: "Aprovação de modificações" },
    { code: "1.D.4", description: "Implementação de modificações" },
    { code: "1.D.5", description: "Testes e validação de modificações" },
    { code: "1.D.6", description: "Liberação de modificações" },
    { code: "1.D.7", description: "Controle de versão" },
    { code: "1.D.8", description: "Rastreabilidade de modificações" }
  ]
};

async function seedPR02() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("Creating PR-02 procedure...\n");

    // Insert PR-02 procedure
    const result = await db.insert(procedures).values({
      code: pr02Data.code,
      name: pr02Data.name,
      description: pr02Data.description,
      status: pr02Data.status,
      responsible: pr02Data.responsible,
    });

    // Get the inserted procedure ID
    const proc = await db
      .select()
      .from(procedures)
      .where(eq(procedures.code, "PR-02"))
      .limit(1);

    if (proc.length === 0) {
      console.error("Failed to retrieve PR-02");
      process.exit(1);
    }

    const procedureId = proc[0].id;
    console.log(`✓ Created PR-02 with ID: ${procedureId}\n`);

    // Insert operational steps
    console.log("Creating operational steps...");
    for (const step of pr02Data.steps) {
      await db.insert(operationalSteps).values({
        procedureId,
        stepNumber: step.stepNumber,
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
        status: "em_desenvolvimento",
      });
      console.log(`  ✓ Step ${step.stepNumber}: ${step.name}`);
    }

    // Get or create COP requirements
    console.log("\nLinking COP requirements...");
    for (const req of pr02Data.copRequirements) {
      // Check if requirement exists
      const existing = await db
        .select()
        .from(copRequirements)
        .where(eq(copRequirements.code, req.code))
        .limit(1);

      let reqId;
      if (existing.length > 0) {
        reqId = existing[0].id;
        console.log(`  ✓ Using existing COP requirement: ${req.code}`);
      } else {
        const insertResult = await db.insert(copRequirements).values({
          code: req.code,
          description: req.description,
          status: "parcial",
        });
        const newReq = await db
          .select()
          .from(copRequirements)
          .where(eq(copRequirements.code, req.code))
          .limit(1);
        reqId = newReq[0].id;
        console.log(`  ✓ Created COP requirement: ${req.code}`);
      }

      // Link procedure to COP requirement
      await db.insert(procedureCopLinks).values({
        procedureId,
        copRequirementId: reqId,
      });
    }

    console.log("\n✅ PR-02 created successfully with all steps and COP links!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding PR-02:", error);
    process.exit(1);
  }
}

seedPR02();
