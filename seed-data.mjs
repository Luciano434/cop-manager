import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { procedures, operationalSteps, copRequirements, procedureCopLinks } from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("Starting seed...");

    // Create COP Requirements
    const copReqCodes = ["1.A.1", "1.A.2", "1.A.3", "1.B.1"];
    const copReqDescriptions = {
      "1.A.1": "Controle de dados de projeto",
      "1.A.2": "Gerenciamento de configuração",
      "1.A.3": "Rastreabilidade de modificações",
      "1.B.1": "Documentação operacional",
    };

    const copRequirementIds = {};

    for (const code of copReqCodes) {
      const result = await db.insert(copRequirements).values({
        code,
        description: copReqDescriptions[code],
        status: "parcial",
      });
      console.log(`Created COP requirement: ${code}`);
    }

    // Get the created COP requirements
    const createdReqs = await db.select().from(copRequirements);
    createdReqs.forEach((req) => {
      copRequirementIds[req.code] = req.id;
    });

    // Create PR-01 Procedure
    const procedureResult = await db.insert(procedures).values({
      code: "PR-01",
      name: "Controle de Dados de Projeto e Configuração",
      description: "Procedimento para controle e gerenciamento de dados de projeto, configuração e rastreabilidade",
      status: "em_desenvolvimento",
      responsible: "Engenharia",
    });

    const procedureId = procedureResult[0];
    console.log(`Created procedure PR-01 with ID: ${procedureId}`);

    // Create operational steps for PR-01
    const steps = [
      {
        stepNumber: 1,
        name: "Recebimento do dado de projeto",
        description: "Receber e registrar o dado de projeto conforme especificação",
        responsible: "Engenharia",
        input: "Documento de projeto do cliente",
        output: "Registro de recebimento",
        evidenceRequired: true,
        status: "em_desenvolvimento",
      },
      {
        stepNumber: 2,
        name: "Registro no controle de dados",
        description: "Registrar o dado no sistema de controle de dados",
        responsible: "Engenharia",
        input: "Dado de projeto recebido",
        output: "Registro no sistema de controle",
        evidenceRequired: true,
        status: "em_desenvolvimento",
      },
      {
        stepNumber: 3,
        name: "Análise e classificação",
        description: "Analisar e classificar o dado conforme criticidade",
        responsible: "Engenharia",
        input: "Dado registrado",
        output: "Classificação definida",
        evidenceRequired: true,
        status: "em_desenvolvimento",
      },
      {
        stepNumber: 4,
        name: "Aprovação do dado",
        description: "Obter aprovação do dado de projeto",
        responsible: "Gerente de Projeto",
        input: "Dado classificado",
        output: "Aprovação registrada",
        evidenceRequired: true,
        status: "em_desenvolvimento",
      },
      {
        stepNumber: 5,
        name: "Liberação para uso",
        description: "Liberar o dado para uso em produção",
        responsible: "Engenharia",
        input: "Dado aprovado",
        output: "Liberação registrada",
        evidenceRequired: true,
        status: "em_desenvolvimento",
      },
      {
        stepNumber: 6,
        name: "Controle de revisão",
        description: "Manter controle de revisões e modificações",
        responsible: "Engenharia",
        input: "Dado em uso",
        output: "Histórico de revisões",
        evidenceRequired: true,
        status: "em_desenvolvimento",
      },
    ];

    for (const step of steps) {
      await db.insert(operationalSteps).values({
        procedureId,
        ...step,
      });
      console.log(`Created step: ${step.name}`);
    }

    // Create links between PR-01 and COP requirements
    const copCodesForPR01 = ["1.A.1", "1.A.2", "1.A.3", "1.B.1"];
    for (const code of copCodesForPR01) {
      const copReqId = copRequirementIds[code];
      if (copReqId) {
        await db.insert(procedureCopLinks).values({
          procedureId,
          copRequirementId: copReqId,
        });
        console.log(`Linked PR-01 to ${code}`);
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
