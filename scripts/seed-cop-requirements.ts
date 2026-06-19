/**
 * Seed script: popula a tabela cop_requirements com todos os requisitos COP.
 *
 * Fontes de dados:
 *   • client/src/data/copRequirements.ts  (códigos e descrições base)
 *   • client/src/data/procedures/PR-01.json  (copMatrix + process steps do CPR-01)
 *
 * Campos derivados por código:
 *   procedureCode    – CPR vinculado (ex: "CPR-01")
 *   expectedEvidence – o que deve ser evidenciado (das descrições do copMatrix)
 *   expectedRecord   – registros esperados (de records[] dos process steps referenciados)
 *   verificationMethod – forma de verificação (de verification dos process steps)
 *
 * Uso:
 *   npx tsx scripts/seed-cop-requirements.ts
 *
 * Idempotente: usa onDuplicateKeyUpdate — pode ser executado múltiplas vezes.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { count } from "drizzle-orm";
import { copRequirements } from "../drizzle/schema";

// ---------------------------------------------------------------------------
// Carregar PR-01.json (único procedimento com copMatrix completa)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));

const pr01 = JSON.parse(
  readFileSync(
    resolve(__dirname, "../client/src/data/procedures/PR-01.json"),
    "utf-8"
  )
) as {
  copMatrix: { requirement: string; description: string; items: string[] }[];
  process: { step: string; records?: string[]; verification?: string }[];
};

// ---------------------------------------------------------------------------
// Extrai procedureCode, expectedEvidence, expectedRecord, verificationMethod
// a partir do copMatrix e dos process steps do PR-01.json
// ---------------------------------------------------------------------------
function fromCopMatrix(code: string): {
  procedureCode: string;
  expectedEvidence: string;
  expectedRecord: string;
  verificationMethod: string;
} | null {
  const entries = pr01.copMatrix.filter((m) => m.requirement === code);
  if (entries.length === 0) return null;

  // expectedEvidence: junte todas as descrições únicas do copMatrix para este código
  const descriptions = [...new Set(entries.map((e) => e.description))];
  const expectedEvidence = descriptions.join("; ");

  // Colete todos os refs de steps únicos (ex: "6.1", "6.5")
  const itemRefs = [...new Set(entries.flatMap((e) => e.items))];

  // Busque os steps correspondentes no process array (ignora refs "4.x" que não existem)
  const steps = itemRefs
    .map((ref) => pr01.process.find((p) => p.step === ref))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  // expectedRecord: todos os registros únicos dos steps referenciados
  const records = [...new Set(steps.flatMap((s) => s.records ?? []))];

  // verificationMethod: todos os métodos de verificação únicos
  const verifications = [
    ...new Set(steps.map((s) => s.verification ?? "").filter(Boolean)),
  ];

  return {
    procedureCode: "CPR-01",
    expectedEvidence,
    expectedRecord: records.join("; "),
    verificationMethod: verifications.join("; "),
  };
}

// ---------------------------------------------------------------------------
// Definição completa dos requisitos
// ---------------------------------------------------------------------------
type RequirementSeed = {
  code: string;
  description: string;
  procedureCode: string;
  expectedEvidence: string;
  expectedRecord: string;
  verificationMethod: string;
};

function req(
  code: string,
  description: string,
  fallback?: {
    procedureCode: string;
    expectedEvidence: string;
    expectedRecord: string;
    verificationMethod: string;
  }
): RequirementSeed {
  const extracted = fromCopMatrix(code) ?? fallback ?? {
    procedureCode: "",
    expectedEvidence: "",
    expectedRecord: "",
    verificationMethod: "",
  };
  return { code, description, ...extracted };
}

const REQUIREMENTS: RequirementSeed[] = [
  // ── 1.A — Controle de Projeto (CPR-01) ──────────────────────────────────
  req("1.A.1",    "Controle de dados de projeto"),
  req("1.A.2",    "Gerenciamento de configuração"),
  req("1.A.2(1)", "Uso de dados atualizados, corretos e aprovados"),
  req("1.A.2(2)", "Controle de emissão e recuperação de obsoletos"),
  req("1.A.2(3)", "Métodos para notificar mudanças"),
  req("1.A.2(4)", "Verificação de uso de dados aprovados na fabricação"),
  req("1.A.2(5)", "Lista de distribuição atualizada"),
  req("1.A.2(6)", "Arquivo completo e atualizado dos dados técnicos"),
  req("1.A.2(7)", "Controle adequado de dados eletrônicos"),
  req("1.A.3",    "Rastreabilidade de modificações"),
  req("1.A.3(2)", "Controle de atualização dos registros de artigos OTP/CPAA"),
  req("1.A.3(3)", "Disponibilização dos registros OTP/CPAA às pessoas autorizadas"),

  // ── 1.B — Documentação (CPR-01) ─────────────────────────────────────────
  req("1.B.1",    "Documentação operacional"),
  req("1.B.1(2)", "Controle de atualização da categorização de peças"),
  req("1.B.1(3)", "Disponibilização da categorização de peças às pessoas autorizadas"),

  // ── 1.C — Aeronavegabilidade Continuada (CPR-03) ────────────────────────
  req("1.C.1", "Instruções de aeronavegabilidade continuada", {
    procedureCode:     "CPR-03",
    expectedEvidence:  "ICA emitida e controlada conforme RBAC 21",
    expectedRecord:    "ICA vigente; histórico de revisões",
    verificationMethod: "Verificação documental; auditoria",
  }),
  req("1.C.2", "Controle de manutenção e falhas", {
    procedureCode:     "CPR-03",
    expectedEvidence:  "Registros de manutenção e ocorrências de falha controlados",
    expectedRecord:    "Registro de manutenção; relatório de falha",
    verificationMethod: "Inspeção; auditoria interna",
  }),
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Erro: DATABASE_URL não está definida no arquivo .env");
    process.exit(1);
  }

  const pool = mysql.createPool(url);
  const db = drizzle(pool);

  const [{ value: before }] = await db
    .select({ value: count() })
    .from(copRequirements);

  console.log(`Banco conectado. Registros existentes: ${before}`);
  console.log(`Inserindo/atualizando ${REQUIREMENTS.length} requisitos...\n`);

  for (const r of REQUIREMENTS) {
    console.log(`  ${r.code.padEnd(12)} ${r.procedureCode.padEnd(8)} ${r.description}`);
  }

  await db
    .insert(copRequirements)
    .values(REQUIREMENTS)
    .onDuplicateKeyUpdate({
      set: {
        description:       copRequirements.description,
        procedureCode:     copRequirements.procedureCode,
        expectedEvidence:  copRequirements.expectedEvidence,
        expectedRecord:    copRequirements.expectedRecord,
        verificationMethod: copRequirements.verificationMethod,
      },
    });

  const [{ value: after }] = await db
    .select({ value: count() })
    .from(copRequirements);

  console.log(`\n──────────────────────────────────────────`);
  console.log(`Concluído: ${after - before} inserido(s), ${before} já existia(m).`);
  console.log(`Total na tabela: ${after} requisito(s).`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro fatal:", err.message ?? err);
  process.exit(1);
});
