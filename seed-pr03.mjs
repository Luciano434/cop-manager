import { getDb } from "./server/db.ts";
import { procedures, operationalSteps, copRequirements, procedureCopLinks } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const pr03Data = {
  code: "PR-03",
  name: "Instruções de Aeronavegabilidade Continuada (ICA)",
  description: "Procedimento para gerenciar a emissão, atualização, controle e disponibilização de Instruções de Aeronavegabilidade Continuada, incluindo boletins de serviço, manuais e atualizações técnicas conforme ANAC COP F-300-28",
  status: "em_desenvolvimento",
  responsible: "Engenharia / Qualidade",
  steps: [
    {
      stepNumber: 1,
      name: "Identificação da necessidade de ICA",
      description: "Identificar e registrar formalmente a necessidade de emissão de Instrução de Aeronavegabilidade Continuada (ICA) decorrente de falhas, melhorias, requisitos regulatórios ou atualizações técnicas",
      howToExecute: "1. Receber solicitação de ICA de: campo (relatórios de falha), engenharia (melhorias), regulação (requisitos ANAC) ou cliente\n2. Verificar completude: descrição da necessidade, justificativa técnica, impacto na aeronavegabilidade\n3. Atribuir Código de Identificação de ICA (CII) no formato: CII-AAAA-NNN-PR-03\n4. Registrar na Lista Mestra de ICA (LMICA) com data/hora e responsável\n5. Validar impacto na aeronavegabilidade conforme matriz de criticidade aeronáutica\n6. Validar aplicabilidade ao Type Design conforme matriz de compatibilidade\n7. Gerar Registro de Identificação de ICA com CII único",
      responsible: "Engenheiro de Aeronavegabilidade / Engenheiro de Projetos",
      input: "Solicitação de ICA (relatório de falha, requisito regulatório ou melhoria técnica)",
      output: "Registro de Identificação de ICA com Código de Identificação de ICA (CII) e entrada na Lista Mestra de ICA",
      evidenceType: "Registro de Identificação de ICA com CII e validação de aeronavegabilidade",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Instruções de Aeronavegabilidade",
      auditAccess: "Auditor acessa SCD, consulta Lista Mestra de ICA, verifica Registro de Identificação com timestamp, validação de aeronavegabilidade e Type Design",
      acceptanceCriteria: "Registro completo com CII único, justificativa técnica documentada, impacto na aeronavegabilidade validado, Type Design verificado, sem gaps de rastreabilidade"
    },
    {
      stepNumber: 2,
      name: "Análise técnica e definição da ação",
      description: "Executar análise técnica aprofundada da necessidade identificada e definir a ação de aeronavegabilidade apropriada",
      howToExecute: "1. Acessar SCD com CII da etapa anterior\n2. Executar análise técnica conforme Procedimento de Análise de Aeronavegabilidade:\n   - Análise de causa raiz (se falha)\n   - Avaliação de impacto na segurança\n   - Identificação de sistemas/componentes afetados\n   - Análise de compatibilidade com Type Design\n3. Definir tipo de ação: Boletim de Serviço (BS), Instrução de Manutenção (IM), Atualização de Manual (AM) ou Instrução Especial (IE)\n4. Documentar justificativa técnica e referências regulatórias\n5. Gerar Relatório de Análise Técnica assinado digitalmente\n6. Atualizar status no SCD para 'Analisado'",
      responsible: "Engenheiro Sênior de Aeronavegabilidade",
      input: "Registro de Identificação de ICA e CII da etapa anterior",
      output: "Relatório de Análise Técnica com definição de ação de aeronavegabilidade",
      evidenceType: "Relatório de Análise Técnica com análise de impacto na aeronavegabilidade",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Análise Técnica de Aeronavegabilidade",
      auditAccess: "Auditor consulta Relatório de Análise no SCD, verifica análise de impacto, valida compatibilidade Type Design, rastreabilidade com CII",
      acceptanceCriteria: "Relatório com análise técnica completa, tipo de ação definido, impacto na aeronavegabilidade documentado, Type Design validado, assinado digitalmente, rastreabilidade com CII confirmada"
    },
    {
      stepNumber: 3,
      name: "Elaboração da ICA",
      description: "Elaborar a Instrução de Aeronavegabilidade Continuada conforme padrão técnico e regulatório, com conteúdo claro e auditável",
      howToExecute: "1. Acessar SCD com CII e Relatório de Análise Técnica\n2. Elaborar ICA conforme Padrão de Documentação Técnica ANAC:\n   - Título e identificação da ICA\n   - Escopo e aplicabilidade (incluindo Type Design)\n   - Descrição da ação de aeronavegabilidade\n   - Procedimentos operacionais/manutenção\n   - Critérios de aceitação e conformidade\n   - Referências regulatórias e normativas\n   - Histórico de revisões\n3. Incluir diagramas, tabelas e especificações técnicas conforme necessário\n4. Validar conformidade com Type Design em todas as seções técnicas\n5. Gerar versão de ICA com número de revisão (ex: ICA-CII-XXXX-Rev.01)\n6. Registrar entrada no Livro de Elaboração de ICA (LEIA)",
      responsible: "Engenheiro Técnico de Aeronavegabilidade / Especialista em Documentação",
      input: "Relatório de Análise Técnica e CII da etapa anterior",
      output: "Instrução de Aeronavegabilidade Continuada elaborada com número de revisão",
      evidenceType: "Instrução de Aeronavegabilidade Continuada (ICA) completa com validação Type Design",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Instruções de Aeronavegabilidade Elaboradas",
      auditAccess: "Auditor consulta ICA no SCD, verifica conformidade com padrão técnico, valida Type Design em seções técnicas, rastreabilidade com Análise Técnica",
      acceptanceCriteria: "ICA completa com todas as seções obrigatórias, número de revisão atribuído, Type Design validado em conteúdo técnico, Livro de Elaboração atualizado, rastreabilidade com Análise Técnica confirmada"
    },
    {
      stepNumber: 4,
      name: "Revisão e aprovação técnica",
      description: "Executar revisão técnica independente e obter aprovação formal da ICA conforme nível de criticidade de aeronavegabilidade",
      howToExecute: "1. Encaminhar ICA para revisão técnica conforme classificação de aeronavegabilidade:\n   - Crítica (impacto direto na segurança): Diretor de Engenharia + Especialista Aeronavegabilidade\n   - Importante (impacto indireto): Gerente de Engenharia + Engenheiro Sênior\n   - Padrão (manutenção/atualização): Engenheiro Sênior\n2. Revisor acessa SCD, consulta ICA e Análise Técnica\n3. Revisor verifica: conformidade técnica com padrões ANAC, impacto na aeronavegabilidade, Type Design validado, clareza das instruções\n4. Revisor aprova, aprova com restrições ou rejeita com justificativa\n5. Se aprovada: Sistema gera Registro de Aprovação Técnica com assinatura digital\n6. Atualizar status no SCD para 'Aprovado' ou 'Rejeitado'",
      responsible: "Diretor de Engenharia / Gerente de Engenharia / Especialista Aeronavegabilidade",
      input: "Instrução de Aeronavegabilidade Continuada e CII da etapa anterior",
      output: "Registro de Aprovação Técnica assinado digitalmente com data/hora e justificativa",
      evidenceType: "Registro de Aprovação Técnica com assinatura digital e validação de aeronavegabilidade",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Aprovações de Aeronavegabilidade",
      auditAccess: "Auditor consulta Registro de Aprovação no SCD, verifica assinatura digital, valida nível de aprovação conforme criticidade de aeronavegabilidade, rastreabilidade completa",
      acceptanceCriteria: "Registro de Aprovação assinado digitalmente, status SCD = 'Aprovado', nível de aprovação conforme criticidade de aeronavegabilidade, Type Design validado, rastreabilidade com ICA e CII confirmada"
    },
    {
      stepNumber: 5,
      name: "Liberação e comunicação aos usuários",
      description: "Liberar a ICA aprovada para uso operacional e comunicar aos usuários finais com rastreabilidade completa",
      howToExecute: "1. Verificar status no SCD = 'Aprovado' (etapa anterior)\n2. Preparar Ordem de Liberação de ICA (OLI) com: CII, ICA aprovada, data/hora liberação, responsável, públicos-alvo, canais de distribuição\n3. Gerar Registro de Liberação de ICA com: data/hora de liberação, versão, responsável, rastreabilidade com Aprovação Técnica, validação de aeronavegabilidade e Type Design\n4. Registrar entrada no Livro de Liberação de ICA (LLICA)\n5. Distribuir ICA aos públicos-alvo conforme canais definidos\n6. Registrar confirmação de recebimento dos usuários\n7. Atualizar status no SCD para 'Em Operação'",
      responsible: "Líder de Liberação de Aeronavegabilidade / Engenheiro de Implantação",
      input: "Registro de Aprovação Técnica e ICA aprovada",
      output: "Ordem de Liberação de ICA com Livro de Liberação atualizado e status 'Em Operação'",
      evidenceType: "Ordem de Liberação de ICA e Livro de Liberação com confirmação de distribuição",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Liberação de Aeronavegabilidade",
      auditAccess: "Auditor consulta Ordem de Liberação no SCD, verifica Livro de Liberação, valida confirmação de distribuição aos usuários, rastreabilidade com Aprovação Técnica",
      acceptanceCriteria: "Ordem de Liberação completa, Livro de Liberação atualizado com confirmação de distribuição, status SCD = 'Em Operação', aeronavegabilidade e Type Design validados, rastreabilidade com Aprovação Técnica confirmada"
    },
    {
      stepNumber: 6,
      name: "Controle de revisão e atualização das ICA",
      description: "Manter controle formal de revisões, atualizações e histórico de mudanças das ICA em operação",
      howToExecute: "1. Monitorar ICA em operação via SCD\n2. Se houver necessidade de revisão: criar Solicitação de Revisão de ICA (SRI)\n3. SRI deve referenciar CII original e justificar revisão: falhas identificadas, melhorias técnicas, requisitos regulatórios novos, atualizações de Type Design\n4. Validar impacto na aeronavegabilidade conforme matriz de criticidade\n5. Validar impacto no Type Design\n6. Se aprovada: Executar análise de impacto conforme Procedimento de Mudança\n7. Gerar Registro de Revisão de ICA com: versão anterior e nova, data/hora, responsável, mudanças incluídas, impacto na aeronavegabilidade, validação Type Design, rastreabilidade com SRI e aprovações\n8. Manter Histórico de Revisões de ICA (HRICA) no SCD com todas as versões",
      responsible: "Engenheiro de Manutenção de Aeronavegabilidade / Gerente de Mudanças",
      input: "Ordem de Liberação de ICA e CII em operação",
      output: "Histórico de Revisões de ICA com todas as versões e Registros de Revisão",
      evidenceType: "Histórico de Revisões de ICA com versões, datas, responsáveis e validação de aeronavegabilidade",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Histórico de Revisões de Aeronavegabilidade",
      auditAccess: "Auditor consulta Histórico de Revisões no SCD, verifica todas as versões com timestamps, valida aprovações de mudanças e conformidade de aeronavegabilidade, rastreabilidade completa de origem até versão atual",
      acceptanceCriteria: "Histórico de Revisões completo com todas as versões, Registros de Revisão com justificativas, validação de aeronavegabilidade para cada versão, Type Design validado, rastreabilidade com SRI e aprovações, sem gaps de auditoria"
    },
    {
      stepNumber: 7,
      name: "Registro e rastreabilidade das ICA emitidas",
      description: "Manter registro centralizado e rastreabilidade completa de todas as ICA emitidas, incluindo conformidade regulatória e aeronavegabilidade",
      howToExecute: "1. Manter Lista Mestra de ICA (LMICA) atualizada com: CII, número de revisão, data de emissão, tipo de ação, status, impacto na aeronavegabilidade, Type Design aplicável, responsável\n2. Manter Registro de Rastreabilidade de ICA (RRI) com: origem, histórico de revisões com datas, aprovações obtidas, distribuição aos usuários, conformidade regulatória\n3. Gerar Relatório de Conformidade de Aeronavegabilidade (RCA) com: número de ICA emitidas por período, distribuição por tipo de ação, impacto na aeronavegabilidade, conformidade com requisitos ANAC, tendências e melhorias\n4. Arquivar ICA obsoletas com justificativa\n5. Manter histórico completo por mínimo 5 anos conforme regulação ANAC",
      responsible: "Gerente de Aeronavegabilidade / Analista de Conformidade",
      input: "Todas as ICA emitidas, Registros de Aprovação, Ordens de Liberação",
      output: "Lista Mestra de ICA atualizada, Registro de Rastreabilidade de ICA e Relatório de Conformidade de Aeronavegabilidade",
      evidenceType: "Lista Mestra de ICA, Registro de Rastreabilidade e Relatório de Conformidade com validação de aeronavegabilidade",
      evidenceLocation: "Sistema de Controle de Dados (SCD) – Módulo de Rastreabilidade de Aeronavegabilidade",
      auditAccess: "Auditor consulta Lista Mestra no SCD, verifica Registro de Rastreabilidade, valida Relatório de Conformidade, rastreabilidade completa de cada ICA de origem até obsolescência",
      acceptanceCriteria: "Lista Mestra completa e atualizada, Registro de Rastreabilidade com histórico completo de cada ICA, Relatório de Conformidade com análise de impacto na aeronavegabilidade, Type Design validado, conformidade ANAC documentada, histórico arquivado por mínimo 5 anos"
    }
  ],
  copRequirements: [
    { code: "1.C.1", description: "Emissão e controle de Instruções de Aeronavegabilidade Continuada" },
    { code: "1.C.2", description: "Rastreabilidade e conformidade de ICA com requisitos regulatórios" }
  ]
};

async function seedPR03() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("Creating PR-03 procedure...\n");

    // Insert PR-03 procedure
    const result = await db.insert(procedures).values({
      code: pr03Data.code,
      name: pr03Data.name,
      description: pr03Data.description,
      status: pr03Data.status,
      responsible: pr03Data.responsible,
    });

    // Get the inserted procedure ID
    const proc = await db
      .select()
      .from(procedures)
      .where(eq(procedures.code, "PR-03"))
      .limit(1);

    if (proc.length === 0) {
      console.error("Failed to retrieve PR-03");
      process.exit(1);
    }

    const procedureId = proc[0].id;
    console.log(`✓ Created PR-03 with ID: ${procedureId}\n`);

    // Insert operational steps
    console.log("Creating operational steps...");
    for (const step of pr03Data.steps) {
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
    for (const req of pr03Data.copRequirements) {
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

    console.log("\n✅ PR-03 created successfully with all steps and COP links!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding PR-03:", error);
    process.exit(1);
  }
}

seedPR03();
