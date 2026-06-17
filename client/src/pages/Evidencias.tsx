import {
  normalizeProcedureCode,
  normalizeRevision,
  getCurrentUser,
} from "@/lib/utils-cop";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type EvidenciaStatus = "OK" | "NOK" | "PARCIAL" | "PENDENTE" | "NA";

type EvidenciaLS = {
  id: number | string;
  cprCode: string;
  revision?: string;
  requirementId: string;
  status: EvidenciaStatus;
  evidences: string[];
  registros: string[];
  responsible: string;
  updatedAt: string;
  observacao?: string;
};

function loadEvidencias(): EvidenciaLS[] {
  try {
    const raw = localStorage.getItem("evidences");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvidencias(data: EvidenciaLS[]) {
  localStorage.setItem("evidences", JSON.stringify(data));
}

function loadCPRs(): any[] {
  try {
    const raw = localStorage.getItem("customProcedures");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSelectedRevision(cpr: any) {
  return normalizeRevision(cpr?.revision || "00");
}

function isValidRequirementRow(row: any[]) {
  if (!Array.isArray(row)) return false;

  const requisito = String(row[0] || "").trim();
  const evidencia = String(row[1] || "").trim();
  const registro = String(row[2] || "").trim();
  const verificacao = String(row[3] || "").trim();

  if (!requisito && !evidencia && !registro && !verificacao) return false;

  const joined = row.join(" ").toLowerCase();

  if (
    joined.includes("requisito") &&
    joined.includes("evid") &&
    joined.includes("registro")
  ) {
    return false;
  }

  if (!requisito || requisito.trim() === "") return false;

  return true;
}

export default function Evidencias() {
  const [cprs, setCprs] = useState<any[]>([]);
  const [selectedCpr, setSelectedCpr] = useState<any>(null);
  const [evidencias, setEvidencias] = useState<EvidenciaLS[]>([]);

  const currentUser = getCurrentUser();
  
  useEffect(() => {
    setCprs(loadCPRs());
    setEvidencias(loadEvidencias());
  }, []);

  function getRequirements() {
    const sections = Array.isArray(selectedCpr?.sections)
      ? selectedCpr.sections
      : Array.isArray(selectedCpr?.structure)
      ? selectedCpr.structure
      : [];

    if (sections.length === 0) return [];

    const item6 = sections.find(
      (s: any) =>
        s.number === 6 ||
        s.number === "6" ||
        s.item === 6 ||
        s.item === "6" ||
        (typeof s.title === "string" && s.title.startsWith("6"))
    );

    const rows =
      item6?.table?.rows ||
      item6?.importedTable?.rows ||
      item6?.rows ||
      [];

    if (!Array.isArray(rows)) return [];

    const cprCode = normalizeProcedureCode(selectedCpr.code);

    return rows
      .filter(isValidRequirementRow)
      .map((row: any[], index: number) => ({
        id: `6.${index + 1}`,
        requisito: String(row[0] || "").trim(),
        evidenciaEsperada: String(row[1] || "").trim(),
        registroEsperado: String(row[2] || "").trim(),
        verificacaoEsperada: String(row[3] || "").trim(),
      }));
  }

  function getEvidencia(requirementId: string): EvidenciaLS {
    const cprCode = normalizeProcedureCode(selectedCpr.code);
    const revision = getSelectedRevision(selectedCpr);

    return (
      evidencias.find(
  (e) =>
    e.requirementId === requirementId &&
    e.cprCode === cprCode &&
    (e.revision || "R00") === revision
) || {
        id: Date.now(),
        cprCode,
        requirementId,
        status: "PENDENTE",
        evidences: [],
        registros: [],
        responsible: "",
        updatedAt: "",
      }
    );
  }

  function updateStatus(requirementId: string, status: EvidenciaStatus) {
  const cprCode = normalizeProcedureCode(selectedCpr.code);
  const revision = getSelectedRevision(selectedCpr);
  const updated = [...evidencias];

    const index = updated.findIndex(
  (e) =>
    e.requirementId === requirementId &&
    e.cprCode === cprCode &&
    (e.revision || "R00") === revision
);

    if (index >= 0) {
      updated[index].status = status;
      updated[index].updatedAt = new Date().toISOString();
    } else {
      updated.push({
  id: `${cprCode}-${revision}-${requirementId}`,
  cprCode,
  revision,
  requirementId,
        status,
        evidences: [],
        registros: [],
        responsible: "",
        updatedAt: new Date().toISOString(),
      });
    }

    setEvidencias(updated);
    saveEvidencias(updated);
  }

  function updateEvidenciaField(
    requirementId: string,
    field: "responsible" | "observacao" | "evidenceText" | "registroText",
    value: string
  ) {
    const cprCode = normalizeProcedureCode(selectedCpr.code);
const revision = getSelectedRevision(selectedCpr);
const updated = [...evidencias];

    const index = updated.findIndex(
  (e) =>
    e.requirementId === requirementId &&
    e.cprCode === cprCode &&
    (e.revision || "R00") === revision
);

    if (index >= 0) {
      updated[index] = {
        ...updated[index],
        responsible:
          field === "responsible" ? value : updated[index].responsible,
        observacao:
          field === "observacao" ? value : updated[index].observacao,
        evidences:
          field === "evidenceText" ? [value] : updated[index].evidences,
        registros:
          field === "registroText" ? [value] : updated[index].registros,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated.push({
  id: `${cprCode}-${revision}-${requirementId}`,
  cprCode,
  revision,
  requirementId,
        status: "PENDENTE",
        evidences: field === "evidenceText" ? [value] : [],
        registros: field === "registroText" ? [value] : [],
        responsible: field === "responsible" ? value : "",
        updatedAt: new Date().toISOString(),
        observacao: field === "observacao" ? value : "",
      });
    }

    setEvidencias(updated);
    saveEvidencias(updated);
  }

  const selectedRevision = getSelectedRevision(selectedCpr);

const requirements = selectedCpr
  ? getRequirements().map((req) => {
      const saved = getEvidencia(req.id);

      return {
        ...req,
        ...saved,
        requirementId: req.id,
        requisito: req.requisito,
        evidenciaEsperada: req.evidenciaEsperada,
        registroEsperado: req.registroEsperado,
        verificacaoEsperada: req.verificacaoEsperada,
        evidences: saved.evidences || (saved as any).evidencias || [],
        responsible: saved.responsible || (saved as any).responsavel || "",
      };
    })
  : [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Gestão de Evidências</h1>

      <Card className="p-4">
        <select
          className="border p-2 w-full"
          value={selectedCpr?.code || ""}
          onChange={(e) =>
            setSelectedCpr(cprs.find((c) => c.code === e.target.value) || null)
          }
        >
          <option value="">Selecione um CPR</option>
          {cprs.map((c) => (
            <option key={c.code} value={c.code}>
              {normalizeProcedureCode(c.code)} - {c.name}
            </option>
          ))}
        </select>
      </Card>

      {selectedCpr && (
        <div className="space-y-4">
          {requirements.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-gray-600">
                Nenhum requisito válido encontrado em Evidências Objetivas deste CPR.
              </p>
            </Card>
          ) : (
            requirements.map((ev: any) => {
              
              return (
                <Card key={ev.requirementId} className="p-4 flex flex-col gap-3">
                  <div className="space-y-2">
                    <p className="font-semibold">{ev.requirementId}</p>

                    <p className="text-sm">
                      <span className="font-medium">Requisito:</span>{" "}
                      {ev.requisito || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Evidência esperada:</span>{" "}
                      {ev.evidenciaEsperada || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Registro esperado:</span>{" "}
                      {ev.registroEsperado || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Forma de verificação:</span>{" "}
                      {ev.verificacaoEsperada || "-"}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Evidência apresentada
                      </label>
                      <textarea
                      disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded min-h-[80px]"
                        value={ev.evidences?.[0] || ""}
                        onChange={(e) =>
                          updateEvidenciaField(
                            ev.requirementId,
                            "evidenceText",
                            e.target.value
                          )
                        }
                        placeholder="Descreva a evidência objetiva apresentada"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Registro / link / caminho
                      </label>
                      <textarea
                      disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded min-h-[80px]"
                        value={ev.registros?.[0] || ""}
                        onChange={(e) =>
                          updateEvidenciaField(
                            ev.requirementId,
                            "registroText",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: F-CPR01-01, link, pasta, arquivo"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Responsável pela verificação
                      </label>
                      <input
                        disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded"
                        value={ev.responsible || ""}
                        onChange={(e) =>
                          updateEvidenciaField(
                            ev.requirementId,
                            "responsible",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: Qualidade / Engenharia"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Observação / pendência
                      </label>
                      <input
                        disabled={currentUser.role === "USUARIO"}
                        className="border p-2 w-full rounded"
                        value={ev.observacao || ""}
                        onChange={(e) =>
                          updateEvidenciaField(
                            ev.requirementId,
                            "observacao",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: aguardando registro"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Badge>{ev.status}</Badge>

                    <select
  disabled={currentUser.role === "USUARIO"}
  value={ev.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as EvidenciaStatus;

                        const hasEvidence =
                          Boolean(ev.evidences?.[0]?.trim()) ||
                          Boolean(ev.registros?.[0]?.trim());

                        if (newStatus === "OK" && !hasEvidence) {
                          alert(
                            "Não é possível marcar como OK sem evidência ou registro."
                          );
                          return;
                        }

                        updateStatus(ev.requirementId, newStatus);
                      }}
                      className="border p-2"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="OK">OK</option>
                      <option value="NOK">NOK</option>
                      <option value="PARCIAL">Parcial</option>
                      <option value="NA">N/A</option>
                    </select>
                  </div>

{/* 🔽 NOVO BLOCO */}
{ev.updatedAt && (
  <p className="text-xs text-gray-500">
    Última atualização: {new Date(ev.updatedAt).toLocaleString()}
  </p>
)}

</Card>
              );
            })
          )}
        </div>
      )}
    </div>
    
  );
}