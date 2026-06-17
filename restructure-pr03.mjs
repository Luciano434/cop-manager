import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { procedures, operationalSteps } from "./drizzle/schema.ts";
import mysql from "mysql2/promise";

async function restructurePR03() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("=== RESTRUCTURING PR-03: Aeronavegabilidade Continuada ===\n");

  try {
    // Get PR-03 procedure
    const pr03 = await db.select().from(procedures).where(eq(procedures.code, "PR-03"));
    if (pr03.length === 0) {
      console.error("PR-03 not found");
      process.exit(1);
    }

    const pr03Id = pr03[0].id;
    console.log(`Found PR-03 with ID: ${pr03Id}`);

    // Delete existing steps for PR-03
    await db.delete(operationalSteps).where(eq(operationalSteps.procedureId, pr03Id));
    console.log("Deleted existing steps for PR-03\n");

    // New 8 steps for PR-03
    const newSteps = [
      {
        procedureId: pr03Id,
        stepNumber: 1,
        name: "Identificação de Evento ou Necessidade",
        description: "1. Receber comunicação de falha em serviço, dificuldade operacional, requisito regulatório ou melhoria\n2. Classificar tipo de evento\n3. Documentar fonte do evento\n4. Avaliar urgência e impacto na aeronavegabilidade\n5. Encaminhar para análise técnica\n\nCritério de Aceitação: Evento identificado, classificado e documentado",
        responsible: "Engenheiro de Aeronavegabilidade",
        input: "Comunicação de falha ou requisito regulatório",
        output: "Registro de Evento em Serviço (RES)",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 2,
        name: "Registro do Evento",
        description: "1. Criar RES com número sequencial\n2. Documentar data, hora, aeronave/componente\n3. Descrever evento de forma objetiva\n4. Registrar fonte e responsável\n5. Armazenar no Sistema de Controle de Aeronavegabilidade (SCA)\n\nCritério de Aceitação: RES criado com todos os campos, rastreável no SCA",
        responsible: "Técnico de Controle de Aeronavegabilidade",
        input: "Evento identificado",
        output: "Registro de Evento em Serviço (RES) com número único",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 3,
        name: "Análise Técnica",
        description: "1. Analisar impacto na aeronavegabilidade\n2. Verificar relação com Type Design\n3. Avaliar criticidade\n4. Determinar se requer ação imediata\n5. Documentar com referências normativas (RBAC 21, CS-23)\n\nCritério de Aceitação: Análise completa com impacto e criticidade definidos",
        responsible: "Engenheiro de Aeronavegabilidade",
        input: "Registro de Evento em Serviço (RES)",
        output: "Relatório de Análise Técnica (RAT)",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 4,
        name: "Definição da Ação",
        description: "1. Determinar tipo de ação (Boletim, Revisão ICA, Instrução Técnica)\n2. Definir escopo (todas as aeronaves ou selecionadas)\n3. Estabelecer prazo de implementação\n4. Designar responsável\n5. Criar Plano de Ação (PA)\n\nCritério de Aceitação: Tipo, escopo, prazo e responsável definidos",
        responsible: "Gerente de Aeronavegabilidade",
        input: "Relatório de Análise Técnica (RAT)",
        output: "Plano de Ação (PA)",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 5,
        name: "Elaboração da ICA",
        description: "1. Estruturar documento técnico com objetivo, escopo, instruções\n2. Incluir diagramas e referências normativas\n3. Especificar peças, ferramentas e materiais\n4. Definir critérios de aceitação\n5. Versionar documento\n\nCritério de Aceitação: ICA completa, tecnicamente correta, auditável",
        responsible: "Engenheiro de Projeto",
        input: "Plano de Ação (PA)",
        output: "Instrução de Aeronavegabilidade Continuada (ICA) preliminar",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 6,
        name: "Revisão e Aprovação Técnica",
        description: "1. Revisar conformidade técnica com RBAC 21\n2. Validar clareza e objetividade\n3. Verificar compatibilidade com Type Design\n4. Obter aprovação de Engenharia, Manutenção e Qualidade\n5. Gerar Registro de Aprovação (RgA)\n\nCritério de Aceitação: ICA aprovada por todas as áreas",
        responsible: "Engenheiro de Aeronavegabilidade",
        input: "Instrução de Aeronavegabilidade Continuada (ICA) preliminar",
        output: "Instrução de Aeronavegabilidade Continuada (ICA) aprovada",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 7,
        name: "Comunicação e Distribuição",
        description: "1. Identificar destinatários (operadores, manutenção, clientes, autoridades)\n2. Preparar comunicado técnico\n3. Distribuir via email, portal, SCA\n4. Registrar data de distribuição\n5. Manter comprovante de recebimento\n\nCritério de Aceitação: ICA distribuída com comprovantes documentados",
        responsible: "Gerente de Aeronavegabilidade",
        input: "Instrução de Aeronavegabilidade Continuada (ICA) aprovada",
        output: "Ordem de Liberação (OL) com comprovantes",
        evidenceRequired: true,
        status: "nao_iniciado"
      },
      {
        procedureId: pr03Id,
        stepNumber: 8,
        name: "Controle de Revisão e Rastreabilidade",
        description: "1. Manter registro de todas as versões\n2. Documentar datas e modificações\n3. Criar Histórico de Revisão (HR)\n4. Armazenar no SCA\n5. Manter rastreabilidade: Evento → RES → RAT → PA → ICA → Distribuição\n\nCritério de Aceitação: Histórico completo, rastreabilidade total, acesso auditável",
        responsible: "Técnico de Controle de Aeronavegabilidade",
        input: "Ordem de Liberação (OL)",
        output: "Histórico de Revisão (HR) e Relatório de Rastreabilidade (RR)",
        evidenceRequired: true,
        status: "nao_iniciado"
      }
    ];

    // Insert new steps
    for (const step of newSteps) {
      await db.insert(operationalSteps).values(step);
    }

    console.log(`✅ Successfully created 8 new steps for PR-03\n`);
    console.log("New PR-03 Structure (Airworthiness Event-Driven):");
    newSteps.forEach(step => console.log(`${step.stepNumber}. ${step.name}`));

    await connection.end();
  } catch (error) {
    console.error("Error restructuring PR-03:", error);
    process.exit(1);
  }
}

restructurePR03();
