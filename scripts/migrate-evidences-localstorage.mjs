import mysql from "mysql2/promise";
import * as fs from "fs";

// Lê o arquivo de export do localStorage
const raw = fs.readFileSync("./localstorage-evidences.json", "utf-8");
const evidencias = JSON.parse(raw);

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Different@34",
  database: "cop_manager",
});

let inseridos = 0;
let ignorados = 0;

for (const ev of evidencias) {
  if (!ev.cprCode || !ev.requirementId) { ignorados++; continue; }

  const cprCode = ev.cprCode;
  const revision = ev.revision || "R00";
  const requirementId = ev.requirementId;
  const status = ["OK","NOK","PARCIAL","PENDENTE","NA"].includes(ev.status) ? ev.status : "PENDENTE";
  const evidenceText = ev.evidences?.[0] || "";
  const registroText = ev.registros?.[0] || "";
  const responsible = ev.responsible || ev.responsavel || "";
  const observacao = ev.observacao || "";

  // Verifica se já existe
  const [rows] = await connection.execute(
    "SELECT id FROM evidence_verifications WHERE cprCode = ? AND revision = ? AND requirementId = ?",
    [cprCode, revision, requirementId]
  );

  if (rows.length > 0) {
    await connection.execute(
      "UPDATE evidence_verifications SET status=?, evidenceText=?, registroText=?, responsible=?, observacao=?, updatedAt=NOW() WHERE id=?",
      [status, evidenceText, registroText, responsible, observacao, rows[0].id]
    );
  } else {
    await connection.execute(
      "INSERT INTO evidence_verifications (cprCode, revision, requirementId, status, evidenceText, registroText, responsible, observacao) VALUES (?,?,?,?,?,?,?,?)",
      [cprCode, revision, requirementId, status, evidenceText, registroText, responsible, observacao]
    );
  }
  inseridos++;
}

await connection.end();
console.log(`✅ Migrados: ${inseridos} | Ignorados: ${ignorados}`);
